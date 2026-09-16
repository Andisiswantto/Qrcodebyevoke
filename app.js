/* ============================================================
   app.js — ANTT QR Generator
   Uses: frames.js (ANTT_FRAMES) + qr-composer.js (QRComposer)
   Vanilla JS — No build step required
   ============================================================ */

'use strict';

// ── State ─────────────────────────────────────────────────────
const state = {
  qrInstance:       null,
  qrMatrix:         null,
  logoImage:        null,
  currentType:      'url',
  currentUser:      null,
  supabase:         null,
  backendAvailable: true,
  debounceTimer:    null,
  lastQrData:       '',
  selectedFrame:    null,          // frame object or null
  selectedBody:     'square',
  selectedExtEye:   'square',
  selectedIntEye:   'square',
  frameCategory:    'all',
  frameSearch:      '',
  composedCanvas:   null,          // last composed canvas (for export)
};

// ── DOM Refs ──────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const dom = {
  tabs:              document.querySelectorAll('.tab'),
  inputVariants:     document.querySelectorAll('.input-variant'),
  inputUrl:          $('qr-input-url'),
  inputText:         $('qr-input-text'),
  inputEmail:        $('qr-input-email'),
  inputPhone:        $('qr-input-phone'),
  charCount:         $('char-count'),
  charMax:           $('char-max'),
  fgColor:           $('fg-color'),
  bgColor:           $('bg-color'),
  fgHex:             $('fg-hex'),
  bgHex:             $('bg-hex'),
  paddingSlider:     $('padding-slider'),
  paddingValue:      $('padding-value'),
  qrSizeSlider:      $('qr-size'),
  sizeValue:         $('size-value'),
  logoUpload:        $('logo-upload'),
  logoFilename:      $('logo-filename'),
  btnClearLogo:      $('btn-clear-logo'),
  errorCorrection:   $('error-correction'),
  qrLoading:         $('qr-loading'),
  qrPlaceholder:     $('qr-placeholder'),
  qrOutput:          $('qr-output'),
  qrCanvasContainer: $('qr-canvas-container'),
  qrFinalCanvas:     $('qr-final-canvas'),
  btnDownloadPng:    $('btn-download-png'),
  btnDownloadSvg:    $('btn-download-svg'),
  pngResolution:     $('png-resolution'),
  authLoggedOut:     $('auth-logged-out'),
  authLoggedIn:      $('auth-logged-in'),
  authUserEmail:     $('auth-user-email'),
  btnLogin:          $('btn-login'),
  btnLogout:         $('btn-logout'),
  loginModal:        $('login-modal'),
  modalBackdrop:     $('modal-backdrop'),
  modalClose:        $('modal-close'),
  loginForm:         $('login-form'),
  loginEmail:        $('login-email'),
  btnSendMagic:      $('btn-send-magic'),
  loginSuccess:      $('login-success'),
  dynamicSection:    $('dynamic-section'),
  btnSaveQr:         $('btn-save-qr'),
  savedQrList:       $('saved-qr-list'),
  savedQrLoading:    $('saved-qr-loading'),
  btnRefreshQr:      $('btn-refresh-qr'),
  shortUrlDisplay:   $('short-url-display'),
  shortUrlLink:      $('short-url-link'),
  btnCopyUrl:        $('btn-copy-url'),
  editModal:         $('edit-modal'),
  editModalBackdrop: $('edit-modal-backdrop'),
  editModalClose:    $('edit-modal-close'),
  editForm:          $('edit-form'),
  editQrId:          $('edit-qr-id'),
  editQrData:        $('edit-qr-data'),
  btnEditCancel:     $('btn-edit-cancel'),
  btnEditSave:       $('btn-edit-save'),
  toast:             $('toast'),
  backendNotice:     $('backend-notice'),
  framePicker:       $('frame-picker'),
  frameCatBar:       $('frame-cat-bar'),
  frameSearch:       $('frame-search'),
  frameOptions:      $('frame-options'),
  frameColor:        $('frame-color'),
  frameColorHex:     $('frame-color-hex'),
  frameLabel:        $('frame-label'),
  frameLabelGroup:   $('frame-label-group'),
  frameEmpty:        $('frame-empty'),
  contrastWarning:   $('contrast-warning'),
  bodyPicker:        $('body-picker'),
  extEyePicker:      $('ext-eye-picker'),
  intEyePicker:      $('int-eye-picker'),
  extEyeColor:       $('ext-eye-color'),
  extEyeColorHex:    $('ext-eye-color-hex'),
  intEyeColor:       $('int-eye-color'),
  intEyeColorHex:    $('int-eye-color-hex'),
  logoPreviewArea:   $('logo-preview-area'),
  ecRadios:          document.querySelectorAll('.ec-radio'),
};

