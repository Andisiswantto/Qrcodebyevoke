/* ============================================================
   frames.js — ANTT QR Frame Library
   50 original frames across 10 categories.

   Frame object shape:
   {
     id:       string        – unique identifier
     name:     string        – display name
     category: string        – category key
     tags:     string[]      – searchable tags
     featured: boolean       – show in Featured section
     isNew:    boolean       – show NEW badge
     hasLabel: boolean       – frame supports editable text label
     defaultLabel: string    – default label text
     canvasRatio: number     – W/H of the full canvas (default 1 = square)

     qrArea: {               – QR placement in 0.0–1.0 fractions of canvas
       x: number, y: number, w: number, h: number
     }

     draw(ctx, W, H, color, label)
       – draws ONLY decorations (border, banner, badge, etc.)
       – ctx is already cleared with background color
       – QR will be rendered separately at the qrArea coordinates
       – color = frame accent color (user-configurable)
       – label = text string (may be empty for non-label frames)
   }
   ============================================================ */

'use strict';

const FRAME_CATEGORIES = [
  { id: 'all',       label: 'All' },
  { id: 'minimal',   label: 'Minimal' },
  { id: 'modern',    label: 'Modern' },
  { id: 'creative',  label: 'Creative' },
  { id: 'elegant',   label: 'Elegant' },
  { id: 'business',  label: 'Business' },
  { id: 'event',     label: 'Event' },
  { id: 'sport',     label: 'Sport' },
  { id: 'badge',     label: 'Badge' },
  { id: 'social',    label: 'Social' },
  { id: 'seasonal',  label: 'Seasonal' },
];

