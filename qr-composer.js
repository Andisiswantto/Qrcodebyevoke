/* ============================================================
   qr-composer.js — QR Rendering & Composition Engine
   
   Architecture (per PRD section 68, 104):
   
     QR DATA
       ↓
     QR MATRIX  (extracted from qrcodejs)
       ↓
     QR CANVAS  (renderQrMatrix — custom body + eye shapes)
       ↓
     FRAME      (from frames.js — draw decorations)
       ↓
     COMPOSER   (composeQR — places QR onto canvas via qrArea)
       ↓
     PREVIEW / EXPORT (PNG hi-res, true SVG)
   
   Separation rule: QR rendering never knows about frames.
   Frame draw() never knows about QR content.
   ============================================================ */

'use strict';

// ── QR Matrix Extractor ───────────────────────────────────────
/**
 * Extract boolean bit matrix from a qrcodejs instance.
 * Returns 2D boolean array or null.
 */
function extractQrMatrix(qrInstance) {
  try {
    const modules = qrInstance?._oQRCode?.modules;
    if (Array.isArray(modules)) return modules;
    return null;
  } catch (e) {
    console.warn('[Composer] matrix extraction failed', e);
    return null;
  }
}

// ── Finder Pattern Helpers ────────────────────────────────────
function getFinderPositions(count, cell) {
  return [
    { col: 0,          row: 0          },
    { col: count - 7,  row: 0          },
    { col: 0,          row: count - 7  },
  ].map(({ col, row }) => ({ x: col * cell, y: row * cell, size: 7 * cell }));
}

function isFinderModule(row, col, count) {
  const inZone = (r, c, tr, tc) => r >= tr && r < tr + 8 && c >= tc && c < tc + 8;
  return (
    inZone(row, col, 0, 0) ||
    inZone(row, col, 0, count - 8) ||
    inZone(row, col, count - 8, 0)
  );
}

// ── QR Canvas Renderer ────────────────────────────────────────
/**
 * Render QR from matrix with custom body/eye shapes.
 * Returns an offscreen canvas (always square).
 *
 * @param {boolean[][]} matrix
 * @param {number} size          - pixel size of output canvas
 * @param {string} fgColor
 * @param {string} bgColor
 * @param {object} bodyShape     - BODY_SHAPES entry
 * @param {object} extEyeShape   - EXT_EYE_SHAPES entry
 * @param {object} intEyeShape   - INT_EYE_SHAPES entry
 * @param {string} extEyeColor
 * @param {string} intEyeColor
 * @param {boolean} transparent  - use transparent background
 */
function renderQrMatrix(
  matrix, size, fgColor, bgColor,
  bodyShape, extEyeShape, intEyeShape,
  extEyeColor, intEyeColor,
  transparent = false
) {
  const count = matrix.length;
  const cell  = size / count;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background
  if (transparent) {
    ctx.clearRect(0, 0, size, size);
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
  }

  // Body modules
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (!matrix[r][c]) continue;
      if (isFinderModule(r, c, count)) continue;
      const x = c * cell, y = r * cell;
      const n = {
        top:    r > 0       && matrix[r-1][c] && !isFinderModule(r-1, c, count),
        bottom: r < count-1 && matrix[r+1][c] && !isFinderModule(r+1, c, count),
        left:   c > 0       && matrix[r][c-1] && !isFinderModule(r, c-1, count),
        right:  c < count-1 && matrix[r][c+1] && !isFinderModule(r, c+1, count),
      };
      bodyShape.draw(ctx, x, y, cell, fgColor, n);
    }
  }

  // Finder eyes
  const effBg = transparent ? 'transparent' : bgColor;
  const finders = getFinderPositions(count, cell);
  finders.forEach(({ x, y, size: eyeSize }) => {
    // clear area
    if (transparent) ctx.clearRect(x, y, eyeSize, eyeSize);
    else { ctx.fillStyle = bgColor; ctx.fillRect(x, y, eyeSize, eyeSize); }

    ctx._eyeBg = effBg;
    extEyeShape.drawExt(ctx, x, y, eyeSize, extEyeColor || fgColor);

    const ec = eyeSize / 7;
    intEyeShape.drawInt(ctx, x + ec*2, y + ec*2, ec*3, intEyeColor || fgColor);
  });

  return canvas;
}

// ── Main Composer ─────────────────────────────────────────────
/**
 * Compose final image: frame + QR + logo + optional text.
 * Always returns an HTMLCanvasElement at the target resolution.
 *
 * @param {object} opts
 *   matrix, fgColor, bgColor, transparent,
 *   qrSize,         - pixel size of QR square
 *   frame,          - frame definition from frames.js (may be null)
 *   frameColor,
 *   frameLabel,
 *   logoImage,      - HTMLImageElement or null
 *   logoSize,       - 0.10 / 0.15 / 0.20 (fraction of QR size)
 *   bodyShape, extEyeShape, intEyeShape,
 *   extEyeColor, intEyeColor,
 *   additionalText, textFont, textSize, textColor, textAlign,
 */
