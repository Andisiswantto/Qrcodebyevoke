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
  selectedFrame:   'none', // active frame id
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
  // Frame
  framePicker:        $('frame-picker'),
  frameOptions:       $('frame-options'),
  frameColor:         $('frame-color'),
  frameColorHex:      $('frame-color-hex'),
  frameLabel:         $('frame-label'),
  frameLabelGroup:    $('frame-label-group'),
};

// ── Frame Definitions ─────────────────────────────────────────
/**
 * Each frame has:
 *   id       – unique key
 *   label    – display name
 *   hasLabel – whether it supports a text label (banner frames)
 *   padding  – extra canvas padding needed beyond user padding (top, right, bottom, left)
 *   draw(ctx, total, frameColor, labelText, qrSize, outerPad)
 *             – draw the frame ON TOP of the already-drawn QR
 */
const FRAMES = [
  {
    id: 'none',
    label: 'None',
    hasLabel: false,
    extraPad: { top: 0, right: 0, bottom: 0, left: 0 },
    draw: () => {},  // no-op
  },
  {
    id: 'simple',
    label: 'Simple',
    hasLabel: false,
    extraPad: { top: 8, right: 8, bottom: 8, left: 8 },
    draw(ctx, total, color) {
      const bw = 4;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.strokeRect(bw / 2, bw / 2, total - bw, total - bw);
    },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    hasLabel: false,
    extraPad: { top: 10, right: 10, bottom: 10, left: 10 },
    draw(ctx, total, color) {
      const bw = 4, r = 18;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.beginPath();
      ctx.roundRect(bw / 2, bw / 2, total - bw, total - bw, r);
      ctx.stroke();
    },
  },
  {
    id: 'double',
    label: 'Double',
    hasLabel: false,
    extraPad: { top: 12, right: 12, bottom: 12, left: 12 },
    draw(ctx, total, color) {
      // Outer border
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(3, 3, total - 6, total - 6);
      // Inner border
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 8, total - 16, total - 16);
    },
  },
  {
    id: 'dotted',
    label: 'Dotted',
    hasLabel: false,
    extraPad: { top: 10, right: 10, bottom: 10, left: 10 },
    draw(ctx, total, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth   = 3;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(4, 4, total - 8, total - 8);
      ctx.setLineDash([]);
    },
  },
  {
    id: 'corners',
    label: 'Corners',
    hasLabel: false,
    extraPad: { top: 10, right: 10, bottom: 10, left: 10 },
    draw(ctx, total, color) {
      const len = 28, bw = 4;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.lineCap     = 'square';
      const off = bw / 2;
      const corners = [
        // top-left
        [[off, off + len], [off, off], [off + len, off]],
        // top-right
        [[total - off - len, off], [total - off, off], [total - off, off + len]],
        // bottom-left
        [[off, total - off - len], [off, total - off], [off + len, total - off]],
        // bottom-right
        [[total - off - len, total - off], [total - off, total - off], [total - off, total - off - len]],
      ];
      corners.forEach(([a, b, c]) => {
        ctx.beginPath();
        ctx.moveTo(...a);
        ctx.lineTo(...b);
        ctx.lineTo(...c);
        ctx.stroke();
      });
    },
  },
  {
    id: 'shadow',
    label: 'Shadow',
    hasLabel: false,
    extraPad: { top: 8, right: 12, bottom: 12, left: 8 },
    draw(ctx, total, color) {
      // Shadow layer
      ctx.fillStyle = color + '55'; // semi-transparent
      ctx.fillRect(6, 6, total - 6, total - 6);
      // White card over it
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, total - 6, total - 6);
      // Thin border
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(0.75, 0.75, total - 6 - 1.5, total - 6 - 1.5);
    },
  },
  {
    id: 'scan-bottom',
    label: 'Scan Me',
    hasLabel: true,
    extraPad: { top: 8, right: 8, bottom: 44, left: 8 },
    draw(ctx, total, color, labelText) {
      const bh = 40, r = 12, bw = 3;
      // Outer rounded rect
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.beginPath();
      ctx.roundRect(bw / 2, bw / 2, total - bw, total - bw, r);
      ctx.stroke();
      // Banner fill at bottom
      const bannerY = total - bh - bw / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(bw / 2, bannerY);
      ctx.lineTo(total - bw / 2, bannerY);
      ctx.lineTo(total - bw / 2, total - r - bw / 2);
      ctx.arcTo(total - bw / 2, total - bw / 2, total - r - bw / 2, total - bw / 2, r);
      ctx.lineTo(r + bw / 2, total - bw / 2);
      ctx.arcTo(bw / 2, total - bw / 2, bw / 2, total - r - bw / 2, r);
      ctx.lineTo(bw / 2, bannerY);
      ctx.closePath();
      ctx.fill();
      // Label text
      const text = labelText || 'SCAN ME';
      ctx.fillStyle    = '#ffffff';
      ctx.font         = `bold ${Math.round(bh * 0.45)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, total / 2, bannerY + bh / 2);
    },
  },
  {
    id: 'scan-top',
    label: 'Top Banner',
    hasLabel: true,
    extraPad: { top: 44, right: 8, bottom: 8, left: 8 },
    draw(ctx, total, color, labelText) {
      const bh = 40, r = 12, bw = 3;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.beginPath();
      ctx.roundRect(bw / 2, bw / 2, total - bw, total - bw, r);
      ctx.stroke();
      // Banner fill at top
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(r + bw / 2, bw / 2);
      ctx.arcTo(total - bw / 2, bw / 2, total - bw / 2, r + bw / 2, r);
      ctx.lineTo(total - bw / 2, bh + bw / 2);
      ctx.lineTo(bw / 2, bh + bw / 2);
      ctx.lineTo(bw / 2, r + bw / 2);
      ctx.arcTo(bw / 2, bw / 2, r + bw / 2, bw / 2, r);
      ctx.closePath();
      ctx.fill();
      // Label text
      const text = labelText || 'SCAN ME';
      ctx.fillStyle    = '#ffffff';
      ctx.font         = `bold ${Math.round(bh * 0.45)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, total / 2, bw / 2 + bh / 2);
    },
  },
  {
    id: 'phone',
    label: 'Phone',
    hasLabel: false,
    extraPad: { top: 36, right: 14, bottom: 52, left: 14 },
    draw(ctx, total, color) {
      const bw = 3, r = 22;
      // Phone body
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.beginPath();
      ctx.roundRect(bw / 2, bw / 2, total - bw, total - bw, r);
      ctx.stroke();
      // Top speaker
      const spW = total * 0.25, spH = 5, spX = (total - spW) / 2, spY = 14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(spX, spY, spW, spH, 3);
      ctx.fill();
      // Bottom home button circle
      const btnR = 10, btnX = total / 2, btnY = total - 26;
      ctx.beginPath();
      ctx.arc(btnX, btnY, btnR, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
  {
    id: 'tag',
    label: 'Price Tag',
    hasLabel: true,
    extraPad: { top: 20, right: 8, bottom: 48, left: 8 },
    draw(ctx, total, color, labelText) {
      const bw = 3, r = 10;
      // Outer border
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.beginPath();
      ctx.roundRect(bw / 2, bw / 2, total - bw, total - bw, r);
      ctx.stroke();
      // Hole at top
      const holeR = 8, holeX = total / 2, holeY = 14;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.beginPath();
      ctx.arc(holeX, holeY, holeR, 0, Math.PI * 2);
      ctx.stroke();
      // Bottom strip
      const stripH = 36, stripY = total - stripH - bw / 2;
      ctx.fillStyle = color;
      ctx.fillRect(bw, stripY, total - bw * 2, stripH);
      // Text
      const text = labelText || 'Scan & Shop';
      ctx.fillStyle    = '#ffffff';
      ctx.font         = `bold ${Math.round(stripH * 0.42)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, total / 2, stripY + stripH / 2);
    },
  },
  {
    id: 'heart',
    label: 'Heart',
    hasLabel: false,
    extraPad: { top: 10, right: 10, bottom: 10, left: 10 },
    draw(ctx, total, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth   = 3;
      // Ornamental corner hearts (small, using unicode-like path)
      const drawHeart = (cx, cy, size) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);
        ctx.bezierCurveTo(-size, -size * 0.3, -size * 2, size * 0.6, 0, size * 1.3);
        ctx.bezierCurveTo(size * 2, size * 0.6, size, -size * 0.3, 0, size * 0.3);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      };
      const s = 8;
      drawHeart(s * 1.5, s * 1.5, s);
      drawHeart(total - s * 1.5, s * 1.5, s);
      drawHeart(s * 1.5, total - s * 1.5, s);
      drawHeart(total - s * 1.5, total - s * 1.5, s);
      // Simple border
      ctx.strokeRect(3, 3, total - 6, total - 6);
    },
  },
  {
    id: 'floral',
    label: 'Floral',
    hasLabel: false,
    extraPad: { top: 14, right: 14, bottom: 14, left: 14 },
    draw(ctx, total, color) {
      // Decorative border with petal ornaments at corners
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.strokeRect(6, 6, total - 12, total - 12);
      // Draw simple petal at each corner
      const drawPetal = (x, y) => {
        ctx.fillStyle = color;
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((Math.PI / 2) * i);
          ctx.beginPath();
          ctx.ellipse(0, -7, 4, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        // center dot
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      };
      const margin = 10;
      drawPetal(margin, margin);
      drawPetal(total - margin, margin);
      drawPetal(margin, total - margin);
      drawPetal(total - margin, total - margin);
    },
  },
];

// ── Frame Picker UI ───────────────────────────────────────────

/** Build a mini SVG thumbnail for a frame preview (48×48) */
function buildFrameThumb(frame) {
  const size = 48;
  const svg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('aria-hidden', 'true');

  if (frame.id === 'none') {
    // Show a bare QR outline
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', '8'); r.setAttribute('y', '8');
    r.setAttribute('width', '32'); r.setAttribute('height', '32');
    r.setAttribute('fill', 'none');
    r.setAttribute('stroke', '#94a3b8');
    r.setAttribute('stroke-width', '1.5');
    r.setAttribute('stroke-dasharray', '3 2');
    svg.appendChild(r);
    return svg;
  }

  // Use a temporary canvas to draw, then embed as image
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Draw QR placeholder (checkerboard-like)
  ctx.fillStyle = '#e2e8f0';
  const qStart = Math.round(size * 0.18);
  const qSize  = size - qStart * 2;
  ctx.fillRect(qStart, qStart, qSize, qSize);
  ctx.fillStyle = '#94a3b8';
  const cell = Math.floor(qSize / 5);
  for (let r2 = 0; r2 < 5; r2++) {
    for (let c = 0; c < 5; c++) {
      if ((r2 + c) % 2 === 0) {
        ctx.fillRect(qStart + c * cell, qStart + r2 * cell, cell, cell);
      }
    }
  }

  // Draw frame
  try {
    frame.draw(ctx, size, '#6366f1', frame.hasLabel ? 'SCAN ME' : '', qSize, qStart);
  } catch (e) { /* swallow preview errors */ }

  const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  img.setAttribute('href', canvas.toDataURL());
  img.setAttribute('width', size);
  img.setAttribute('height', size);
  svg.appendChild(img);
  return svg;
}

function renderFramePicker() {
  const container = dom.framePicker;
  container.innerHTML = '';

  FRAMES.forEach((frame) => {
    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.className = `frame-option${state.selectedFrame === frame.id ? ' selected' : ''}`;
    btn.dataset.frame = frame.id;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', state.selectedFrame === frame.id ? 'true' : 'false');
    btn.setAttribute('aria-label', frame.label);

    const preview = document.createElement('div');
    preview.className = 'frame-option__preview';
    preview.appendChild(buildFrameThumb(frame));

    const label = document.createElement('span');
    label.className   = 'frame-option__label';
    label.textContent = frame.label;

    btn.appendChild(preview);
    btn.appendChild(label);
    container.appendChild(btn);
  });
}

function selectFrame(frameId) {
  state.selectedFrame = frameId;

  // Update aria + classes
  dom.framePicker.querySelectorAll('.frame-option').forEach((btn) => {
    const active = btn.dataset.frame === frameId;
    btn.classList.toggle('selected', active);
    btn.setAttribute('aria-checked', active ? 'true' : 'false');
  });

  // Show / hide color + label controls
  const frame = FRAMES.find((f) => f.id === frameId);
  const hasFrame = frameId !== 'none';
  dom.frameOptions.classList.toggle('hidden', !hasFrame);
  if (frame) {
    dom.frameLabelGroup.classList.toggle('hidden', !frame.hasLabel);
  }

  if (state.lastQrData) applyCanvasEffects();
}

// ── Frame Drawing Helper ──────────────────────────────────────
function getActiveFrame() {
  return FRAMES.find((f) => f.id === state.selectedFrame) || FRAMES[0];
}


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

// ── Canvas Effects (logo, padding, color, frame) ─────────────
function applyCanvasEffects() {
  // Get the canvas rendered by qrcode.js
  const sourceCanvas = dom.qrOutput.querySelector('canvas');
  if (!sourceCanvas) return;

  const padding   = parseInt(dom.paddingSlider.value, 10);
  const size      = parseInt(dom.qrSize.value, 10);
  const frame     = getActiveFrame();
  const ep        = frame.extraPad;
  const frameColor = dom.frameColor?.value || '#6366f1';
  const labelText  = dom.frameLabel?.value.trim() || '';

  // Total canvas size includes user padding + frame extra padding
  const totalW = size + padding * 2 + ep.left + ep.right;
  const totalH = size + padding * 2 + ep.top  + ep.bottom;

  const canvas  = dom.qrFinalCanvas;
  canvas.width  = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  // Background fill
  ctx.fillStyle = dom.bgColor.value;
  ctx.fillRect(0, 0, totalW, totalH);

  // For shadow frame, we need to redraw bg after shadow layer
  if (frame.id === 'shadow') {
    // Draw shadow first, then bg card, then QR
    frame.draw(ctx, totalW < totalH ? totalW : totalH, frameColor, labelText, size, padding);
    ctx.fillStyle = dom.bgColor.value;
    const adj = 6; // matches shadow offset in frame def
    ctx.fillRect(0, 0, totalW - adj, totalH - adj);
  }

  // Draw QR
  const qrX = padding + ep.left;
  const qrY = padding + ep.top;
  ctx.drawImage(sourceCanvas, qrX, qrY, size, size);

  // Logo overlay
  if (state.logoImage) {
    const logoSize = Math.round(size * 0.20);
    const logoX    = qrX + Math.round((size - logoSize) / 2);
    const logoY    = qrY + Math.round((size - logoSize) / 2);

    const pad = 4;
    ctx.fillStyle = dom.bgColor.value;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2, 6);
    } else {
      ctx.rect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2);
    }
    ctx.fill();
    ctx.drawImage(state.logoImage, logoX, logoY, logoSize, logoSize);
  }

  // Draw frame on top (except shadow which was drawn first)
  if (frame.id !== 'none' && frame.id !== 'shadow') {
    const total = Math.max(totalW, totalH);
    frame.draw(ctx, totalW, frameColor, labelText, size, padding);
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

  // Always use the final canvas (which includes frame) as PNG-embedded SVG
  // This guarantees frame is included in export
  const canvas = dom.qrFinalCanvas;
  if (!canvas || !canvas.width) return;

  const pngData = canvas.toDataURL('image/png');
  const { width, height } = canvas;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <image href="${pngData}" x="0" y="0" width="${width}" height="${height}"/>
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

  // Frame picker — event delegation
  dom.framePicker.addEventListener('click', (e) => {
    const btn = e.target.closest('.frame-option');
    if (btn) selectFrame(btn.dataset.frame);
  });

  // Frame color
  if (dom.frameColor) {
    dom.frameColor.addEventListener('input', () => {
      if (dom.frameColorHex) dom.frameColorHex.textContent = dom.frameColor.value;
      if (state.lastQrData) applyCanvasEffects();
    });
  }

  // Frame label text
  if (dom.frameLabel) {
    dom.frameLabel.addEventListener('input', () => {
      if (state.lastQrData) applyCanvasEffects();
    });
  }
}

// ── Init ──────────────────────────────────────────────────────
function init() {
  renderFramePicker();
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
