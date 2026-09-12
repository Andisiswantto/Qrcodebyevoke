# QR Code Generator

Aplikasi web untuk membuat, mengkustomisasi, dan mengelola QR code statis maupun dinamis.  
Dibangun dengan HTML/CSS/Vanilla JS di frontend, Cloudflare Workers sebagai backend, dan Supabase sebagai database.

---

## Fitur Utama

- **QR Statis** — Buat QR code instan tanpa perlu login (URL, Teks, Email, Nomor HP)
- **Kustomisasi** — Warna foreground & background, padding, overlay logo, ukuran, koreksi error
- **Unduh** — Format PNG (resolusi tinggi) dan SVG (vektor)
- **QR Dinamis** — Simpan QR dan ubah URL tujuan kapan saja tanpa mencetak ulang
- **Autentikasi** — Magic link via Supabase Auth (tanpa password)
- **Graceful Degradation** — Jika backend tidak tersedia, aplikasi tetap berjalan dalam mode statis

---

## Prasyarat

| Tool | Versi Minimum | Keterangan |
|------|--------------|------------|
| Node.js | 18+ | Untuk Wrangler CLI |
| npm / pnpm | terbaru | Package manager |
| Wrangler CLI | 3+ | Deploy Cloudflare Worker |
| Akun Supabase | — | Database & Auth |
| Akun Cloudflare | — | Worker & Pages |

Instal Wrangler (jika belum):

```bash
npm install -g wrangler
wrangler login
```

---

## Langkah 1 — Setup Supabase