// ── Body Shape Definitions ────────────────────────────────────
const BODY_SHAPES = [
  {
    id: 'square', label: 'Square',
    draw(ctx, x, y, s, color) {
      ctx.fillStyle = color; ctx.fillRect(x, y, s, s);
    },
  },
  {
    id: 'rounded', label: 'Rounded',
    draw(ctx, x, y, s, color, n) {
      const r = s * 0.35;
      ctx.fillStyle = color; ctx.beginPath();
      ctx.roundRect(x, y, s, s, [
        n.top||n.left?0:r, n.top||n.right?0:r,
        n.bottom||n.right?0:r, n.bottom||n.left?0:r,
      ]); ctx.fill();
    },
  },
  {
    id: 'circle', label: 'Circle',
    draw(ctx, x, y, s, color) {
      ctx.fillStyle = color; ctx.beginPath();
      ctx.arc(x+s/2, y+s/2, s*0.44, 0, Math.PI*2); ctx.fill();
    },
  },
  {
    id: 'dot', label: 'Dot',
    draw(ctx, x, y, s, color) {
      ctx.fillStyle = color; ctx.beginPath();
      ctx.arc(x+s/2, y+s/2, s*0.32, 0, Math.PI*2); ctx.fill();
    },
  },
  {
    id: 'diamond', label: 'Diamond',
    draw(ctx, x, y, s, color) {
      const cx=x+s/2, cy=y+s/2, h=s*0.46;
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(cx,cy-h); ctx.lineTo(cx+h,cy);
      ctx.lineTo(cx,cy+h); ctx.lineTo(cx-h,cy);
      ctx.closePath(); ctx.fill();
    },
  },
  {
    id: 'star', label: 'Star',
    draw(ctx, x, y, s, color) {
      const cx=x+s/2, cy=y+s/2, outer=s*0.44, inner=s*0.20, pts=5;
      ctx.fillStyle = color; ctx.beginPath();
      for (let i=0;i<pts*2;i++) {
        const a=(i*Math.PI)/pts-Math.PI/2, r=i%2===0?outer:inner;
        i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a))
             :ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
      }
      ctx.closePath(); ctx.fill();
    },
  },
  {
    id: 'vertical', label: 'Vertical',
    draw(ctx, x, y, s, color, n) {
      ctx.fillStyle = color; const r=s*0.4;
      ctx.beginPath();
      ctx.roundRect(x+s*0.18, y, s*0.64, s, [n.top?0:r,n.top?0:r,n.bottom?0:r,n.bottom?0:r]);
      ctx.fill();
    },
  },
  {
    id: 'horizontal', label: 'Horizontal',
    draw(ctx, x, y, s, color, n) {
      ctx.fillStyle = color; const r=s*0.4;
      ctx.beginPath();
      ctx.roundRect(x, y+s*0.18, s, s*0.64, [n.left?0:r,n.right?0:r,n.right?0:r,n.left?0:r]);
      ctx.fill();
    },
  },
  {
    id: 'leaf', label: 'Leaf',
    draw(ctx, x, y, s, color) {
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(x+s/2,y);
      ctx.quadraticCurveTo(x+s,y,   x+s,y+s/2);
      ctx.quadraticCurveTo(x+s,y+s, x+s/2,y+s);
      ctx.quadraticCurveTo(x,y+s,   x,y+s/2);
      ctx.quadraticCurveTo(x,y,     x+s/2,y);
      ctx.closePath(); ctx.fill();
    },
  },
  {
    id: 'mosaic', label: 'Mosaic',
    draw(ctx, x, y, s, color) {
      const g=s*0.12, hs=(s-g*3)/2;
      ctx.fillStyle = color;
      [[0,0],[1,0],[0,1],[1,1]].forEach(([ci,ri]) => {
        ctx.fillRect(x+g+ci*(hs+g), y+g+ri*(hs+g), hs, hs);
      });
    },
  },
];