// ── Shared drawing helpers ────────────────────────────────────
function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function labelInBanner(ctx, text, cx, cy, fs, color) {
  ctx.fillStyle = color;
  ctx.font = `bold ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
}

// ── Frame Definitions ─────────────────────────────────────────
const FRAMES = [

  // ════════════════════════════════════════════════════════════
  // MINIMAL (10 frames)
  // ════════════════════════════════════════════════════════════

  {
    id: 'minimal-001',
    name: 'Clean Border',
    category: 'minimal',
    tags: ['minimal', 'simple', 'border', 'clean'],
    featured: true, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.06, y: 0.06, w: 0.88, h: 0.88 },
    draw(ctx, W, H, color) {
      const bw = W * 0.018;
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, W * 0.03);
      ctx.stroke();
    },
  },

  {
    id: 'minimal-002',
    name: 'Double Line',
    category: 'minimal',
    tags: ['minimal', 'double', 'border'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.84 },
    draw(ctx, W, H, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = W * 0.014;
      drawRoundRect(ctx, W*0.02, H*0.02, W*0.96, H*0.96, W*0.025);
      ctx.stroke();
      ctx.lineWidth = W * 0.007;
      drawRoundRect(ctx, W*0.035, H*0.035, W*0.93, H*0.93, W*0.02);
      ctx.stroke();
    },
  },

  {
    id: 'minimal-003',
    name: 'Corner Marks',
    category: 'minimal',
    tags: ['minimal', 'corners', 'brackets'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.07, y: 0.07, w: 0.86, h: 0.86 },
    draw(ctx, W, H, color) {
      const len = W * 0.13, bw = W * 0.022, off = W * 0.025;
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      ctx.lineCap = 'square';
      const corners = [
        [[off, off + len], [off, off], [off + len, off]],
        [[W-off-len, off], [W-off, off], [W-off, off+len]],
        [[off, H-off-len], [off, H-off], [off+len, H-off]],
        [[W-off-len, H-off], [W-off, H-off], [W-off, H-off-len]],
      ];
      corners.forEach(([a, b, c]) => {
        ctx.beginPath();
        ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c);
        ctx.stroke();
      });
    },
  },

  {
    id: 'minimal-004',
    name: 'Dotted Ring',
    category: 'minimal',
    tags: ['minimal', 'dotted', 'dashed'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.07, y: 0.07, w: 0.86, h: 0.86 },
    draw(ctx, W, H, color) {
      const bw = W * 0.016;
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      ctx.setLineDash([W * 0.04, W * 0.025]);
      drawRoundRect(ctx, bw, bw, W-bw*2, H-bw*2, W * 0.04);
      ctx.stroke();
      ctx.setLineDash([]);
    },
  },

  {
    id: 'minimal-005',
    name: 'Shadow Card',
    category: 'minimal',
    tags: ['minimal', 'shadow', 'card'],
    featured: true, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.06, y: 0.06, w: 0.86, h: 0.86 },
    draw(ctx, W, H, color) {
      const sh = W * 0.04;
      // shadow
      ctx.fillStyle = color + '33';
      drawRoundRect(ctx, sh, sh, W-sh, H-sh, W*0.035);
      ctx.fill();
      // background repaint (bg color already on ctx — use white for shadow effect)
      const bgC = ctx._bgColor || '#ffffff';
      ctx.fillStyle = bgC;
      drawRoundRect(ctx, 0, 0, W-sh, H-sh, W*0.035);
      ctx.fill();
      // border
      ctx.strokeStyle = color;
      ctx.lineWidth = W * 0.01;
      drawRoundRect(ctx, W*0.005, H*0.005, W-sh-W*0.01, H-sh-H*0.01, W*0.03);
      ctx.stroke();
    },
  },

  {
    id: 'minimal-006',
    name: 'Thick Border',
    category: 'minimal',
    tags: ['minimal', 'thick', 'bold', 'border'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.09, y: 0.09, w: 0.82, h: 0.82 },
    draw(ctx, W, H, color) {
      ctx.fillStyle = color;
      drawRoundRect(ctx, 0, 0, W, H, W * 0.05);
      ctx.fill();
      const bgC = ctx._bgColor || '#ffffff';
      ctx.fillStyle = bgC;
      drawRoundRect(ctx, W*0.045, H*0.045, W*0.91, H*0.91, W * 0.035);
      ctx.fill();
    },
  },

  {
    id: 'minimal-007',
    name: 'Side Lines',
    category: 'minimal',
    tags: ['minimal', 'lines', 'sides'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.07, y: 0.07, w: 0.86, h: 0.86 },
    draw(ctx, W, H, color) {
      const bw = W * 0.018, gap = H * 0.15;
      ctx.strokeStyle = color;
      ctx.lineWidth = bw;
      ctx.lineCap = 'round';
      // left line
      ctx.beginPath(); ctx.moveTo(bw/2, gap); ctx.lineTo(bw/2, H-gap); ctx.stroke();
      // right line
      ctx.beginPath(); ctx.moveTo(W-bw/2, gap); ctx.lineTo(W-bw/2, H-gap); ctx.stroke();
    },
  },

  {
    id: 'minimal-008',
    name: 'Bottom Scan',
    category: 'minimal',
    tags: ['minimal', 'scan me', 'label', 'bottom'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1 / 1.18,
    qrArea: { x: 0.05, y: 0.05, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.15, by = H * 0.84;
      ctx.fillStyle = color + '18';
      drawRoundRect(ctx, 0, by, W, H-by, W*0.04);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.006, H*0.006, W*0.988, H*0.988, W*0.04);
      ctx.stroke();
      labelInBanner(ctx, label || 'SCAN ME', W/2, by + bh/2, W * 0.062, color);
    },
  },

  {
    id: 'minimal-009',
    name: 'Top Label',
    category: 'minimal',
    tags: ['minimal', 'top', 'label'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1 / 1.18,
    qrArea: { x: 0.05, y: 0.17, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.15;
      ctx.fillStyle = color + '18';
      drawRoundRect(ctx, 0, 0, W, bh, W*0.04);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.006, H*0.006, W*0.988, H*0.988, W*0.04);
      ctx.stroke();
      labelInBanner(ctx, label || 'SCAN ME', W/2, bh/2, W * 0.062, color);
    },
  },

  {
    id: 'minimal-010',
    name: 'No Frame',
    category: 'minimal',
    tags: ['none', 'no frame', 'clean'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0, y: 0, w: 1, h: 1 },
    draw() {},
  },

  // ════════════════════════════════════════════════════════════
  // MODERN (10 frames)
  // ════════════════════════════════════════════════════════════

  {
    id: 'modern-001',
    name: 'Solid Banner',
    category: 'modern',
    tags: ['modern', 'banner', 'bottom', 'label'],
    featured: true, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1 / 1.22,
    qrArea: { x: 0.05, y: 0.04, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.18, r = W * 0.055, bw = W * 0.012;
      // outer border
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // bottom solid banner
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(bw, H - bh);
      ctx.lineTo(W - bw, H - bh);
      ctx.lineTo(W - bw, H - r);
      ctx.arcTo(W - bw, H - bw, W - r, H - bw, r);
      ctx.lineTo(r + bw, H - bw);
      ctx.arcTo(bw, H - bw, bw, H - r, r);
      ctx.lineTo(bw, H - bh);
      ctx.closePath(); ctx.fill();
      labelInBanner(ctx, label || 'SCAN ME', W/2, H - bh/2, W * 0.068, '#ffffff');
    },
  },

  {
    id: 'modern-002',
    name: 'Top Solid',
    category: 'modern',
    tags: ['modern', 'top', 'banner', 'label'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1 / 1.22,
    qrArea: { x: 0.05, y: 0.19, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.18, r = W * 0.055, bw = W * 0.012;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(bw, bh);
      ctx.lineTo(W - bw, bh);
      ctx.lineTo(W - bw, r + bw);
      ctx.arcTo(W - bw, bw, W - r, bw, r);
      ctx.lineTo(r + bw, bw);
      ctx.arcTo(bw, bw, bw, r + bw, r);
      ctx.lineTo(bw, bh);
      ctx.closePath(); ctx.fill();
      labelInBanner(ctx, label || 'SCAN ME', W/2, bh/2, W * 0.068, '#ffffff');
    },
  },

  {
    id: 'modern-003',
    name: 'Pill Badge',
    category: 'modern',
    tags: ['modern', 'pill', 'badge', 'label'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN HERE',
    canvasRatio: 1 / 1.2,
    qrArea: { x: 0.05, y: 0.04, w: 0.9, h: 0.8 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.13, by = H * 0.84, br = bh / 2;
      const px = W * 0.08;
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.006, H*0.006, W*0.988, H*0.844, W*0.04);
      ctx.stroke();
      ctx.fillStyle = color;
      drawRoundRect(ctx, px, by, W - px*2, bh, br);
      ctx.fill();
      labelInBanner(ctx, label || 'SCAN HERE', W/2, by + bh/2, W * 0.06, '#ffffff');
    },
  },

  {
    id: 'modern-004',
    name: 'Speech Bubble',
    category: 'modern',
    tags: ['modern', 'speech', 'bubble', 'label'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1 / 1.22,
    qrArea: { x: 0.05, y: 0.04, w: 0.9, h: 0.8 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.15, by = H * 0.82, br = bh / 2, bw = W * 0.012;
      // QR border
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H*0.84-bw, W*0.04); ctx.stroke();
      // pill bubble
      const px = W * 0.06;
      ctx.fillStyle = color;
      drawRoundRect(ctx, px, by, W-px*2, bh, br); ctx.fill();
      // pointer triangle
      ctx.beginPath();
      ctx.moveTo(W/2 - W*0.05, by);
      ctx.lineTo(W/2 + W*0.05, by);
      ctx.lineTo(W/2, by - H*0.04);
      ctx.closePath(); ctx.fill();
      labelInBanner(ctx, label || 'SCAN ME', W/2, by + bh/2, W * 0.062, '#ffffff');
    },
  },

  {
    id: 'modern-005',
    name: 'Side Strip Left',
    category: 'modern',
    tags: ['modern', 'side', 'vertical', 'landscape'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN',
    canvasRatio: 1.4,
    qrArea: { x: 0.3, y: 0.05, w: 0.65, h: 0.9 },
    draw(ctx, W, H, color, label) {
      const sw = W * 0.26, r = H * 0.055, bw = W * 0.008;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      ctx.fillStyle = color;
      drawRoundRect(ctx, bw, bw, sw, H - bw*2, [r, 0, 0, r]); ctx.fill();
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(Math.min(sw * 0.22, H * 0.14, 22))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.translate(sw / 2, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(label || 'SCAN', 0, 0);
      ctx.restore();
    },
  },

  {
    id: 'modern-006',
    name: 'Side Strip Right',
    category: 'modern',
    tags: ['modern', 'side', 'vertical', 'landscape'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN',
    canvasRatio: 1.4,
    qrArea: { x: 0.05, y: 0.05, w: 0.65, h: 0.9 },
    draw(ctx, W, H, color, label) {
      const sw = W * 0.26, sx = W * 0.74, r = H * 0.055, bw = W * 0.008;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      ctx.fillStyle = color;
      drawRoundRect(ctx, sx, bw, sw - bw, H - bw*2, [0, r, r, 0]); ctx.fill();
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(Math.min(sw * 0.22, H * 0.14, 22))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.translate(sx + sw/2, H / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(label || 'SCAN', 0, 0);
      ctx.restore();
    },
  },

  {
    id: 'modern-007',
    name: 'Bold Corners',
    category: 'modern',
    tags: ['modern', 'corners', 'bold'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.84 },
    draw(ctx, W, H, color) {
      const len = W * 0.18, bw = W * 0.028;
      ctx.strokeStyle = color; ctx.lineWidth = bw; ctx.lineCap = 'round';
      const off = bw / 2;
      const corners = [
        [[off, off + len], [off, off], [off + len, off]],
        [[W-off-len, off], [W-off, off], [W-off, off+len]],
        [[off, H-off-len], [off, H-off], [off+len, H-off]],
        [[W-off-len, H-off], [W-off, H-off], [W-off, H-off-len]],
      ];
      corners.forEach(([a, b, c]) => {
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.stroke();
      });
    },
  },

  {
    id: 'modern-008',
    name: 'Gradient Bar Bottom',
    category: 'modern',
    tags: ['modern', 'gradient', 'label', 'bottom'],
    featured: true, isNew: true, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1 / 1.22,
    qrArea: { x: 0.05, y: 0.04, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.18, by = H * 0.82, r = W * 0.045;
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.006, H*0.006, W*0.988, H*0.988, r); ctx.stroke();
      const grad = ctx.createLinearGradient(0, by, W, by + bh);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + 'aa');
      ctx.fillStyle = grad;
      drawRoundRect(ctx, W*0.006, by, W*0.988, H*0.988-by, [0, 0, r, r]); ctx.fill();
      labelInBanner(ctx, label || 'SCAN ME', W/2, by + bh/2, W * 0.068, '#ffffff');
    },
  },

  {
    id: 'modern-009',
    name: 'Phone Frame',
    category: 'modern',
    tags: ['modern', 'phone', 'device', 'mobile'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 0.7,
    qrArea: { x: 0.1, y: 0.18, w: 0.8, h: 0.65 },
    draw(ctx, W, H, color) {
      const r = W * 0.12, bw = W * 0.018;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // speaker
      const spW = W * 0.26, spH = H * 0.02;
      ctx.fillStyle = color;
      drawRoundRect(ctx, (W-spW)/2, H*0.07, spW, spH, spH/2); ctx.fill();
      // home button
      ctx.beginPath();
      ctx.arc(W/2, H * 0.9, W * 0.055, 0, Math.PI * 2);
      ctx.stroke();
    },
  },

  {
    id: 'modern-010',
    name: 'Tag Frame',
    category: 'modern',
    tags: ['modern', 'tag', 'label', 'shop'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN & SHOP',
    canvasRatio: 1 / 1.25,
    qrArea: { x: 0.06, y: 0.15, w: 0.88, h: 0.72 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.045, bw = W * 0.013;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // hole at top
      const hr = W * 0.045;
      ctx.beginPath(); ctx.arc(W/2, H * 0.09, hr, 0, Math.PI * 2); ctx.stroke();
      // label strip at top
      ctx.fillStyle = color + '22';
      drawRoundRect(ctx, bw, bw, W-bw*2, H*0.14, [r, r, 0, 0]); ctx.fill();
      labelInBanner(ctx, label || 'SCAN & SHOP', W/2, H * 0.09, W * 0.055, color);
    },
  },

  // ════════════════════════════════════════════════════════════
  // CREATIVE (10 frames)
  // ════════════════════════════════════════════════════════════

  {
    id: 'creative-001',
    name: 'Heart Corners',
    category: 'creative',
    tags: ['creative', 'heart', 'love', 'romantic'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color) {
      const drawHeart = (cx, cy, sz) => {
        ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, sz * 0.3);
        ctx.bezierCurveTo(-sz, -sz*0.3, -sz*2, sz*0.6, 0, sz*1.3);
        ctx.bezierCurveTo(sz*2, sz*0.6, sz, -sz*0.3, 0, sz*0.3);
        ctx.fill(); ctx.restore();
      };
      const s = W * 0.055;
      drawHeart(s*1.4, s*1.4, s); drawHeart(W-s*1.4, s*1.4, s);
      drawHeart(s*1.4, H-s*1.4, s); drawHeart(W-s*1.4, H-s*1.4, s);
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.92, W*0.03); ctx.stroke();
    },
  },

  {
    id: 'creative-002',
    name: 'Floral Corner',
    category: 'creative',
    tags: ['creative', 'floral', 'flower', 'nature'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color) {
      const drawPetal = (x, y) => {
        ctx.fillStyle = color;
        for (let i = 0; i < 4; i++) {
          ctx.save(); ctx.translate(x, y); ctx.rotate((Math.PI/2)*i);
          ctx.beginPath(); ctx.ellipse(0, -W*0.05, W*0.025, W*0.055, 0, 0, Math.PI*2);
          ctx.fill(); ctx.restore();
        }
        ctx.beginPath(); ctx.arc(x, y, W*0.02, 0, Math.PI*2);
        ctx.fillStyle = color; ctx.fill();
      };
      const m = W * 0.06;
      drawPetal(m, m); drawPetal(W-m, m); drawPetal(m, H-m); drawPetal(W-m, H-m);
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.011;
      drawRoundRect(ctx, W*0.05, H*0.05, W*0.9, H*0.9, W*0.02); ctx.stroke();
    },
  },

  {
    id: 'creative-003',
    name: 'Star Burst',
    category: 'creative',
    tags: ['creative', 'star', 'burst', 'event'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'SCAN ME!',
    canvasRatio: 1,
    qrArea: { x: 0.12, y: 0.12, w: 0.76, h: 0.76 },
    draw(ctx, W, H, color, label) {
      // starburst corner decorations
      const drawStar = (cx, cy, r1, r2, pts) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < pts * 2; i++) {
          const a = (i * Math.PI) / pts - Math.PI / 2;
          const r = i % 2 === 0 ? r1 : r2;
          i === 0 ? ctx.moveTo(cx + r*Math.cos(a), cy + r*Math.sin(a))
                  : ctx.lineTo(cx + r*Math.cos(a), cy + r*Math.sin(a));
        }
        ctx.closePath(); ctx.fill();
      };
      const s = W * 0.07;
      drawStar(s, s, s, s*0.45, 6);
      drawStar(W-s, s, s, s*0.45, 6);
      drawStar(s, H-s, s, s*0.45, 6);
      drawStar(W-s, H-s, s, s*0.45, 6);
      if (label) labelInBanner(ctx, label, W/2, H * 0.955, W * 0.058, color);
    },
  },

  {
    id: 'creative-004',
    name: 'Ribbon Top',
    category: 'creative',
    tags: ['creative', 'ribbon', 'event', 'award'],
    featured: true, isNew: false, hasLabel: true,
    defaultLabel: 'SPECIAL OFFER',
    canvasRatio: 1 / 1.25,
    qrArea: { x: 0.05, y: 0.2, w: 0.9, h: 0.75 },
    draw(ctx, W, H, color, label) {
      const rh = H * 0.18, r = W * 0.04;
      // main border
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.006, H*0.006, W*0.988, H*0.988, r); ctx.stroke();
      // ribbon banner
      ctx.fillStyle = color;
      drawRoundRect(ctx, 0, H*0.025, W, rh, [r, r, 0, 0]); ctx.fill();
      // ribbon tails (notch effect)
      ctx.fillStyle = ctx._bgColor || '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, H * 0.175);
      ctx.lineTo(W * 0.04, H * 0.195);
      ctx.lineTo(0, H * 0.215);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W, H * 0.175);
      ctx.lineTo(W - W*0.04, H * 0.195);
      ctx.lineTo(W, H * 0.215);
      ctx.closePath(); ctx.fill();
      labelInBanner(ctx, label || 'SPECIAL OFFER', W/2, H * 0.115, W * 0.06, '#ffffff');
    },
  },

  {
    id: 'creative-005',
    name: 'Ticket',
    category: 'creative',
    tags: ['creative', 'ticket', 'event', 'coupon'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN TO ENTER',
    canvasRatio: 1 / 1.3,
    qrArea: { x: 0.06, y: 0.06, w: 0.88, h: 0.7 },
    draw(ctx, W, H, color, label) {
      const notchR = W * 0.04, bw = W * 0.012, r = W * 0.04;
      const divY = H * 0.75;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      // outer border
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // dashed divider
      ctx.setLineDash([W*0.035, W*0.025]);
      ctx.beginPath(); ctx.moveTo(notchR*2 + bw, divY); ctx.lineTo(W - notchR*2 - bw, divY);
      ctx.stroke(); ctx.setLineDash([]);
      // notch circles
      ctx.fillStyle = ctx._bgColor || '#ffffff';
      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.arc(0, divY, notchR, -Math.PI/2, Math.PI/2); ctx.fill();
      ctx.beginPath(); ctx.arc(W, divY, notchR, Math.PI/2, -Math.PI/2); ctx.fill();
      // label at bottom
      labelInBanner(ctx, label || 'SCAN TO ENTER', W/2, divY + (H-divY)/2, W * 0.058, color);
    },
  },

  {
    id: 'creative-006',
    name: 'Bubble Frame',
    category: 'creative',
    tags: ['creative', 'bubble', 'fun', 'playful'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'SCAN ME!',
    canvasRatio: 1 / 1.15,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.76 },
    draw(ctx, W, H, color, label) {
      // Bubbles around border
      const bubbles = [
        [0.08, 0.04], [0.25, 0.02], [0.5, 0.03], [0.75, 0.02], [0.92, 0.04],
        [0.97, 0.2],  [0.97, 0.5],  [0.97, 0.78],
        [0.92, 0.95], [0.75, 0.97], [0.5, 0.96], [0.25, 0.97], [0.08, 0.95],
        [0.03, 0.78], [0.03, 0.5],  [0.03, 0.2],
      ];
      bubbles.forEach(([fx, fy], i) => {
        const r = W * (0.025 + (i % 3) * 0.008);
        ctx.fillStyle = color + (i % 2 === 0 ? 'dd' : '88');
        ctx.beginPath(); ctx.arc(W*fx, H*fy, r, 0, Math.PI*2); ctx.fill();
      });
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.011;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.84, W*0.04); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.925, W * 0.058, color);
    },
  },

  {
    id: 'creative-007',
    name: 'Zigzag Edge',
    category: 'creative',
    tags: ['creative', 'zigzag', 'pattern', 'dynamic'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color) {
      const teeth = 10, tw = W / teeth, th = H * 0.045;
      ctx.fillStyle = color;
      // top zigzag
      ctx.beginPath(); ctx.moveTo(0, th);
      for (let i = 0; i < teeth; i++) {
        ctx.lineTo(tw * i + tw / 2, 0);
        ctx.lineTo(tw * (i + 1), th);
      }
      ctx.lineTo(W, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
      // bottom zigzag
      ctx.beginPath(); ctx.moveTo(0, H - th);
      for (let i = 0; i < teeth; i++) {
        ctx.lineTo(tw * i + tw / 2, H);
        ctx.lineTo(tw * (i + 1), H - th);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    },
  },

  {
    id: 'creative-008',
    name: 'Camera Frame',
    category: 'creative',
    tags: ['creative', 'camera', 'photo', 'scan'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SNAP & SCAN',
    canvasRatio: 1 / 1.15,
    qrArea: { x: 0.08, y: 0.12, w: 0.84, h: 0.72 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.05, bw = W * 0.013;
      // Camera body
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, H*0.06, W-bw, H*0.88, r); ctx.stroke();
      // Lens ring top
      const lensW = W * 0.45, lensH = H * 0.06;
      ctx.fillStyle = color;
      drawRoundRect(ctx, (W - lensW)/2, H*0.025, lensW, lensH, lensH*0.4); ctx.fill();
      // Shutter button
      ctx.fillStyle = color + '99';
      ctx.beginPath(); ctx.arc(W * 0.82, H * 0.09, W*0.04, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = bw * 0.7;
      ctx.beginPath(); ctx.arc(W * 0.82, H * 0.09, W*0.04, 0, Math.PI*2); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.93, W * 0.058, color);
    },
  },

  {
    id: 'creative-009',
    name: 'Paw Corners',
    category: 'creative',
    tags: ['creative', 'paw', 'pet', 'animal', 'cute'],
    featured: false, isNew: true, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color) {
      const drawPaw = (cx, cy, sz) => {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(cx, cy, sz, 0, Math.PI*2); ctx.fill();
        const toes = [[-sz*1.3,-sz*1.5],[0,-sz*1.8],[sz*1.3,-sz*1.5]];
        toes.forEach(([dx, dy]) => {
          ctx.beginPath(); ctx.arc(cx+dx, cy+dy, sz*0.7, 0, Math.PI*2); ctx.fill();
        });
      };
      const s = W * 0.05;
      drawPaw(s*1.5, s*1.5, s); drawPaw(W-s*1.5, s*1.5, s);
      drawPaw(s*1.5, H-s*1.5, s); drawPaw(W-s*1.5, H-s*1.5, s);
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.011;
      drawRoundRect(ctx, W*0.045, H*0.045, W*0.91, H*0.91, W*0.03); ctx.stroke();
    },
  },

  {
    id: 'creative-010',
    name: 'Neon Glow',
    category: 'creative',
    tags: ['creative', 'neon', 'glow', 'vibrant'],
    featured: true, isNew: true, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.78 },
    draw(ctx, W, H, color, label) {
      // Outer glow layers
      for (let i = 4; i >= 1; i--) {
        ctx.strokeStyle = color + Math.floor(255 * 0.12 * i).toString(16).padStart(2,'0');
        ctx.lineWidth = W * 0.008 * i * 2;
        ctx.shadowBlur = 0;
        drawRoundRect(ctx, W*0.03, H*0.03, W*0.94, H*0.94, W*0.04);
        ctx.stroke();
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.03, H*0.03, W*0.94, H*0.94, W*0.04);
      ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.935, W * 0.058, color);
    },
  },

  // ════════════════════════════════════════════════════════════
  // ELEGANT (10 frames)
  // ════════════════════════════════════════════════════════════

  {
    id: 'elegant-001',
    name: 'Gold Thin',
    category: 'elegant',
    tags: ['elegant', 'gold', 'thin', 'luxury'],
    featured: true, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.07, y: 0.07, w: 0.86, h: 0.86 },
    draw(ctx, W, H, color) {
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.009;
      drawRoundRect(ctx, W*0.03, H*0.03, W*0.94, H*0.94, W*0.015); ctx.stroke();
      ctx.lineWidth = W * 0.004;
      drawRoundRect(ctx, W*0.045, H*0.045, W*0.91, H*0.91, W*0.01); ctx.stroke();
    },
  },

  {
    id: 'elegant-002',
    name: 'Diamond Corners',
    category: 'elegant',
    tags: ['elegant', 'diamond', 'luxury', 'corner'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.84 },
    draw(ctx, W, H, color) {
      const drawDiamond = (cx, cy, r) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy-r); ctx.lineTo(cx+r, cy); ctx.lineTo(cx, cy+r); ctx.lineTo(cx-r, cy);
        ctx.closePath(); ctx.fill();
      };
      const s = W * 0.055;
      drawDiamond(s, s, s * 0.7); drawDiamond(W-s, s, s * 0.7);
      drawDiamond(s, H-s, s * 0.7); drawDiamond(W-s, H-s, s * 0.7);
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.009;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.92, 0); ctx.stroke();
    },
  },

  {
    id: 'elegant-003',
    name: 'Royal Border',
    category: 'elegant',
    tags: ['elegant', 'royal', 'ornate'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1 / 1.2,
    qrArea: { x: 0.07, y: 0.07, w: 0.86, h: 0.75 },
    draw(ctx, W, H, color, label) {
      ctx.strokeStyle = color;
      ctx.lineWidth = W * 0.022; drawRoundRect(ctx, W*0.01, H*0.01, W*0.98, H*0.98, W*0.02); ctx.stroke();
      ctx.lineWidth = W * 0.008; drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.92, W*0.015); ctx.stroke();
      ctx.lineWidth = W * 0.004; drawRoundRect(ctx, W*0.055, H*0.055, W*0.89, H*0.89, W*0.01); ctx.stroke();
      labelInBanner(ctx, label || 'SCAN ME', W/2, H * 0.9, W * 0.065, color);
    },
  },

  {
    id: 'elegant-004',
    name: 'Monogram',
    category: 'elegant',
    tags: ['elegant', 'monogram', 'wedding', 'formal'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'SCAN TO RSVP',
    canvasRatio: 1 / 1.2,
    qrArea: { x: 0.05, y: 0.04, w: 0.9, h: 0.8 },
    draw(ctx, W, H, color, label) {
      // thin ornate border
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.007;
      drawRoundRect(ctx, W*0.02, H*0.02, W*0.96, H*0.96, W*0.02); ctx.stroke();
      // corner ornament lines
      const m = W * 0.04, len = W * 0.08;
      ctx.lineWidth = W * 0.007; ctx.lineCap = 'round';
      [[m,m],[W-m,m],[m,H-m],[W-m,H-m]].forEach(([cx, cy]) => {
        ctx.beginPath(); ctx.moveTo(cx-len/2, cy); ctx.lineTo(cx+len/2, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy-len/2); ctx.lineTo(cx, cy+len/2); ctx.stroke();
      });
      labelInBanner(ctx, label || 'SCAN TO RSVP', W/2, H * 0.91, W * 0.056, color);
    },
  },

  {
    id: 'elegant-005',
    name: 'Arch Frame',
    category: 'elegant',
    tags: ['elegant', 'arch', 'luxury', 'wedding'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1 / 1.2,
    qrArea: { x: 0.07, y: 0.18, w: 0.86, h: 0.76 },
    draw(ctx, W, H, color, label) {
      const bw = W * 0.012;
      // Arch at top
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      ctx.beginPath();
      ctx.moveTo(bw, H * 0.18);
      ctx.arcTo(bw, bw, W/2, bw, W * 0.08);
      ctx.arcTo(W-bw, bw, W-bw, H*0.18, W * 0.08);
      ctx.lineTo(W-bw, H-bw);
      ctx.lineTo(bw, H-bw);
      ctx.lineTo(bw, H * 0.18);
      ctx.stroke();
      labelInBanner(ctx, label || 'SCAN ME', W/2, H * 0.09, W * 0.065, color);
    },
  },

  {
    id: 'elegant-006',
    name: 'Lace Border',
    category: 'elegant',
    tags: ['elegant', 'lace', 'wedding', 'delicate'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color) {
      const n = 16, r = W * 0.035;
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.007;
      // outer rect
      drawRoundRect(ctx, W*0.025, H*0.025, W*0.95, H*0.95, W*0.02); ctx.stroke();
      // decorative circles along border
      for (let i = 0; i < n; i++) {
        const t = i / n;
        let x, y;
        if (t < 0.25)      { x = W*0.025 + (t/0.25)*W*0.95; y = H*0.025; }
        else if (t < 0.5)  { x = W*0.975; y = H*0.025 + ((t-0.25)/0.25)*H*0.95; }
        else if (t < 0.75) { x = W*0.975 - ((t-0.5)/0.25)*W*0.95; y = H*0.975; }
        else               { x = W*0.025; y = H*0.975 - ((t-0.75)/0.25)*H*0.95; }
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.stroke();
      }
    },
  },

  {
    id: 'elegant-007',
    name: 'Wreath Frame',
    category: 'elegant',
    tags: ['elegant', 'wreath', 'floral', 'organic'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'SCAN TO VIEW',
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color, label) {
      // Draw leaf/oval shapes in a ring
      const leaves = 24;
      ctx.fillStyle = color + 'cc';
      for (let i = 0; i < leaves; i++) {
        const a = (i / leaves) * Math.PI * 2;
        const d = W * 0.44;
        const cx = W/2 + Math.cos(a) * d;
        const cy = H/2 + Math.sin(a) * d;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a + Math.PI/2);
        ctx.beginPath();
        ctx.ellipse(0, 0, W*0.025, W*0.055, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.006;
      ctx.beginPath(); ctx.arc(W/2, H/2, W*0.38, 0, Math.PI*2); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.94, W * 0.055, color);
    },
  },

  {
    id: 'elegant-008',
    name: 'Filigree',
    category: 'elegant',
    tags: ['elegant', 'filigree', 'ornate', 'luxury'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.09, y: 0.09, w: 0.82, h: 0.82 },
    draw(ctx, W, H, color) {
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.008;
      // Main border
      drawRoundRect(ctx, W*0.03, H*0.03, W*0.94, H*0.94, W*0.015); ctx.stroke();
      // Corner swirls
      const corners = [[W*0.06,H*0.06],[W*0.94,H*0.06],[W*0.06,H*0.94],[W*0.94,H*0.94]];
      const dirs = [[1,1],[-1,1],[1,-1],[-1,-1]];
      corners.forEach(([cx,cy], idx) => {
        const [dx, dy] = dirs[idx];
        ctx.beginPath();
        ctx.arc(cx, cy, W*0.04, 0, Math.PI*1.5); ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + dx*W*0.04, cy, W*0.025, Math.PI, 0); ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy + dy*H*0.04, W*0.025, Math.PI*0.5, -Math.PI*0.5); ctx.stroke();
      });
    },
  },

  {
    id: 'elegant-009',
    name: 'Pearl Border',
    category: 'elegant',
    tags: ['elegant', 'pearl', 'beads', 'luxury'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.09, y: 0.09, w: 0.82, h: 0.82 },
    draw(ctx, W, H, color) {
      const n = 32, pr = W * 0.022;
      // Pearl dots along a rounded rect path
      for (let i = 0; i < n; i++) {
        const t = i / n;
        let x, y;
        if (t < 0.25)      { x = W*0.04 + (t/0.25)*(W*0.92); y = H*0.04; }
        else if (t < 0.5)  { x = W*0.96; y = H*0.04 + ((t-0.25)/0.25)*H*0.92; }
        else if (t < 0.75) { x = W*0.96 - ((t-0.5)/0.25)*W*0.92; y = H*0.96; }
        else               { x = W*0.04; y = H*0.96 - ((t-0.75)/0.25)*H*0.92; }
        // Pearl shading
        const grad = ctx.createRadialGradient(x-pr*0.3, y-pr*0.3, pr*0.1, x, y, pr);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, color + 'cc');
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, pr, 0, Math.PI*2); ctx.fill();
      }
    },
  },

  {
    id: 'elegant-010',
    name: 'Art Deco',
    category: 'elegant',
    tags: ['elegant', 'art deco', 'geometric', 'vintage'],
    featured: true, isNew: true, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1 / 1.15,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.75 },
    draw(ctx, W, H, color, label) {
      ctx.strokeStyle = color;
      // Outer frame
      ctx.lineWidth = W * 0.018;
      drawRoundRect(ctx, W*0.01, H*0.01, W*0.98, H*0.98, 0); ctx.stroke();
      // Inner frame
      ctx.lineWidth = W * 0.007;
      drawRoundRect(ctx, W*0.045, H*0.045, W*0.91, H*0.87, 0); ctx.stroke();
      // Art deco fan lines at top corners
      [[W*0.05, H*0.05], [W*0.95, H*0.05]].forEach(([cx, cy], idx) => {
        for (let i = 0; i < 5; i++) {
          const a = (idx === 0 ? 0 : Math.PI) + (i - 2) * 0.22;
          ctx.lineWidth = W * 0.006;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * W * 0.12, cy + Math.sin(a) * H * 0.12);
          ctx.stroke();
        }
      });
      if (label) labelInBanner(ctx, label, W/2, H * 0.935, W * 0.06, color);
    },
  },

  // ════════════════════════════════════════════════════════════
  // BUSINESS (10 frames)
  // ════════════════════════════════════════════════════════════

  {
    id: 'business-001',
    name: 'Corporate Clean',
    category: 'business',
    tags: ['business', 'corporate', 'professional', 'clean'],
    featured: true, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN FOR INFO',
    canvasRatio: 1 / 1.22,
    qrArea: { x: 0.04, y: 0.04, w: 0.92, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.18, bw = W * 0.012;
      ctx.fillStyle = color;
      drawRoundRect(ctx, 0, 0, W, H, W*0.04); ctx.fill();
      const bgC = ctx._bgColor || '#ffffff';
      ctx.fillStyle = bgC;
      drawRoundRect(ctx, bw*2.5, bw*2.5, W-bw*5, H*0.84-bw*5, W*0.025); ctx.fill();
      ctx.fillStyle = '#ffffff';
      drawRoundRect(ctx, 0, H-bh, W, bh, [0, 0, W*0.04, W*0.04]); ctx.fillStyle = color;
      labelInBanner(ctx, label || 'SCAN FOR INFO', W/2, H - bh/2, W * 0.062, '#ffffff');
      ctx.fillStyle = color;
      labelInBanner(ctx, label || 'SCAN FOR INFO', W/2, H - bh/2, W * 0.062, '#ffffff');
    },
  },

  {
    id: 'business-002',
    name: 'Business Card',
    category: 'business',
    tags: ['business', 'card', 'contact', 'professional'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'CONNECT WITH US',
    canvasRatio: 1.6,
    qrArea: { x: 0.55, y: 0.08, w: 0.4, h: 0.84 },
    draw(ctx, W, H, color, label) {
      const r = H * 0.08, bw = W * 0.006;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // left side divider
      const divX = W * 0.52;
      ctx.beginPath(); ctx.moveTo(divX, H*0.12); ctx.lineTo(divX, H*0.88); ctx.stroke();
      // label on left
      const lines = (label || 'CONNECT\nWITH US').split(/\n| /);
      ctx.fillStyle = color;
      ctx.font = `bold ${Math.round(H * 0.12)}px -apple-system, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lh = H * 0.14;
      const sy = H/2 - (lines.length-1)*lh/2;
      lines.forEach((l, i) => ctx.fillText(l, divX/2, sy + i*lh));
    },
  },

  {
    id: 'business-003',
    name: 'Stamp Frame',
    category: 'business',
    tags: ['business', 'stamp', 'official', 'seal'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'OFFICIAL',
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color, label) {
      // Perforated/stamp border
      const steps = 24, r = W * 0.024;
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.009;
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const d = W * 0.47;
        const x = W/2 + Math.cos(a) * d, y = H/2 + Math.sin(a) * d;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.013;
      drawRoundRect(ctx, W*0.05, H*0.05, W*0.9, H*0.9, W*0.02); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.955, W * 0.055, color);
    },
  },

  {
    id: 'business-004',
    name: 'Info Panel',
    category: 'business',
    tags: ['business', 'info', 'panel', 'label'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN FOR DETAILS',
    canvasRatio: 1 / 1.2,
    qrArea: { x: 0.05, y: 0.17, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.15, r = W * 0.04, bw = W * 0.012;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      ctx.fillStyle = color + '15';
      drawRoundRect(ctx, bw, bw, W-bw*2, bh, [r, r, 0, 0]); ctx.fill();
      // info icon
      const ix = W * 0.1, iy = bh / 2;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(ix, iy, W * 0.04, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${W * 0.06}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('i', ix, iy);
      labelInBanner(ctx, label || 'SCAN FOR DETAILS', W * 0.6, bh / 2, W * 0.055, color);
    },
  },

  {
    id: 'business-005',
    name: 'Dark Corporate',
    category: 'business',
    tags: ['business', 'dark', 'professional', 'bold'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1 / 1.22,
    qrArea: { x: 0.06, y: 0.06, w: 0.88, h: 0.76 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.18, r = W * 0.04;
      ctx.fillStyle = color;
      drawRoundRect(ctx, 0, 0, W, H, r); ctx.fill();
      const bgC = ctx._bgColor || '#ffffff';
      ctx.fillStyle = bgC;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H-H*0.22, W*0.025); ctx.fill();
      labelInBanner(ctx, label || 'SCAN ME', W/2, H - bh/2, W * 0.07, '#ffffff');
    },
  },

  {
    id: 'business-006',
    name: 'Price Tag',
    category: 'business',
    tags: ['business', 'price', 'tag', 'retail', 'shop'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN FOR PRICE',
    canvasRatio: 1 / 1.2,
    qrArea: { x: 0.06, y: 0.12, w: 0.88, h: 0.75 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.04, bw = W * 0.012;
      // Tag shape with notch at top
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // Hole punch
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      ctx.beginPath(); ctx.arc(W/2, H*0.065, W*0.038, 0, Math.PI*2); ctx.stroke();
      // String lines
      ctx.lineWidth = bw * 0.5; ctx.setLineDash([W*0.02, W*0.015]);
      ctx.beginPath(); ctx.moveTo(W*0.35, H*0.065); ctx.lineTo(W*0.18, H*0.065); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W*0.65, H*0.065); ctx.lineTo(W*0.82, H*0.065); ctx.stroke();
      ctx.setLineDash([]);
      // Top color band
      ctx.fillStyle = color + '22';
      drawRoundRect(ctx, bw, bw, W-bw*2, H*0.1, [r, r, 0, 0]); ctx.fill();
      if (label) labelInBanner(ctx, label, W/2, H*0.055, W * 0.052, color);
    },
  },

  {
    id: 'business-007',
    name: 'Receipt Frame',
    category: 'business',
    tags: ['business', 'receipt', 'payment', 'checkout'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'SCAN TO PAY',
    canvasRatio: 0.72,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.65 },
    draw(ctx, W, H, color, label) {
      const bw = W * 0.013;
      // Straight sides
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      ctx.strokeRect(bw/2, bw/2, W-bw, H-bw);
      // Tear-line dashes
      const divY = H * 0.78;
      ctx.setLineDash([W*0.04, W*0.02]);
      ctx.beginPath(); ctx.moveTo(bw*2, divY); ctx.lineTo(W-bw*2, divY); ctx.stroke();
      ctx.setLineDash([]);
      // Notch circles on sides
      [0, W].forEach((x) => {
        ctx.fillStyle = ctx._bgColor || '#ffffff';
        ctx.strokeStyle = color; ctx.lineWidth = bw;
        ctx.beginPath(); ctx.arc(x, divY, W*0.04, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
      });
      // Scan line icons at bottom
      const lineY = divY + (H - divY) / 2;
      ctx.strokeStyle = color + 'aa'; ctx.lineWidth = bw * 0.6;
      for (let i = 0; i < 4; i++) {
        const lx = W*0.15 + i*W*0.18;
        ctx.beginPath(); ctx.moveTo(lx, lineY - H*0.06); ctx.lineTo(lx, lineY + H*0.06); ctx.stroke();
      }
      if (label) labelInBanner(ctx, label, W/2, lineY, W * 0.058, color);
    },
  },

  {
    id: 'business-008',
    name: 'Folder Tab',
    category: 'business',
    tags: ['business', 'folder', 'file', 'document'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'OPEN FILE',
    canvasRatio: 1.1,
    qrArea: { x: 0.04, y: 0.14, w: 0.92, h: 0.81 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.04, bw = W * 0.012;
      const tabW = W * 0.42, tabH = H * 0.12;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      // Folder tab
      ctx.beginPath();
      ctx.moveTo(W*0.04, tabH);
      ctx.lineTo(W*0.04, r);
      ctx.arcTo(W*0.04, bw, W*0.04+r, bw, r);
      ctx.lineTo(W*0.04+tabW-r, bw);
      ctx.arcTo(W*0.04+tabW, bw, W*0.04+tabW, tabH, r);
      ctx.lineTo(W-bw, tabH);
      ctx.lineTo(W-bw, H-bw);
      ctx.arcTo(W-bw, H-bw, W-bw-r, H-bw, r);
      ctx.lineTo(r+bw, H-bw);
      ctx.arcTo(bw, H-bw, bw, H-bw-r, r);
      ctx.lineTo(bw, tabH);
      ctx.closePath();
      ctx.stroke();
      // Fill tab
      ctx.fillStyle = color + '20';
      ctx.beginPath();
      ctx.moveTo(W*0.04, tabH);
      ctx.lineTo(W*0.04, r);
      ctx.arcTo(W*0.04, bw, W*0.04+r, bw, r);
      ctx.lineTo(W*0.04+tabW-r, bw);
      ctx.arcTo(W*0.04+tabW, bw, W*0.04+tabW, tabH, r);
      ctx.closePath();
      ctx.fill();
      if (label) labelInBanner(ctx, label, W*0.04+tabW/2, tabH/2, W * 0.052, color);
    },
  },

  {
    id: 'business-009',
    name: 'Minimal Logo',
    category: 'business',
    tags: ['business', 'logo', 'brand', 'top', 'label'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'YOUR BRAND',
    canvasRatio: 1 / 1.18,
    qrArea: { x: 0.05, y: 0.18, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bw = W * 0.01;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, W*0.03); ctx.stroke();
      // Top divider line
      ctx.lineWidth = bw * 0.7;
      ctx.beginPath(); ctx.moveTo(W*0.08, H*0.155); ctx.lineTo(W*0.92, H*0.155); ctx.stroke();
      // Brand name at top
      if (label) {
        ctx.fillStyle = color;
        ctx.font = `bold ${W * 0.072}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, W/2, H * 0.08);
      }
    },
  },

  {
    id: 'business-010',
    name: 'Stats Panel',
    category: 'business',
    tags: ['business', 'stats', 'data', 'analytics'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'SCAN FOR DATA',
    canvasRatio: 1.4,
    qrArea: { x: 0.04, y: 0.06, w: 0.56, h: 0.88 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.03, bw = W * 0.008;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // Vertical divider
      const divX = W * 0.62;
      ctx.beginPath(); ctx.moveTo(divX, H*0.08); ctx.lineTo(divX, H*0.92); ctx.stroke();
      // Bar chart on right side
      const bars = [0.5, 0.8, 0.35, 0.65, 0.9];
      const barW = (W - divX - W*0.06) / bars.length * 0.6;
      const chartH = H * 0.55, chartY = H * 0.35;
      ctx.fillStyle = color;
      bars.forEach((val, i) => {
        const bx = divX + W*0.04 + i * (barW / 0.6);
        const bh = chartH * val;
        drawRoundRect(ctx, bx, chartY + chartH - bh, barW, bh, barW*0.2);
        ctx.fill();
      });
      if (label) labelInBanner(ctx, label, divX + (W - divX)/2, H * 0.12, W * 0.042, color);
    },
  },

  // ════════════════════════════════════════════════════════════
  // EVENT (10 frames)
  // ════════════════════════════════════════════════════════════

  {
    id: 'event-001',
    name: 'Event Ticket',
    category: 'event',
    tags: ['event', 'ticket', 'concert', 'admission'],
    featured: true, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN TO ENTER',
    canvasRatio: 1 / 1.3,
    qrArea: { x: 0.06, y: 0.08, w: 0.88, h: 0.66 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.045, bw = W * 0.012, notchR = W * 0.045;
      const divY = H * 0.76;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      ctx.setLineDash([W*0.04, W*0.025]);
      ctx.beginPath(); ctx.moveTo(notchR*2.2, divY); ctx.lineTo(W-notchR*2.2, divY); ctx.stroke();
      ctx.setLineDash([]);
      const bgC = ctx._bgColor || '#ffffff';
      ctx.fillStyle = bgC; ctx.strokeStyle = color;
      ctx.beginPath(); ctx.arc(0, divY, notchR, -Math.PI/2, Math.PI/2); ctx.fill();
      ctx.beginPath(); ctx.arc(W, divY, notchR, Math.PI/2, -Math.PI/2); ctx.fill();
      labelInBanner(ctx, label || 'SCAN TO ENTER', W/2, divY + (H-divY)/2, W * 0.058, color);
    },
  },

  {
    id: 'event-002',
    name: 'Festival Badge',
    category: 'event',
    tags: ['event', 'festival', 'badge', 'music'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN & ENJOY',
    canvasRatio: 1 / 1.18,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.76 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.055, bw = W * 0.014;
      ctx.fillStyle = color;
      drawRoundRect(ctx, 0, 0, W, H, r); ctx.fill();
      const bgC = ctx._bgColor || '#ffffff';
      ctx.fillStyle = bgC;
      drawRoundRect(ctx, bw*3, bw*3, W-bw*6, H*0.84-bw*6, r*0.6); ctx.fill();
      // triangle decoration top
      ctx.fillStyle = color + '66';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(W*0.35, 0); ctx.lineTo(0, H*0.2);
      ctx.closePath(); ctx.fill();
      labelInBanner(ctx, label || 'SCAN & ENJOY', W/2, H - H*0.09, W * 0.062, '#ffffff');
    },
  },

  {
    id: 'event-003',
    name: 'Conference Pass',
    category: 'event',
    tags: ['event', 'conference', 'pass', 'lanyard'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'CONFERENCE PASS',
    canvasRatio: 0.72,
    qrArea: { x: 0.08, y: 0.25, w: 0.84, h: 0.65 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.08, bw = W * 0.015;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // lanyard hole
      ctx.beginPath(); ctx.arc(W/2, H*0.07, W*0.06, 0, Math.PI*2); ctx.stroke();
      // top banner
      ctx.fillStyle = color;
      drawRoundRect(ctx, bw, bw, W-bw*2, H*0.22, [r, r, 0, 0]); ctx.fill();
      labelInBanner(ctx, label || 'CONFERENCE PASS', W/2, H*0.145, W * 0.065, '#ffffff');
    },
  },

  {
    id: 'event-004',
    name: 'Party Popper',
    category: 'event',
    tags: ['event', 'party', 'celebration', 'fun'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: "SCAN & CELEBRATE",
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color, label) {
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.92, W*0.04); ctx.stroke();
      // confetti dots
      const dots = [[0.07,0.06],[0.93,0.08],[0.05,0.94],[0.95,0.93],[0.5,0.035],[0.04,0.5]];
      dots.forEach(([fx, fy]) => {
        ctx.fillStyle = color + 'cc';
        ctx.beginPath(); ctx.arc(W*fx, H*fy, W*0.022, 0, Math.PI*2); ctx.fill();
      });
      if (label) labelInBanner(ctx, label, W/2, H * 0.958, W * 0.052, color);
    },
  },

  {
    id: 'event-005',
    name: 'Award Ribbon',
    category: 'event',
    tags: ['event', 'award', 'ribbon', 'winner'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN TO CLAIM',
    canvasRatio: 1 / 1.2,
    qrArea: { x: 0.08, y: 0.06, w: 0.84, h: 0.74 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.045, bw = W * 0.012, bh = H * 0.2, by = H * 0.8;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // ribbon tails
      ctx.fillStyle = color;
      const tw = W * 0.18, tailY = by, tailH = H * 0.16;
      ctx.beginPath();
      ctx.moveTo(W*0.15, tailY); ctx.lineTo(W*0.15 + tw, tailY);
      ctx.lineTo(W*0.15 + tw + W*0.06, tailY + tailH);
      ctx.lineTo(W*0.15, tailY + tailH);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W*0.85, tailY); ctx.lineTo(W*0.85 - tw, tailY);
      ctx.lineTo(W*0.85 - tw - W*0.06, tailY + tailH);
      ctx.lineTo(W*0.85, tailY + tailH);
      ctx.closePath(); ctx.fill();
      // badge circle
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(W/2, tailY + H*0.06, W*0.12, 0, Math.PI*2); ctx.fill();
      labelInBanner(ctx, label || 'SCAN TO CLAIM', W/2, tailY + H*0.06, W * 0.055, '#ffffff');
    },
  },

  {
    id: 'event-006',
    name: 'Stage Spotlight',
    category: 'event',
    tags: ['event', 'stage', 'spotlight', 'performance'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'ON STAGE',
    canvasRatio: 1,
    qrArea: { x: 0.09, y: 0.09, w: 0.82, h: 0.78 },
    draw(ctx, W, H, color, label) {
      // Spotlight cone from top
      const grad = ctx.createLinearGradient(W/2, 0, W/2, H);
      grad.addColorStop(0, color + '33');
      grad.addColorStop(0.6, color + '08');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(W*0.35, 0); ctx.lineTo(W*0.65, 0);
      ctx.lineTo(W*0.9, H*0.8); ctx.lineTo(W*0.1, H*0.8);
      ctx.closePath(); ctx.fill();
      // Frame border
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.014;
      drawRoundRect(ctx, W*0.03, H*0.03, W*0.94, H*0.88, W*0.03); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.935, W * 0.058, color);
    },
  },

  {
    id: 'event-007',
    name: 'Countdown',
    category: 'event',
    tags: ['event', 'countdown', 'launch', 'timer'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN TO JOIN',
    canvasRatio: 1 / 1.25,
    qrArea: { x: 0.06, y: 0.06, w: 0.88, h: 0.72 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.04, bw = W * 0.013;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // Progress bar at bottom
      const barY = H * 0.8, barH = H * 0.055;
      ctx.fillStyle = color + '22';
      drawRoundRect(ctx, W*0.06, barY, W*0.88, barH, barH/2); ctx.fill();
      ctx.fillStyle = color;
      drawRoundRect(ctx, W*0.06, barY, W*0.55, barH, barH/2); ctx.fill();
      // Tick marks above bar
      for (let i = 0; i <= 5; i++) {
        const tx = W*0.06 + i * (W*0.88/5);
        ctx.strokeStyle = color + '66'; ctx.lineWidth = bw * 0.5;
        ctx.beginPath(); ctx.moveTo(tx, barY - barH*0.3); ctx.lineTo(tx, barY); ctx.stroke();
      }
      if (label) labelInBanner(ctx, label, W/2, H * 0.915, W * 0.057, color);
    },
  },

  {
    id: 'event-008',
    name: 'Wristband',
    category: 'event',
    tags: ['event', 'wristband', 'vip', 'access'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'VIP ACCESS',
    canvasRatio: 2.5,
    qrArea: { x: 0.38, y: 0.06, w: 0.3, h: 0.88 },
    draw(ctx, W, H, color, label) {
      const r = H * 0.45, bw = W * 0.006;
      // Wristband shape
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // Color band on left
      ctx.fillStyle = color;
      drawRoundRect(ctx, bw, bw, W*0.34, H-bw*2, [r, 0, 0, r]); ctx.fill();
      // Text on left
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${H * 0.28}px -apple-system, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.translate(W * 0.17, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(label || 'VIP ACCESS', 0, 0);
      ctx.restore();
      // Divider dashes
      ctx.strokeStyle = color + '55'; ctx.lineWidth = bw * 0.5;
      ctx.setLineDash([H*0.06, H*0.04]);
      ctx.beginPath(); ctx.moveTo(W*0.36, H*0.1); ctx.lineTo(W*0.36, H*0.9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W*0.7, H*0.1); ctx.lineTo(W*0.7, H*0.9); ctx.stroke();
      ctx.setLineDash([]);
    },
  },

  {
    id: 'event-009',
    name: 'Invitation Card',
    category: 'event',
    tags: ['event', 'invitation', 'card', 'formal'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'YOU\'RE INVITED',
    canvasRatio: 1 / 1.4,
    qrArea: { x: 0.1, y: 0.25, w: 0.8, h: 0.65 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.035, bw = W * 0.012;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      ctx.lineWidth = bw * 0.5;
      drawRoundRect(ctx, W*0.03, H*0.025, W*0.94, H*0.955, r*0.7); ctx.stroke();
      // Envelope flap triangle at top
      ctx.fillStyle = color + '20';
      ctx.beginPath();
      ctx.moveTo(W*0.035, H*0.025);
      ctx.lineTo(W*0.965, H*0.025);
      ctx.lineTo(W/2, H*0.21);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = bw * 0.5;
      ctx.beginPath();
      ctx.moveTo(W*0.035, H*0.025);
      ctx.lineTo(W/2, H*0.21);
      ctx.lineTo(W*0.965, H*0.025);
      ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.13, W * 0.058, color);
    },
  },

  {
    id: 'event-010',
    name: 'Nametag',
    category: 'event',
    tags: ['event', 'nametag', 'hello', 'conference'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'HELLO!',
    canvasRatio: 0.85,
    qrArea: { x: 0.08, y: 0.36, w: 0.84, h: 0.55 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.06, bw = W * 0.014;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // Top colored zone
      ctx.fillStyle = color;
      drawRoundRect(ctx, bw, bw, W-bw*2, H*0.33, [r, r, 0, 0]); ctx.fill();
      // "HELLO my name is" text
      ctx.fillStyle = '#ffffff';
      ctx.font = `${W * 0.062}px -apple-system, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('hello, my name is', W/2, H * 0.115);
      ctx.font = `bold ${W * 0.1}px -apple-system, sans-serif`;
      ctx.fillText(label || 'HELLO!', W/2, H * 0.25);
    },
  },

  // ════════════════════════════════════════════════════════════
  // SPORT (10 frames)
  // ════════════════════════════════════════════════════════════

  {
    id: 'sport-001',
    name: 'Sport Bold',
    category: 'sport',
    tags: ['sport', 'bold', 'dynamic', 'fitness'],
    featured: true, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN TO PLAY',
    canvasRatio: 1 / 1.22,
    qrArea: { x: 0.05, y: 0.04, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.18;
      // angled bottom banner
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.82);
      ctx.lineTo(W, H * 0.78);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.018;
      drawRoundRect(ctx, W*0.007, H*0.007, W*0.986, H*0.986, W*0.035); ctx.stroke();
      labelInBanner(ctx, label || 'SCAN TO PLAY', W/2, H - bh/2, W * 0.065, '#ffffff');
    },
  },

  {
    id: 'sport-002',
    name: 'Jersey Number',
    category: 'sport',
    tags: ['sport', 'jersey', 'team', 'number'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: '#1 SCAN ME',
    canvasRatio: 1 / 1.18,
    qrArea: { x: 0.06, y: 0.18, w: 0.88, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.17, bw = W * 0.018;
      ctx.fillStyle = color;
      drawRoundRect(ctx, 0, 0, W, H, W*0.04); ctx.fill();
      const bgC = ctx._bgColor || '#ffffff';
      ctx.fillStyle = bgC;
      drawRoundRect(ctx, bw*2, bh + bw, W-bw*4, H - bh - bw*3, W*0.025); ctx.fill();
      labelInBanner(ctx, label || '#1 SCAN ME', W/2, bh/2 + bw*0.5, W * 0.07, '#ffffff');
    },
  },

  {
    id: 'sport-003',
    name: 'Podium',
    category: 'sport',
    tags: ['sport', 'podium', 'winner', 'champion'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'SCAN & WIN',
    canvasRatio: 1 / 1.15,
    qrArea: { x: 0.06, y: 0.04, w: 0.88, h: 0.82 },
    draw(ctx, W, H, color, label) {
      // Podium step bottom bar
      ctx.fillStyle = color;
      const ph = H * 0.12, py = H * 0.87;
      const steps = [
        { x: W*0.2, w: W*0.6, h: ph*0.8, y: py + ph*0.2 },
        { x: W*0.08, w: W*0.18, h: ph*0.6, y: py + ph*0.4 },
        { x: W*0.74, w: W*0.18, h: ph*0.6, y: py + ph*0.4 },
      ];
      steps.forEach(({ x, w, h, y }) => {
        drawRoundRect(ctx, x, y, w, h, W*0.015); ctx.fill();
      });
      // border
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.014;
      drawRoundRect(ctx, W*0.006, H*0.006, W*0.988, py - H*0.006, W*0.035); ctx.stroke();
      labelInBanner(ctx, label || 'SCAN & WIN', W/2, H - ph*0.4, W * 0.058, '#ffffff');
    },
  },

  {
    id: 'sport-004',
    name: 'Speed Lines',
    category: 'sport',
    tags: ['sport', 'speed', 'racing', 'fast'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'SCAN & RACE',
    canvasRatio: 1 / 1.18,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.78 },
    draw(ctx, W, H, color, label) {
      // Speed lines on left and right
      const lines = 6;
      for (let i = 0; i < lines; i++) {
        const t = (i + 0.5) / lines;
        const y = H * 0.1 + t * H * 0.7;
        const len = W * (0.04 + Math.random() * 0.06);
        ctx.strokeStyle = color + Math.floor(100 + i*25).toString(16);
        ctx.lineWidth = W * (0.008 + i * 0.003);
        ctx.lineCap = 'round';
        // left lines
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(len, y); ctx.stroke();
        // right lines
        ctx.beginPath(); ctx.moveTo(W, y); ctx.lineTo(W - len, y); ctx.stroke();
      }
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.016;
      ctx.lineCap = 'butt';
      drawRoundRect(ctx, W*0.005, H*0.005, W*0.99, H*0.91, W*0.03); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.945, W * 0.062, color);
    },
  },

  {
    id: 'sport-005',
    name: 'Scoreboard',
    category: 'sport',
    tags: ['sport', 'scoreboard', 'stadium', 'game'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN TO SCORE',
    canvasRatio: 1.3,
    qrArea: { x: 0.04, y: 0.04, w: 0.5, h: 0.92 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.03, bw = W * 0.008;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // Vertical divider
      const divX = W * 0.56;
      ctx.beginPath(); ctx.moveTo(divX, H*0.06); ctx.lineTo(divX, H*0.94); ctx.stroke();
      // Score boxes on right
      const boxH = H * 0.25, boxY = [H*0.1, H*0.38, H*0.66];
      boxY.forEach((by, i) => {
        ctx.fillStyle = i === 1 ? color : color + '22';
        drawRoundRect(ctx, divX + W*0.04, by, W*0.32, boxH, W*0.015); ctx.fill();
        ctx.fillStyle = i === 1 ? '#ffffff' : color;
        ctx.font = `bold ${H * 0.14}px -apple-system, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(['1ST','2ND','3RD'][i], divX + W*0.04 + W*0.16, by + boxH/2);
      });
      if (label) labelInBanner(ctx, label, divX/2, H * 0.94, W * 0.038, color);
    },
  },

  {
    id: 'sport-006',
    name: 'Lightning Bolt',
    category: 'sport',
    tags: ['sport', 'lightning', 'energy', 'power'],
    featured: true, isNew: true, hasLabel: true,
    defaultLabel: 'POWER UP',
    canvasRatio: 1 / 1.2,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.74 },
    draw(ctx, W, H, color, label) {
      // Lightning bolt corner marks
      const bolt = (ctx, cx, cy, sz) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy - sz);
        ctx.lineTo(cx - sz*0.3, cy);
        ctx.lineTo(cx - sz*0.1, cy);
        ctx.lineTo(cx - sz*0.4, cy + sz);
        ctx.lineTo(cx + sz*0.4, cy - sz*0.1);
        ctx.lineTo(cx + sz*0.1, cy - sz*0.1);
        ctx.lineTo(cx + sz*0.3, cy - sz);
        ctx.closePath(); ctx.fill();
      };
      const s = W * 0.06;
      bolt(ctx, s, s, s); bolt(ctx, W-s, s, s);
      bolt(ctx, s, H*0.84-s, s); bolt(ctx, W-s, H*0.84-s, s);
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.013;
      drawRoundRect(ctx, W*0.03, H*0.03, W*0.94, H*0.78, W*0.02); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.915, W * 0.062, color);
    },
  },

  {
    id: 'sport-007',
    name: 'Finish Line',
    category: 'sport',
    tags: ['sport', 'finish', 'race', 'checkered'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN TO FINISH',
    canvasRatio: 1 / 1.18,
    qrArea: { x: 0.05, y: 0.14, w: 0.9, h: 0.8 },
    draw(ctx, W, H, color, label) {
      // Checkered flag top banner
      const cells = 10, cellW = W / cells, cellH = H * 0.11;
      for (let c = 0; c < cells; c++) {
        for (let r = 0; r < 2; r++) {
          if ((c + r) % 2 === 0) {
            ctx.fillStyle = color;
            ctx.fillRect(c * cellW, r * cellH / 2, cellW, cellH / 2);
          }
        }
      }
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.006, H*0.12, W*0.988, H*0.868, W*0.03); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.065, W * 0.057, ctx._bgColor || '#ffffff');
    },
  },

  {
    id: 'sport-008',
    name: 'Trophy Frame',
    category: 'sport',
    tags: ['sport', 'trophy', 'winner', 'champion', 'gold'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN TO WIN',
    canvasRatio: 1 / 1.15,
    qrArea: { x: 0.07, y: 0.07, w: 0.86, h: 0.75 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.03, bw = W * 0.013;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // Trophy silhouette at bottom center
      const ty = H * 0.84, ts = W * 0.08;
      ctx.fillStyle = color;
      // Cup body
      ctx.beginPath();
      ctx.moveTo(W/2 - ts, ty);
      ctx.bezierCurveTo(W/2 - ts, ty + ts*2, W/2 + ts, ty + ts*2, W/2 + ts, ty);
      ctx.closePath(); ctx.fill();
      // Handle left
      ctx.beginPath(); ctx.arc(W/2 - ts, ty + ts*0.8, ts*0.35, Math.PI*0.5, -Math.PI*0.5); ctx.stroke();
      // Handle right
      ctx.beginPath(); ctx.arc(W/2 + ts, ty + ts*0.8, ts*0.35, -Math.PI*0.5, Math.PI*0.5); ctx.stroke();
      // Base
      ctx.fillRect(W/2 - ts*0.6, ty + ts*2, ts*1.2, ts*0.35);
      ctx.fillRect(W/2 - ts*0.9, ty + ts*2.3, ts*1.8, ts*0.25);
      if (label) labelInBanner(ctx, label, W/2, H * 0.915, W * 0.057, color);
    },
  },

  {
    id: 'sport-009',
    name: 'Dumbbell Frame',
    category: 'sport',
    tags: ['sport', 'fitness', 'gym', 'workout', 'dumbbell'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'GET FIT',
    canvasRatio: 1 / 1.18,
    qrArea: { x: 0.06, y: 0.06, w: 0.88, h: 0.78 },
    draw(ctx, W, H, color, label) {
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.015;
      drawRoundRect(ctx, W*0.005, H*0.005, W*0.99, H*0.88, W*0.04); ctx.stroke();
      // Dumbbell icon at bottom
      const dbY = H * 0.91, dbW = W * 0.36, dbH = H * 0.04;
      ctx.fillStyle = color;
      // Bar
      ctx.fillRect(W/2 - dbW/2 + dbH, dbY, dbW - dbH*2, dbH*0.4);
      // Left plates
      drawRoundRect(ctx, W/2 - dbW/2, dbY - dbH*0.3, dbH, dbH*1.05, dbH*0.15); ctx.fill();
      drawRoundRect(ctx, W/2 - dbW/2 + dbH*1.1, dbY - dbH*0.15, dbH*0.8, dbH*0.7, dbH*0.1); ctx.fill();
      // Right plates
      drawRoundRect(ctx, W/2 + dbW/2 - dbH, dbY - dbH*0.3, dbH, dbH*1.05, dbH*0.15); ctx.fill();
      drawRoundRect(ctx, W/2 + dbW/2 - dbH*1.9, dbY - dbH*0.15, dbH*0.8, dbH*0.7, dbH*0.1); ctx.fill();
      if (label) labelInBanner(ctx, label, W/2, H * 0.93, W * 0.056, color);
    },
  },

  {
    id: 'sport-010',
    name: 'Target Frame',
    category: 'sport',
    tags: ['sport', 'target', 'archery', 'aim', 'goal'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'HIT THE TARGET',
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color, label) {
      // Concentric ring target around the QR area
      const cx = W/2, cy = H/2;
      [0.48, 0.42, 0.37].forEach((r, i) => {
        ctx.strokeStyle = color + (i === 0 ? 'ff' : i === 1 ? 'aa' : '55');
        ctx.lineWidth = W * (0.018 - i * 0.005);
        ctx.beginPath(); ctx.arc(cx, cy, W*r, 0, Math.PI*2); ctx.stroke();
      });
      // Cross-hair lines
      ctx.strokeStyle = color + '44'; ctx.lineWidth = W * 0.006;
      ctx.setLineDash([W*0.03, W*0.02]);
      ctx.beginPath(); ctx.moveTo(W*0.05, cy); ctx.lineTo(W*0.95, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, H*0.05); ctx.lineTo(cx, H*0.95); ctx.stroke();
      ctx.setLineDash([]);
      if (label) labelInBanner(ctx, label, W/2, H * 0.958, W * 0.055, color);
    },
  },

  // ════════════════════════════════════════════════════════════
  // BADGE (10 frames)
  // ════════════════════════════════════════════════════════════

  {
    id: 'badge-001',
    name: 'Shield Badge',
    category: 'badge',
    tags: ['badge', 'shield', 'official', 'secure'],
    featured: true, isNew: false, hasLabel: true,
    defaultLabel: 'VERIFIED',
    canvasRatio: 1 / 1.15,
    qrArea: { x: 0.1, y: 0.07, w: 0.8, h: 0.72 },
    draw(ctx, W, H, color, label) {
      ctx.fillStyle = color;
      // shield shape
      ctx.beginPath();
      ctx.moveTo(W*0.06, H*0.04);
      ctx.lineTo(W*0.94, H*0.04);
      ctx.lineTo(W*0.94, H*0.65);
      ctx.quadraticCurveTo(W*0.94, H*0.92, W/2, H*0.97);
      ctx.quadraticCurveTo(W*0.06, H*0.92, W*0.06, H*0.65);
      ctx.closePath(); ctx.fill();
      const bgC = ctx._bgColor || '#ffffff';
      ctx.fillStyle = bgC;
      ctx.beginPath();
      ctx.moveTo(W*0.12, H*0.09);
      ctx.lineTo(W*0.88, H*0.09);
      ctx.lineTo(W*0.88, H*0.62);
      ctx.quadraticCurveTo(W*0.88, H*0.84, W/2, H*0.9);
      ctx.quadraticCurveTo(W*0.12, H*0.84, W*0.12, H*0.62);
      ctx.closePath(); ctx.fill();
      labelInBanner(ctx, label || 'VERIFIED', W/2, H * 0.82, W * 0.062, '#ffffff');
    },
  },

  {
    id: 'badge-002',
    name: 'Hexagon Badge',
    category: 'badge',
    tags: ['badge', 'hexagon', 'tech', 'modern'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.11, y: 0.11, w: 0.78, h: 0.78 },
    draw(ctx, W, H, color) {
      const cx = W/2, cy = H/2, r = W * 0.48;
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.022;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI / 3) - Math.PI / 6;
        i === 0 ? ctx.moveTo(cx + r*Math.cos(a), cy + r*Math.sin(a))
                : ctx.lineTo(cx + r*Math.cos(a), cy + r*Math.sin(a));
      }
      ctx.closePath(); ctx.stroke();
    },
  },

  {
    id: 'badge-003',
    name: 'Circle Seal',
    category: 'badge',
    tags: ['badge', 'circle', 'seal', 'round'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN ME',
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color, label) {
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.022;
      ctx.beginPath(); ctx.arc(W/2, H/2, W*0.47, 0, Math.PI*2); ctx.stroke();
      ctx.lineWidth = W * 0.009;
      ctx.beginPath(); ctx.arc(W/2, H/2, W*0.43, 0, Math.PI*2); ctx.stroke();
      if (label) {
        ctx.font = `bold ${W * 0.06}px -apple-system, sans-serif`;
        ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, W/2, H * 0.935);
      }
    },
  },

  {
    id: 'badge-004',
    name: 'Star Badge',
    category: 'badge',
    tags: ['badge', 'star', 'award', 'gold'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'TOP RATED',
    canvasRatio: 1,
    qrArea: { x: 0.12, y: 0.12, w: 0.76, h: 0.72 },
    draw(ctx, W, H, color, label) {
      // 8-pointed star shape as outer border
      const pts = 8, outer = W * 0.48, inner = W * 0.36;
      ctx.fillStyle = color + '22';
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.016;
      ctx.beginPath();
      for (let i = 0; i < pts * 2; i++) {
        const a = (i * Math.PI) / pts - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        i === 0 ? ctx.moveTo(W/2 + r*Math.cos(a), H/2 + r*Math.sin(a))
                : ctx.lineTo(W/2 + r*Math.cos(a), H/2 + r*Math.sin(a));
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.89, W * 0.058, color);
    },
  },

  {
    id: 'badge-005',
    name: 'Crown Badge',
    category: 'badge',
    tags: ['badge', 'crown', 'premium', 'vip', 'king'],
    featured: true, isNew: true, hasLabel: true,
    defaultLabel: 'PREMIUM',
    canvasRatio: 1 / 1.15,
    qrArea: { x: 0.09, y: 0.2, w: 0.82, h: 0.72 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.04, bw = W * 0.012;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, H*0.16, W-bw, H*0.82, r); ctx.stroke();
      // Crown at top
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(W*0.1, H*0.16);
      ctx.lineTo(W*0.1, H*0.02);
      ctx.lineTo(W*0.3, H*0.1);
      ctx.lineTo(W*0.5, H*0.01);
      ctx.lineTo(W*0.7, H*0.1);
      ctx.lineTo(W*0.9, H*0.02);
      ctx.lineTo(W*0.9, H*0.16);
      ctx.closePath(); ctx.fill();
      // Crown jewels
      [[W*0.1, H*0.02],[W*0.5, H*0.01],[W*0.9, H*0.02]].forEach(([jx, jy]) => {
        ctx.beginPath();
        ctx.arc(jx, jy, W*0.025, 0, Math.PI*2);
        ctx.fillStyle = ctx._bgColor || '#ffffff';
        ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = bw*0.5; ctx.stroke();
      });
      if (label) labelInBanner(ctx, label, W/2, H * 0.915, W * 0.062, color);
    },
  },

  {
    id: 'badge-006',
    name: 'Pentagon',
    category: 'badge',
    tags: ['badge', 'pentagon', 'security', 'official'],
    featured: false, isNew: false, hasLabel: false,
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color) {
      const pts = 5, cx = W/2, cy = H/2, r = W * 0.46;
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.02;
      ctx.beginPath();
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2 - Math.PI / 2;
        i === 0 ? ctx.moveTo(cx + r*Math.cos(a), cy + r*Math.sin(a))
                : ctx.lineTo(cx + r*Math.cos(a), cy + r*Math.sin(a));
      }
      ctx.closePath(); ctx.stroke();
      ctx.lineWidth = W * 0.008;
      const ri = W * 0.39;
      ctx.beginPath();
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2 - Math.PI / 2;
        i === 0 ? ctx.moveTo(cx + ri*Math.cos(a), cy + ri*Math.sin(a))
                : ctx.lineTo(cx + ri*Math.cos(a), cy + ri*Math.sin(a));
      }
      ctx.closePath(); ctx.stroke();
    },
  },

  {
    id: 'badge-007',
    name: 'Ribbon Medal',
    category: 'badge',
    tags: ['badge', 'medal', 'ribbon', 'achievement'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN TO REDEEM',
    canvasRatio: 0.75,
    qrArea: { x: 0.07, y: 0.35, w: 0.86, h: 0.58 },
    draw(ctx, W, H, color, label) {
      // Ribbon tails at top
      ctx.fillStyle = color;
      // Left ribbon tail
      ctx.beginPath();
      ctx.moveTo(W*0.25, 0); ctx.lineTo(W*0.48, 0);
      ctx.lineTo(W*0.48, H*0.32);
      ctx.lineTo(W*0.37, H*0.25);
      ctx.lineTo(W*0.25, H*0.32);
      ctx.closePath(); ctx.fill();
      // Right ribbon tail
      ctx.beginPath();
      ctx.moveTo(W*0.52, 0); ctx.lineTo(W*0.75, 0);
      ctx.lineTo(W*0.75, H*0.32);
      ctx.lineTo(W*0.63, H*0.25);
      ctx.lineTo(W*0.52, H*0.32);
      ctx.closePath(); ctx.fill();
      // Medal circle
      ctx.strokeStyle = color; ctx.lineWidth = W*0.022;
      ctx.beginPath(); ctx.arc(W/2, H*0.6, W*0.42, 0, Math.PI*2); ctx.stroke();
      ctx.lineWidth = W*0.009;
      ctx.beginPath(); ctx.arc(W/2, H*0.6, W*0.36, 0, Math.PI*2); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.61, W * 0.058, color);
    },
  },

  {
    id: 'badge-008',
    name: 'Diamond Badge',
    category: 'badge',
    tags: ['badge', 'diamond', 'premium', 'luxury', 'gem'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'DIAMOND TIER',
    canvasRatio: 1,
    qrArea: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    draw(ctx, W, H, color, label) {
      // Diamond (rhombus) outer shape
      const cx = W/2, cy = H*0.5;
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.02;
      ctx.beginPath();
      ctx.moveTo(cx, H*0.025);
      ctx.lineTo(W*0.975, cy);
      ctx.lineTo(cx, H*0.975);
      ctx.lineTo(W*0.025, cy);
      ctx.closePath(); ctx.stroke();
      // Inner diamond
      ctx.lineWidth = W * 0.008;
      ctx.beginPath();
      ctx.moveTo(cx, H*0.08);
      ctx.lineTo(W*0.92, cy);
      ctx.lineTo(cx, H*0.92);
      ctx.lineTo(W*0.08, cy);
      ctx.closePath(); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.955, W * 0.056, color);
    },
  },

  {
    id: 'badge-009',
    name: 'Emblem Frame',
    category: 'badge',
    tags: ['badge', 'emblem', 'crest', 'official', 'seal'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'OFFICIAL SEAL',
    canvasRatio: 1 / 1.1,
    qrArea: { x: 0.1, y: 0.08, w: 0.8, h: 0.72 },
    draw(ctx, W, H, color, label) {
      // Crest shape: straight top sides tapering to point at bottom
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.018;
      ctx.beginPath();
      ctx.moveTo(W*0.08, H*0.04);
      ctx.lineTo(W*0.92, H*0.04);
      ctx.lineTo(W*0.92, H*0.68);
      ctx.quadraticCurveTo(W*0.92, H*0.88, W/2, H*0.98);
      ctx.quadraticCurveTo(W*0.08, H*0.88, W*0.08, H*0.68);
      ctx.closePath(); ctx.stroke();
      // Inner crest
      ctx.lineWidth = W * 0.007;
      ctx.beginPath();
      ctx.moveTo(W*0.14, H*0.08);
      ctx.lineTo(W*0.86, H*0.08);
      ctx.lineTo(W*0.86, H*0.65);
      ctx.quadraticCurveTo(W*0.86, H*0.82, W/2, H*0.91);
      ctx.quadraticCurveTo(W*0.14, H*0.82, W*0.14, H*0.65);
      ctx.closePath(); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.785, W * 0.056, color);
    },
  },

  {
    id: 'badge-010',
    name: 'Burst Badge',
    category: 'badge',
    tags: ['badge', 'burst', 'sale', 'promo', 'attention'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'HOT DEAL',
    canvasRatio: 1,
    qrArea: { x: 0.15, y: 0.15, w: 0.7, h: 0.7 },
    draw(ctx, W, H, color, label) {
      // Starburst / badge shape with many points
      const pts = 16, outer = W * 0.48, inner = W * 0.38;
      ctx.fillStyle = color + '22';
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.016;
      ctx.beginPath();
      for (let i = 0; i < pts * 2; i++) {
        const a = (i * Math.PI) / pts - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        i === 0
          ? ctx.moveTo(W/2 + r*Math.cos(a), H/2 + r*Math.sin(a))
          : ctx.lineTo(W/2 + r*Math.cos(a), H/2 + r*Math.sin(a));
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.956, W * 0.056, color);
    },
  },

  // ════════════════════════════════════════════════════════════
  // SOCIAL (10 frames)
  // ════════════════════════════════════════════════════════════

  {
    id: 'social-001',
    name: 'Social Rounded',
    category: 'social',
    tags: ['social', 'rounded', 'instagram', 'link'],
    featured: true, isNew: false, hasLabel: true,
    defaultLabel: 'FOLLOW US',
    canvasRatio: 1 / 1.22,
    qrArea: { x: 0.05, y: 0.04, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.12, bh = H * 0.18;
      ctx.fillStyle = color;
      drawRoundRect(ctx, 0, 0, W, H, r); ctx.fill();
      const bgC = ctx._bgColor || '#ffffff';
      ctx.fillStyle = bgC;
      drawRoundRect(ctx, W*0.04, H*0.032, W*0.92, H*0.84, r*0.7); ctx.fill();
      labelInBanner(ctx, label || 'FOLLOW US', W/2, H - bh/2, W * 0.068, '#ffffff');
    },
  },

  {
    id: 'social-002',
    name: 'Link In Bio',
    category: 'social',
    tags: ['social', 'link', 'bio', 'profile'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'LINK IN BIO',
    canvasRatio: 1 / 1.22,
    qrArea: { x: 0.05, y: 0.04, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.18, r = W * 0.08, bw = W * 0.012;
      // gradient fill border
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '88');
      ctx.strokeStyle = grad; ctx.lineWidth = bw * 2;
      drawRoundRect(ctx, bw, bw, W-bw*2, H-bw*2, r); ctx.stroke();
      ctx.lineWidth = bw;
      ctx.strokeStyle = color;
      drawRoundRect(ctx, bw*3, bw*3, W-bw*6, H-bw*6, r*0.7); ctx.stroke();
      labelInBanner(ctx, label || 'LINK IN BIO', W/2, H - bh/2, W * 0.065, color);
    },
  },

  {
    id: 'social-003',
    name: 'Story Frame',
    category: 'social',
    tags: ['social', 'story', 'reel', 'highlight'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN MY STORY',
    canvasRatio: 0.6,
    qrArea: { x: 0.07, y: 0.25, w: 0.86, h: 0.52 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.07, bw = W * 0.016;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // profile placeholder circle at top
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      ctx.beginPath(); ctx.arc(W/2, H*0.12, W*0.1, 0, Math.PI*2); ctx.stroke();
      // gradient ring around profile
      const grad = ctx.createLinearGradient(W*0.4, H*0.02, W*0.6, H*0.22);
      grad.addColorStop(0, color); grad.addColorStop(1, color + '44');
      ctx.strokeStyle = grad; ctx.lineWidth = bw * 1.5;
      ctx.beginPath(); ctx.arc(W/2, H*0.12, W*0.115, 0, Math.PI*2); ctx.stroke();
      labelInBanner(ctx, label || 'SCAN MY STORY', W/2, H * 0.85, W * 0.065, color);
    },
  },

  {
    id: 'social-004',
    name: 'Chat Bubble',
    category: 'social',
    tags: ['social', 'chat', 'message', 'conversation'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'CHAT WITH US',
    canvasRatio: 1 / 1.15,
    qrArea: { x: 0.06, y: 0.06, w: 0.88, h: 0.76 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.1, bw = W * 0.014;
      // Chat bubble border
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      ctx.beginPath();
      ctx.moveTo(W*0.05+r, H*0.04);
      ctx.arcTo(W*0.05, H*0.04, W*0.05, H*0.04+r, r);
      ctx.lineTo(W*0.05, H*0.84-r);
      ctx.arcTo(W*0.05, H*0.84, W*0.05+r, H*0.84, r);
      ctx.lineTo(W*0.25, H*0.84);
      ctx.lineTo(W*0.18, H*0.96);
      ctx.lineTo(W*0.38, H*0.84);
      ctx.lineTo(W*0.95-r, H*0.84);
      ctx.arcTo(W*0.95, H*0.84, W*0.95, H*0.84-r, r);
      ctx.lineTo(W*0.95, H*0.04+r);
      ctx.arcTo(W*0.95, H*0.04, W*0.95-r, H*0.04, r);
      ctx.closePath();
      ctx.stroke();
      if (label) labelInBanner(ctx, label, W*0.5, H * 0.92, W * 0.058, color);
    },
  },

  {
    id: 'social-005',
    name: 'QR Card',
    category: 'social',
    tags: ['social', 'card', 'share', 'profile'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'SHARE PROFILE',
    canvasRatio: 1 / 1.3,
    qrArea: { x: 0.07, y: 0.07, w: 0.86, h: 0.68 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.06, bw = W * 0.012;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // Bottom bio strip
      const stripY = H * 0.78;
      ctx.fillStyle = color + '18';
      drawRoundRect(ctx, bw, stripY, W-bw*2, H-stripY-bw, [0,0,r,r]); ctx.fill();
      // Profile circle placeholder
      const pr = W * 0.08;
      ctx.strokeStyle = color; ctx.lineWidth = bw * 0.8;
      ctx.beginPath(); ctx.arc(W * 0.15, stripY + (H-stripY)/2, pr, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = color + '33';
      ctx.beginPath(); ctx.arc(W * 0.15, stripY + (H-stripY)/2, pr, 0, Math.PI*2); ctx.fill();
      if (label) labelInBanner(ctx, label, W*0.6, stripY + (H-stripY)/2, W * 0.058, color);
    },
  },

  {
    id: 'social-006',
    name: 'Wave Banner',
    category: 'social',
    tags: ['social', 'wave', 'banner', 'gradient'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'CONNECT',
    canvasRatio: 1 / 1.22,
    qrArea: { x: 0.05, y: 0.04, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.18, by = H * 0.82;
      // Wave bottom
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, by + bh*0.3);
      ctx.quadraticCurveTo(W*0.25, by - bh*0.2, W*0.5, by + bh*0.15);
      ctx.quadraticCurveTo(W*0.75, by + bh*0.5, W, by + bh*0.1);
      ctx.lineTo(W, H); ctx.lineTo(0, H);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.006, H*0.006, W*0.988, H*0.988, W*0.04); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, by + bh*0.6, W * 0.065, '#ffffff');
    },
  },

  {
    id: 'social-007',
    name: 'Hashtag Frame',
    category: 'social',
    tags: ['social', 'hashtag', 'twitter', 'trend'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: '#SCANME',
    canvasRatio: 1,
    qrArea: { x: 0.12, y: 0.12, w: 0.76, h: 0.76 },
    draw(ctx, W, H, color, label) {
      // Hashtag # symbol as background decoration
      ctx.strokeStyle = color + '22'; ctx.lineWidth = W * 0.04;
      ctx.lineCap = 'round';
      // Vertical lines
      ctx.beginPath(); ctx.moveTo(W*0.38, H*0.03); ctx.lineTo(W*0.3, H*0.97); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W*0.62, H*0.03); ctx.lineTo(W*0.54, H*0.97); ctx.stroke();
      // Horizontal lines
      ctx.beginPath(); ctx.moveTo(W*0.06, H*0.38); ctx.lineTo(W*0.94, H*0.38); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W*0.06, H*0.62); ctx.lineTo(W*0.94, H*0.62); ctx.stroke();
      ctx.lineCap = 'butt';
      // Overlay border
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.014;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.92, W*0.04); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.955, W * 0.065, color);
    },
  },

  {
    id: 'social-008',
    name: 'Podcast Frame',
    category: 'social',
    tags: ['social', 'podcast', 'audio', 'microphone', 'listen'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'LISTEN NOW',
    canvasRatio: 1 / 1.2,
    qrArea: { x: 0.06, y: 0.06, w: 0.88, h: 0.76 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.04, bw = W * 0.012;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // Sound wave bars at bottom
      const bars = [0.3, 0.6, 1.0, 0.7, 0.4, 0.8, 0.5, 0.9, 0.4, 0.6, 0.3];
      const barW = W * 0.04, gap = W * 0.018;
      const totalW = bars.length * (barW + gap) - gap;
      const startX = (W - totalW) / 2;
      const barMaxH = H * 0.07, barBaseY = H * 0.875;
      ctx.fillStyle = color;
      bars.forEach((h, i) => {
        const bh = barMaxH * h;
        drawRoundRect(ctx, startX + i*(barW+gap), barBaseY - bh, barW, bh*2, barW*0.4);
        ctx.fill();
      });
      if (label) labelInBanner(ctx, label, W/2, H * 0.945, W * 0.056, color);
    },
  },

  {
    id: 'social-009',
    name: 'Location Pin',
    category: 'social',
    tags: ['social', 'location', 'map', 'pin', 'place'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'FIND US HERE',
    canvasRatio: 1 / 1.3,
    qrArea: { x: 0.06, y: 0.22, w: 0.88, h: 0.7 },
    draw(ctx, W, H, color, label) {
      const bw = W * 0.012, r = W * 0.04;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, H*0.18, W-bw, H*0.8, [0, 0, r, r]); ctx.stroke();
      // Pin shape at top
      const pinR = W * 0.13, pinCy = H * 0.14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(W/2, pinCy, pinR, 0, Math.PI*2); ctx.fill();
      // Pin tail
      ctx.beginPath();
      ctx.moveTo(W/2 - pinR*0.5, pinCy + pinR*0.6);
      ctx.lineTo(W/2, H * 0.2);
      ctx.lineTo(W/2 + pinR*0.5, pinCy + pinR*0.6);
      ctx.closePath(); ctx.fill();
      // Dot inside pin
      ctx.fillStyle = ctx._bgColor || '#ffffff';
      ctx.beginPath(); ctx.arc(W/2, pinCy, pinR*0.42, 0, Math.PI*2); ctx.fill();
      if (label) labelInBanner(ctx, label, W/2, H * 0.94, W * 0.057, color);
    },
  },

  {
    id: 'social-010',
    name: 'Subscribe Frame',
    category: 'social',
    tags: ['social', 'subscribe', 'youtube', 'channel', 'follow'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'SUBSCRIBE NOW',
    canvasRatio: 1 / 1.22,
    qrArea: { x: 0.05, y: 0.04, w: 0.9, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bh = H * 0.18, by = H * 0.82, r = W * 0.05, bw = W * 0.012;
      // Outer border
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      // Solid bottom banner (pill-style)
      ctx.fillStyle = color;
      drawRoundRect(ctx, bw, by, W-bw*2, H-by-bw, [0, 0, r, r]); ctx.fill();
      // Play button triangle inside banner
      const px = W * 0.2, py = by + bh/2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(px, py - bh*0.28);
      ctx.lineTo(px + bh*0.32, py);
      ctx.lineTo(px, py + bh*0.28);
      ctx.closePath(); ctx.fill();
      // Label beside play icon
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${W * 0.065}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label || 'SUBSCRIBE NOW', W * 0.32, by + bh/2);
    },
  },

  // ════════════════════════════════════════════════════════════
  // SEASONAL (10 frames)
  // ════════════════════════════════════════════════════════════

  {
    id: 'seasonal-001',
    name: 'Holiday Frame',
    category: 'seasonal',
    tags: ['seasonal', 'holiday', 'festive', 'winter'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'HAPPY HOLIDAYS',
    canvasRatio: 1,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const bw = W * 0.014;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, W*0.04); ctx.stroke();
      // snowflake dots along top
      const n = 7;
      for (let i = 0; i < n; i++) {
        const x = W * (0.1 + i * 0.13), y = H * 0.04;
        ctx.fillStyle = color + 'bb';
        ctx.beginPath(); ctx.arc(x, y, W*0.018, 0, Math.PI*2); ctx.fill();
      }
      // label at bottom
      labelInBanner(ctx, label || 'HAPPY HOLIDAYS', W/2, H * 0.92, W * 0.058, color);
    },
  },

  {
    id: 'seasonal-002',
    name: 'Spring Blossom',
    category: 'seasonal',
    tags: ['seasonal', 'spring', 'flower', 'blossom'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'HAPPY SPRING',
    canvasRatio: 1,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const drawFlower = (cx, cy, r) => {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ctx.fillStyle = color + 'bb';
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(a)*r*1.2, cy + Math.sin(a)*r*1.2, r*0.6, r*0.9, a, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.fillStyle = ctx._bgColor || '#ffffff';
        ctx.beginPath(); ctx.arc(cx, cy, r*0.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(cx, cy, r*0.3, 0, Math.PI*2); ctx.fill();
      };
      const s = W * 0.08;
      drawFlower(s, s, s); drawFlower(W-s, s, s);
      drawFlower(s, H*0.88, s); drawFlower(W-s, H*0.88, s);
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.01;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.88, W*0.03); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.935, W * 0.058, color);
    },
  },

  {
    id: 'seasonal-003',
    name: 'Summer Sun',
    category: 'seasonal',
    tags: ['seasonal', 'summer', 'sun', 'beach'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SUMMER VIBES',
    canvasRatio: 1,
    qrArea: { x: 0.09, y: 0.09, w: 0.82, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const rays = 12, cx = W/2, cy = H*0.5;
      const innerR = W * 0.44, outerR = W * 0.5;
      ctx.strokeStyle = color + '55'; ctx.lineWidth = W * 0.012;
      ctx.lineCap = 'round';
      for (let i = 0; i < rays; i++) {
        const a = (i / rays) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
        ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.013;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.88, W*0.04); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.935, W * 0.057, color);
    },
  },

  {
    id: 'seasonal-004',
    name: 'Autumn Leaves',
    category: 'seasonal',
    tags: ['seasonal', 'autumn', 'fall', 'leaves'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'FALL SPECIAL',
    canvasRatio: 1,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const drawLeaf = (cx, cy, sz, angle) => {
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(angle);
        ctx.fillStyle = color + 'cc';
        ctx.beginPath();
        ctx.moveTo(0, -sz);
        ctx.bezierCurveTo(sz, -sz, sz, sz*0.5, 0, sz);
        ctx.bezierCurveTo(-sz, sz*0.5, -sz, -sz, 0, -sz);
        ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = sz * 0.1;
        ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(0, sz); ctx.stroke();
        ctx.restore();
      };
      const s = W * 0.065;
      drawLeaf(s, s, s, 0.5); drawLeaf(W-s, s, s, -0.5);
      drawLeaf(s, H*0.88, s, 0.8); drawLeaf(W-s, H*0.88, s, -0.8);
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.011;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.87, W*0.03); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.935, W * 0.057, color);
    },
  },

  {
    id: 'seasonal-005',
    name: 'Winter Frost',
    category: 'seasonal',
    tags: ['seasonal', 'winter', 'frost', 'ice', 'snow'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'WINTER SPECIAL',
    canvasRatio: 1,
    qrArea: { x: 0.09, y: 0.09, w: 0.82, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const drawCrystal = (cx, cy, sz) => {
        ctx.strokeStyle = color + 'aa'; ctx.lineWidth = sz * 0.12;
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a)*sz, cy + Math.sin(a)*sz); ctx.stroke();
          const mx = cx + Math.cos(a)*sz*0.6, my = cy + Math.sin(a)*sz*0.6;
          for (let j = -1; j <= 1; j += 2) {
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(mx + Math.cos(a + j*Math.PI/3)*sz*0.25, my + Math.sin(a + j*Math.PI/3)*sz*0.25);
            ctx.stroke();
          }
        }
        ctx.lineCap = 'butt';
      };
      const s = W * 0.07;
      drawCrystal(s, s, s); drawCrystal(W-s, s, s);
      drawCrystal(s, H*0.88, s); drawCrystal(W-s, H*0.88, s);
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.011;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.87, W*0.03); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.935, W * 0.057, color);
    },
  },

  {
    id: 'seasonal-006',
    name: 'New Year',
    category: 'seasonal',
    tags: ['seasonal', 'new year', 'fireworks', 'celebration'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'HAPPY NEW YEAR',
    canvasRatio: 1,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const drawBurst = (cx, cy, r, pts) => {
        ctx.lineCap = 'round';
        for (let i = 0; i < pts; i++) {
          const a = (i / pts) * Math.PI * 2;
          ctx.strokeStyle = color + (i % 2 === 0 ? 'ff' : '88');
          ctx.lineWidth = W * 0.006;
          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r); ctx.stroke();
        }
        ctx.lineCap = 'butt';
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(cx, cy, r*0.12, 0, Math.PI*2); ctx.fill();
      };
      const s = W * 0.1;
      drawBurst(s, s, s, 10); drawBurst(W-s, s, s, 10);
      drawBurst(s, H*0.87, s, 8); drawBurst(W-s, H*0.87, s, 8);
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.87, W*0.03); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.935, W * 0.055, color);
    },
  },

  {
    id: 'seasonal-007',
    name: 'Love Day',
    category: 'seasonal',
    tags: ['seasonal', 'valentine', 'love', 'heart', 'romance'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'WITH LOVE',
    canvasRatio: 1,
    qrArea: { x: 0.09, y: 0.09, w: 0.82, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const drawHeart = (cx, cy, sz) => {
        ctx.fillStyle = color + 'cc';
        ctx.beginPath();
        ctx.moveTo(cx, cy + sz*0.4);
        ctx.bezierCurveTo(cx - sz*1.2, cy - sz*0.4, cx - sz*2, cy + sz*0.8, cx, cy + sz*2);
        ctx.bezierCurveTo(cx + sz*2, cy + sz*0.8, cx + sz*1.2, cy - sz*0.4, cx, cy + sz*0.4);
        ctx.fill();
      };
      const heartPts = 16;
      for (let i = 0; i < heartPts; i++) {
        const t = i / heartPts;
        let x, y;
        if (t < 0.25)      { x = W*0.04 + (t/0.25)*W*0.92; y = H*0.04; }
        else if (t < 0.5)  { x = W*0.96; y = H*0.04 + ((t-0.25)/0.25)*H*0.84; }
        else if (t < 0.75) { x = W*0.96 - ((t-0.5)/0.25)*W*0.92; y = H*0.88; }
        else               { x = W*0.04; y = H*0.88 - ((t-0.75)/0.25)*H*0.84; }
        drawHeart(x, y, W * 0.018);
      }
      if (label) labelInBanner(ctx, label, W/2, H * 0.935, W * 0.06, color);
    },
  },

  {
    id: 'seasonal-008',
    name: 'Graduation',
    category: 'seasonal',
    tags: ['seasonal', 'graduation', 'education', 'diploma'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'SCAN TO CONNECT',
    canvasRatio: 1 / 1.18,
    qrArea: { x: 0.07, y: 0.07, w: 0.86, h: 0.76 },
    draw(ctx, W, H, color, label) {
      const r = W * 0.04, bw = W * 0.012;
      ctx.strokeStyle = color; ctx.lineWidth = bw;
      drawRoundRect(ctx, bw/2, bw/2, W-bw, H-bw, r); ctx.stroke();
      ctx.fillStyle = color + '18';
      drawRoundRect(ctx, bw, bw, W-bw*2, H*0.03, [r, r, 0, 0]); ctx.fill();
      drawRoundRect(ctx, bw, H*0.84, W-bw*2, H*0.03, [0, 0, 0, 0]); ctx.fill();
      // Graduation cap
      ctx.fillStyle = color;
      const capY = H * 0.89, capW = W * 0.18, capH = H * 0.025;
      ctx.fillRect((W-capW)/2, capY, capW, capH);
      ctx.beginPath();
      ctx.moveTo(W/2, capY - H*0.03);
      ctx.lineTo(W/2 - capW*0.7, capY);
      ctx.lineTo(W/2 + capW*0.7, capY);
      ctx.closePath(); ctx.fill();
      if (label) labelInBanner(ctx, label, W/2, H*0.91, W * 0.057, '#ffffff');
    },
  },

  {
    id: 'seasonal-009',
    name: 'Birthday',
    category: 'seasonal',
    tags: ['seasonal', 'birthday', 'celebration', 'party', 'cake'],
    featured: false, isNew: true, hasLabel: true,
    defaultLabel: 'HAPPY BIRTHDAY',
    canvasRatio: 1,
    qrArea: { x: 0.08, y: 0.08, w: 0.84, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const confetti = [
        [0.07, 0.03], [0.2, 0.06], [0.5, 0.02], [0.75, 0.05], [0.93, 0.03],
        [0.97, 0.2],  [0.96, 0.5], [0.97, 0.78],
        [0.93, 0.95], [0.8, 0.97], [0.5, 0.96], [0.2, 0.97], [0.07, 0.95],
        [0.03, 0.78], [0.04, 0.5], [0.03, 0.2],
      ];
      confetti.forEach(([fx, fy], i) => {
        const sz = W * 0.018;
        ctx.fillStyle = color + ['ff','cc','99','66'][i % 4];
        if (i % 2 === 0) {
          ctx.fillRect(W*fx - sz/2, H*fy - sz/2, sz, sz * 0.5);
        } else {
          ctx.beginPath(); ctx.arc(W*fx, H*fy, sz*0.5, 0, Math.PI*2); ctx.fill();
        }
      });
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.013;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.87, W*0.04); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.935, W * 0.055, color);
    },
  },

  {
    id: 'seasonal-010',
    name: 'Ramadan',
    category: 'seasonal',
    tags: ['seasonal', 'ramadan', 'eid', 'crescent', 'moon'],
    featured: false, isNew: false, hasLabel: true,
    defaultLabel: 'RAMADAN MUBARAK',
    canvasRatio: 1,
    qrArea: { x: 0.09, y: 0.09, w: 0.82, h: 0.78 },
    draw(ctx, W, H, color, label) {
      const drawCrescent = (cx, cy, r) => {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = ctx._bgColor || '#ffffff';
        ctx.beginPath(); ctx.arc(cx + r*0.35, cy - r*0.1, r*0.75, 0, Math.PI*2); ctx.fill();
      };
      const drawStar4 = (cx, cy, r) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 - Math.PI/8;
          const rad = i % 2 === 0 ? r : r*0.45;
          i === 0 ? ctx.moveTo(cx + rad*Math.cos(a), cy + rad*Math.sin(a))
                  : ctx.lineTo(cx + rad*Math.cos(a), cy + rad*Math.sin(a));
        }
        ctx.closePath(); ctx.fill();
      };
      const s = W * 0.07;
      drawCrescent(s, s, s); drawStar4(W-s, s, s*0.55);
      drawStar4(s, H*0.87, s*0.5); drawCrescent(W-s, H*0.87, s);
      ctx.strokeStyle = color; ctx.lineWidth = W * 0.012;
      drawRoundRect(ctx, W*0.04, H*0.04, W*0.92, H*0.87, W*0.03); ctx.stroke();
      if (label) labelInBanner(ctx, label, W/2, H * 0.935, W * 0.053, color);
    },
  },

];

// Convenience lookup
const FRAMES_BY_ID = Object.fromEntries(FRAMES.map(f => [f.id, f]));

// Export (no ES modules — attach to window for vanilla JS)
window.ANTT_FRAMES = FRAMES;
window.ANTT_FRAME_CATEGORIES = FRAME_CATEGORIES;
window.ANTT_FRAMES_BY_ID = FRAMES_BY_ID;