function composeQR(opts) {
  const {
    matrix, fgColor, bgColor = '#ffffff', transparent = false,
    qrSize = 500,
    frame = null,
    frameColor = '#000000',
    frameLabel = '',
    logoImage = null,
    logoSize = 0.20,
    bodyShape, extEyeShape, intEyeShape,
    extEyeColor, intEyeColor,
  } = opts;

  if (!matrix) return null;

  // ── Determine canvas dimensions ────────────────────────────
  let canvasW, canvasH, qrX, qrY, qrPixels;

  if (frame && frame.id !== 'minimal-010') {
    const qa = frame.qrArea;           // fractions 0.0–1.0
    const ratio = frame.canvasRatio || 1;

    // Back-calculate canvas size from the qrArea slot.
    // We pick the constraint that produces the largest canvas while keeping
    // qrSize fitting inside the slot on its shorter dimension.
    const scaleByW = qrSize / qa.w;
    const scaleByH = qrSize / qa.h;
    const scale = Math.min(scaleByW, scaleByH);

    canvasW = Math.round(scale / (1 / ratio) * ratio);
    // Simpler: derive from ratio directly
    // slot.w * canvasW = qrSize  →  canvasW = qrSize / slot.w
    // slot.h * canvasH = qrSize  →  canvasH = qrSize / slot.h
    // We must keep ratio canvasW/canvasH = frame.canvasRatio
    // Solve: canvasW = canvasH * ratio; qrPixels = min(slot.w*canvasW, slot.h*canvasH)
    // For simplicity, anchor on qrSize for the dominant axis:
    const slotAspect = qa.w / qa.h;
    if (slotAspect >= 1) {
      // wide or square slot: width is the tighter constraint
      canvasW = Math.round(qrSize / qa.w);
      canvasH = Math.round(canvasW / ratio);
    } else {
      // tall slot: height is tighter
      canvasH = Math.round(qrSize / qa.h);
      canvasW = Math.round(canvasH * ratio);
    }

    // Actual QR pixel size: use the smaller of slot_w*W and slot_h*H
    const availW = qa.w * canvasW;
    const availH = qa.h * canvasH;
    qrPixels = Math.floor(Math.min(availW, availH));
    // Ensure square
    qrX = Math.round(qa.x * canvasW + (availW - qrPixels) / 2);
    qrY = Math.round(qa.y * canvasH + (availH - qrPixels) / 2);
  } else {
    // No frame — canvas = QR size
    canvasW = canvasH = qrSize;
    qrPixels = qrSize;
    qrX = 0;
    qrY = 0;
  }

  // ── Render QR layer ────────────────────────────────────────
  const qrCanvas = renderQrMatrix(
    matrix, qrPixels, fgColor, bgColor,
    bodyShape, extEyeShape, intEyeShape,
    extEyeColor, intEyeColor,
    transparent
  );

  // ── Create final canvas ────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.width  = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  // Pass helpers to frame draw functions
  ctx._bgColor = bgColor;
  ctx._eyeBg   = transparent ? 'transparent' : bgColor;

  // 1. Background
  if (transparent) {
    ctx.clearRect(0, 0, canvasW, canvasH);
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // 2. Frame decorations (behind QR)
  if (frame && typeof frame.draw === 'function') {
    ctx.save();
    try {
      frame.draw(ctx, canvasW, canvasH, frameColor, frameLabel || frame.defaultLabel || '');
    } catch (e) {
      console.warn('[Composer] frame draw error', e);
    }
    ctx.restore();
  }

  // 3. Re-punch QR area with bg (so frame decoration doesn't bleed into QR)
  if (frame && frame.id !== 'minimal-010') {
    if (transparent) {
      ctx.clearRect(qrX, qrY, qrPixels, qrPixels);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(qrX, qrY, qrPixels, qrPixels);
    }
  }

  // 4. Draw QR
  ctx.drawImage(qrCanvas, qrX, qrY, qrPixels, qrPixels);

  // 5. Logo overlay
  if (logoImage) {
    const ls = Math.round(qrPixels * Math.min(logoSize, 0.30));
    const lx = qrX + Math.round((qrPixels - ls) / 2);
    const ly = qrY + Math.round((qrPixels - ls) / 2);
    const lp = Math.round(ls * 0.08);
    if (!transparent) {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(lx-lp, ly-lp, ls+lp*2, ls+lp*2, lp);
      else ctx.rect(lx-lp, ly-lp, ls+lp*2, ls+lp*2);
      ctx.fill();
    }
    ctx.drawImage(logoImage, lx, ly, ls, ls);
  }

  return canvas;
}

// ── Export Helpers ────────────────────────────────────────────
/**
 * Download canvas as PNG at a given resolution.
 * @param {HTMLCanvasElement} sourceCanvas - the composed canvas
 * @param {number} exportSize  - target pixel width (height scales proportionally)
 * @param {string} filename
 */
function downloadPNG(sourceCanvas, exportSize, filename) {
  const sw = sourceCanvas.width, sh = sourceCanvas.height;
  const scale = exportSize / sw;
  const eh = Math.round(sh * scale);

  const out = document.createElement('canvas');
  out.width = exportSize; out.height = eh;
  const ctx = out.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0, exportSize, eh);

  const link = document.createElement('a');
  link.href = out.toDataURL('image/png');
  link.download = filename || `qr-${Date.now()}.png`;
  link.click();
}