// ── Eye Shape Definitions ─────────────────────────────────────
const EXT_EYE_SHAPES = [
  {
    id: 'square', label: 'Square',
    drawExt(ctx, x, y, s, color) {
      const bw=s/7; ctx.fillStyle=color; ctx.fillRect(x,y,s,s);
      ctx.fillStyle=ctx._eyeBg||'#ffffff'; ctx.fillRect(x+bw,y+bw,s-bw*2,s-bw*2);
    },
  },
  {
    id: 'rounded', label: 'Rounded',
    drawExt(ctx, x, y, s, color) {
      const bw=s/7, r=s*0.22; ctx.fillStyle=color;
      ctx.beginPath(); ctx.roundRect(x,y,s,s,r); ctx.fill();
      ctx.fillStyle=ctx._eyeBg||'#ffffff';
      ctx.beginPath(); ctx.roundRect(x+bw,y+bw,s-bw*2,s-bw*2,r*0.6); ctx.fill();
    },
  },
  {
    id: 'circle', label: 'Circle',
    drawExt(ctx, x, y, s, color) {
      const cx=x+s/2, cy=y+s/2, bw=s/7;
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(cx,cy,s/2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=ctx._eyeBg||'#ffffff'; ctx.beginPath(); ctx.arc(cx,cy,s/2-bw,0,Math.PI*2); ctx.fill();
    },
  },
  {
    id: 'rounded-outer', label: 'Outer Round',
    drawExt(ctx, x, y, s, color) {
      const bw=s/7, r=s*0.30; ctx.fillStyle=color;
      ctx.beginPath(); ctx.roundRect(x,y,s,s,r); ctx.fill();
      ctx.fillStyle=ctx._eyeBg||'#ffffff'; ctx.fillRect(x+bw,y+bw,s-bw*2,s-bw*2);
    },
  },
  {
    id: 'rounded-inner', label: 'Inner Round',
    drawExt(ctx, x, y, s, color) {
      const bw=s/7, r=s*0.22; ctx.fillStyle=color; ctx.fillRect(x,y,s,s);
      ctx.fillStyle=ctx._eyeBg||'#ffffff';
      ctx.beginPath(); ctx.roundRect(x+bw,y+bw,s-bw*2,s-bw*2,r); ctx.fill();
    },
  },
  {
    id: 'diamond', label: 'Diamond',
    drawExt(ctx, x, y, s, color) {
      const cx=x+s/2, cy=y+s/2, bw=s/7;
      ctx.fillStyle=color; ctx.beginPath();
      ctx.moveTo(cx,y); ctx.lineTo(x+s,cy); ctx.lineTo(cx,y+s); ctx.lineTo(x,cy);
      ctx.closePath(); ctx.fill();
      const i=bw*1.4; ctx.fillStyle=ctx._eyeBg||'#ffffff'; ctx.beginPath();
      ctx.moveTo(cx,y+i); ctx.lineTo(x+s-i,cy); ctx.lineTo(cx,y+s-i); ctx.lineTo(x+i,cy);
      ctx.closePath(); ctx.fill();
    },
  },
  {
    id: 'leaf', label: 'Leaf',
    drawExt(ctx, x, y, s, color) {
      const bw=s/7; ctx.fillStyle=color; ctx.beginPath();
      ctx.moveTo(x+s/2,y); ctx.quadraticCurveTo(x+s,y,x+s,y+s/2);
      ctx.quadraticCurveTo(x+s,y+s,x+s/2,y+s); ctx.quadraticCurveTo(x,y+s,x,y+s/2);
      ctx.quadraticCurveTo(x,y,x+s/2,y); ctx.closePath(); ctx.fill();
      const i=bw; ctx.fillStyle=ctx._eyeBg||'#ffffff'; ctx.beginPath();
      ctx.moveTo(x+s/2,y+i); ctx.quadraticCurveTo(x+s-i,y+i,x+s-i,y+s/2);
      ctx.quadraticCurveTo(x+s-i,y+s-i,x+s/2,y+s-i); ctx.quadraticCurveTo(x+i,y+s-i,x+i,y+s/2);
      ctx.quadraticCurveTo(x+i,y+i,x+s/2,y+i); ctx.closePath(); ctx.fill();
    },
  },
];

const INT_EYE_SHAPES = [
  {
    id: 'square', label: 'Square',
    drawInt(ctx, x, y, s, color) { ctx.fillStyle=color; ctx.fillRect(x,y,s,s); },
  },
  {
    id: 'rounded', label: 'Rounded',
    drawInt(ctx, x, y, s, color) {
      ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(x,y,s,s,s*0.28); ctx.fill();
    },
  },
  {
    id: 'circle', label: 'Circle',
    drawInt(ctx, x, y, s, color) {
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x+s/2,y+s/2,s*0.48,0,Math.PI*2); ctx.fill();
    },
  },
  {
    id: 'dot', label: 'Dot',
    drawInt(ctx, x, y, s, color) {
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x+s/2,y+s/2,s*0.32,0,Math.PI*2); ctx.fill();
    },
  },
  {
    id: 'diamond', label: 'Diamond',
    drawInt(ctx, x, y, s, color) {
      const cx=x+s/2, cy=y+s/2, h=s*0.46;
      ctx.fillStyle=color; ctx.beginPath();
      ctx.moveTo(cx,cy-h); ctx.lineTo(cx+h,cy); ctx.lineTo(cx,cy+h); ctx.lineTo(cx-h,cy);
      ctx.closePath(); ctx.fill();
    },
  },
  {
    id: 'star', label: 'Star',
    drawInt(ctx, x, y, s, color) {
      const cx=x+s/2, cy=y+s/2, outer=s*0.46, inner=s*0.20, pts=5;
      ctx.fillStyle=color; ctx.beginPath();
      for (let i=0;i<pts*2;i++) {
        const a=(i*Math.PI)/pts-Math.PI/2, r=i%2===0?outer:inner;
        i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a))
             :ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
      }
      ctx.closePath(); ctx.fill();
    },
  },
  {
    id: 'leaf', label: 'Leaf',
    drawInt(ctx, x, y, s, color) {
      ctx.fillStyle=color; ctx.beginPath();
      ctx.moveTo(x+s/2,y); ctx.quadraticCurveTo(x+s,y,x+s,y+s/2);
      ctx.quadraticCurveTo(x+s,y+s,x+s/2,y+s); ctx.quadraticCurveTo(x,y+s,x,y+s/2);
      ctx.quadraticCurveTo(x,y,x+s/2,y); ctx.closePath(); ctx.fill();
    },
  },
];

// ── Frame Category Bar ────────────────────────────────────────
function renderCategoryBar() {
  const bar = dom.frameCatBar;
  if (!bar) return;
  bar.innerHTML = '';
  (window.ANTT_FRAME_CATEGORIES || []).forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'frame-cat-btn' + (cat.id === state.frameCategory ? ' active' : '');
    btn.dataset.cat = cat.id;
    btn.textContent = cat.label;
    bar.appendChild(btn);
  });
}

// ── Frame Grid ────────────────────────────────────────────────
function getFilteredFrames() {
  const all = window.ANTT_FRAMES || [];
  const q   = state.frameSearch.toLowerCase().trim();
  return all.filter((f) => {
    const catMatch = state.frameCategory === 'all' || f.category === state.frameCategory;
    const searchMatch = !q || f.name.toLowerCase().includes(q)
      || f.category.includes(q)
      || (f.tags || []).some((t) => t.includes(q));
    return catMatch && searchMatch;
  });
}

function renderFrameGrid() {
  const container = dom.framePicker;
  if (!container) return;
  container.innerHTML = '';

  const frames = getFilteredFrames();

  if (dom.frameEmpty) {
    dom.frameEmpty.classList.toggle('hidden', frames.length > 0);
  }

  // Featured section first (only when not searching and cat is 'all')
  const showFeatured = !state.frameSearch && state.frameCategory === 'all';
  const featured = showFeatured ? frames.filter((f) => f.featured) : [];
  const rest = showFeatured ? frames.filter((f) => !f.featured) : frames;

  if (featured.length) {
    const label = document.createElement('div');
    label.className = 'frame-section-label';
    label.textContent = '★ Featured';
    container.appendChild(label);
    featured.forEach((f) => container.appendChild(buildFrameCard(f)));

    if (rest.length) {
      const label2 = document.createElement('div');
      label2.className = 'frame-section-label';
      label2.textContent = 'All Frames';
      container.appendChild(label2);
    }
  }

  rest.forEach((f) => container.appendChild(buildFrameCard(f)));
}

