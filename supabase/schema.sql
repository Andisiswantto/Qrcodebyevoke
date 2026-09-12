-- ============================================================
-- QR Code Generator — Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
-- pgcrypto is enabled by default in Supabase (for gen_random_uuid)
-- No additional extensions needed.

-- ── 1. Users Table ──────────────────────────────────────────
-- Mirrors auth.users; populated via trigger on signup.
CREATE TABLE IF NOT EXISTS public.users (
    id         UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email      VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.users             IS 'App-level user profile, synced from auth.users on signup.';
COMMENT ON COLUMN public.users.id          IS 'Matches auth.users.id (UUID).';
COMMENT ON COLUMN public.users.email       IS 'User email address.';
COMMENT ON COLUMN public.users.created_at  IS 'Account creation timestamp.';

-- ── 2. QR Codes Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type       VARCHAR(50)  NOT NULL CHECK (type IN ('url', 'text', 'email', 'phone')),
    data       TEXT         NOT NULL CHECK (char_length(data) <= 2000),
    short_url  VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.qr_codes              IS 'Dynamic QR code records with short URL routing.';
COMMENT ON COLUMN public.qr_codes.id           IS 'Primary key UUID.';
COMMENT ON COLUMN public.qr_codes.user_id      IS 'Owner user ID (FK → users.id).';
COMMENT ON COLUMN public.qr_codes.type         IS 'QR content type: url | text | email | phone.';
COMMENT ON COLUMN public.qr_codes.data         IS 'Destination content / URL (max 2000 chars).';
COMMENT ON COLUMN public.qr_codes.short_url    IS 'Short alphanumeric code for redirect routing.';
COMMENT ON COLUMN public.qr_codes.created_at   IS 'Record creation timestamp.';
COMMENT ON COLUMN public.qr_codes.updated_at   IS 'Last update timestamp (auto-maintained by trigger).';

-- ── 3. QR Scans Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.qr_scans (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_id      UUID        NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT
);

COMMENT ON TABLE  public.qr_scans             IS 'Anonymous scan events for analytics.';
COMMENT ON COLUMN public.qr_scans.id          IS 'Primary key UUID.';
COMMENT ON COLUMN public.qr_scans.qr_id       IS 'FK → qr_codes.id.';
COMMENT ON COLUMN public.qr_scans.scanned_at  IS 'Timestamp of the scan.';
COMMENT ON COLUMN public.qr_scans.user_agent  IS 'User-Agent string of the scanning device.';

-- ── Indexes ──────────────────────────────────────────────────
-- Fast short_url lookup (used on every redirect)
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_codes_short_url ON public.qr_codes (short_url);
-- Filter QR codes by owner
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes (user_id);
-- Filter scans by QR code
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_id ON public.qr_scans (qr_id);

-- ── Auto-update updated_at trigger ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_qr_codes_updated_at ON public.qr_codes;
CREATE TRIGGER trg_qr_codes_updated_at
    BEFORE UPDATE ON public.qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ── Trigger: auto-create user on auth.users signup ───────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at)
    VALUES (NEW.id, NEW.email, NEW.created_at)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- ── Row Level Security ────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scans  ENABLE ROW LEVEL SECURITY;

-- ── RLS: users ───────────────────────────────────────────────
-- Users can only read and update their own row
CREATE POLICY "users_select_own"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "users_update_own"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ── RLS: qr_codes ────────────────────────────────────────────
-- Owners can read all their QR codes
CREATE POLICY "qr_codes_select_own"
    ON public.qr_codes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Owners can insert their own QR codes
CREATE POLICY "qr_codes_insert_own"
    ON public.qr_codes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Owners can update their own QR codes
CREATE POLICY "qr_codes_update_own"
    ON public.qr_codes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Owners can delete their own QR codes
CREATE POLICY "qr_codes_delete_own"
    ON public.qr_codes
    FOR DELETE
    USING (auth.uid() = user_id);

-- ── RLS: qr_scans ────────────────────────────────────────────
-- Anyone (including anonymous/service role) can insert scan records
-- The Worker uses service_role key which bypasses RLS, so this
-- policy covers direct client-side inserts if ever needed.
CREATE POLICY "qr_scans_insert_anon"
    ON public.qr_scans
    FOR INSERT
    WITH CHECK (true);

-- QR code owners can read scan analytics for their own QRs
CREATE POLICY "qr_scans_select_owner"
    ON public.qr_scans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.qr_codes qc
            WHERE qc.id = qr_scans.qr_id
              AND qc.user_id = auth.uid()
        )
    );

-- ── Verification queries (run manually to confirm setup) ─────
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
