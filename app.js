/* ============================================================
   QR Code Generator — app.js
   Vanilla JS — No build step required
   ============================================================ */

'use strict';

// ── Config (injected via index.html inline script) ───────────
// SUPABASE_URL, SUPABASE_ANON_KEY, WORKER_URL are declared there.

// ── State ────────────────────────────────────────────────────
const state = {
  qrInstance:      null,   // qrcode.js instance
  logoImage:       null,   // HTMLImageElement for logo
  currentType:     'url',  // active input tab
  currentUser:     null,   // Supabase user object
  supabase:        null,   // Supabase client
  backendAvailable: true,  // becomes false on Worker failure
  debounceTimer:   null,
  lastQrData:      '',     // last successfully generated QR data
};

// ── DOM Refs ─────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const dom = {
  // Tabs
  tabs:               document.querySelectorAll('.tab'),
  // Inputs
  inputVariants:      document.querySelectorAll('.input-variant'),
  inputUrl:           $('qr-input-url'),
  inputText:          $('qr-input-text'),
  inputEmail:         $('qr-input-email'),
  inputPhone:         $('qr-input-phone'),
  charCount:          $('char-count'),
  charMax:            $('char-max'),
  // Customization
  fgColor:            $('fg-color'),
  bgColor:            $('bg-color'),
  fgHex:              $('fg-hex'),
  bgHex:              $('bg-hex'),
  paddingSlider:      $('padding-slider'),
  paddingValue:       $('padding-value'),
  qrSize:             $('qr-size'),
  sizeValue:          $('size-value'),
  logoUpload:         $('logo-upload'),
  logoFilename:       $('logo-filename'),
  btnClearLogo:       $('btn-clear-logo'),
  errorCorrection:    $('error-correction'),
  // Preview
  qrLoading:          $('qr-loading'),
  qrPlaceholder:      $('qr-placeholder'),
  qrOutput:           $('qr-output'),
  qrCanvasContainer:  $('qr-canvas-container'),
  qrFinalCanvas:      $('qr-final-canvas'),
  // Downloads
  btnDownloadPng:     $('btn-download-png'),
  btnDownloadSvg:     $('btn-download-svg'),
  // Auth
  authLoggedOut:      $('auth-logged-out'),
  authLoggedIn:       $('auth-logged-in'),
  authUserEmail:      $('auth-user-email'),
  btnLogin:           $('btn-login'),
  btnLogout:          $('btn-logout'),
  // Login modal
  loginModal:         $('login-modal'),
  modalBackdrop:      $('modal-backdrop'),
  modalClose:         $('modal-close'),
  loginForm:          $('login-form'),
  loginEmail:         $('login-email'),
  btnSendMagic:       $('btn-send-magic'),
  loginSuccess:       $('login-success'),
  // Dynamic section
  dynamicSection:     $('dynamic-section'),
  btnSaveQr:          $('btn-save-qr'),
  savedQrList:        $('saved-qr-list'),
  savedQrLoading:     $('saved-qr-loading'),
  btnRefreshQr:       $('btn-refresh-qr'),
  // Short URL
  shortUrlDisplay:    $('short-url-display'),
  shortUrlLink:       $('short-url-link'),
  btnCopyUrl:         $('btn-copy-url'),
  // Edit modal
  editModal:          $('edit-modal'),
  editModalBackdrop:  $('edit-modal-backdrop'),
  editModalClose:     $('edit-modal-close'),
  editForm:           $('edit-form'),
  editQrId:           $('edit-qr-id'),
  editQrData:         $('edit-qr-data'),
  btnEditCancel:      $('btn-edit-cancel'),
  btnEditSave:        $('btn-edit-save'),
  // Misc
  toast:              $('toast'),
  backendNotice:      $('backend-notice'),
};

// ── Toast ────────────────────────────────────────────────────
let toastTimeout = null;
function showToast(message, type = '', duration = 3500) {
  const el = dom.toast;
  el.textContent = message;
  el.className = `toast toast--visible${type ? ` toast--${type}` : ''}`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    el.className = 'toast';
  }, duration);
}