function buildFrameCard(frame) {
  const selectedId = state.selectedFrame?.id || null;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'frame-card' + (selectedId === frame.id ? ' selected' : '');
  btn.dataset.frameId = frame.id;
  btn.setAttribute('role', 'radio');
  btn.setAttribute('aria-checked', selectedId === frame.id ? 'true' : 'false');
  btn.setAttribute('aria-label', frame.name);

  // Thumbnail
  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'frame-card__thumb';
  const thumbCanvas = QRComposer.buildFrameThumbnail(frame, 80);
  thumbWrap.appendChild(thumbCanvas);

  // Badges
  if (frame.isNew) {
    const badge = document.createElement('span');
    badge.className = 'frame-card__badge frame-card__badge--new';
    badge.textContent = 'NEW';
    thumbWrap.appendChild(badge);
  }
  if (frame.featured) {
    const badge = document.createElement('span');
    badge.className = 'frame-card__badge frame-card__badge--star';
    badge.textContent = '★';
    thumbWrap.appendChild(badge);
  }

  const nameEl = document.createElement('span');
  nameEl.className = 'frame-card__name';
  nameEl.textContent = frame.name;

  btn.appendChild(thumbWrap);
  btn.appendChild(nameEl);
  return btn;
}

function selectFrame(frameId) {
  const frame = (window.ANTT_FRAMES || []).find((f) => f.id === frameId) || null;
  state.selectedFrame = frame;

  // Update UI selection state
  dom.framePicker.querySelectorAll('.frame-card').forEach((btn) => {
    const active = btn.dataset.frameId === frameId;
    btn.classList.toggle('selected', active);
    btn.setAttribute('aria-checked', active ? 'true' : 'false');
  });

  // Show/hide frame options
  const hasFrame = !!frame && frame.id !== 'minimal-010';
  if (dom.frameOptions) dom.frameOptions.classList.toggle('hidden', !hasFrame);
  if (frame && dom.frameLabelGroup) {
    dom.frameLabelGroup.classList.toggle('hidden', !frame.hasLabel);
    if (frame.hasLabel && dom.frameLabel && !dom.frameLabel.value) {
      dom.frameLabel.value = frame.defaultLabel || '';
    }
  }

  if (state.lastQrData) compose();
}

// ── Body Picker ───────────────────────────────────────────────
function buildBodyThumb(shape) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, size, size);
  const cols = 5, cell = Math.floor(size * 0.78 / cols);
  const off = Math.floor((size - cols * cell) / 2);
  const pattern = [[1,1,1,0,1],[1,0,1,1,0],[0,1,1,0,1],[1,0,0,1,1],[1,1,0,1,0]];
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      if (!pattern[r][c]) continue;
      const n = {
        top:    r>0      && !!pattern[r-1]?.[c],
        bottom: r<cols-1 && !!pattern[r+1]?.[c],
        left:   c>0      && !!pattern[r]?.[c-1],
        right:  c<cols-1 && !!pattern[r]?.[c+1],
      };
      shape.draw(ctx, off+c*cell, off+r*cell, cell, '#0f172a', n);
    }
  }
  const img = document.createElement('img');
  img.src = canvas.toDataURL(); img.width = img.height = size; img.alt = '';
  return img;
}

function renderBodyPicker() {
  const container = dom.bodyPicker;
  if (!container) return;
  container.innerHTML = '';
  BODY_SHAPES.forEach((shape) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'frame-option' + (state.selectedBody === shape.id ? ' selected' : '');
    btn.dataset.body = shape.id;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', state.selectedBody === shape.id ? 'true' : 'false');
    btn.setAttribute('aria-label', shape.label);
    const preview = document.createElement('div');
    preview.className = 'frame-option__preview';
    preview.appendChild(buildBodyThumb(shape));
    const label = document.createElement('span');
    label.className = 'frame-option__label';
    label.textContent = shape.label;
    btn.appendChild(preview); btn.appendChild(label);
    container.appendChild(btn);
  });
}

function selectBody(id) {
  state.selectedBody = id;
  dom.bodyPicker.querySelectorAll('.frame-option').forEach((btn) => {
    const a = btn.dataset.body === id;
    btn.classList.toggle('selected', a);
    btn.setAttribute('aria-checked', a ? 'true' : 'false');
  });
  if (state.lastQrData) generateQR();
}

// ── Eye Pickers ───────────────────────────────────────────────
function buildExtEyeThumb(shape) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, size, size);
  ctx._eyeBg = '#f8fafc';
  try { shape.drawExt(ctx, 8, 8, size-16, '#0f172a'); } catch {}
  const img = document.createElement('img');
  img.src = canvas.toDataURL(); img.width = img.height = size; img.alt = '';
  return img;
}

function buildIntEyeThumb(shape) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#cbd5e1'; ctx.fillRect(4,4,size-8,size-8);
  const bw = (size-8)/7;
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(4+bw,4+bw,size-8-bw*2,size-8-bw*2);
  const ip = 4+bw*2, is2 = size-ip*2;
  try { shape.drawInt(ctx, ip, ip, is2, '#0f172a'); } catch {}
  const img = document.createElement('img');
  img.src = canvas.toDataURL(); img.width = img.height = size; img.alt = '';
  return img;
}

function renderEyePicker(containerId, shapes, selectedId, dataAttr, thumbFn) {
  const container = $(containerId);
  if (!container) return;
  container.innerHTML = '';
  shapes.forEach((shape) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'frame-option' + (selectedId === shape.id ? ' selected' : '');
    btn.dataset[dataAttr] = shape.id;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', selectedId === shape.id ? 'true' : 'false');
    btn.setAttribute('aria-label', shape.label);
    const preview = document.createElement('div');
    preview.className = 'frame-option__preview';
    preview.appendChild(thumbFn(shape));
    const label = document.createElement('span');
    label.className = 'frame-option__label';
    label.textContent = shape.label;
    btn.appendChild(preview); btn.appendChild(label);
    container.appendChild(btn);
  });
}

