// Built-in design templates (Figma/Canva-style).
//
// A template is a recipe for the whole canvas: size, background, phone
// mockup slot(s) and text layers — all in RELATIVE coords (0..1 of W/H) so
// the same template scales to any store preset (1290x2796, 1080x1920...).
//
//   slots: [{ id:'screen', x,y,w,h, tilt? }] — screenshot drop zones.
//     'screen' is the main phone mockup (device bezel drawn around it).
//     Extra slots ('screen2'...) are plain screenshots (no bezel).
//   frame: 'device' (bezel around slot 'screen') | 'none'
//   texts: [{ id, text:{EN}, x, y, size (@1290w, scaled), align, font,
//             bold, color, opacity, anchor, lineHeight?, spacing?,
//             maxWidth?, tilt?, pill? }]
//   bg: { type:'solid'|'gradient'|'radial', ... }
//   decor: [{ kind:'circle'|'rect', ...rel coords, color, opacity, tilt? }]
//
// Flow: pick template -> canvas rebuilt -> click a slot (or the
// "Load screenshot" button on a selected slot) -> image fitted into slot.
// Texts stay editable like normal text layers.

export const TEMPLATE_CATEGORIES = [
  { id: 'minimal', name: 'Minimal' },
  { id: 'bold', name: 'Bold' },
  { id: 'device', name: 'Device Focus' },
  { id: 'feature', name: 'Feature List' },
  { id: 'promo', name: 'Promo / Sale' },
  { id: 'dark', name: 'Dark' },
  { id: 'gradient', name: 'Gradient' },
];

const F = (family) => family;