// ── Spinner helpers ──────────────────────────────────────────
function setSpinner(btn, active) {
  const text    = btn.querySelector('.btn__text');
  const spinner = btn.querySelector('.btn__spinner');
  if (!text || !spinner) return;
  text.classList.toggle('hidden', active);
  spinner.classList.toggle('hidden', !active);
  btn.disabled = active;
}

// ── Input value helpers ──────────────────────────────────────
function getActiveInput() {
  const map = {
    url:   dom.inputUrl,
    text:  dom.inputText,
    email: dom.inputEmail,
    phone: dom.inputPhone,
  };
  return map[state.currentType];
}

function getRawInputValue() {
  return (getActiveInput()?.value || '').trim();
}

function getQrData() {
  const raw = getRawInputValue();
  if (!raw) return '';
  switch (state.currentType) {
    case 'email': return raw.startsWith('mailto:') ? raw : `mailto:${raw}`;
    case 'phone': return raw.startsWith('tel:')    ? raw : `tel:${raw}`;
    default:      return raw;
  }
}

// ── Char counter ─────────────────────────────────────────────
function updateCharCounter() {
  const input  = getActiveInput();
  const max    = input.tagName === 'INPUT' && state.currentType === 'phone' ? 20 : 2000;
  const len    = (input?.value || '').length;
  dom.charCount.textContent = len;
  dom.charMax.textContent   = max;

  const wrap = dom.charCount.closest('.char-counter') || dom.charCount.parentElement;
  if (wrap) {
    wrap.classList.remove('warn', 'danger');
    if (len > max * 0.9) wrap.classList.add('danger');
    else if (len > max * 0.75) wrap.classList.add('warn');
  }
}

// ── Tab switching ─────────────────────────────────────────────
function switchTab(type) {
  state.currentType = type;

  dom.tabs.forEach((t) => {
    const active = t.dataset.type === type;
    t.classList.toggle('tab--active', active);
    t.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  dom.inputVariants.forEach((v) => {
    v.classList.toggle('hidden', v.id !== `input-${type}`);
  });

  updateCharCounter();
  debouncedGenerate();
}

// ── QR Generation ────────────────────────────────────────────
function getQrConfig() {
  const size = parseInt(dom.qrSize.value, 10);
  const ecMap = { L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M, Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H };
  return {
    width:          size,
    height:         size,
    colorDark:      dom.fgColor.value,
    colorLight:     dom.bgColor.value,
    correctLevel:   ecMap[dom.errorCorrection.value] ?? QRCode.CorrectLevel.M,
  };
}

function generateQR() {
  const data = getQrData();

  if (!data) {
    clearQrPreview();
    return;
  }

  if (data.length > 2000) {
    showToast('Content exceeds 2000 characters. Please shorten it.', 'error');
    return;
  }

  state.lastQrData = data;
  showQrLoading(true);

  // Clear previous
  dom.qrOutput.innerHTML = '';
  dom.qrOutput.classList.remove('hidden');
  dom.qrPlaceholder.classList.add('hidden');
  dom.qrCanvasContainer.classList.add('hidden');

  try {
    const config = getQrConfig();
    state.qrInstance = new QRCode(dom.qrOutput, { text: data, ...config });

    // Give qrcode.js a tick to render, then apply canvas effects
    requestAnimationFrame(() => {
      setTimeout(() => {
        applyCanvasEffects();
        showQrLoading(false);
        dom.btnDownloadPng.disabled = false;
        dom.btnDownloadSvg.disabled = false;
      }, 100);
    });
  } catch (err) {
    showQrLoading(false);
    clearQrPreview();
    showToast('Failed to generate QR code. Try different content.', 'error');
    console.error('[QR] generation error:', err);
  }
}

function clearQrPreview() {
  dom.qrOutput.innerHTML = '';
  dom.qrOutput.classList.add('hidden');
  dom.qrCanvasContainer.classList.add('hidden');
  dom.qrPlaceholder.classList.remove('hidden');
  dom.btnDownloadPng.disabled = true;
  dom.btnDownloadSvg.disabled = true;
  state.lastQrData = '';
}

function showQrLoading(show) {
  dom.qrLoading.classList.toggle('hidden', !show);
}

// ── Canvas Effects (logo, padding, color) ────────────────────
function applyCanvasEffects() {
  // Get the canvas rendered by qrcode.js
  const sourceCanvas = dom.qrOutput.querySelector('canvas');
  if (!sourceCanvas) return;

  const padding = parseInt(dom.paddingSlider.value, 10);
  const size    = parseInt(dom.qrSize.value, 10);
  const total   = size + padding * 2;

  const canvas  = dom.qrFinalCanvas;
  canvas.width  = total;
  canvas.height = total;
  const ctx = canvas.getContext('2d');

  // Background fill
  ctx.fillStyle = dom.bgColor.value;
  ctx.fillRect(0, 0, total, total);

  // Draw QR
  ctx.drawImage(sourceCanvas, padding, padding, size, size);

  // Logo overlay
  if (state.logoImage) {
    const logoSize = Math.round(size * 0.20); // 20% of QR size
    const logoX    = padding + Math.round((size - logoSize) / 2);
    const logoY    = padding + Math.round((size - logoSize) / 2);

    // White background behind logo for readability
    const pad = 4;
    ctx.fillStyle = dom.bgColor.value;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2, 6)
      : ctx.rect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2);
    ctx.fill();

    ctx.drawImage(state.logoImage, logoX, logoY, logoSize, logoSize);
  }

  dom.qrOutput.classList.add('hidden');
  dom.qrCanvasContainer.classList.remove('hidden');
}