function selectExtEye(id) {
  state.selectedExtEye = id;
  document.querySelectorAll('#ext-eye-picker .frame-option').forEach((btn) => {
    const a = btn.dataset.extEye === id;
    btn.classList.toggle('selected', a);
    btn.setAttribute('aria-checked', a ? 'true' : 'false');
  });
  if (state.lastQrData) compose();
}

function selectIntEye(id) {
  state.selectedIntEye = id;
  document.querySelectorAll('#int-eye-picker .frame-option').forEach((btn) => {
    const a = btn.dataset.intEye === id;
    btn.classList.toggle('selected', a);
    btn.setAttribute('aria-checked', a ? 'true' : 'false');
  });
  if (state.lastQrData) compose();
}

// ── QR Generation ─────────────────────────────────────────────
function getQrData() {
  const inputs = { url: dom.inputUrl, text: dom.inputText, email: dom.inputEmail, phone: dom.inputPhone };
  const raw = (inputs[state.currentType]?.value || '').trim();
  if (!raw) return '';
  if (state.currentType === 'email') return raw.startsWith('mailto:') ? raw : `mailto:${raw}`;
  if (state.currentType === 'phone') return raw.startsWith('tel:')    ? raw : `tel:${raw}`;
  return raw;
}

function getActiveInput() {
  return { url: dom.inputUrl, text: dom.inputText, email: dom.inputEmail, phone: dom.inputPhone }[state.currentType];
}

function updateCharCounter() {
  const input = getActiveInput();
  const max = state.currentType === 'phone' ? 20 : 2000;
  const len = (input?.value || '').length;
  dom.charCount.textContent = len;
  dom.charMax.textContent   = max;
  const wrap = dom.charCount.closest('.char-counter');
  if (wrap) {
    wrap.classList.remove('warn', 'danger');
    if (len > max * 0.9) wrap.classList.add('danger');
    else if (len > max * 0.75) wrap.classList.add('warn');
  }
}

function getEcLevel() {
  const v = dom.errorCorrection?.value || 'M';
  return { L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M, Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H }[v] ?? QRCode.CorrectLevel.M;
}

function generateQR() {
  const data = getQrData();
  if (!data) { clearQrPreview(); return; }
  if (data.length > 2000) { showToast('Content exceeds 2000 characters.', 'error'); return; }

  state.lastQrData = data;
  showQrLoading(true);
  dom.qrOutput.innerHTML = '';
  dom.qrOutput.classList.remove('hidden');
  dom.qrPlaceholder.classList.add('hidden');
  dom.qrCanvasContainer.classList.add('hidden');

  try {
    const size = parseInt(dom.qrSizeSlider?.value || 400, 10);
    state.qrInstance = new QRCode(dom.qrOutput, {
      text: data,
      width: size, height: size,
      colorDark:    dom.fgColor.value,
      colorLight:   dom.bgColor.value,
      correctLevel: getEcLevel(),
    });

    requestAnimationFrame(() => setTimeout(() => {
      state.qrMatrix = QRComposer.extractQrMatrix(state.qrInstance);
      compose();
      showQrLoading(false);
    }, 80));
  } catch (err) {
    showQrLoading(false);
    clearQrPreview();
    showToast('Failed to generate QR code.', 'error');
    console.error('[QR]', err);
  }
}

// ── Compose & Render ──────────────────────────────────────────
function compose() {
  if (!state.qrMatrix) return;

  const fgColor  = dom.fgColor.value;
  const bgColor  = dom.bgColor.value;
  const qrSize   = parseInt(dom.qrSizeSlider?.value || 400, 10);
  const padding  = parseInt(dom.paddingSlider?.value || 10, 10);

  // Adjust effective QR size by padding (no frame = padding is just extra white space)
  const effectiveQrSize = Math.max(100, qrSize - padding * 2);

  const bodyShape  = BODY_SHAPES.find((s) => s.id === state.selectedBody) || BODY_SHAPES[0];
  const extEye     = EXT_EYE_SHAPES.find((s) => s.id === state.selectedExtEye) || EXT_EYE_SHAPES[0];
  const intEye     = INT_EYE_SHAPES.find((s) => s.id === state.selectedIntEye) || INT_EYE_SHAPES[0];
  const extColor   = dom.extEyeColor?.value || fgColor;
  const intColor   = dom.intEyeColor?.value || fgColor;
  const frame      = state.selectedFrame;
  const frameColor = dom.frameColor?.value || '#6366f1';
  const frameLabel = dom.frameLabel?.value.trim() || '';

  // Contrast check
  const contrast = QRComposer.checkContrast(fgColor, bgColor);
  if (dom.contrastWarning) {
    dom.contrastWarning.classList.toggle('hidden', contrast === 'ok');
  }

  const composed = QRComposer.composeQR({
    matrix:     state.qrMatrix,
    fgColor, bgColor,
    qrSize:     effectiveQrSize,
    frame,
    frameColor,
    frameLabel,
    logoImage:  state.logoImage,
    logoSize:   0.20,
    bodyShape, extEyeShape: extEye, intEyeShape: intEye,
    extEyeColor: extColor,
    intEyeColor: intColor,
  });

  if (!composed) return;
  state.composedCanvas = composed;

  // Draw to preview canvas
  const preview = dom.qrFinalCanvas;
  preview.width  = composed.width;
  preview.height = composed.height;
  preview.getContext('2d').drawImage(composed, 0, 0);

  // Scale for display
  const MAX = 440;
  const scale = Math.min(1, MAX / composed.width, MAX / composed.height);
  preview.style.width  = Math.round(composed.width  * scale) + 'px';
  preview.style.height = Math.round(composed.height * scale) + 'px';

  dom.qrOutput.classList.add('hidden');
  dom.qrCanvasContainer.classList.remove('hidden');
  dom.btnDownloadPng.disabled = false;
  dom.btnDownloadSvg.disabled = false;
}