export const TEMPLATES = [
  // ==================== BOLD ====================
  {
    id: 'bold-statement',
    category: 'bold',
    name: 'Big Statement',
    desc: 'Giant type over angled phone',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#ff4d00' },
    frame: 'none',
    slots: [{ id: 'screen', x: 0.22, y: 0.42, w: 0.56, h: 0.50, tilt: -8 }],
    texts: [
      { id: 'title', text: { EN: 'LOUD.\nFAST.\nYOURS.' }, x: 0.08, y: 0.07, size: 190, align: 'left', font: F('Oswald'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-left', lineHeight: 0.95 },
      { id: 'sub', text: { EN: 'THE APP THAT KEEPS UP WITH YOU' }, x: 0.08, y: 0.365, size: 44, align: 'left', font: F('Inter'), bold: true, color: '#1a1a1a', opacity: 1, anchor: 'top-left', spacing: 0.18 },
    ],
  },
  {
    id: 'bold-duo',
    category: 'bold',
    name: 'Color Block Duo',
    desc: 'Split background, floating phone',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#1414ff' },
    frame: 'none',
    slots: [{ id: 'screen', x: 0.25, y: 0.30, w: 0.50, h: 0.48 }],
    decor: [
      { kind: 'rect', x: 0, y: 0.62, w: 1, h: 0.38, color: '#ffd900', opacity: 1 },
      { kind: 'circle', x: 0.82, y: 0.20, r: 0.14, color: '#ffffff', opacity: 0.18 },
    ],
    texts: [
      { id: 'title', text: { EN: 'Make some\nnoise' }, x: 0.5, y: 0.06, size: 150, align: 'center', font: F('Oswald'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-center', lineHeight: 0.95 },
      { id: 'sub', text: { EN: 'Share your world in seconds' }, x: 0.5, y: 0.70, size: 52, align: 'center', font: F('Inter'), bold: true, color: '#141419', opacity: 1, anchor: 'top-center' },
    ],
  },
  {
    id: 'bold-mono',
    category: 'bold',
    name: 'Mono Punch',
    desc: 'Black on yellow, sticker vibe',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#ffd900' },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.26, y: 0.38, w: 0.48, h: 0.50 }],
    decor: [
      { kind: 'rect', x: -0.1, y: 0.16, w: 1.2, h: 0.13, color: '#141419', opacity: 1, tilt: -4 },
    ],
    texts: [
      { id: 'band', text: { EN: 'NEW NEW NEW' }, x: 0.5, y: 0.225, size: 52, align: 'center', font: F('JetBrains Mono'), bold: true, color: '#ffd900', opacity: 1, anchor: 'center', tilt: -4, spacing: 0.1 },
      { id: 'title', text: { EN: 'Do more.' }, x: 0.5, y: 0.045, size: 150, align: 'center', font: F('Oswald'), bold: true, color: '#141419', opacity: 1, anchor: 'top-center' },
    ],
  },

  // ==================== DEVICE FOCUS ====================
  {
    id: 'device-solo',
    category: 'device',
    name: 'Solo Device',
    desc: 'One big phone, headline above',
    width: 1290, height: 2796,
    bg: { type: 'gradient', from: '#1c1c22', to: '#3a3a44', angle: 160 },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.22, y: 0.30, w: 0.56, h: 0.58 }],
    decor: [
      { kind: 'circle', x: 0.5, y: 0.62, r: 0.42, color: '#ffffff', opacity: 0.06 },
    ],
    texts: [
      { id: 'title', text: { EN: 'Power in\nyour pocket' }, x: 0.5, y: 0.07, size: 120, align: 'center', font: F('Inter'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-center', lineHeight: 1.05 },
      { id: 'sub', text: { EN: 'Blazing fast. All day battery.' }, x: 0.5, y: 0.235, size: 46, align: 'center', font: F('Inter'), bold: false, color: '#b9b9c2', opacity: 1, anchor: 'top-center' },
    ],
  },
  {
    id: 'device-duo',
    category: 'device',
    name: 'Device Duo',
    desc: 'Two phones side by side',
    width: 1290, height: 2796,
    bg: { type: 'gradient', from: '#0ea5e9', to: '#6366f1', angle: 140 },
    frame: 'device',
    slots: [
      { id: 'screen', x: 0.06, y: 0.32, w: 0.42, h: 0.46, tilt: -4 },
      { id: 'screen2', x: 0.52, y: 0.32, w: 0.42, h: 0.46, tilt: 4 },
    ],
    texts: [
      { id: 'title', text: { EN: 'Light & Dark.\nYou choose.' }, x: 0.5, y: 0.08, size: 110, align: 'center', font: F('Inter'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-center', lineHeight: 1.08 },
      { id: 'sub', text: { EN: 'Two themes, one great app' }, x: 0.5, y: 0.84, size: 48, align: 'center', font: F('Inter'), bold: false, color: '#e8e8ff', opacity: 1, anchor: 'top-center' },
    ],
  },
  {
    id: 'device-trio',
    category: 'device',
    name: 'Triple Threat',
    desc: 'Three phones fan layout',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#101014' },
    frame: 'none',
    slots: [
      { id: 'screen2', x: 0.02, y: 0.36, w: 0.34, h: 0.38, tilt: -8 },
      { id: 'screen', x: 0.33, y: 0.30, w: 0.36, h: 0.44 },
      { id: 'screen3', x: 0.64, y: 0.36, w: 0.34, h: 0.38, tilt: 8 },
    ],
    texts: [
      { id: 'title', text: { EN: 'EVERY SCREEN\nSHINES' }, x: 0.5, y: 0.09, size: 104, align: 'center', font: F('Oswald'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-center', lineHeight: 1.0, spacing: 0.06 },
      { id: 'sub', text: { EN: 'Home - Stats - Profile' }, x: 0.5, y: 0.80, size: 46, align: 'center', font: F('JetBrains Mono'), bold: false, color: '#8b8b96', opacity: 1, anchor: 'top-center', spacing: 0.12 },
    ],
  },




  // ==================== MINIMAL ====================
  {
    id: 'minimal-hero',
    category: 'minimal',
    name: 'Clean Hero',
    desc: 'Big title, one phone, lots of air',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#f7f7f5' },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.24, y: 0.36, w: 0.52, h: 0.52 }],
    decor: [
      { kind: 'circle', x: 0.85, y: 0.12, r: 0.16, color: '#e8e6e1', opacity: 1 },
      { kind: 'circle', x: 0.08, y: 0.85, r: 0.10, color: '#efedea', opacity: 1 },
    ],
    texts: [
      { id: 'kicker', text: { EN: 'INTRODUCING' }, x: 0.5, y: 0.10, size: 44, align: 'center', font: F('Inter'), bold: true, color: '#8a8a93', opacity: 1, anchor: 'top-center', spacing: 0.35 },
      { id: 'title', text: { EN: 'Your day,\nbeautifully\norganized.' }, x: 0.5, y: 0.135, size: 118, align: 'center', font: F('Inter'), bold: true, color: '#141419', opacity: 1, anchor: 'top-center', lineHeight: 1.08 },
      { id: 'sub', text: { EN: 'Plan tasks, track habits and stay focused.' }, x: 0.5, y: 0.305, size: 46, align: 'center', font: F('Inter'), bold: false, color: '#6d6d76', opacity: 1, anchor: 'top-center' },
    ],
  },
  {
    id: 'minimal-caption',
    category: 'minimal',
    name: 'Caption Card',
    desc: 'Screenshot top, caption bottom',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#ffffff' },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.27, y: 0.07, w: 0.46, h: 0.46 }],
    decor: [
      { kind: 'rect', x: 0.08, y: 0.60, w: 0.84, h: 0.32, color: '#f4f4f2', opacity: 1, radius: 0.04 },
    ],
    texts: [
      { id: 'title', text: { EN: 'See everything\nat a glance' }, x: 0.5, y: 0.655, size: 96, align: 'center', font: F('Inter'), bold: true, color: '#141419', opacity: 1, anchor: 'top-center', lineHeight: 1.1 },
      { id: 'sub', text: { EN: 'A calm home screen that shows what matters.' }, x: 0.5, y: 0.81, size: 44, align: 'center', font: F('Inter'), bold: false, color: '#6d6d76', opacity: 1, anchor: 'top-center' },
    ],
  },
  {
    id: 'minimal-split',
    category: 'minimal',
    name: 'Split Story',
    desc: 'Text top, phone bottom half-bleed',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#f2efe9' },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.26, y: 0.46, w: 0.48, h: 0.50 }],
    texts: [
      { id: 'title', text: { EN: 'Designed to\nbe simple' }, x: 0.12, y: 0.10, size: 116, align: 'left', font: F('Playfair Display'), bold: true, color: '#1c1a16', opacity: 1, anchor: 'top-left', lineHeight: 1.05 },
      { id: 'sub', text: { EN: 'No clutter. No learning curve. Just open and go.' }, x: 0.12, y: 0.30, size: 46, align: 'left', font: F('Inter'), bold: false, color: '#7a746a', opacity: 1, anchor: 'top-left', maxWidth: 0.76 },
    ],
  },

  // ==================== FEATURE LIST ====================
  {
    id: 'feature-checks',
    category: 'feature',
    name: 'Checklist',
    desc: 'Phone + 3 features',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#ffffff' },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.08, y: 0.30, w: 0.40, h: 0.44 }],
    texts: [
      { id: 'title', text: { EN: 'Why you will\nlove it' }, x: 0.5, y: 0.07, size: 104, align: 'center', font: F('Inter'), bold: true, color: '#141419', opacity: 1, anchor: 'top-center', lineHeight: 1.05 },
      { id: 'f1', text: { EN: 'Fast sync' }, x: 0.53, y: 0.32, size: 48, align: 'left', font: F('Inter'), bold: true, color: '#141419', opacity: 1, anchor: 'top-left' },
      { id: 'f1d', text: { EN: 'Your data everywhere,\ninstantly.' }, x: 0.53, y: 0.355, size: 40, align: 'left', font: F('Inter'), bold: false, color: '#6d6d76', opacity: 1, anchor: 'top-left' },
      { id: 'f2', text: { EN: 'Private by design' }, x: 0.53, y: 0.45, size: 48, align: 'left', font: F('Inter'), bold: true, color: '#141419', opacity: 1, anchor: 'top-left' },
      { id: 'f2d', text: { EN: 'End-to-end encrypted.\nAlways.' }, x: 0.53, y: 0.485, size: 40, align: 'left', font: F('Inter'), bold: false, color: '#6d6d76', opacity: 1, anchor: 'top-left' },
      { id: 'f3', text: { EN: 'Works offline' }, x: 0.53, y: 0.58, size: 48, align: 'left', font: F('Inter'), bold: true, color: '#141419', opacity: 1, anchor: 'top-left' },
      { id: 'f3d', text: { EN: 'No connection?\nNo problem.' }, x: 0.53, y: 0.615, size: 40, align: 'left', font: F('Inter'), bold: false, color: '#6d6d76', opacity: 1, anchor: 'top-left' },
    ],
  },
  {
    id: 'feature-cards',
    category: 'feature',
    name: 'Feature Cards',
    desc: 'Stacked cards + phone',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#f1f5f9' },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.28, y: 0.05, w: 0.44, h: 0.42 }],
    decor: [
      { kind: 'rect', x: 0.08, y: 0.52, w: 0.84, h: 0.13, color: '#ffffff', opacity: 1, radius: 0.03 },
      { kind: 'rect', x: 0.08, y: 0.67, w: 0.84, h: 0.13, color: '#ffffff', opacity: 1, radius: 0.03 },
      { kind: 'rect', x: 0.08, y: 0.82, w: 0.84, h: 0.13, color: '#0ea5e9', opacity: 1, radius: 0.03 },
    ],
    texts: [
      { id: 'f1', text: { EN: 'Fast sync' }, x: 0.14, y: 0.555, size: 52, align: 'left', font: F('Inter'), bold: true, color: '#0f172a', opacity: 1, anchor: 'top-left' },
      { id: 'f1d', text: { EN: 'Realtime across devices' }, x: 0.14, y: 0.60, size: 40, align: 'left', font: F('Inter'), bold: false, color: '#64748b', opacity: 1, anchor: 'top-left' },
      { id: 'f2', text: { EN: 'Private' }, x: 0.14, y: 0.705, size: 52, align: 'left', font: F('Inter'), bold: true, color: '#0f172a', opacity: 1, anchor: 'top-left' },
      { id: 'f2d', text: { EN: 'Your data stays yours' }, x: 0.14, y: 0.75, size: 40, align: 'left', font: F('Inter'), bold: false, color: '#64748b', opacity: 1, anchor: 'top-left' },
      { id: 'f3', text: { EN: 'Get started free' }, x: 0.14, y: 0.86, size: 52, align: 'left', font: F('Inter'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-left' },
    ],
  },
  {
    id: 'feature-numbers',
    category: 'feature',
    name: 'Numbered Steps',
    desc: '01 02 03 how-it-works',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#0f172a' },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.28, y: 0.06, w: 0.44, h: 0.40 }],
    texts: [
      { id: 'n1', text: { EN: '01' }, x: 0.10, y: 0.50, size: 120, align: 'left', font: F('Oswald'), bold: true, color: '#0ea5e9', opacity: 1, anchor: 'top-left' },
      { id: 't1', text: { EN: 'Snap a photo' }, x: 0.32, y: 0.52, size: 56, align: 'left', font: F('Inter'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-left' },
      { id: 'd1', text: { EN: 'Capture anything in one tap.' }, x: 0.32, y: 0.555, size: 40, align: 'left', font: F('Inter'), bold: false, color: '#94a3b8', opacity: 1, anchor: 'top-left' },
      { id: 'n2', text: { EN: '02' }, x: 0.10, y: 0.63, size: 120, align: 'left', font: F('Oswald'), bold: true, color: '#0ea5e9', opacity: 1, anchor: 'top-left' },
      { id: 't2', text: { EN: 'Edit in seconds' }, x: 0.32, y: 0.65, size: 56, align: 'left', font: F('Inter'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-left' },
      { id: 'd2', text: { EN: 'Filters, crop, magic fix.' }, x: 0.32, y: 0.685, size: 40, align: 'left', font: F('Inter'), bold: false, color: '#94a3b8', opacity: 1, anchor: 'top-left' },
      { id: 'n3', text: { EN: '03' }, x: 0.10, y: 0.76, size: 120, align: 'left', font: F('Oswald'), bold: true, color: '#0ea5e9', opacity: 1, anchor: 'top-left' },
      { id: 't3', text: { EN: 'Share anywhere' }, x: 0.32, y: 0.78, size: 56, align: 'left', font: F('Inter'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-left' },
      { id: 'd3', text: { EN: 'One link for every platform.' }, x: 0.32, y: 0.815, size: 40, align: 'left', font: F('Inter'), bold: false, color: '#94a3b8', opacity: 1, anchor: 'top-left' },
    ],
  },

  // ==================== PROMO / SALE ====================
  {
    id: 'promo-sale',
    category: 'promo',
    name: 'Big Sale',
    desc: 'Discount badge + phone',
    width: 1290, height: 2796,
    bg: { type: 'gradient', from: '#7c3aed', to: '#db2777', angle: 150 },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.26, y: 0.36, w: 0.48, h: 0.50 }],
    decor: [
      { kind: 'circle', x: 0.76, y: 0.16, r: 0.14, color: '#ffd900', opacity: 1 },
    ],
    texts: [
      { id: 'badge', text: { EN: '-50%' }, x: 0.76, y: 0.135, size: 84, align: 'center', font: F('Oswald'), bold: true, color: '#141419', opacity: 1, anchor: 'center' },
      { id: 'title', text: { EN: 'PRO SALE' }, x: 0.5, y: 0.05, size: 150, align: 'center', font: F('Oswald'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-center', spacing: 0.04 },
      { id: 'sub', text: { EN: 'Unlock everything. Half price. This week only.' }, x: 0.5, y: 0.155, size: 46, align: 'center', font: F('Inter'), bold: false, color: '#ffe4f1', opacity: 1, anchor: 'top-center' },
      { id: 'cta', text: { EN: 'GET PRO' }, x: 0.5, y: 0.905, size: 56, align: 'center', font: F('Inter'), bold: true, color: '#141419', opacity: 1, anchor: 'center', pill: { bg: '#ffffff', padx: 70, pady: 26 } },
    ],
  },
  {
    id: 'promo-launch',
    category: 'promo',
    name: 'Launch Day',
    desc: 'Neon accents, update CTA',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#0a0a12' },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.26, y: 0.34, w: 0.48, h: 0.48 }],
    decor: [
      { kind: 'circle', x: 0.5, y: 0.60, r: 0.40, color: '#7c3aed', opacity: 0.25 },
      { kind: 'rect', x: 0.10, y: 0.90, w: 0.80, h: 0.085, color: '#1c1c28', opacity: 1, radius: 0.04 },
    ],
    texts: [
      { id: 'kicker', text: { EN: 'LIVE NOW' }, x: 0.5, y: 0.06, size: 46, align: 'center', font: F('JetBrains Mono'), bold: true, color: '#34d399', opacity: 1, anchor: 'top-center', spacing: 0.14 },
      { id: 'title', text: { EN: 'Version 3.0\nis here' }, x: 0.5, y: 0.095, size: 130, align: 'center', font: F('Inter'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-center', lineHeight: 1.02 },
      { id: 'cta', text: { EN: 'UPDATE NOW' }, x: 0.5, y: 0.917, size: 52, align: 'center', font: F('Inter'), bold: true, color: '#ffffff', opacity: 1, anchor: 'center', spacing: 0.12 },
    ],
  },

  // ==================== DARK ====================
  {
    id: 'dark-glow',
    category: 'dark',
    name: 'Neon Glow',
    desc: 'Dark stage, glowing phone',
    width: 1290, height: 2796,
    bg: { type: 'radial', inner: '#2b2b38', outer: '#0c0c10' },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.26, y: 0.32, w: 0.48, h: 0.50 }],
    decor: [
      { kind: 'circle', x: 0.5, y: 0.58, r: 0.36, color: '#22d3ee', opacity: 0.16 },
    ],
    texts: [
      { id: 'title', text: { EN: 'Built for\nthe night' }, x: 0.5, y: 0.07, size: 122, align: 'center', font: F('Inter'), bold: true, color: '#f4f4f5', opacity: 1, anchor: 'top-center', lineHeight: 1.05 },
      { id: 'sub', text: { EN: 'True blacks. Easy on the eyes.' }, x: 0.5, y: 0.245, size: 46, align: 'center', font: F('Inter'), bold: false, color: '#a1a1aa', opacity: 1, anchor: 'top-center' },
    ],
  },
  {
    id: 'dark-quote',
    category: 'dark',
    name: 'Review Spotlight',
    desc: 'Store quote + rating',
    width: 1290, height: 2796,
    bg: { type: 'solid', color: '#131316' },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.28, y: 0.08, w: 0.44, h: 0.40 }],
    decor: [
      { kind: 'rect', x: 0.08, y: 0.55, w: 0.84, h: 0.30, color: '#1e1e24', opacity: 1, radius: 0.04 },
    ],
    texts: [
      { id: 'stars', text: { EN: '*****' }, x: 0.5, y: 0.59, size: 72, align: 'center', font: F('Inter'), bold: true, color: '#ffd900', opacity: 1, anchor: 'top-center', spacing: 0.1 },
      { id: 'quote', text: { EN: 'The only app I\nopen every morning.' }, x: 0.5, y: 0.645, size: 60, align: 'center', font: F('Playfair Display'), bold: false, color: '#f4f4f5', opacity: 1, anchor: 'top-center', lineHeight: 1.15 },
      { id: 'who', text: { EN: '- APP OF THE DAY' }, x: 0.5, y: 0.79, size: 40, align: 'center', font: F('JetBrains Mono'), bold: false, color: '#71717a', opacity: 1, anchor: 'top-center', spacing: 0.16 },
    ],
  },

  // ==================== GRADIENT ====================
  {
    id: 'gradient-wave',
    category: 'gradient',
    name: 'Aurora',
    desc: 'Soft gradient, calm type',
    width: 1290, height: 2796,
    bg: { type: 'gradient', from: '#fce7f3', to: '#c7d2fe', angle: 165 },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.26, y: 0.34, w: 0.48, h: 0.50 }],
    decor: [
      { kind: 'circle', x: 0.15, y: 0.20, r: 0.22, color: '#f0abfc', opacity: 0.55 },
      { kind: 'circle', x: 0.85, y: 0.75, r: 0.24, color: '#93c5fd', opacity: 0.55 },
    ],
    texts: [
      { id: 'title', text: { EN: 'Calm,\nby design' }, x: 0.5, y: 0.07, size: 124, align: 'center', font: F('Playfair Display'), bold: true, color: '#1e1b2e', opacity: 1, anchor: 'top-center', lineHeight: 1.03 },
      { id: 'sub', text: { EN: 'Focus mode, sleep sounds and more' }, x: 0.5, y: 0.245, size: 46, align: 'center', font: F('Inter'), bold: false, color: '#5b5670', opacity: 1, anchor: 'top-center' },
    ],
  },
  {
    id: 'gradient-sunset',
    category: 'gradient',
    name: 'Sunset Pop',
    desc: 'Warm gradient, playful headline',
    width: 1290, height: 2796,
    bg: { type: 'gradient', from: '#fb923c', to: '#e11d48', angle: 155 },
    frame: 'device',
    slots: [{ id: 'screen', x: 0.26, y: 0.36, w: 0.48, h: 0.48 }],
    decor: [
      { kind: 'circle', x: 0.80, y: 0.12, r: 0.18, color: '#ffffff', opacity: 0.22 },
      { kind: 'circle', x: 0.12, y: 0.88, r: 0.12, color: '#7c2d12', opacity: 0.25 },
    ],
    texts: [
      { id: 'title', text: { EN: 'Golden hour,\nall day' }, x: 0.5, y: 0.07, size: 128, align: 'center', font: F('Caveat'), bold: true, color: '#ffffff', opacity: 1, anchor: 'top-center', lineHeight: 0.95 },
      { id: 'sub', text: { EN: 'Filters that feel like sunshine' }, x: 0.5, y: 0.275, size: 48, align: 'center', font: F('Inter'), bold: true, color: '#fff7ed', opacity: 1, anchor: 'top-center' },
    ],
  },
];

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}

export function getTemplatesByCategory(catId) {
  if (!catId || catId === 'all') return TEMPLATES;
  return TEMPLATES.filter((t) => t.category === catId);
}