// ── Debounced generate ───────────────────────────────────────
function debouncedGenerate() {
  clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(generateQR, 300);
}

// ── Downloads ────────────────────────────────────────────────
function downloadPng() {
  const canvas = dom.qrFinalCanvas;
  if (!canvas || !canvas.width) return;
  const link = document.createElement('a');
  link.href     = canvas.toDataURL('image/png');
  link.download = `qr-code-${Date.now()}.png`;
  link.click();
}

function downloadSvg() {
  const data = state.lastQrData;
  if (!data) return;

  const size     = parseInt(dom.qrSize.value, 10);
  const padding  = parseInt(dom.paddingSlider.value, 10);
  const total    = size + padding * 2;
  const fg       = dom.fgColor.value;
  const bg       = dom.bgColor.value;

  // Build QR matrix using qrcode.js internal (bit matrix extraction)
  const qrObj = new QRCode(document.createElement('div'), {
    text: data, width: size, height: size,
    colorDark: fg, colorLight: bg,
    correctLevel: getQrConfig().correctLevel,
  });

  const qrCanvas = qrObj._el?.querySelector('canvas') || qrObj._oDrawing?._elCanvas;
  if (!qrCanvas) {
    // Fallback: use current canvas as PNG embedded in SVG
    const pngData = dom.qrFinalCanvas.toDataURL('image/png');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}">
  <rect width="${total}" height="${total}" fill="${bg}"/>
  <image href="${pngData}" x="${padding}" y="${padding}" width="${size}" height="${size}"/>
</svg>`;
    triggerSvgDownload(svg);
    return;
  }

  // Extract pixel data from qr canvas and build proper SVG paths
  const offCtx = document.createElement('canvas').getContext('2d');
  offCtx.canvas.width  = qrCanvas.width;
  offCtx.canvas.height = qrCanvas.height;
  offCtx.drawImage(qrCanvas, 0, 0);

  const imgData  = offCtx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
  const modules  = qrCanvas.width;
  const cellSize = size / modules;
  let rects      = '';

  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      const idx  = (row * modules + col) * 4;
      const dark = imgData.data[idx] < 128; // R channel < 128 = dark cell
      if (dark) {
        const x = (padding + col * cellSize).toFixed(2);
        const y = (padding + row * cellSize).toFixed(2);
        const s = cellSize.toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${fg}"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}">
  <rect width="${total}" height="${total}" fill="${bg}"/>
  ${rects}
</svg>`;
  triggerSvgDownload(svg);
}