function clearQrPreview() {
  dom.qrOutput.innerHTML = '';
  dom.qrOutput.classList.add('hidden');
  dom.qrCanvasContainer.classList.add('hidden');
  dom.qrPlaceholder.classList.remove('hidden');
  dom.btnDownloadPng.disabled = true;
  dom.btnDownloadSvg.disabled = true;
  state.lastQrData = '';
  state.composedCanvas = null;
}

function showQrLoading(show) {
  dom.qrLoading.classList.toggle('hidden', !show);
}

// ── Downloads ─────────────────────────────────────────────────
function downloadPng() {
  if (!state.composedCanvas) return;
  const resolution = parseInt(dom.pngResolution?.value || 2000, 10);
  const framePart  = state.selectedFrame ? state.selectedFrame.id : 'plain';
  const filename   = `qr-${framePart}-${resolution}.png`;
  QRComposer.downloadPNG(state.composedCanvas, resolution, filename);
}

function downloadSvg() {
  if (!state.composedCanvas) return;
  const framePart = state.selectedFrame ? state.selectedFrame.id : 'plain';
  QRComposer.downloadSVG({
    composedCanvas: state.composedCanvas,
    filename: `qr-${framePart}.svg`,
  });
}

// ── Logo ──────────────────────────────────────────────────────
function handleLogoUpload(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Please upload a valid image file.', 'error'); return; }
  if (file.size > 5 * 1024 * 1024)    { showToast('Logo must be under 5 MB.', 'error');           return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.logoImage = img;
      if (dom.logoFilename) dom.logoFilename.textContent = file.name;
      if (dom.btnClearLogo) dom.btnClearLogo.classList.remove('hidden');
      updateLogoPreview();
      if (state.lastQrData) compose();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearLogo() {
  state.logoImage = null;
  if (dom.logoUpload)   dom.logoUpload.value = '';
  if (dom.logoFilename) dom.logoFilename.textContent = 'Choose image…';
  if (dom.btnClearLogo) dom.btnClearLogo.classList.add('hidden');
  updateLogoPreview();
  if (state.lastQrData) compose();
}

function updateLogoPreview() {
  if (!dom.logoPreviewArea) return;
  dom.logoPreviewArea.innerHTML = state.logoImage
    ? `<img src="${state.logoImage.src}" alt="Logo preview" />`
    : '';
}

// ── Tab switching ─────────────────────────────────────────────
function switchTab(type) {
  state.currentType = type;
  dom.tabs.forEach((t) => {
    const a = t.dataset.type === type;
    t.classList.toggle('tab--active', a);
    t.setAttribute('aria-selected', a ? 'true' : 'false');
  });
  dom.inputVariants.forEach((v) => v.classList.toggle('hidden', v.id !== `input-${type}`));
  updateCharCounter();
  debouncedGenerate();
}

// ── Debounce ──────────────────────────────────────────────────
function debouncedGenerate() {
  clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(generateQR, 280);
}

// ── Toast ─────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = '', duration = 3500) {
  dom.toast.textContent = msg;
  dom.toast.className = `toast toast--visible${type ? ` toast--${type}` : ''}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { dom.toast.className = 'toast'; }, duration);
}

// ── Spinner ───────────────────────────────────────────────────
function setSpinner(btn, active) {
  btn.querySelector('.btn__text')?.classList.toggle('hidden', active);
  btn.querySelector('.btn__spinner')?.classList.toggle('hidden', !active);
  btn.disabled = active;
}

// ── Clipboard ─────────────────────────────────────────────────
async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); showToast('Copied!', 'success'); }
  catch { showToast('Could not copy. Please copy manually.', 'warning'); }
}

// ── Sanitize ──────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeAttr(s) { return escapeHtml(s).replace(/`/g,'&#96;'); }

// ── Auth (Supabase) ───────────────────────────────────────────
function initSupabase() {
  try {
    if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL') return;
    state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    state.supabase.auth.onAuthStateChange((_e, session) => {
      state.currentUser = session?.user ?? null;
      updateAuthUI();
      if (state.currentUser) loadSavedQrs();
    });
    state.supabase.auth.getSession().then(({ data }) => {
      state.currentUser = data.session?.user ?? null;
      updateAuthUI();
      if (state.currentUser) loadSavedQrs();
    });
  } catch (err) { console.error('[Auth]', err); }
}

function updateAuthUI() {
  const in_ = !!state.currentUser;
  dom.authLoggedOut.classList.toggle('hidden', in_);
  dom.authLoggedIn.classList.toggle('hidden', !in_);
  dom.dynamicSection.classList.toggle('hidden', !in_);
  if (in_) dom.authUserEmail.textContent = state.currentUser.email || '';
}

async function sendMagicLink(email) {
  if (!state.supabase) { showToast('Auth not configured.', 'error'); return; }
  setSpinner(dom.btnSendMagic, true);
  try {
    const { error } = await state.supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    if (error) throw error;
    dom.loginForm.classList.add('hidden');
    dom.loginSuccess.classList.remove('hidden');
  } catch (err) {
    showToast(err.message || 'Failed to send magic link.', 'error');
  } finally { setSpinner(dom.btnSendMagic, false); }
}