### 1.1 Buat Project Baru
1. Buka [supabase.com](https://supabase.com) → **New project**
2. Catat **Project URL** dan **API Keys** (akan dibutuhkan di langkah berikutnya)

### 1.2 Jalankan Schema SQL
1. Di dashboard Supabase, buka **SQL Editor**
2. Salin seluruh isi file `supabase/schema.sql`
3. Tempel ke SQL Editor dan klik **Run**
4. Pastikan tidak ada error — semua tabel, trigger, dan policy RLS akan terbuat otomatis

### 1.3 Konfigurasi Auth Magic Link
1. Buka **Authentication → Providers → Email**
2. Pastikan **Enable Email Provider** aktif
3. Aktifkan opsi **Confirm email** (opsional, tapi direkomendasikan untuk production)
4. Buka **Authentication → URL Configuration**
5. Tambahkan URL aplikasi Anda ke **Redirect URLs**  
   Contoh: `https://your-app.pages.dev`  
   Untuk pengembangan lokal: `http://localhost:3000`

### 1.4 Catat API Keys
Buka **Project Settings → API**. Anda akan butuh:

| Key | Digunakan di |
|-----|-------------|
| `Project URL` | Frontend + Worker |
| `anon / public` key | Frontend |
| `service_role` key | Worker (rahasia!) |

> ⚠️ **JANGAN** commit `service_role` key ke repository. Key ini memberikan akses penuh ke database.

---

## Langkah 2 — Update Konfigurasi Frontend

Buka file `index.html` dan cari bagian ini di bagian bawah (sebelum `</body>`):

```html
<script>
  const SUPABASE_URL    = 'YOUR_SUPABASE_URL'
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
  const WORKER_URL      = 'YOUR_WORKER_URL'
</script>
```

Ganti nilai placeholder dengan nilai asli:

```html
<script>
  const SUPABASE_URL    = 'https://abcdefghij.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  const WORKER_URL      = 'https://qr-code-generator-api.your-name.workers.dev'
</script>
```

> **Catatan:** `WORKER_URL` akan tersedia setelah Langkah 3 selesai.

---

## Langkah 3 — Deploy Cloudflare Worker

### 3.1 Masuk ke folder worker

```bash
cd "worker"
```

### 3.2 Set Environment Secrets

Gunakan Wrangler untuk menyimpan secrets secara aman (tidak di-hardcode):

```bash
wrangler secret put SUPABASE_URL
# Masukkan: https://abcdefghij.supabase.co

wrangler secret put SUPABASE_SERVICE_KEY
# Masukkan: service_role key dari Supabase

wrangler secret put SUPABASE_ANON_KEY
# Masukkan: anon/public key dari Supabase
```

### 3.3 Deploy Worker

```bash
wrangler deploy
```

Output akan menampilkan URL Worker Anda, contoh:

```
✅ Deployed to: https://qr-code-generator-api.your-name.workers.dev
```

Salin URL ini dan perbarui `WORKER_URL` di `index.html` (Langkah 2).

### 3.4 Test Worker

```bash
# Test redirect endpoint
curl -I https://qr-code-generator-api.your-name.workers.dev/api/qr/ABCD1234

# Test CORS preflight
curl -X OPTIONS https://qr-code-generator-api.your-name.workers.dev/api/qr/save \
  -H "Access-Control-Request-Method: POST"
```

---

## Langkah 4 — Update Worker URL di Frontend

Setelah Worker berhasil deploy, kembali ke `index.html` dan pastikan `WORKER_URL` sudah diisi dengan URL yang benar dari Langkah 3.3.

---

## Langkah 5 — Deploy ke Cloudflare Pages

### Opsi A — Via Cloudflare Dashboard (Drag & Drop)

1. Buka [pages.cloudflare.com](https://pages.cloudflare.com)
2. Klik **Create a project → Direct Upload**
3. Drag & drop folder project (hanya file frontend, tanpa folder `worker/` dan `supabase/`)
4. Klik **Deploy site**
5. Setelah deploy, catat URL Pages Anda (contoh: `https://your-app.pages.dev`)
6. Tambahkan URL tersebut ke **Supabase → Auth → Redirect URLs** (Langkah 1.3)

### Opsi B — Via Git (Continuous Deployment)

1. Push kode ke GitHub/GitLab
2. Di Cloudflare Pages → **Create a project → Connect to Git**
3. Pilih repository Anda
4. Build settings:
   - **Framework preset:** None
   - **Build command:** *(kosongkan)*
   - **Build output directory:** `/` (atau `.`)
5. Klik **Save and Deploy**

---

## Referensi Environment Variables

### Frontend (`index.html`)

| Variabel | Keterangan | Contoh |
|----------|------------|--------|
| `SUPABASE_URL` | URL project Supabase | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anon key Supabase | `eyJhbGci...` |
| `WORKER_URL` | URL Cloudflare Worker Anda | `https://qr-api.name.workers.dev` |

### Worker (`wrangler secret put`)

| Variabel | Keterangan | Sumber |
|----------|------------|--------|
| `SUPABASE_URL` | URL project Supabase | Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Service role key (rahasia!) | Project Settings → API |
| `SUPABASE_ANON_KEY` | Public anon key | Project Settings → API |

---

## Struktur Project

```
qr-code-generator/
├── index.html          # Halaman utama
├── styles.css          # Stylesheet (mobile-first, dark mode)
├── app.js              # Logic frontend (QR gen, auth, API calls)
├── worker/
│   ├── index.js        # Cloudflare Worker script
│   └── wrangler.toml   # Konfigurasi Wrangler
├── supabase/
│   └── schema.sql      # Schema database + RLS policies
└── README.md           # Panduan ini
```

---

## Penggunaan Lokal (Development)

Tidak diperlukan build tool. Cukup buka `index.html` di browser:

```bash
# Gunakan server lokal sederhana (hindari masalah CORS)
npx serve .
# atau
python3 -m http.server 3000
```

Kemudian buka `http://localhost:3000`.

> **Catatan:** Fitur QR Statis akan langsung berfungsi. Fitur Dinamis memerlukan Supabase dan Worker yang sudah dikonfigurasi.

---

## Troubleshooting

**QR tidak muncul**  
→ Pastikan koneksi internet aktif (library qrcode.js di-load via CDN)

**Login tidak berfungsi**  
→ Periksa `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `index.html`  
→ Pastikan redirect URL sudah ditambahkan di Supabase Auth settings

**Save QR gagal**  
→ Pastikan `WORKER_URL` sudah diisi dan Worker sudah di-deploy  
→ Cek log Worker: `wrangler tail` di folder `worker/`

**Notifikasi "Backend unavailable"**  
→ Worker tidak bisa dijangkau. Aplikasi tetap berjalan dalam mode statis.  
→ Cek status Worker di Cloudflare Dashboard

---

## Lisensi

MIT License — bebas digunakan untuk proyek pribadi maupun komersial.