function triggerSvgDownload(svgString) {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `qr-code-${Date.now()}.svg`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ── Logo Upload ───────────────────────────────────────────────
function handleLogoUpload(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Please upload a valid image file.', 'error');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('Logo image must be under 2 MB.', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.logoImage = img;
      dom.logoFilename.textContent = file.name;
      dom.btnClearLogo.classList.remove('hidden');
      applyCanvasEffects();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearLogo() {
  state.logoImage = null;
  dom.logoUpload.value = '';
  dom.logoFilename.textContent = 'Choose image…';
  dom.btnClearLogo.classList.add('hidden');
  applyCanvasEffects();
}

// ── Supabase Auth ────────────────────────────────────────────
function initSupabase() {
  try {
    if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      console.warn('[Auth] Supabase not configured. Auth features disabled.');
      return;
    }
    state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    state.supabase.auth.onAuthStateChange((_event, session) => {
      state.currentUser = session?.user ?? null;
      updateAuthUI();
      if (state.currentUser) {
        loadSavedQrs();
      }
    });
    // Initial session check
    state.supabase.auth.getSession().then(({ data }) => {
      state.currentUser = data.session?.user ?? null;
      updateAuthUI();
      if (state.currentUser) loadSavedQrs();
    });
  } catch (err) {
    console.error('[Auth] Supabase init error:', err);
  }
}

function updateAuthUI() {
  const loggedIn = !!state.currentUser;
  dom.authLoggedOut.classList.toggle('hidden', loggedIn);
  dom.authLoggedIn.classList.toggle('hidden', !loggedIn);
  dom.dynamicSection.classList.toggle('hidden', !loggedIn);

  if (loggedIn) {
    dom.authUserEmail.textContent = state.currentUser.email || '';
  }
}

async function sendMagicLink(email) {
  if (!state.supabase) {
    showToast('Auth not configured. Please set up Supabase keys.', 'error');
    return;
  }
  setSpinner(dom.btnSendMagic, true);
  try {
    const { error } = await state.supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    if (error) throw error;
    dom.loginForm.classList.add('hidden');
    dom.loginSuccess.classList.remove('hidden');
  } catch (err) {
    showToast(err.message || 'Failed to send magic link. Try again.', 'error');
    console.error('[Auth] magic link error:', err);
  } finally {
    setSpinner(dom.btnSendMagic, false);
  }
}

async function logout() {
  if (!state.supabase) return;
  try {
    await state.supabase.auth.signOut();
    state.currentUser = null;
    showToast('Logged out successfully.', 'success');
    dom.shortUrlDisplay.classList.add('hidden');
    updateAuthUI();
  } catch (err) {
    showToast('Logout failed. Please try again.', 'error');
    console.error('[Auth] logout error:', err);
  }
}

// ── Dynamic QR — Save ─────────────────────────────────────────
async function saveQrCode() {
  if (!state.currentUser) {
    showToast('Please log in to save QR codes.', 'warning');
    return;
  }

  const data = getQrData();
  if (!data) {
    showToast('Enter some content to generate a QR code first.', 'warning');
    return;
  }

  setSpinner(dom.btnSaveQr, true);

  try {
    if (!state.backendAvailable || typeof WORKER_URL === 'undefined' || WORKER_URL === 'YOUR_WORKER_URL') {
      throw new Error('Worker URL not configured.');
    }

    const session = await state.supabase.auth.getSession();
    const token   = session.data.session?.access_token;
    if (!token) throw new Error('No active session.');

    const resp = await fetchWithTimeout(`${WORKER_URL}/api/qr/save`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: state.currentType, data }),
    }, 10000);

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      throw new Error(errBody.error || `Server error ${resp.status}`);
    }

    const result = await resp.json();
    const shortUrl = `${WORKER_URL}/${result.short_url}`;

    // Update preview short URL
    dom.shortUrlDisplay.classList.remove('hidden');
    dom.shortUrlLink.href        = shortUrl;
    dom.shortUrlLink.textContent = shortUrl;

    showToast('QR code saved!', 'success');
    await loadSavedQrs();
  } catch (err) {
    if (err.name === 'AbortError' || isNetworkError(err)) {
      markBackendUnavailable();
    } else {
      showToast(err.message || 'Failed to save QR code.', 'error');
    }
    console.error('[Dynamic QR] save error:', err);
  } finally {
    setSpinner(dom.btnSaveQr, false);
  }
}

