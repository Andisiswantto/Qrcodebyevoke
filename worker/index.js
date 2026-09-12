/**
 * QR Code Generator — Cloudflare Worker
 * Routes:
 *   POST /api/qr/save        — save new dynamic QR, returns short_url
 *   PUT  /api/qr/:id         — update QR destination (auth required)
 *   GET  /api/qr/:short_url  — redirect to destination URL
 *   GET  /:short_url         — top-level redirect (convenience)
 */

// ── CORS ────────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age':       '86400',
};

function corsResponse(body, init = {}) {
  const status  = init.status  || 200;
  const headers = { ...CORS_HEADERS, 'Content-Type': 'application/json', ...(init.headers || {}) };
  return new Response(body, { status, headers });
}

function jsonOk(data) {
  return corsResponse(JSON.stringify(data));
}

function jsonError(message, status = 400) {
  return corsResponse(JSON.stringify({ error: message }), { status });
}

function handleOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ── Short URL generator ──────────────────────────────────────────────────────
// Nanoid-style 8-char alphanumeric using crypto.randomUUID
function generateShortCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; // unambiguous chars
  const uuid     = crypto.randomUUID().replace(/-/g, ''); // 32 hex chars
  let result     = '';
  for (let i = 0; i < 8; i++) {
    // Use pairs of hex chars (0–255) to pick from alphabet (avoiding modulo bias for small alphabets)
    const byte = parseInt(uuid.substring(i * 2, i * 2 + 2), 16);
    result += alphabet[byte % alphabet.length];
  }
  return result;
}

// ── JWT verification via Supabase ────────────────────────────────────────────
async function verifyJwt(authHeader, env) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header.' };
  }
  const token = authHeader.slice(7);

  try {
    // Verify token by calling Supabase Auth API
    const resp = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey':        env.SUPABASE_ANON_KEY,
      },
    });

    if (!resp.ok) {
      return { user: null, error: 'Invalid or expired token.' };
    }

    const user = await resp.json();
    return { user, error: null };
  } catch (err) {
    console.error('[JWT] verification error:', err);
    return { user: null, error: 'Token verification failed.' };
  }
}

// ── Supabase REST helpers ────────────────────────────────────────────────────
function supabaseHeaders(env) {
  return {
    'Content-Type':  'application/json',
    'apikey':        env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Prefer':        'return=representation',
  };
}

async function supabaseQuery(env, path, options = {}) {
  const url  = `${env.SUPABASE_URL}/rest/v1/${path}`;
  const resp = await fetch(url, { headers: supabaseHeaders(env), ...options });
  const body = await resp.json();
  if (!resp.ok) {
    throw new Error(body.message || body.error || `Supabase error ${resp.status}`);
  }
  return body;
}

// ── Input validation ─────────────────────────────────────────────────────────
const ALLOWED_TYPES = ['url', 'text', 'email', 'phone'];

function validateSaveInput(body) {
  if (!body || typeof body !== 'object') return 'Request body must be JSON.';
  if (!body.data || typeof body.data !== 'string') return 'Field "data" is required and must be a string.';
  if (body.data.trim().length === 0) return 'Field "data" cannot be empty.';
  if (body.data.length > 2000) return 'Field "data" exceeds maximum 2000 characters.';
  if (!body.type || !ALLOWED_TYPES.includes(body.type)) return `Field "type" must be one of: ${ALLOWED_TYPES.join(', ')}.`;
  return null;
}

// ── Route: POST /api/qr/save ─────────────────────────────────────────────────
async function handleSaveQr(request, env) {
  // Verify auth
  const { user, error: authError } = await verifyJwt(request.headers.get('Authorization'), env);
  if (authError) return jsonError(authError, 401);

  // Parse + validate body
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400);
  }

  const validationError = validateSaveInput(body);
  if (validationError) return jsonError(validationError, 400);

  // Generate unique short code (retry once on collision)
  let shortCode  = generateShortCode();
  let attempts   = 0;
  let insertedQr = null;

  while (attempts < 3) {
    try {
      const rows = await supabaseQuery(env, 'qr_codes', {
        method: 'POST',
        body: JSON.stringify({
          user_id:   user.id,
          type:      body.type,
          data:      body.data.trim(),
          short_url: shortCode,
        }),
      });
      insertedQr = Array.isArray(rows) ? rows[0] : rows;
      break;
    } catch (err) {
      // 23505 = unique_violation (short_url collision)
      if (err.message.includes('23505') || err.message.includes('unique')) {
        shortCode = generateShortCode();
        attempts++;
      } else {
        console.error('[save] Supabase insert error:', err);
        return jsonError('Failed to save QR code. Please try again.', 500);
      }
    }
  }

  if (!insertedQr) {
    return jsonError('Failed to generate a unique short URL. Please try again.', 500);
  }

  return jsonOk({
    id:        insertedQr.id,
    short_url: insertedQr.short_url,
    type:      insertedQr.type,
    data:      insertedQr.data,
  });
}