async function logout() {
  if (!state.supabase) return;
  try { await state.supabase.auth.signOut(); state.currentUser = null; updateAuthUI(); showToast('Logged out.', 'success'); }
  catch { showToast('Logout failed.', 'error'); }
}

// ── Dynamic QR ────────────────────────────────────────────────
async function saveQrCode() {
  if (!state.currentUser) { showToast('Please log in to save QR codes.', 'warning'); return; }
  const data = getQrData();
  if (!data) { showToast('Enter content first.', 'warning'); return; }
  setSpinner(dom.btnSaveQr, true);
  try {
    if (!state.backendAvailable || typeof WORKER_URL === 'undefined') throw new Error('Worker not configured.');
    const session = await state.supabase.auth.getSession();
    const token   = session.data.session?.access_token;
    if (!token) throw new Error('No active session.');
    const resp = await fetchWithTimeout(`${WORKER_URL}/api/qr/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ type: state.currentType, data }),
    }, 10000);
    if (!resp.ok) { const e = await resp.json().catch(()=>({})); throw new Error(e.error || `Error ${resp.status}`); }
    const result   = await resp.json();
    const shortUrl = `${WORKER_URL}/${result.short_url}`;
    dom.shortUrlDisplay.classList.remove('hidden');
    dom.shortUrlLink.href = dom.shortUrlLink.textContent = shortUrl;
    showToast('QR saved!', 'success');
    await loadSavedQrs();
  } catch (err) {
    if (isNetworkError(err)) markBackendUnavailable();
    else showToast(err.message || 'Failed to save.', 'error');
  } finally { setSpinner(dom.btnSaveQr, false); }
}

async function loadSavedQrs() {
  if (!state.currentUser || !state.supabase) return;
  dom.savedQrLoading.classList.remove('hidden');
  dom.savedQrList.innerHTML = '';
  try {
    const { data, error } = await state.supabase.from('qr_codes')
      .select('id,type,data,short_url,created_at')
      .eq('user_id', state.currentUser.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    data?.length ? renderQrList(data) : renderEmptyQrList();
  } catch { renderEmptyQrList('Failed to load QR codes.'); }
  finally { dom.savedQrLoading.classList.add('hidden'); }
}

function renderEmptyQrList(msg = 'No saved QR codes yet.') {
  dom.savedQrList.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><p>${escapeHtml(msg)}</p></div>`;
}

function renderQrList(qrCodes) {
  dom.savedQrList.innerHTML = qrCodes.map((qr) => {
    const shortUrl  = buildShortUrl(qr.short_url);
    const date      = new Date(qr.created_at).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
    const typeLabel = qr.type.charAt(0).toUpperCase() + qr.type.slice(1);
    return `<div class="saved-qr-item" data-id="${qr.id}">
      <div class="saved-qr-item__info">
        <div class="saved-qr-item__type">${escapeHtml(typeLabel)}</div>
        <div class="saved-qr-item__data" title="${escapeHtml(qr.data)}">${escapeHtml(qr.data)}</div>
        <div class="saved-qr-item__meta">${date}</div>
        ${shortUrl ? `<a class="saved-qr-item__short-url" href="${escapeHtml(shortUrl)}" target="_blank" rel="noopener">${escapeHtml(shortUrl)}</a>` : ''}
      </div>
      <div class="saved-qr-item__actions">
        <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${qr.id}" data-data="${escapeAttr(qr.data)}" aria-label="Edit">
          <svg viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');
}

function buildShortUrl(code) {
  if (!code) return null;
  return typeof WORKER_URL !== 'undefined' ? `${WORKER_URL}/${code}` : null;
}

async function updateQrCode(id, newData) {
  setSpinner(dom.btnEditSave, true);
  try {
    if (!state.backendAvailable || typeof WORKER_URL === 'undefined') throw new Error('Worker not configured.');
    const session = await state.supabase.auth.getSession();
    const token   = session.data.session?.access_token;
    if (!token) throw new Error('No session.');
    const resp = await fetchWithTimeout(`${WORKER_URL}/api/qr/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ data: newData }),
    }, 10000);
    if (!resp.ok) { const e = await resp.json().catch(()=>({})); throw new Error(e.error || `Error ${resp.status}`); }
    closeEditModal(); showToast('QR updated!', 'success'); await loadSavedQrs();
  } catch (err) {
    if (isNetworkError(err)) markBackendUnavailable();
    else showToast(err.message || 'Failed to update.', 'error');
  } finally { setSpinner(dom.btnEditSave, false); }
}

// ── Modals ────────────────────────────────────────────────────
function openEditModal(id, currentData) {
  dom.editQrId.value = id; dom.editQrData.value = currentData;
  dom.editModal.classList.remove('hidden'); dom.editQrData.focus();
}
function closeEditModal() { dom.editModal.classList.add('hidden'); dom.editForm.reset(); }
function openLoginModal() {
  dom.loginModal.classList.remove('hidden');
  dom.loginForm.classList.remove('hidden');
  dom.loginSuccess.classList.add('hidden');
  dom.loginEmail.value = '';
  setTimeout(() => dom.loginEmail.focus(), 50);
}
function closeLoginModal() { dom.loginModal.classList.add('hidden'); }