// ── Dynamic QR — Load List ────────────────────────────────────
async function loadSavedQrs() {
  if (!state.currentUser || !state.supabase) return;

  dom.savedQrLoading.classList.remove('hidden');
  dom.savedQrList.innerHTML = '';

  try {
    const { data, error } = await state.supabase
      .from('qr_codes')
      .select('id, type, data, short_url, created_at')
      .eq('user_id', state.currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      renderEmptyQrList();
    } else {
      renderQrList(data);
    }
  } catch (err) {
    renderEmptyQrList('Failed to load QR codes.');
    console.error('[Dynamic QR] load error:', err);
  } finally {
    dom.savedQrLoading.classList.add('hidden');
  }
}

function renderEmptyQrList(message = 'No saved QR codes yet.') {
  dom.savedQrList.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <p>${escapeHtml(message)}</p>
    </div>`;
}

function renderQrList(qrCodes) {
  dom.savedQrList.innerHTML = qrCodes.map((qr) => {
    const shortUrl = buildShortUrl(qr.short_url);
    const date     = new Date(qr.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const typeLabel = qr.type.charAt(0).toUpperCase() + qr.type.slice(1);
    return `
      <div class="saved-qr-item" data-id="${qr.id}">
        <div class="saved-qr-item__info">
          <div class="saved-qr-item__type">${escapeHtml(typeLabel)}</div>
          <div class="saved-qr-item__data" title="${escapeHtml(qr.data)}">${escapeHtml(qr.data)}</div>
          <div class="saved-qr-item__meta">${date}</div>
          ${shortUrl ? `<a class="saved-qr-item__short-url" href="${escapeHtml(shortUrl)}" target="_blank" rel="noopener">${escapeHtml(shortUrl)}</a>` : ''}
        </div>
        <div class="saved-qr-item__actions">
          <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${qr.id}" data-data="${escapeAttr(qr.data)}" aria-label="Edit QR code">
            <svg viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>`;
  }).join('');
}

function buildShortUrl(shortCode) {
  if (!shortCode) return null;
  if (typeof WORKER_URL !== 'undefined' && WORKER_URL !== 'YOUR_WORKER_URL') {
    return `${WORKER_URL}/${shortCode}`;
  }
  return null;
}

// ── Dynamic QR — Edit ─────────────────────────────────────────
async function updateQrCode(id, newData) {
  setSpinner(dom.btnEditSave, true);

  try {
    if (!state.backendAvailable || typeof WORKER_URL === 'undefined' || WORKER_URL === 'YOUR_WORKER_URL') {
      throw new Error('Worker URL not configured.');
    }

    const session = await state.supabase.auth.getSession();
    const token   = session.data.session?.access_token;
    if (!token) throw new Error('No active session.');

    const resp = await fetchWithTimeout(`${WORKER_URL}/api/qr/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data: newData }),
    }, 10000);

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      throw new Error(errBody.error || `Server error ${resp.status}`);
    }

    closeEditModal();
    showToast('QR code updated!', 'success');
    await loadSavedQrs();
  } catch (err) {
    if (err.name === 'AbortError' || isNetworkError(err)) {
      markBackendUnavailable();
    } else {
      showToast(err.message || 'Failed to update QR code.', 'error');
    }
    console.error('[Dynamic QR] update error:', err);
  } finally {
    setSpinner(dom.btnEditSave, false);
  }
}

// ── Edit Modal ────────────────────────────────────────────────
function openEditModal(id, currentData) {
  dom.editQrId.value   = id;
  dom.editQrData.value = currentData;
  dom.editModal.classList.remove('hidden');
  dom.editQrData.focus();
}

function closeEditModal() {
  dom.editModal.classList.add('hidden');
  dom.editForm.reset();
}

// ── Login Modal ───────────────────────────────────────────────
function openLoginModal() {
  dom.loginModal.classList.remove('hidden');
  dom.loginForm.classList.remove('hidden');
  dom.loginSuccess.classList.add('hidden');
  dom.loginEmail.value = '';
  setTimeout(() => dom.loginEmail.focus(), 50);
}