// ── Route: PUT /api/qr/:id ────────────────────────────────────────────────────
async function handleUpdateQr(request, env, id) {
  if (!id) return jsonError('QR code ID is required.', 400);

  // Validate UUID format
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(id)) return jsonError('Invalid QR code ID.', 400);

  // Verify auth
  const { user, error: authError } = await verifyJwt(request.headers.get('Authorization'), env);
  if (authError) return jsonError(authError, 401);

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400);
  }

  if (!body.data || typeof body.data !== 'string' || body.data.trim().length === 0) {
    return jsonError('Field "data" is required and cannot be empty.', 400);
  }
  if (body.data.length > 2000) {
    return jsonError('Field "data" exceeds maximum 2000 characters.', 400);
  }

  // Verify ownership: fetch the QR code and check user_id
  let existing;
  try {
    const rows = await supabaseQuery(env, `qr_codes?id=eq.${id}&select=id,user_id`);
    existing   = Array.isArray(rows) ? rows[0] : null;
  } catch (err) {
    console.error('[update] fetch ownership error:', err);
    return jsonError('Failed to verify QR code ownership.', 500);
  }

  if (!existing) return jsonError('QR code not found.', 404);
  if (existing.user_id !== user.id) return jsonError('Forbidden: you do not own this QR code.', 403);

  // Perform update
  try {
    const rows = await supabaseQuery(env, `qr_codes?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ data: body.data.trim() }),
    });
    const updated = Array.isArray(rows) ? rows[0] : rows;
    return jsonOk({ id: updated.id, data: updated.data, short_url: updated.short_url });
  } catch (err) {
    console.error('[update] Supabase patch error:', err);
    return jsonError('Failed to update QR code. Please try again.', 500);
  }
}

// ── Route: GET /api/qr/:short_url (redirect) ──────────────────────────────────
async function handleRedirect(env, shortCode) {
  if (!shortCode) return jsonError('Short URL code is required.', 400);

  // Sanitize: only allow alphanumeric + hyphens
  if (!/^[A-Za-z0-9\-_]{1,20}$/.test(shortCode)) {
    return jsonError('Invalid short URL code.', 400);
  }

  let qr;
  try {
    // Use service key to read — RLS allows public read via GET /api/qr/:short_url
    const rows = await supabaseQuery(env, `qr_codes?short_url=eq.${shortCode}&select=id,data,type`);
    qr = Array.isArray(rows) ? rows[0] : null;
  } catch (err) {
    console.error('[redirect] Supabase query error:', err);
    return jsonError('Failed to look up QR code.', 500);
  }

  if (!qr) {
    return new Response('QR code not found.', { status: 404, headers: CORS_HEADERS });
  }

  // Track the scan (fire-and-forget, don't block redirect)
  trackScan(env, qr.id, request?.headers?.get('User-Agent') || '').catch(console.error);

  // For URL types, redirect. For others, return data as JSON.
  const destination = qr.data;
  const isRedirectable = destination.startsWith('http://') || destination.startsWith('https://') || destination.startsWith('mailto:') || destination.startsWith('tel:');

  if (isRedirectable) {
    return Response.redirect(destination, 302);
  }

  return jsonOk({ type: qr.type, data: qr.data });
}

async function trackScan(env, qrId, userAgent) {
  try {
    await supabaseQuery(env, 'qr_scans', {
      method: 'POST',
      body: JSON.stringify({ qr_id: qrId, user_agent: userAgent }),
    });
  } catch (err) {
    // Non-critical — log and continue
    console.warn('[scan] tracking error:', err);
  }
}

// ── Router ──────────────────────────────────────────────────────────────────
async function router(request, env) {
  const url    = new URL(request.url);
  const path   = url.pathname;
  const method = request.method.toUpperCase();

  // CORS preflight
  if (method === 'OPTIONS') return handleOptions();

  // POST /api/qr/save
  if (method === 'POST' && path === '/api/qr/save') {
    return handleSaveQr(request, env);
  }

  // PUT /api/qr/:id
  const putMatch = path.match(/^\/api\/qr\/([^/]+)$/);
  if (method === 'PUT' && putMatch) {
    return handleUpdateQr(request, env, putMatch[1]);
  }

  // GET /api/qr/:short_url — redirect
  const getApiMatch = path.match(/^\/api\/qr\/([^/]+)$/);
  if (method === 'GET' && getApiMatch) {
    return handleRedirect(env, getApiMatch[1]);
  }

  // GET /:short_url — top-level convenience redirect
  const topLevelMatch = path.match(/^\/([A-Za-z0-9\-_]{4,20})$/);
  if (method === 'GET' && topLevelMatch) {
    return handleRedirect(env, topLevelMatch[1]);
  }

  // 404
  return jsonError('Route not found.', 404);
}

// ── Cloudflare Worker entry point ────────────────────────────────────────────
export default {
  async fetch(request, env, _ctx) {
    try {
      return await router(request, env);
    } catch (err) {
      console.error('[Worker] unhandled error:', err);
      return jsonError('Internal server error.', 500);
    }
  },
};