// ── Backend ───────────────────────────────────────────────────
function markBackendUnavailable() {
  if (!state.backendAvailable) return;
  state.backendAvailable = false;
  dom.backendNotice.classList.remove('hidden');
  showToast('Backend unavailable. Static mode only.', 'warning', 5000);
}
function isNetworkError(err) { return err instanceof TypeError && err.message.toLowerCase().includes('fetch'); }
function fetchWithTimeout(url, options = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

// ── Event Bindings ────────────────────────────────────────────
function bindEvents() {
  // Input tabs
  dom.tabs.forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.type)));

  // Text inputs
  [dom.inputUrl, dom.inputText, dom.inputEmail, dom.inputPhone].forEach((el) => {
    el?.addEventListener('input', () => { updateCharCounter(); debouncedGenerate(); });
  });

  // Colors
  dom.fgColor.addEventListener('input', () => { dom.fgHex.textContent = dom.fgColor.value; debouncedGenerate(); });
  dom.bgColor.addEventListener('input', () => { dom.bgHex.textContent = dom.bgColor.value; debouncedGenerate(); });

  // Sliders
  dom.paddingSlider?.addEventListener('input', () => {
    dom.paddingValue.textContent = dom.paddingSlider.value;
    if (state.lastQrData) compose();
  });
  dom.qrSizeSlider?.addEventListener('input', () => {
    dom.sizeValue.textContent = dom.qrSizeSlider.value;
    debouncedGenerate();
  });

  // Error correction
  dom.errorCorrection?.addEventListener('change', debouncedGenerate);
  dom.ecRadios.forEach((r) => r.addEventListener('change', () => {
    if (r.checked) { dom.errorCorrection.value = r.value; debouncedGenerate(); }
  }));

  // Logo
  dom.logoUpload?.addEventListener('change', (e) => handleLogoUpload(e.target.files[0]));
  dom.btnClearLogo?.addEventListener('click', clearLogo);

  // Downloads
  dom.btnDownloadPng.addEventListener('click', downloadPng);
  dom.btnDownloadSvg.addEventListener('click', downloadSvg);

  // Frame search
  dom.frameSearch?.addEventListener('input', () => {
    state.frameSearch = dom.frameSearch.value;
    renderFrameGrid();
  });

  // Frame category bar — event delegation
  dom.frameCatBar?.addEventListener('click', (e) => {
    const btn = e.target.closest('.frame-cat-btn');
    if (!btn) return;
    state.frameCategory = btn.dataset.cat;
    dom.frameCatBar.querySelectorAll('.frame-cat-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.cat === state.frameCategory);
    });
    renderFrameGrid();
  });

  // Frame grid — event delegation
  dom.framePicker?.addEventListener('click', (e) => {
    const btn = e.target.closest('.frame-card');
    if (btn) selectFrame(btn.dataset.frameId);
  });

  // Frame color
  dom.frameColor?.addEventListener('input', () => {
    if (dom.frameColorHex) dom.frameColorHex.textContent = dom.frameColor.value;
    if (state.lastQrData) compose();
  });

  // Frame label
  dom.frameLabel?.addEventListener('input', () => { if (state.lastQrData) compose(); });

  // Body picker
  dom.bodyPicker?.addEventListener('click', (e) => {
    const btn = e.target.closest('.frame-option');
    if (btn?.dataset.body) selectBody(btn.dataset.body);
  });

  // Eye pickers
  dom.extEyePicker?.addEventListener('click', (e) => {
    const btn = e.target.closest('.frame-option');
    if (btn?.dataset.extEye) selectExtEye(btn.dataset.extEye);
  });
  dom.intEyePicker?.addEventListener('click', (e) => {
    const btn = e.target.closest('.frame-option');
    if (btn?.dataset.intEye) selectIntEye(btn.dataset.intEye);
  });

  // Eye colors
  dom.extEyeColor?.addEventListener('input', () => {
    if (dom.extEyeColorHex) dom.extEyeColorHex.textContent = dom.extEyeColor.value;
    if (state.lastQrData) compose();
  });
  dom.intEyeColor?.addEventListener('input', () => {
    if (dom.intEyeColorHex) dom.intEyeColorHex.textContent = dom.intEyeColor.value;
    if (state.lastQrData) compose();
  });

  // Auth
  dom.btnLogin?.addEventListener('click', openLoginModal);
  dom.btnLogout?.addEventListener('click', logout);
  dom.modalBackdrop?.addEventListener('click', closeLoginModal);
  dom.modalClose?.addEventListener('click', closeLoginModal);

  // Login form
  dom.loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = dom.loginEmail.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email.', 'error'); return;
    }
    await sendMagicLink(email);
  });

  // Dynamic QR
  dom.btnSaveQr?.addEventListener('click', saveQrCode);
  dom.btnRefreshQr?.addEventListener('click', loadSavedQrs);
  dom.savedQrList?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="edit"]');
    if (btn) openEditModal(btn.dataset.id, btn.dataset.data);
  });

  // Edit modal
  dom.editModalBackdrop?.addEventListener('click', closeEditModal);
  dom.editModalClose?.addEventListener('click', closeEditModal);
  dom.btnEditCancel?.addEventListener('click', closeEditModal);
  dom.editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = dom.editQrId.value, newData = dom.editQrData.value.trim();
    if (!newData) { showToast('Destination cannot be empty.', 'error'); return; }
    await updateQrCode(id, newData);
  });

  // Copy short URL
  dom.btnCopyUrl?.addEventListener('click', () => {
    const url = dom.shortUrlLink.textContent.trim();
    if (url) copyToClipboard(url);
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLoginModal(); closeEditModal(); }
  });
}

// ── Init ──────────────────────────────────────────────────────
function init() {
  renderCategoryBar();
  renderFrameGrid();
  renderBodyPicker();
  renderEyePicker('ext-eye-picker', EXT_EYE_SHAPES, state.selectedExtEye, 'extEye', buildExtEyeThumb);
  renderEyePicker('int-eye-picker', INT_EYE_SHAPES, state.selectedIntEye, 'intEye', buildIntEyeThumb);
  bindEvents();
  initSupabase();
  updateCharCounter();
  if (getQrData()) generateQR();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
