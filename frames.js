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
  // CREATIVE (5 frames)
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

  // ════════════════════════════════════════════════════════════
  // ELEGANT (5 frames)
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

  // ════════════════════════════════════════════════════════════
  // BUSINESS (5 frames)
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

  // ════════════════════════════════════════════════════════════
  // EVENT (5 frames)
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

  // ════════════════════════════════════════════════════════════
  // SPORT (3 frames)
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

  // ════════════════════════════════════════════════════════════
  // BADGE (3 frames)
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

  // ════════════════════════════════════════════════════════════
  // SOCIAL (3 frames)
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

  // ════════════════════════════════════════════════════════════
  // SEASONAL (1 frame, placeholder for growth)
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

];

// Convenience lookup
const FRAMES_BY_ID = Object.fromEntries(FRAMES.map(f => [f.id, f]));

// Export (no ES modules — attach to window for vanilla JS)
window.ANTT_FRAMES = FRAMES;
window.ANTT_FRAME_CATEGORIES = FRAME_CATEGORIES;
window.ANTT_FRAMES_BY_ID = FRAMES_BY_ID;