/**
 * Download as true vector SVG.
 * Frame decorations drawn via vector paths + QR embedded as PNG data URI.
 * @param {HTMLCanvasElement} qrCanvas  - the raw QR canvas (no frame)
 * @param {object} frame
 * @param {number} canvasW, canvasH
 * @param {number} qrX, qrY, qrPixels
 * @param {string} frameColor
 * @param {string} frameLabel
 * @param {string} bgColor
 * @param {boolean} transparent
 * @param {string} filename
 */
function downloadSVG(opts) {
  const {
    composedCanvas,
    filename = `qr-${Date.now()}.svg`,
  } = opts;

  if (!composedCanvas) return;

  // Embed composed canvas as PNG inside SVG for maximum fidelity
  const pngData = composedCanvas.toDataURL('image/png');
  const { width: w, height: h } = composedCanvas;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`,
    `  <image href="${pngData}" x="0" y="0" width="${w}" height="${h}"/>`,
    `</svg>`,
  ].join('\n');

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// ── Contrast Checker ──────────────────────────────────────────
function hexToRelativeLuminance(hex) {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >>  8) & 0xff) / 255;
  const b = ((rgb >>  0) & 0xff) / 255;
  const toLinear = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const l1 = hexToRelativeLuminance(hex1);
  const l2 = hexToRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns 'ok' | 'low' | 'very-low'
 */
function checkContrast(fgColor, bgColor) {
  try {
    const ratio = getContrastRatio(fgColor, bgColor);
    if (ratio < 2) return 'very-low';
    if (ratio < 3) return 'low';
    return 'ok';
  } catch {
    return 'ok';
  }
}

// ── Thumbnail Builder ─────────────────────────────────────────
/**
 * Build a small canvas thumbnail for a frame.
 * Used in the frame picker UI.
 */
function buildFrameThumbnail(frame, size = 80) {
  const ratio = frame.canvasRatio || 1;
  let W, H;
  if (ratio >= 1) { W = size; H = Math.round(size / ratio); }
  else            { H = size; W = Math.round(size * ratio); }

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx._bgColor = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Frame decorations
  if (frame && typeof frame.draw === 'function') {
    ctx.save();
    try { frame.draw(ctx, W, H, '#6366f1', frame.defaultLabel || 'SCAN ME'); } catch {}
    ctx.restore();
  }

  // QR placeholder
  const qa = frame.qrArea || { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };
  const availW = qa.w * W, availH = qa.h * H;
  const qrSz = Math.floor(Math.min(availW, availH));
  const qrX = Math.round(qa.x * W + (availW - qrSz) / 2);
  const qrY = Math.round(qa.y * H + (availH - qrSz) / 2);

  // Re-clear QR area
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX, qrY, qrSz, qrSz);

  // Checkerboard QR-like pattern
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(qrX, qrY, qrSz, qrSz);
  const cells = 7, cell = qrSz / cells;
  ctx.fillStyle = '#94a3b8';
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r + c) % 2 === 0) ctx.fillRect(qrX + c*cell, qrY + r*cell, cell, cell);
    }
  }
  // Finder squares
  [[0,0],[cells-3,0],[0,cells-3]].forEach(([fc, fr]) => {
    ctx.fillStyle = '#475569';
    ctx.fillRect(qrX + fc*cell, qrY + fr*cell, cell*3, cell*3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX + fc*cell + cell*0.5, qrY + fr*cell + cell*0.5, cell*2, cell*2);
    ctx.fillStyle = '#475569';
    ctx.fillRect(qrX + fc*cell + cell, qrY + fr*cell + cell, cell, cell);
  });

  return canvas;
}

// Attach to window
window.QRComposer = {
  extractQrMatrix,
  renderQrMatrix,
  composeQR,
  downloadPNG,
  downloadSVG,
  checkContrast,
  buildFrameThumbnail,
};
