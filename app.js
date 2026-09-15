/* ============================================================
   QR Code Generator — app.js
   Vanilla JS — No build step required
   ============================================================ */

'use strict';

// ── Config (injected via index.html inline script) ───────────
// SUPABASE_URL, SUPABASE_ANON_KEY, WORKER_URL are declared there.

// ── State ────────────────────────────────────────────────────
const state = {
  qrInstance:       null,
  logoImage:        null,
  currentType:      'url',
  currentUser:      null,
  supabase:         null,
  backendAvailable: true,
  debounceTimer:    null,
  lastQrData:       '',
  selectedFrame:    'none',
  selectedBody:     'square',
  selectedExtEye:   'square',   // external eye (outer border) shape
  selectedIntEye:   'square',   // internal eye (inner dot) shape
  qrMatrix:         null,
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
  // Body shape
  bodyPicker:         $('body-picker'),
  // Eye shapes
  extEyePicker:       $('ext-eye-picker'),
  intEyePicker:       $('int-eye-picker'),
  extEyeColor:        $('ext-eye-color'),
  extEyeColorHex:     $('ext-eye-color-hex'),
  intEyeColor:        $('int-eye-color'),
  intEyeColorHex:     $('int-eye-color-hex'),
  // Customization tabs
  custTabs:           document.querySelectorAll('.cust-tab'),
  custPanels:         document.querySelectorAll('.cust-panel'),
  btnResetSettings:   $('btn-reset-settings'),
  // Logo preview
  logoPreviewArea:    $('logo-preview-area'),
  // EC radio buttons
  ecRadios:           document.querySelectorAll('.ec-radio'),
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
    draw: () => {},
  },
  {
    id: 'simple',
    label: 'Simple',
    hasLabel: false,
    extraPad: { top: 8, right: 8, bottom: 8, left: 8 },
    draw(ctx, totalW, color, _label, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 16;
      const bw = 4;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.strokeRect(bw / 2, bw / 2, totalW - bw, totalH - bw);
    },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    hasLabel: false,
    extraPad: { top: 10, right: 10, bottom: 10, left: 10 },
    draw(ctx, totalW, color, _label, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 20;
      const bw = 4, r = 18;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.beginPath();
      ctx.roundRect(bw / 2, bw / 2, totalW - bw, totalH - bw, r);
      ctx.stroke();
    },
  },
  {
    id: 'double',
    label: 'Double',
    hasLabel: false,
    extraPad: { top: 12, right: 12, bottom: 12, left: 12 },
    draw(ctx, totalW, color, _label, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 24;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(3, 3, totalW - 6, totalH - 6);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 8, totalW - 16, totalH - 16);
    },
  },
  {
    id: 'dotted',
    label: 'Dotted',
    hasLabel: false,
    extraPad: { top: 10, right: 10, bottom: 10, left: 10 },
    draw(ctx, totalW, color, _label, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 20;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 3;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(4, 4, totalW - 8, totalH - 8);
      ctx.setLineDash([]);
    },
  },
  {
    id: 'corners',
    label: 'Corners',
    hasLabel: false,
    extraPad: { top: 10, right: 10, bottom: 10, left: 10 },
    draw(ctx, totalW, color, _label, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 20;
      const len = 28, bw = 4;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.lineCap     = 'square';
      const off = bw / 2;
      const corners = [
        [[off, off + len],           [off, off],           [off + len, off]],
        [[totalW-off-len, off],       [totalW-off, off],    [totalW-off, off+len]],
        [[off, totalH-off-len],       [off, totalH-off],    [off+len, totalH-off]],
        [[totalW-off-len, totalH-off],[totalW-off,totalH-off],[totalW-off,totalH-off-len]],
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
    draw(ctx, totalW, color, _label, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 20;
      ctx.fillStyle = color + '55';
      ctx.fillRect(6, 6, totalW - 6, totalH - 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, totalW - 6, totalH - 6);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(0.75, 0.75, totalW - 6 - 1.5, totalH - 6 - 1.5);
    },
  },
  {
    id: 'scan-bottom',
    label: 'Scan Me',
    hasLabel: true,
    extraPad: { top: 8, right: 8, bottom: 44, left: 8 },
    draw(ctx, totalW, color, labelText, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 8 + 44;
      const bh = 40, r = 12, bw = 3;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.beginPath();
      ctx.roundRect(bw/2, bw/2, totalW-bw, totalH-bw, r);
      ctx.stroke();
      const bannerY = totalH - bh - bw/2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(bw/2, bannerY);
      ctx.lineTo(totalW-bw/2, bannerY);
      ctx.lineTo(totalW-bw/2, totalH-r-bw/2);
      ctx.arcTo(totalW-bw/2, totalH-bw/2, totalW-r-bw/2, totalH-bw/2, r);
      ctx.lineTo(r+bw/2, totalH-bw/2);
      ctx.arcTo(bw/2, totalH-bw/2, bw/2, totalH-r-bw/2, r);
      ctx.lineTo(bw/2, bannerY);
      ctx.closePath();
      ctx.fill();
      const text = labelText || 'SCAN ME';
      ctx.fillStyle    = '#ffffff';
      ctx.font         = `bold ${Math.round(bh * 0.45)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, totalW/2, bannerY + bh/2);
    },
  },
  {
    id: 'scan-top',
    label: 'Top Banner',
    hasLabel: true,
    extraPad: { top: 44, right: 8, bottom: 8, left: 8 },
    draw(ctx, totalW, color, labelText, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 44 + 8;
      const bh = 40, r = 12, bw = 3;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.beginPath();
      ctx.roundRect(bw/2, bw/2, totalW-bw, totalH-bw, r);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(r+bw/2, bw/2);
      ctx.arcTo(totalW-bw/2, bw/2, totalW-bw/2, r+bw/2, r);
      ctx.lineTo(totalW-bw/2, bh+bw/2);
      ctx.lineTo(bw/2, bh+bw/2);
      ctx.lineTo(bw/2, r+bw/2);
      ctx.arcTo(bw/2, bw/2, r+bw/2, bw/2, r);
      ctx.closePath();
      ctx.fill();
      const text = labelText || 'SCAN ME';
      ctx.fillStyle    = '#ffffff';
      ctx.font         = `bold ${Math.round(bh * 0.45)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, totalW/2, bw/2 + bh/2);
    },
  },
  {
    id: 'phone',
    label: 'Phone',
    hasLabel: false,
    extraPad: { top: 36, right: 14, bottom: 52, left: 14 },
    draw(ctx, totalW, color, _label, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 36 + 52;
      const bw = 3, r = 22;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.beginPath();
      ctx.roundRect(bw/2, bw/2, totalW-bw, totalH-bw, r);
      ctx.stroke();
      // Top speaker bar
      const spW = totalW * 0.25, spH = 5, spX = (totalW-spW)/2, spY = 14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(spX, spY, spW, spH, 3);
      ctx.fill();
      // Bottom home button
      const btnR = 10, btnX = totalW/2, btnY = totalH - 26;
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
    draw(ctx, totalW, color, labelText, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 20 + 48;
      const bw = 3, r = 10;
      ctx.strokeStyle = color;
      ctx.lineWidth   = bw;
      ctx.beginPath();
      ctx.roundRect(bw/2, bw/2, totalW-bw, totalH-bw, r);
      ctx.stroke();
      // Hole at top
      const holeR = 8, holeX = totalW/2, holeY = 14;
      ctx.beginPath();
      ctx.arc(holeX, holeY, holeR, 0, Math.PI * 2);
      ctx.stroke();
      // Bottom strip
      const stripH = 36, stripY = totalH - stripH - bw/2;
      ctx.fillStyle = color;
      ctx.fillRect(bw, stripY, totalW-bw*2, stripH);
      const text = labelText || 'Scan & Shop';
      ctx.fillStyle    = '#ffffff';
      ctx.font         = `bold ${Math.round(stripH * 0.42)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, totalW/2, stripY + stripH/2);
    },
  },
  {
    id: 'heart',
    label: 'Heart',
    hasLabel: false,
    extraPad: { top: 10, right: 10, bottom: 10, left: 10 },
    draw(ctx, totalW, color, _label, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 20;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 3;
      const drawHeart = (cx, cy, sz) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.moveTo(0, sz * 0.3);
        ctx.bezierCurveTo(-sz, -sz * 0.3, -sz * 2, sz * 0.6, 0, sz * 1.3);
        ctx.bezierCurveTo(sz * 2, sz * 0.6, sz, -sz * 0.3, 0, sz * 0.3);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      };
      const s = 8;
      drawHeart(s*1.5, s*1.5, s);
      drawHeart(totalW-s*1.5, s*1.5, s);
      drawHeart(s*1.5, totalH-s*1.5, s);
      drawHeart(totalW-s*1.5, totalH-s*1.5, s);
      ctx.strokeRect(3, 3, totalW-6, totalH-6);
    },
  },
  {
    id: 'floral',
    label: 'Floral',
    hasLabel: false,
    extraPad: { top: 14, right: 14, bottom: 14, left: 14 },
    draw(ctx, totalW, color, _label, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 28;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.strokeRect(6, 6, totalW-12, totalH-12);
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
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      };
      const margin = 10;
      drawPetal(margin, margin);
      drawPetal(totalW-margin, margin);
      drawPetal(margin, totalH-margin);
      drawPetal(totalW-margin, totalH-margin);
    },
  },

  // ── Frames from frame 1.png ──────────────────────────────────

  {
    id: 'f1-scan-top-rounded',
    label: 'Bold Top',
    hasLabel: true,
    extraPad: { top: 52, right: 6, bottom: 6, left: 6 },
    draw(ctx, totalW, color, labelText, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 52 + 6;
      const bw = 4, r = 16;
      // Outer rounded rect border (double line)
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      ctx.beginPath();
      ctx.roundRect(bw / 2, bw / 2, totalW - bw, totalH - bw, r);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bw + 3, bw + 3, totalW - (bw + 3) * 2, totalH - (bw + 3) * 2, r * 0.7);
      ctx.stroke();
      // Top banner
      const bh = 46;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(bw / 2, bw / 2, totalW - bw, bh, [r, r, 0, 0]);
      ctx.fill();
      // Label
      const text = labelText || 'SCAN ME!';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(bh * 0.5)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, totalW / 2, bw / 2 + bh / 2);
    },
  },

  {
    id: 'f1-corner-bubble',
    label: 'Corner + Bubble',
    hasLabel: true,
    extraPad: { top: 14, right: 14, bottom: 56, left: 14 },
    draw(ctx, totalW, color, labelText, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 14 + 56;
      const len = 32, bw = 4;
      // Corner brackets only
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      ctx.lineCap = 'square';
      const off = bw / 2;
      const corners = [
        [[off, off + len], [off, off], [off + len, off]],
        [[totalW - off - len, off], [totalW - off, off], [totalW - off, off + len]],
        [[off, totalH - off - len - 56], [off, totalH - off - 56], [off + len, totalH - off - 56]],
        [[totalW - off - len, totalH - off - 56], [totalW - off, totalH - off - 56], [totalW - off, totalH - off - len - 56]],
      ];
      corners.forEach(([a, b, c]) => {
        ctx.beginPath();
        ctx.moveTo(...a);
        ctx.lineTo(...b);
        ctx.lineTo(...c);
        ctx.stroke();
      });
      // Speech bubble pill at bottom
      const bh = 40, br = 20;
      const bx = bw, by = totalH - bh - bw;
      const bw2 = totalW - bw * 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw2, bh, br);
      ctx.fill();
      // Triangle pointer upward from bubble
      const tx = totalW / 2;
      ctx.beginPath();
      ctx.moveTo(tx - 10, by);
      ctx.lineTo(tx + 10, by);
      ctx.lineTo(tx, by - 12);
      ctx.closePath();
      ctx.fill();
      // Label
      const text = labelText || 'SCAN ME!';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(bh * 0.46)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, totalW / 2, by + bh / 2);
    },
  },

  {
    id: 'f1-dashed-top',
    label: 'Dashed Banner',
    hasLabel: true,
    extraPad: { top: 52, right: 6, bottom: 6, left: 6 },
    draw(ctx, totalW, color, labelText, qrSize, outerPad) {
      const totalH = qrSize + outerPad * 2 + 52 + 6;
      const bw = 3, r = 14;
      // Dashed outer border
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.roundRect(bw / 2, bw / 2, totalW - bw, totalH - bw, r);
      ctx.stroke();
      ctx.setLineDash([]);
      // Inner solid border (inset)
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(10, 10, totalW - 20, totalH - 20, r * 0.6);
      ctx.stroke();
      // Top banner
      const bh = 46;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(bw / 2, bw / 2, totalW - bw, bh, [r, r, 0, 0]);
      ctx.fill();
      // Divider line between banner and QR
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(10, bh + bw / 2);
      ctx.lineTo(totalW - 10, bh + bw / 2);
      ctx.stroke();
      // Label
      const text = labelText || 'SCAN ME!';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(bh * 0.5)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, totalW / 2, bw / 2 + bh / 2);
    },
  },

  // ── Frames from frame2.png ──────────────────────────────────

  {
    id: 'f2-label-left',
    label: 'Label Left',
    hasLabel: true,
    orientation: 'landscape',
    absorbPadding: true,
    extraPad: { top: 8, right: 8, bottom: 8, left: 120 },
    draw(ctx, totalW, color, labelText, qrSize) {
      const outerPad = 8;
      const totalH = qrSize + outerPad * 2;
      const STRIP = 120;
      const bw = 3, r = 12;
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      ctx.beginPath();
      ctx.roundRect(bw/2, bw/2, totalW-bw, totalH-bw, r);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(bw, bw, STRIP-bw, totalH-bw*2, [r-1, 0, 0, r-1]);
      ctx.fill();
      const text = labelText || 'SCAN ME!';
      ctx.save();
      const fs = Math.round(Math.min(STRIP * 0.22, totalH * 0.18, 24));
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.translate(STRIP/2, totalH/2);
      ctx.rotate(-Math.PI/2);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    },
  },

  {
    id: 'f2-label-right',
    label: 'Label Right',
    hasLabel: true,
    orientation: 'landscape',
    absorbPadding: true,
    extraPad: { top: 8, right: 120, bottom: 8, left: 8 },
    draw(ctx, totalW, color, labelText, qrSize) {
      const outerPad = 8;
      const totalH = qrSize + outerPad * 2;
      const STRIP = 120;
      const bw = 3, r = 12;
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      ctx.beginPath();
      ctx.roundRect(bw/2, bw/2, totalW-bw, totalH-bw, r);
      ctx.stroke();
      const stripX = totalW - STRIP;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(stripX, bw, STRIP-bw, totalH-bw*2, [0, r-1, r-1, 0]);
      ctx.fill();
      const text = labelText || 'SCAN ME!';
      ctx.save();
      const fs = Math.round(Math.min(STRIP * 0.22, totalH * 0.18, 24));
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.translate(stripX + STRIP/2, totalH/2);
      ctx.rotate(Math.PI/2);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    },
  },

  {
    id: 'f2-scan-left-pill',
    label: 'Pill Left',
    hasLabel: true,
    orientation: 'landscape',
    absorbPadding: true,
    extraPad: { top: 8, right: 8, bottom: 8, left: 120 },
    draw(ctx, totalW, color, labelText, qrSize) {
      const outerPad = 8;
      const totalH = qrSize + outerPad * 2;
      const LABEL_W = 120;
      const r = totalH / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(0, 0, totalW, totalH, r);
      ctx.fill();
      // White QR background — QR drawn at (LABEL_W, outerPad) = (ep.left+0, ep.top+0)
      const qrX = LABEL_W;
      const qrY = outerPad;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, Math.min(r * 0.5, 20));
      ctx.fill();
      const text = labelText || 'SCAN ME!';
      const lines = text.split(' ');
      ctx.fillStyle = '#ffffff';
      const fs = Math.round(Math.min(LABEL_W * 0.22, totalH * 0.2, 26));
      ctx.font = `bold ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lineH = fs * 1.25;
      const startY = totalH / 2 - (lines.length - 1) * lineH / 2;
      lines.forEach((line, i) => ctx.fillText(line, LABEL_W / 2, startY + i * lineH));
    },
  },

  {
    id: 'f2-icon-right-pill',
    label: 'Pill Right',
    hasLabel: true,
    orientation: 'landscape',
    absorbPadding: true,
    extraPad: { top: 8, right: 120, bottom: 8, left: 8 },
    draw(ctx, totalW, color, labelText, qrSize) {
      const outerPad = 8;
      const totalH = qrSize + outerPad * 2;
      const LABEL_W = 120;
      const r = totalH / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(0, 0, totalW, totalH, r);
      ctx.fill();
      // White QR background — QR drawn at (8, 8) = (ep.left+0, ep.top+0)
      const qrX = 8;
      const qrY = outerPad;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, Math.min(r * 0.5, 20));
      ctx.fill();
      const labelSectionX = totalW - LABEL_W;
      const text = labelText || 'SCAN ME!';
      const lines = text.split(' ');
      ctx.fillStyle = '#ffffff';
      const fs = Math.round(Math.min(LABEL_W * 0.22, totalH * 0.2, 26));
      ctx.font = `bold ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lineH = fs * 1.25;
      const startY = totalH / 2 - (lines.length - 1) * lineH / 2;
      lines.forEach((line, i) => ctx.fillText(line, labelSectionX + LABEL_W / 2, startY + i * lineH));
    },
  },

  {
    id: 'f2-portrait-bottom',
    label: 'Portrait Bottom',
    hasLabel: true,
    orientation: 'portrait',
    absorbPadding: true,
    extraPad: { top: 8, right: 8, bottom: 80, left: 8 },
    draw(ctx, totalW, color, labelText, qrSize) {
      const outerPad = 8;
      const totalH = qrSize + outerPad * 2 + 80;
      const r = 16;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(0, 0, totalW, totalH, r);
      ctx.fill();
      // White QR area — at (outerPad, outerPad)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(outerPad - 4, outerPad - 4, qrSize + 8, qrSize + 8, 8);
      ctx.fill();
      const bannerY = outerPad + qrSize + outerPad;
      const bh = totalH - bannerY;
      const text = labelText || 'SCAN ME!';
      const lines = text.split(' ');
      ctx.fillStyle = '#ffffff';
      const fs = Math.round(Math.min(bh * 0.38, totalW * 0.12, 28));
      ctx.font = `bold ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lineH = fs * 1.3;
      const startY = bannerY + bh / 2 - (lines.length - 1) * lineH / 2;
      lines.forEach((line, i) => ctx.fillText(line, totalW / 2, startY + i * lineH));
    },
  },

  {
    id: 'f2-portrait-top',
    label: 'Portrait Top',
    hasLabel: true,
    orientation: 'portrait',
    absorbPadding: true,
    extraPad: { top: 80, right: 8, bottom: 8, left: 8 },
    draw(ctx, totalW, color, labelText, qrSize) {
      const outerPad = 8;
      const totalH = qrSize + outerPad * 2 + 80;
      const bh = 80, bw = 3, r = 16;
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      ctx.beginPath();
      ctx.roundRect(bw/2, bw/2, totalW-bw, totalH-bw, r);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(bw/2, bw/2, totalW-bw, bh, [r, r, 0, 0]);
      ctx.fill();
      const text = labelText || 'SCAN ME!';
      const lines = text.split(' ');
      ctx.fillStyle = '#ffffff';
      const fs = Math.round(Math.min(bh * 0.32, totalW * 0.12, 28));
      ctx.font = `bold ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lineH = fs * 1.3;
      const startY = bh / 2 - (lines.length - 1) * lineH / 2;
      lines.forEach((line, i) => ctx.fillText(line, totalW / 2, startY + i * lineH));
    },
  },

  {
    id: 'f2-speech-right',
    label: 'Speech Right',
    hasLabel: true,
    orientation: 'landscape',
    absorbPadding: true,
    extraPad: { top: 8, right: 116, bottom: 8, left: 8 },
    draw(ctx, totalW, color, labelText, qrSize) {
      const outerPad = 8;
      const totalH = qrSize + outerPad * 2;
      const LABEL_W = 116;
      const bw = 3, r = 16;
      const bubbleW = totalW - LABEL_W;
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      ctx.beginPath();
      ctx.roundRect(bw/2, bw/2, bubbleW-bw, totalH-bw, r);
      ctx.stroke();
      // Arrow right
      const arrowY = totalH / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(bubbleW-bw, arrowY-14);
      ctx.lineTo(bubbleW+20, arrowY);
      ctx.lineTo(bubbleW-bw, arrowY+14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bubbleW-bw-1, arrowY-12, bw+2, 24);
      const text = labelText || 'SCAN ME!';
      const lines = text.split(' ');
      ctx.fillStyle = color;
      const labelAreaStart = bubbleW + 20;
      const labelAreaW = totalW - labelAreaStart;
      const fs = Math.round(Math.min(labelAreaW * 0.24, totalH * 0.2, 26));
      ctx.font = `bold ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lineH = fs * 1.3;
      const startY = totalH / 2 - (lines.length - 1) * lineH / 2;
      lines.forEach((line, i) => ctx.fillText(line, labelAreaStart + labelAreaW / 2, startY + i * lineH));
    },
  },

  {
    id: 'f2-speech-left',
    label: 'Speech Left',
    hasLabel: true,
    orientation: 'landscape',
    absorbPadding: true,
    extraPad: { top: 8, right: 8, bottom: 8, left: 116 },
    draw(ctx, totalW, color, labelText, qrSize) {
      const outerPad = 8;
      const totalH = qrSize + outerPad * 2;
      const LABEL_W = 116;
      const bw = 3, r = 16;
      const qrStartX = LABEL_W;
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      ctx.beginPath();
      ctx.roundRect(qrStartX+bw/2, bw/2, totalW-qrStartX-bw, totalH-bw, r);
      ctx.stroke();
      // Arrow left
      const arrowY = totalH / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(qrStartX+bw, arrowY-14);
      ctx.lineTo(qrStartX-20, arrowY);
      ctx.lineTo(qrStartX+bw, arrowY+14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrStartX-1, arrowY-12, bw+2, 24);
      const text = labelText || 'SCAN ME!';
      const lines = text.split(' ');
      ctx.fillStyle = color;
      const labelAreaW = qrStartX - 20;
      const fs = Math.round(Math.min(labelAreaW * 0.24, totalH * 0.2, 26));
      ctx.font = `bold ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lineH = fs * 1.3;
      const startY = totalH / 2 - (lines.length - 1) * lineH / 2;
      lines.forEach((line, i) => ctx.fillText(line, labelAreaW / 2, startY + i * lineH));
    },
  },
];

// ── Frame Picker UI ───────────────────────────────────────────

/** Build a mini SVG thumbnail for a frame preview (48×48) */
function buildFrameThumb(frame) {
  const size = 48;
  const svg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');

  if (frame.id === 'none') {
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
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

  // Determine canvas dimensions based on orientation
  let canvasW = size, canvasH = size;
  if (frame.orientation === 'landscape') {
    canvasW = Math.round(size * 1.7);
    canvasH = size;
  } else if (frame.orientation === 'portrait') {
    canvasW = size;
    canvasH = Math.round(size * 1.5);
  }

  svg.setAttribute('viewBox', `0 0 ${canvasW} ${canvasH}`);
  svg.setAttribute('width', canvasW);
  svg.setAttribute('height', canvasH);

  // Use a temporary canvas to draw, then embed as image
  const canvas = document.createElement('canvas');
  canvas.width  = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  ctx._eyeBg = '#ffffff';

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Determine QR placeholder position for this frame orientation
  let qStart, qSize;
  if (frame.orientation === 'landscape') {
    qSize  = Math.round(canvasH * 0.64);
    qStart = Math.round((canvasH - qSize) / 2);
    const ep = frame.extraPad;
    const qrOffsetX = Math.round(ep.left * (canvasW / (ep.left + ep.right + qSize + qStart * 2)));
    // Draw QR placeholder on right side
    const qx = canvasW - qStart - qSize;
    const qy = qStart;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(qx, qy, qSize, qSize);
    ctx.fillStyle = '#94a3b8';
    const cell = Math.floor(qSize / 5);
    for (let r2 = 0; r2 < 5; r2++) {
      for (let c = 0; c < 5; c++) {
        if ((r2 + c) % 2 === 0) ctx.fillRect(qx + c * cell, qy + r2 * cell, cell, cell);
      }
    }
    try { frame.draw(ctx, canvasW, '#6366f1', 'SCAN ME!', qSize, qStart); } catch (e) { /* */ }
  } else if (frame.orientation === 'portrait') {
    qSize  = Math.round(canvasW * 0.64);
    qStart = Math.round((canvasW - qSize) / 2);
    const qy = Math.round(canvasH * 0.18);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(qStart, qy, qSize, qSize);
    ctx.fillStyle = '#94a3b8';
    const cell = Math.floor(qSize / 5);
    for (let r2 = 0; r2 < 5; r2++) {
      for (let c = 0; c < 5; c++) {
        if ((r2 + c) % 2 === 0) ctx.fillRect(qStart + c * cell, qy + r2 * cell, cell, cell);
      }
    }
    try { frame.draw(ctx, canvasW, '#6366f1', 'SCAN ME!', qSize, qStart); } catch (e) { /* */ }
  } else {
    // Standard square frame
    qStart = Math.round(size * 0.18);
    qSize  = size - qStart * 2;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(qStart, qStart, qSize, qSize);
    ctx.fillStyle = '#94a3b8';
    const cell = Math.floor(qSize / 5);
    for (let r2 = 0; r2 < 5; r2++) {
      for (let c = 0; c < 5; c++) {
        if ((r2 + c) % 2 === 0) ctx.fillRect(qStart + c * cell, qStart + r2 * cell, cell, cell);
      }
    }
    try { frame.draw(ctx, canvasW, '#6366f1', frame.hasLabel ? 'SCAN ME' : '', qSize, qStart); } catch (e) { /* */ }
  }

  const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  img.setAttribute('href', canvas.toDataURL());
  img.setAttribute('width', canvasW);
  img.setAttribute('height', canvasH);
  svg.appendChild(img);
  return svg;
}

function renderFramePicker() {
  const container = dom.framePicker;
  container.innerHTML = '';

  FRAMES.forEach((frame) => {
    const btn = document.createElement('button');
    btn.type      = 'button';
    let btnClass  = `frame-option${state.selectedFrame === frame.id ? ' selected' : ''}`;
    if (frame.orientation === 'landscape') btnClass += ' frame-option--landscape';
    if (frame.orientation === 'portrait')  btnClass += ' frame-option--portrait';
    btn.className = btnClass;
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
    const frame  = FRAMES.find((f) => f.id === btn.dataset.frame);
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

// ── Body Shape Definitions ────────────────────────────────────
/**
 * Each body shape defines how individual QR modules are drawn.
 * draw(ctx, x, y, size, color, neighbors)
 *   x, y    – top-left of the module cell
 *   size    – pixel size of the cell
 *   color   – fill color
 *   n       – neighbor map { top, right, bottom, left, tl, tr, bl, br } (boolean)
 */
const BODY_SHAPES = [
  {
    id: 'square',
    label: 'Square',
    draw(ctx, x, y, s, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, s, s);
    },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    draw(ctx, x, y, s, color, n) {
      const r = s * 0.35;
      ctx.fillStyle = color;
      ctx.beginPath();
      // round corners only where there's no neighbor
      const tl = n.top || n.left   ? 0 : r;
      const tr = n.top || n.right  ? 0 : r;
      const br = n.bottom || n.right  ? 0 : r;
      const bl = n.bottom || n.left   ? 0 : r;
      ctx.roundRect(x, y, s, s, [tl, tr, br, bl]);
      ctx.fill();
    },
  },
  {
    id: 'circle',
    label: 'Circle',
    draw(ctx, x, y, s, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.44, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'dot',
    label: 'Dot',
    draw(ctx, x, y, s, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'diamond',
    label: 'Diamond',
    draw(ctx, x, y, s, color) {
      const cx = x + s / 2, cy = y + s / 2, h = s * 0.46;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx,      cy - h);
      ctx.lineTo(cx + h,  cy);
      ctx.lineTo(cx,      cy + h);
      ctx.lineTo(cx - h,  cy);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'star',
    label: 'Star',
    draw(ctx, x, y, s, color) {
      const cx = x + s / 2, cy = y + s / 2;
      const outer = s * 0.44, inner = s * 0.20;
      const pts = 5;
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < pts * 2; i++) {
        const angle = (i * Math.PI) / pts - Math.PI / 2;
        const r2 = i % 2 === 0 ? outer : inner;
        i === 0
          ? ctx.moveTo(cx + r2 * Math.cos(angle), cy + r2 * Math.sin(angle))
          : ctx.lineTo(cx + r2 * Math.cos(angle), cy + r2 * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'cross',
    label: 'Cross',
    draw(ctx, x, y, s, color) {
      const t = s * 0.28, o = s * 0.18;
      ctx.fillStyle = color;
      // horizontal bar
      ctx.fillRect(x, y + o, s, t);
      // vertical bar
      ctx.fillRect(x + o, y, t, s);
    },
  },
  {
    id: 'vertical',
    label: 'Vertical',
    draw(ctx, x, y, s, color, n) {
      ctx.fillStyle = color;
      const r = s * 0.4;
      const tl = n.top  ? 0 : r;
      const bl = n.bottom ? 0 : r;
      ctx.beginPath();
      ctx.roundRect(x + s * 0.18, y, s * 0.64, s, [tl, tl, bl, bl]);
      ctx.fill();
    },
  },
  {
    id: 'horizontal',
    label: 'Horizontal',
    draw(ctx, x, y, s, color, n) {
      ctx.fillStyle = color;
      const r = s * 0.4;
      const tl = n.left  ? 0 : r;
      const tr = n.right ? 0 : r;
      ctx.beginPath();
      ctx.roundRect(x, y + s * 0.18, s, s * 0.64, [tl, tr, tr, tl]);
      ctx.fill();
    },
  },
  {
    id: 'leaf',
    label: 'Leaf',
    draw(ctx, x, y, s, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + s / 2, y);
      ctx.quadraticCurveTo(x + s, y,      x + s, y + s / 2);
      ctx.quadraticCurveTo(x + s, y + s,  x + s / 2, y + s);
      ctx.quadraticCurveTo(x,     y + s,  x, y + s / 2);
      ctx.quadraticCurveTo(x,     y,      x + s / 2, y);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'triangle',
    label: 'Triangle',
    draw(ctx, x, y, s, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + s / 2, y + s * 0.08);
      ctx.lineTo(x + s * 0.92, y + s * 0.92);
      ctx.lineTo(x + s * 0.08, y + s * 0.92);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'mosaic',
    label: 'Mosaic',
    draw(ctx, x, y, s, color) {
      // Split into 4 tiny squares with gap
      const g = s * 0.12, hs = (s - g * 3) / 2;
      ctx.fillStyle = color;
      [[0,0],[1,0],[0,1],[1,1]].forEach(([ci, ri]) => {
        ctx.fillRect(x + g + ci * (hs + g), y + g + ri * (hs + g), hs, hs);
      });
    },
  },
];

// ── Body Picker UI ────────────────────────────────────────────
function buildBodyThumb(shape) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, size, size);

  // Draw a small 5×5 QR-like pattern using the shape
  const cols = 5, cell = Math.floor((size * 0.78) / cols);
  const offsetX = Math.floor((size - cols * cell) / 2);
  const offsetY = offsetX;

  // Simple pattern: 1 = dark, 0 = light
  const pattern = [
    [1,1,1,0,1],
    [1,0,1,1,0],
    [0,1,1,0,1],
    [1,0,0,1,1],
    [1,1,0,1,0],
  ];

  const noNeighbor = { top:false, right:false, bottom:false, left:false };

  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      if (!pattern[r][c]) continue;
      const n = {
        top:    r > 0        && pattern[r-1][c],
        bottom: r < cols-1   && pattern[r+1][c],
        left:   c > 0        && pattern[r][c-1],
        right:  c < cols-1   && pattern[r][c+1],
      };
      shape.draw(ctx, offsetX + c * cell, offsetY + r * cell, cell, '#0f172a', n);
    }
  }

  const img = document.createElement('img');
  img.src = canvas.toDataURL();
  img.width  = size;
  img.height = size;
  img.alt = '';
  return img;
}

function renderBodyPicker() {
  const container = dom.bodyPicker;
  if (!container) return;
  container.innerHTML = '';

  BODY_SHAPES.forEach((shape) => {
    const btn = document.createElement('button');
    btn.type  = 'button';
    btn.className = `frame-option${state.selectedBody === shape.id ? ' selected' : ''}`;
    btn.dataset.body = shape.id;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', state.selectedBody === shape.id ? 'true' : 'false');
    btn.setAttribute('aria-label', shape.label);

    const preview = document.createElement('div');
    preview.className = 'frame-option__preview';
    preview.appendChild(buildBodyThumb(shape));

    const label = document.createElement('span');
    label.className   = 'frame-option__label';
    label.textContent = shape.label;

    btn.appendChild(preview);
    btn.appendChild(label);
    container.appendChild(btn);
  });
}

function selectBody(shapeId) {
  state.selectedBody = shapeId;
  dom.bodyPicker.querySelectorAll('.frame-option').forEach((btn) => {
    const active = btn.dataset.body === shapeId;
    btn.classList.toggle('selected', active);
    btn.setAttribute('aria-checked', active ? 'true' : 'false');
  });
  if (state.lastQrData) generateQR();
}

// ── QR Bit Matrix Extractor ───────────────────────────────────
/**
 * Extract the raw boolean matrix from qrcodejs.
 * Returns a 2D boolean array (true = dark module) or null on failure.
 */
function extractQrMatrix(qrInstance) {
  try {
    // qrcodejs stores the module data in _oQRCode.modules
    const modules = qrInstance._oQRCode?.modules;
    if (modules && Array.isArray(modules)) return modules;
    // Fallback: read from the rendered canvas pixel data
    const canvas = dom.qrOutput.querySelector('canvas');
    if (!canvas) return null;
    const size = canvas.width;
    const ctx2  = canvas.getContext('2d');
    const imgData = ctx2.getImageData(0, 0, size, size);
    // Determine module count from qrInstance
    const count = qrInstance._oQRCode?.moduleCount || Math.round(Math.sqrt(size));
    const cell  = size / count;
    const mat   = [];
    for (let r = 0; r < count; r++) {
      mat[r] = [];
      for (let c = 0; c < count; c++) {
        const px = Math.round((r + 0.5) * cell);
        const py = Math.round((c + 0.5) * cell);
        const idx = (px * size + py) * 4;
        mat[r][c] = imgData.data[idx] < 128;
      }
    }
    return mat;
  } catch (e) {
    console.warn('[QR] matrix extraction failed', e);
    return null;
  }
}

// ── Custom QR Canvas Renderer ─────────────────────────────────
/**
 * Render QR with custom body shape + custom eye shapes.
 * Returns an offscreen canvas.
 */
function renderQrWithShape(matrix, size, fgColor, bgColor) {
  const count  = matrix.length;
  const cell   = size / count;
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  const shape = BODY_SHAPES.find((s) => s.id === state.selectedBody) || BODY_SHAPES[0];
  const needCustomEyes = state.selectedExtEye !== 'square' || state.selectedIntEye !== 'square'
    || (dom.extEyeColor?.value && dom.extEyeColor.value !== fgColor)
    || (dom.intEyeColor?.value && dom.intEyeColor.value !== fgColor);

  // Draw body modules, skipping finder pattern zones
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (!matrix[r][c]) continue;
      if (isFinderModule(r, c, count)) continue; // drawn separately
      const x = c * cell;
      const y = r * cell;
      const n = {
        top:    r > 0       && matrix[r-1][c] && !isFinderModule(r-1, c, count),
        bottom: r < count-1 && matrix[r+1][c] && !isFinderModule(r+1, c, count),
        left:   c > 0       && matrix[r][c-1] && !isFinderModule(r, c-1, count),
        right:  c < count-1 && matrix[r][c+1] && !isFinderModule(r, c+1, count),
        tl:     r > 0 && c > 0       && matrix[r-1][c-1],
        tr:     r > 0 && c < count-1 && matrix[r-1][c+1],
        bl:     r < count-1 && c > 0       && matrix[r+1][c-1],
        br:     r < count-1 && c < count-1 && matrix[r+1][c+1],
      };
      shape.draw(ctx, x, y, cell, fgColor, n);
    }
  }

  // Draw the 3 finder eyes
  const finders = getFinderPositions(count, cell);
  finders.forEach(({ x, y, size: eyeSize }) => {
    drawFinderEye(ctx, x, y, eyeSize, bgColor);
  });

  return canvas;
}

// ── Eye Shape Definitions ─────────────────────────────────────
/**
 * QR finder patterns are at top-left, top-right, bottom-left.
 * Each consists of:
 *   - External eye: 7×7 module border ring
 *   - Internal eye: 3×3 filled center
 *
 * drawExt(ctx, x, y, size, color)
 *   draws the outer frame of a finder pattern
 *   x,y = pixel top-left, size = total pixel size of 7×7 area
 *
 * drawInt(ctx, x, y, size, color)
 *   draws the inner dot (3×3 area centered inside the 7×7)
 *   x,y = pixel top-left of the 3×3 area, size = pixel size of 3×3
 */

const EXT_EYE_SHAPES = [
  {
    id: 'square',
    label: 'Square',
    drawExt(ctx, x, y, s, color) {
      const bw = s / 7;
      ctx.fillStyle = color;
      // Outer fill then punch out inside
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = 'transparent';
      ctx.clearRect(x + bw, y + bw, s - bw * 2, s - bw * 2);
      // Re-draw bg in the hole (use saved bg from caller)
      ctx.fillStyle = ctx._eyeBg || '#ffffff';
      ctx.fillRect(x + bw, y + bw, s - bw * 2, s - bw * 2);
    },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    drawExt(ctx, x, y, s, color) {
      const bw = s / 7, r = s * 0.22;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, r);
      ctx.fill();
      ctx.fillStyle = ctx._eyeBg || '#ffffff';
      ctx.beginPath();
      ctx.roundRect(x + bw, y + bw, s - bw * 2, s - bw * 2, r * 0.6);
      ctx.fill();
    },
  },
  {
    id: 'circle',
    label: 'Circle',
    drawExt(ctx, x, y, s, color) {
      const cx = x + s / 2, cy = y + s / 2, bw = s / 7;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ctx._eyeBg || '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, s / 2 - bw, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'rounded-outer',
    label: 'Outer Round',
    drawExt(ctx, x, y, s, color) {
      const bw = s / 7, r = s * 0.30;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, r);
      ctx.fill();
      // Inner hole is square
      ctx.fillStyle = ctx._eyeBg || '#ffffff';
      ctx.fillRect(x + bw, y + bw, s - bw * 2, s - bw * 2);
    },
  },
  {
    id: 'rounded-inner',
    label: 'Inner Round',
    drawExt(ctx, x, y, s, color) {
      const bw = s / 7, r = s * 0.22;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = ctx._eyeBg || '#ffffff';
      ctx.beginPath();
      ctx.roundRect(x + bw, y + bw, s - bw * 2, s - bw * 2, r);
      ctx.fill();
    },
  },
  {
    id: 'diamond',
    label: 'Diamond',
    drawExt(ctx, x, y, s, color) {
      const cx = x + s / 2, cy = y + s / 2, bw = s / 7;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx,     y);
      ctx.lineTo(x + s,  cy);
      ctx.lineTo(cx,     y + s);
      ctx.lineTo(x,      cy);
      ctx.closePath();
      ctx.fill();
      const i = bw * 1.4;
      ctx.fillStyle = ctx._eyeBg || '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx,       y + i);
      ctx.lineTo(x + s - i, cy);
      ctx.lineTo(cx,       y + s - i);
      ctx.lineTo(x + i,    cy);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'leaf',
    label: 'Leaf',
    drawExt(ctx, x, y, s, color) {
      const bw = s / 7, r = s * 0.42;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + s / 2, y);
      ctx.quadraticCurveTo(x + s, y,     x + s, y + s / 2);
      ctx.quadraticCurveTo(x + s, y + s, x + s / 2, y + s);
      ctx.quadraticCurveTo(x,     y + s, x,     y + s / 2);
      ctx.quadraticCurveTo(x,     y,     x + s / 2, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = ctx._eyeBg || '#ffffff';
      const i = bw;
      ctx.beginPath();
      ctx.moveTo(x + s / 2, y + i);
      ctx.quadraticCurveTo(x + s - i, y + i,     x + s - i, y + s / 2);
      ctx.quadraticCurveTo(x + s - i, y + s - i, x + s / 2, y + s - i);
      ctx.quadraticCurveTo(x + i,     y + s - i, x + i,     y + s / 2);
      ctx.quadraticCurveTo(x + i,     y + i,     x + s / 2, y + i);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'cross',
    label: 'Cross',
    drawExt(ctx, x, y, s, color) {
      const t = s / 3.5, bw = s / 7;
      ctx.fillStyle = color;
      // cross shape: H bar + V bar
      ctx.fillRect(x, y + (s - t) / 2, s, t);
      ctx.fillRect(x + (s - t) / 2, y, t, s);
      // Punch inner cross hole
      ctx.fillStyle = ctx._eyeBg || '#ffffff';
      const i = bw;
      ctx.fillRect(x + i, y + (s - t) / 2 + i, s - i * 2, t - i * 2);
      ctx.fillRect(x + (s - t) / 2 + i, y + i, t - i * 2, s - i * 2);
    },
  },
];

const INT_EYE_SHAPES = [
  {
    id: 'square',
    label: 'Square',
    drawInt(ctx, x, y, s, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, s, s);
    },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    drawInt(ctx, x, y, s, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, s * 0.28);
      ctx.fill();
    },
  },
  {
    id: 'circle',
    label: 'Circle',
    drawInt(ctx, x, y, s, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.48, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'dot',
    label: 'Dot',
    drawInt(ctx, x, y, s, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'diamond',
    label: 'Diamond',
    drawInt(ctx, x, y, s, color) {
      const cx = x + s / 2, cy = y + s / 2, h = s * 0.46;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx,     cy - h);
      ctx.lineTo(cx + h, cy);
      ctx.lineTo(cx,     cy + h);
      ctx.lineTo(cx - h, cy);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'star',
    label: 'Star',
    drawInt(ctx, x, y, s, color) {
      const cx = x + s / 2, cy = y + s / 2;
      const outer = s * 0.46, inner = s * 0.20;
      const pts = 5;
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < pts * 2; i++) {
        const angle = (i * Math.PI) / pts - Math.PI / 2;
        const r2 = i % 2 === 0 ? outer : inner;
        i === 0
          ? ctx.moveTo(cx + r2 * Math.cos(angle), cy + r2 * Math.sin(angle))
          : ctx.lineTo(cx + r2 * Math.cos(angle), cy + r2 * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'cross',
    label: 'Cross',
    drawInt(ctx, x, y, s, color) {
      const t = s * 0.38, o = (s - t) / 2;
      ctx.fillStyle = color;
      ctx.fillRect(x, y + o, s, t);
      ctx.fillRect(x + o, y, t, s);
    },
  },
  {
    id: 'leaf',
    label: 'Leaf',
    drawInt(ctx, x, y, s, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + s / 2, y);
      ctx.quadraticCurveTo(x + s, y,     x + s, y + s / 2);
      ctx.quadraticCurveTo(x + s, y + s, x + s / 2, y + s);
      ctx.quadraticCurveTo(x,     y + s, x,     y + s / 2);
      ctx.quadraticCurveTo(x,     y,     x + s / 2, y);
      ctx.closePath();
      ctx.fill();
    },
  },
];

// ── Eye Picker UI ─────────────────────────────────────────────
function buildExtEyeThumb(shape) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, size, size);
  ctx._eyeBg = '#f8fafc';
  const pad = 8;
  try {
    shape.drawExt(ctx, pad, pad, size - pad * 2, '#0f172a');
  } catch (e) { /* */ }
  const img = document.createElement('img');
  img.src = canvas.toDataURL();
  img.width = img.height = size;
  img.alt = '';
  return img;
}

function buildIntEyeThumb(shape) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, size, size);
  // Draw outer shell in muted color for context
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(4, 4, size - 8, size - 8);
  ctx.fillStyle = '#f8fafc';
  const bw = (size - 8) / 7;
  ctx.fillRect(4 + bw, 4 + bw, size - 8 - bw * 2, size - 8 - bw * 2);
  // Draw inner shape
  const innerPad = 4 + bw * 2;
  const innerSize = size - innerPad * 2;
  try {
    shape.drawInt(ctx, innerPad, innerPad, innerSize, '#0f172a');
  } catch (e) { /* */ }
  const img = document.createElement('img');
  img.src = canvas.toDataURL();
  img.width = img.height = size;
  img.alt = '';
  return img;
}

function renderEyePicker(containerId, shapes, selectedId, dataAttr, buildThumbFn) {
  const container = $(containerId);
  if (!container) return;
  container.innerHTML = '';
  shapes.forEach((shape) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `frame-option${selectedId === shape.id ? ' selected' : ''}`;
    btn.dataset[dataAttr] = shape.id;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', selectedId === shape.id ? 'true' : 'false');
    btn.setAttribute('aria-label', shape.label);

    const preview = document.createElement('div');
    preview.className = 'frame-option__preview';
    preview.appendChild(buildThumbFn(shape));

    const label = document.createElement('span');
    label.className = 'frame-option__label';
    label.textContent = shape.label;

    btn.appendChild(preview);
    btn.appendChild(label);
    container.appendChild(btn);
  });
}

function selectExtEye(id) {
  state.selectedExtEye = id;
  document.querySelectorAll('#ext-eye-picker .frame-option').forEach((btn) => {
    const active = btn.dataset.extEye === id;
    btn.classList.toggle('selected', active);
    btn.setAttribute('aria-checked', active ? 'true' : 'false');
  });
  if (state.lastQrData) applyCanvasEffects();
}

function selectIntEye(id) {
  state.selectedIntEye = id;
  document.querySelectorAll('#int-eye-picker .frame-option').forEach((btn) => {
    const active = btn.dataset.intEye === id;
    btn.classList.toggle('selected', active);
    btn.setAttribute('aria-checked', active ? 'true' : 'false');
  });
  if (state.lastQrData) applyCanvasEffects();
}

// ── Finder Pattern Positions ──────────────────────────────────
/**
 * Returns the pixel position {x, y} of the 3 finder patterns
 * given the QR module count and cell size (in pixels).
 * Finder patterns are always at fixed positions in the QR spec:
 *   top-left:     col 0, row 0
 *   top-right:    col (count-7), row 0
 *   bottom-left:  col 0, row (count-7)
 */
function getFinderPositions(count, cell) {
  return [
    { col: 0,         row: 0         }, // top-left
    { col: count - 7, row: 0         }, // top-right
    { col: 0,         row: count - 7 }, // bottom-left
  ].map(({ col, row }) => ({
    x: col * cell,
    y: row * cell,
    size: 7 * cell,
  }));
}

/**
 * Returns true if module at (row, col) is inside any of the
 * 7×7 finder pattern zones (including the quiet separator row/col).
 */
function isFinderModule(row, col, count) {
  // 7×7 zones + 1 separator
  const inZone = (r, c, tr, tc) => r >= tr && r < tr + 8 && c >= tc && c < tc + 8;
  return (
    inZone(row, col, 0, 0) ||             // top-left
    inZone(row, col, 0, count - 8) ||     // top-right
    inZone(row, col, count - 8, 0)        // bottom-left
  );
}

// ── Draw Eye on Canvas ────────────────────────────────────────
function drawFinderEye(ctx, x, y, size, bgColor) {
  const extShape = EXT_EYE_SHAPES.find((s) => s.id === state.selectedExtEye) || EXT_EYE_SHAPES[0];
  const intShape = INT_EYE_SHAPES.find((s) => s.id === state.selectedIntEye) || INT_EYE_SHAPES[0];
  const extEyeColor = dom.extEyeColor?.value || dom.fgColor.value;
  const intEyeColor = dom.intEyeColor?.value || dom.fgColor.value;

  // Clear the area first with bg color
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, size, size);

  // Set bg reference for hollow shapes
  ctx._eyeBg = bgColor;

  // Draw outer ring (7×7 area)
  extShape.drawExt(ctx, x, y, size, extEyeColor);

  // Draw inner dot (3×3, centered in 7×7 i.e. offset by 2 cells)
  const cell = size / 7;
  const innerX = x + cell * 2;
  const innerY = y + cell * 2;
  const innerSize = cell * 3;
  intShape.drawInt(ctx, innerX, innerY, innerSize, intEyeColor);
}

// ── Customization Tabs ────────────────────────────────────────
function switchCustTab(tabId) {
  dom.custTabs.forEach((t) => {
    const active = t.dataset.custTab === tabId;
    t.classList.toggle('cust-tab--active', active);
    t.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  dom.custPanels.forEach((p) => {
    p.classList.toggle('hidden', p.id !== `cpanel-${tabId}`);
  });
}

// ── Reset Settings ────────────────────────────────────────────
function resetSettings() {
  dom.fgColor.value = '#000000';
  dom.bgColor.value = '#ffffff';
  dom.fgHex.textContent = '#000000';
  dom.bgHex.textContent = '#ffffff';

  dom.paddingSlider.value = '10';
  dom.paddingValue.textContent = '10';
  dom.qrSize.value = '300';
  dom.sizeValue.textContent = '300';

  dom.errorCorrection.value = 'M';
  dom.ecRadios.forEach((r) => { r.checked = r.value === 'M'; });

  clearLogo();
  selectFrame('none');
  if (dom.frameColor) { dom.frameColor.value = '#6366f1'; dom.frameColorHex.textContent = '#6366f1'; }
  if (dom.frameLabel) dom.frameLabel.value = '';

  selectBody('square');
  selectExtEye('square');
  selectIntEye('square');
  if (dom.extEyeColor) { dom.extEyeColor.value = '#000000'; dom.extEyeColorHex.textContent = '#000000'; }
  if (dom.intEyeColor) { dom.intEyeColor.value = '#000000'; dom.intEyeColorHex.textContent = '#000000'; }

  if (state.lastQrData) generateQR();
  showToast('Settings reset.', 'success');
}

// ── Logo Preview ──────────────────────────────────────────────
function updateLogoPreview() {
  if (!dom.logoPreviewArea) return;
  if (state.logoImage) {
    dom.logoPreviewArea.innerHTML = `<img src="${state.logoImage.src}" alt="Logo preview" />`;
  } else {
    dom.logoPreviewArea.innerHTML = '';
  }
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

    // Give qrcode.js a tick to render, then extract matrix + apply effects
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Extract bit matrix for custom body shape rendering
        state.qrMatrix = extractQrMatrix(state.qrInstance);
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

// ── Canvas Effects (logo, padding, color, body shape, frame) ──
function applyCanvasEffects() {
  const padding    = parseInt(dom.paddingSlider.value, 10);
  const size       = parseInt(dom.qrSize.value, 10);
  const frame      = getActiveFrame();
  const ep         = frame.extraPad;
  const frameColor = dom.frameColor?.value || '#6366f1';
  const labelText  = dom.frameLabel?.value.trim() || '';
  const fgColor    = dom.fgColor.value;
  const bgColor    = dom.bgColor.value;

  // Build the QR layer
  let qrLayer = null;
  if (state.qrMatrix) {
    qrLayer = renderQrWithShape(state.qrMatrix, size, fgColor, bgColor);
  } else {
    const sourceCanvas = dom.qrOutput.querySelector('canvas');
    if (!sourceCanvas) return;
    qrLayer = sourceCanvas;
  }

  // Total canvas size = QR + user padding on all sides + frame extra padding
  // For landscape/portrait frames that absorb padding, ignore user padding
  const effectivePad = frame.absorbPadding ? 0 : padding;
  const totalW = size + effectivePad * 2 + ep.left + ep.right;
  const totalH = size + effectivePad * 2 + ep.top  + ep.bottom;

  const canvas  = dom.qrFinalCanvas;
  canvas.width  = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  ctx._eyeBg = bgColor;

  // Background fill
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, totalW, totalH);

  const isSpecialFrame = frame.orientation === 'landscape' || frame.orientation === 'portrait';

  // Shadow frame: draw shadow first, then repaint bg card
  if (frame.id === 'shadow') {
    frame.draw(ctx, totalW, frameColor, labelText, size, padding);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalW - 6, totalH - 6);
  }

  // Landscape/Portrait: draw frame background FIRST, then QR on top
  if (isSpecialFrame) {
    frame.draw(ctx, totalW, frameColor, labelText, size, frame.absorbPadding ? 0 : padding);
  }

  // QR position: always at (ep.left + padding, ep.top + padding)
  // For landscape/portrait frames that absorb padding internally, padding=0
  const effectivePadding = frame.absorbPadding ? 0 : padding;
  const qrX = ep.left + effectivePadding;
  const qrY = ep.top  + effectivePadding;
  ctx.drawImage(qrLayer, qrX, qrY, size, size);

  // Logo overlay (centered on QR)
  if (state.logoImage) {
    const logoSize = Math.round(size * 0.20);
    const logoX    = qrX + Math.round((size - logoSize) / 2);
    const logoY    = qrY + Math.round((size - logoSize) / 2);
    const pad = 4;
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2, 6);
    } else {
      ctx.rect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2);
    }
    ctx.fill();
    ctx.drawImage(state.logoImage, logoX, logoY, logoSize, logoSize);
  }

  // Standard frames: draw frame on top of QR
  if (!isSpecialFrame && frame.id !== 'none' && frame.id !== 'shadow') {
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
      updateLogoPreview();
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
  updateLogoPreview();
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
  // Customization tabs
  dom.custTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchCustTab(tab.dataset.custTab));
  });

  // Reset settings
  if (dom.btnResetSettings) {
    dom.btnResetSettings.addEventListener('click', resetSettings);
  }

  // EC level radio → sync hidden select
  dom.ecRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        dom.errorCorrection.value = radio.value;
        debouncedGenerate();
      }
    });
  });

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

  // Body shape picker — event delegation
  if (dom.bodyPicker) {
    dom.bodyPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.frame-option');
      if (btn && btn.dataset.body) selectBody(btn.dataset.body);
    });
  }

  // External eye picker
  if (dom.extEyePicker) {
    dom.extEyePicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.frame-option');
      if (btn && btn.dataset.extEye) selectExtEye(btn.dataset.extEye);
    });
  }

  // Internal eye picker
  if (dom.intEyePicker) {
    dom.intEyePicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.frame-option');
      if (btn && btn.dataset.intEye) selectIntEye(btn.dataset.intEye);
    });
  }

  // Eye color pickers
  if (dom.extEyeColor) {
    dom.extEyeColor.addEventListener('input', () => {
      if (dom.extEyeColorHex) dom.extEyeColorHex.textContent = dom.extEyeColor.value;
      if (state.lastQrData) applyCanvasEffects();
    });
  }
  if (dom.intEyeColor) {
    dom.intEyeColor.addEventListener('input', () => {
      if (dom.intEyeColorHex) dom.intEyeColorHex.textContent = dom.intEyeColor.value;
      if (state.lastQrData) applyCanvasEffects();
    });
  }

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
  renderBodyPicker();
  renderEyePicker('ext-eye-picker', EXT_EYE_SHAPES, state.selectedExtEye, 'extEye', buildExtEyeThumb);
  renderEyePicker('int-eye-picker', INT_EYE_SHAPES, state.selectedIntEye, 'intEye', buildIntEyeThumb);
  bindEvents();
  initSupabase();
  updateCharCounter();

  const initialVal = getRawInputValue();
  if (initialVal) generateQR();
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