function closeLoginModal() {
  dom.loginModal.classList.add('hidden');
}

// ── Backend Degradation ───────────────────────────────────────
function markBackendUnavailable() {
  if (!state.backendAvailable) return;
  state.backendAvailable = false;
  dom.backendNotice.classList.remove('hidden');
  showToast('Backend unavailable. Running in static mode.', 'warning', 5000);
}

function isNetworkError(err) {
  return err instanceof TypeError && err.message.toLowerCase().includes('fetch');
}

// ── Fetch with timeout ────────────────────────────────────────
function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// ── Copy to clipboard ─────────────────────────────────────────
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  } catch {
    showToast('Could not copy. Please copy manually.', 'warning');
  }
}

// ── Sanitization helpers ──────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/`/g, '&#96;');
}

// ── Event Listeners ───────────────────────────────────────────
function bindEvents() {
  // Tab switching
  dom.tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.type));
  });

  // Input events
  [dom.inputUrl, dom.inputText, dom.inputEmail, dom.inputPhone].forEach((el) => {
    el.addEventListener('input', () => {
      updateCharCounter();
      debouncedGenerate();
    });
  });

  // Color pickers
  dom.fgColor.addEventListener('input', () => {
    dom.fgHex.textContent = dom.fgColor.value;
    debouncedGenerate();
  });
  dom.bgColor.addEventListener('input', () => {
    dom.bgHex.textContent = dom.bgColor.value;
    debouncedGenerate();
  });

  // Sliders
  dom.paddingSlider.addEventListener('input', () => {
    dom.paddingValue.textContent = dom.paddingSlider.value;
    if (state.lastQrData) applyCanvasEffects();
  });
  dom.qrSize.addEventListener('input', () => {
    dom.sizeValue.textContent = dom.qrSize.value;
    debouncedGenerate();
  });

  // Error correction
  dom.errorCorrection.addEventListener('change', () => debouncedGenerate());

  // Logo
  dom.logoUpload.addEventListener('change', (e) => handleLogoUpload(e.target.files[0]));
  dom.btnClearLogo.addEventListener('click', clearLogo);

  // Downloads
  dom.btnDownloadPng.addEventListener('click', downloadPng);
  dom.btnDownloadSvg.addEventListener('click', downloadSvg);

  // Auth
  dom.btnLogin.addEventListener('click', openLoginModal);
  dom.btnLogout.addEventListener('click', logout);
  dom.modalBackdrop.addEventListener('click', closeLoginModal);
  dom.modalClose.addEventListener('click', closeLoginModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLoginModal();
      closeEditModal();
    }
  });

  // Login form
  dom.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = dom.loginEmail.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    await sendMagicLink(email);
  });

  // Dynamic QR
  dom.btnSaveQr.addEventListener('click', saveQrCode);
  dom.btnRefreshQr.addEventListener('click', loadSavedQrs);

  // Saved QR list — event delegation for edit buttons
  dom.savedQrList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="edit"]');
    if (btn) {
      openEditModal(btn.dataset.id, btn.dataset.data);
    }
  });

  // Edit modal
  dom.editModalBackdrop.addEventListener('click', closeEditModal);
  dom.editModalClose.addEventListener('click', closeEditModal);
  dom.btnEditCancel.addEventListener('click', closeEditModal);
  dom.editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id      = dom.editQrId.value;
    const newData = dom.editQrData.value.trim();
    if (!newData) {
      showToast('Destination cannot be empty.', 'error');
      return;
    }
    if (newData.length > 2000) {
      showToast('Content exceeds 2000 characters.', 'error');
      return;
    }
    await updateQrCode(id, newData);
  });

  // Copy short URL
  dom.btnCopyUrl.addEventListener('click', () => {
    const url = dom.shortUrlLink.textContent.trim();
    if (url) copyToClipboard(url);
  });
}

// ── Init ──────────────────────────────────────────────────────
function init() {
  bindEvents();
  initSupabase();
  updateCharCounter();

  // Trigger generation with default placeholder so preview shows on load
  // (only if an input already has a value — e.g. when navigating back)
  const initialVal = getRawInputValue();
  if (initialVal) generateQR();
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
