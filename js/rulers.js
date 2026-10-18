// Rulers + alignment guides drawn outside of fabric (never exported).
//
//  - top & left rulers: pixel ticks/labels, live-updating with zoom
//  - selection extent highlighted on both rulers
//  - dashed center guides on the canvas so you can see when something is centered
//  - dragging snaps the object's center/edges to the canvas center/edges

const SIZE = 22; // ruler thickness in CSS px (must match --ruler-size)
const STORAGE_KEY = 'screenshot-framer-rulers';
const SNAP_PX = 7; // snap distance in screen px

const BG = '#252529';
const TICK_MINOR = '#3f3f47';
const TICK_MAJOR = '#5a5a64';
const LABEL = '#b3b3b7';
const CENTER = 'rgba(139,92,246,0.9)';
const CENTER_DASH = 'rgba(139,92,246,0.5)';
const BAND = 'rgba(59,130,246,0.22)';
const BAND_EDGE = 'rgba(59,130,246,0.9)';
const SNAP = 'rgba(239,68,68,0.95)'; // canvas center/edge snap line
const SNAP_OBJ = 'rgba(236,72,153,0.95)'; // object-to-object alignment line
const SNAP_CENTER = 'rgba(16,185,129,0.95)'; // centered on canvas center

function pickStep(zoom) {
  const candidates = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
  for (const c of candidates) {
    if (c * zoom >= 48) return c;
  }
  return candidates[candidates.length - 1];
}

export class RulerManager {
  constructor(canvasManager, store) {
    this.cm = canvasManager;
    this.store = store;
    this.canvas = canvasManager.canvas;
    this.enabled = true;
    this.guidesEnabled = true;
    this.snapEnabled = true;
    this.snapGuides = { v: [], h: [] }; // {v:[{pos,from,to,color}], h:[{pos,from,to,color}]}
    this.flash = { x: null, y: null };
    this.flashTimer = null;
    this.loadPrefs();
    this.init();
  }

  static get SIZE() {
    return SIZE;
  }

  // ---------- preferences (per browser tab, like the rest of the app) ----------

  loadPrefs() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (typeof p.rulers === 'boolean') this.enabled = p.rulers;
      if (typeof p.guides === 'boolean') this.guidesEnabled = p.guides;
      if (typeof p.snap === 'boolean') this.snapEnabled = p.snap;
    } catch {
      // ignore corrupt prefs
    }
  }

  savePrefs() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        rulers: this.enabled,
        guides: this.guidesEnabled,
        snap: this.snapEnabled,
      }));
    } catch {
      // ignore
    }
  }

  // ---------- lifecycle ----------

  init() {
    this.stage = document.getElementById('canvasStage');
    this.hEl = document.getElementById('rulerH');
    this.vEl = document.getElementById('rulerV');
    this.overlay = document.getElementById('guideOverlay');
    this.cm.rulerInset = this.enabled ? SIZE : 0;
    if (this.stage) this.stage.classList.toggle('no-rulers', !this.enabled);
    this.bindFabric();
    this.sync();
  }

  bindFabric() {
    const c = this.canvas;
    c.on('object:moving', (e) => this.onMoving(e));
    c.on('object:modified', () => this.clearSnap());
    c.on('mouse:up', () => this.clearSnap());
    c.on('selection:created', () => this.draw());
    c.on('selection:updated', () => this.draw());
    c.on('selection:cleared', () => this.draw());
  }

  setRulersEnabled(on) {
    this.enabled = !!on;
    this.cm.rulerInset = this.enabled ? SIZE : 0;
    if (this.stage) this.stage.classList.toggle('no-rulers', !this.enabled);
    this.savePrefs();
    this.sync();
  }

  setGuidesEnabled(on) {
    this.guidesEnabled = !!on;
    this.savePrefs();
    this.drawOverlay();
  }

  setSnapEnabled(on) {
    this.snapEnabled = !!on;
    if (!this.snapEnabled) this.clearSnap();
    this.savePrefs();
  }

  /** Briefly highlight the canvas center after using Center H/V. */
  highlightCenter(axis) {
    if (axis === 'h') this.flash.x = this.canvas.getWidth() / 2;
    else this.flash.y = this.canvas.getHeight() / 2;
    this.drawOverlay();
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.flash = { x: null, y: null };
      this.drawOverlay();
    }, 900);
  }

  // ---------- geometry helpers ----------

  /** Logical pixels of pasteboard ring on every side of the real canvas. */
  pasteboard() {
    return (this.cm && this.cm.pasteboard) || 0;
  }

  /** Convert a logical x (can be negative, inside the pasteboard) to screen px. */
  sx(x, zoom) {
    return Math.round((x + this.pasteboard()) * zoom) + 0.5;
  }

  /** Convert a logical y (can be negative, inside the pasteboard) to screen px. */
  sy(y, zoom) {
    return Math.round((y + this.pasteboard()) * zoom) + 0.5;
  }

  displaySize() {
    const zoom = this.cm.zoom || 1;
    const pb = this.pasteboard();
    return {
      zoom,
      pb,
      w: Math.max(1, Math.round((this.canvas.getWidth() + pb * 2) * zoom)),
      h: Math.max(1, Math.round((this.canvas.getHeight() + pb * 2) * zoom)),
      ax: Math.round(pb * zoom), // screen x of logical 0
      ay: Math.round(pb * zoom), // screen y of logical 0
    };
  }

  selectionBBox() {
    const objs = this.canvas.getActiveObjects ? this.canvas.getActiveObjects() : [];
    if (!objs || !objs.length) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const o of objs) {
      const b = o.getBoundingRect(true, true);
      minX = Math.min(minX, b.left);
      minY = Math.min(minY, b.top);
      maxX = Math.max(maxX, b.left + b.width);
      maxY = Math.max(maxY, b.top + b.height);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
  }

  // ---------- redraw ----------

  /** Resize + redraw everything (call when zoom or canvas size changes). */
  sync() {
    if (!this.hEl) return;
    const { w, h } = this.displaySize();
    this.sizeEl(this.hEl, w, SIZE);
    this.sizeEl(this.vEl, SIZE, h);
    this.sizeEl(this.overlay, w, h);
    this.draw();
  }

  sizeEl(el, w, h) {
    if (!el) return;
    const dpr = window.devicePixelRatio || 1;
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.width = Math.max(1, Math.round(w * dpr));
    el.height = Math.max(1, Math.round(h * dpr));
  }

  prepare(el, w, h) {
    const dpr = window.devicePixelRatio || 1;
    const ctx = el.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1;
    return ctx;
  }

  draw() {
    this.drawHorizontal();
    this.drawVertical();
    this.drawOverlay();
  }

  drawHorizontal() {
    if (!this.enabled || !this.hEl) return;
    const { zoom, w } = this.displaySize();
    const W = this.canvas.getWidth();
    const ctx = this.prepare(this.hEl, w, SIZE);
    const step = pickStep(zoom);
    const minor = step / 5;

    ctx.strokeStyle = TICK_MINOR;
    ctx.beginPath();
    for (let v = 0; v <= W + 0.0001; v += minor) {
      const x = this.sx(v, zoom);
      ctx.moveTo(x, SIZE - 4);
      ctx.lineTo(x, SIZE);
    }
    ctx.stroke();

    ctx.strokeStyle = TICK_MAJOR;
    ctx.fillStyle = LABEL;
    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.beginPath();
    for (let v = 0; v <= W + 0.0001; v += step) {
      const x = this.sx(v, zoom);
      ctx.moveTo(x, SIZE - 8);
      ctx.lineTo(x, SIZE);
      ctx.fillText(String(Math.round(v)), x + 2, 1);
    }
    ctx.stroke();

    const cx = this.sx(W / 2, zoom);
    ctx.strokeStyle = CENTER;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, SIZE);
    ctx.stroke();

    const b = this.selectionBBox();
    if (b) {
      const x0 = this.sx(b.left, zoom);
      const x1 = this.sx(b.left + b.width, zoom);
      ctx.fillStyle = BAND;
      ctx.fillRect(x0, 0, Math.max(1, x1 - x0), SIZE);
      ctx.strokeStyle = BAND_EDGE;
      ctx.beginPath();
      ctx.moveTo(Math.round(x0) + 0.5, 0);
      ctx.lineTo(Math.round(x0) + 0.5, SIZE);
      ctx.moveTo(Math.round(x1) + 0.5, 0);
      ctx.lineTo(Math.round(x1) + 0.5, SIZE);
      ctx.stroke();
    }
  }

  drawVertical() {
    if (!this.enabled || !this.vEl) return;
    const { zoom, h } = this.displaySize();
    const H = this.canvas.getHeight();
    const ctx = this.prepare(this.vEl, SIZE, h);
    const step = pickStep(zoom);
    const minor = step / 5;

    ctx.strokeStyle = TICK_MINOR;
    ctx.beginPath();
    for (let v = 0; v <= H + 0.0001; v += minor) {
      const y = this.sy(v, zoom);
      ctx.moveTo(SIZE - 4, y);
      ctx.lineTo(SIZE, y);
    }
    ctx.stroke();

    ctx.strokeStyle = TICK_MAJOR;
    ctx.fillStyle = LABEL;
    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.beginPath();
    for (let v = 0; v <= H + 0.0001; v += step) {
      const y = this.sy(v, zoom);
      ctx.moveTo(SIZE - 8, y);
      ctx.lineTo(SIZE, y);
      // rotated label reading bottom-to-top
      ctx.save();
      ctx.translate(2, y - 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(String(Math.round(v)), 0, 0);
      ctx.restore();
    }
    ctx.stroke();

    const cy = this.sy(H / 2, zoom);
    ctx.strokeStyle = CENTER;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(SIZE, cy);
    ctx.stroke();

    const b = this.selectionBBox();
    if (b) {
      const y0 = this.sy(b.top, zoom);
      const y1 = this.sy(b.top + b.height, zoom);
      ctx.fillStyle = BAND;
      ctx.fillRect(0, y0, SIZE, Math.max(1, y1 - y0));
      ctx.strokeStyle = BAND_EDGE;
      ctx.beginPath();
      ctx.moveTo(0, Math.round(y0) + 0.5);
      ctx.lineTo(SIZE, Math.round(y0) + 0.5);
      ctx.moveTo(0, Math.round(y1) + 0.5);
      ctx.lineTo(SIZE, Math.round(y1) + 0.5);
      ctx.stroke();
    }
  }

  drawOverlay() {
    if (!this.overlay) return;
    const { zoom, w, h } = this.displaySize();
    const W = this.canvas.getWidth();
    const H = this.canvas.getHeight();
    const dpr = window.devicePixelRatio || 1;
    const ctx = this.overlay.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const line = (x1, y1, x2, y2, color, dash) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash(dash || []);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    if (this.guidesEnabled) {
      const cx = this.sx(W / 2, zoom);
      const cy = this.sy(H / 2, zoom);
      line(cx, 0, cx, h, CENTER_DASH, [6, 5]);
      line(0, cy, w, cy, CENTER_DASH, [6, 5]);
    }

    const gx = this.flash.x;
    const gy = this.flash.y;
    if (gx !== null && gx !== undefined) {
      const x = this.sx(gx, zoom);
      line(x, 0, x, h, SNAP);
    }
    if (gy !== null && gy !== undefined) {
      const y = this.sy(gy, zoom);
      line(0, y, w, y, SNAP);
    }

    // Snap guide segments (canvas + object alignment). Drawn on top of the center dash.
    for (const seg of (this.snapGuides.v || [])) {
      const x = this.sx(seg.pos, zoom);
      const y0 = Math.max(0, this.sy(seg.from ?? 0, zoom));
      const y1 = Math.min(h, this.sy(seg.to ?? this.canvas.getHeight(), zoom));
      line(x, y0, x, y1, seg.color || SNAP);
    }
    for (const seg of (this.snapGuides.h || [])) {
      const y = this.sy(seg.pos, zoom);
      const x0 = Math.max(0, this.sx(seg.from ?? 0, zoom));
      const x1 = Math.min(w, this.sx(seg.to ?? this.canvas.getWidth(), zoom));
      line(x0, y, x1, y, seg.color || SNAP);
    }
  }

  // ---------- snapping while dragging ----------

  /**
   * While dragging, snap the moving object's edges/center to:
   *  - canvas left/center/right and top/center/bottom
   *  - other objects' edges/centers (smart guides)
   * Draws a colored helper line for every alignment so the user is warned.
   */
  onMoving(e) {
    const t = e.target;
    if (!t || !this.snapEnabled) return;
    const zoom = this.cm.zoom || 1;
    const W = this.canvas.getWidth();
    const H = this.canvas.getHeight();
    const thr = SNAP_PX / zoom;
    const b = t.getBoundingRect(true, true);

    // Candidate anchors on the moving object: [coord, kind]
    const mLeft = b.left;
    const mRight = b.left + b.width;
    const mCenterX = b.left + b.width / 2;
    const mTop = b.top;
    const mBottom = b.top + b.height;
    const mCenterY = b.top + b.height / 2;

    // Collect snap targets from other objects (exclude the moving one + its own group members)
    const exclude = new Set([t]);
    if (t.type === 'activeSelection') {
      for (const o of t.getObjects()) exclude.add(o);
    }
    const targetsX = []; // {pos, from, to, color}
    const targetsY = [];
    for (const o of this.canvas.getObjects()) {
      if (exclude.has(o)) continue;
      const ob = o.getBoundingRect(true, true);
      const oL = ob.left;
      const oR = ob.left + ob.width;
      const oCX = ob.left + ob.width / 2;
      const oT = ob.top;
      const oB = ob.top + ob.height;
      const oCY = ob.top + ob.height / 2;
      // vertical target lines (x positions) span the union of both objects vertically
      const vSpan = [Math.min(oT, mTop), Math.max(oB, mBottom)];
      targetsX.push({ pos: oL, from: vSpan[0], to: vSpan[1], color: SNAP_OBJ });
      targetsX.push({ pos: oR, from: vSpan[0], to: vSpan[1], color: SNAP_OBJ });
      targetsX.push({ pos: oCX, from: vSpan[0], to: vSpan[1], color: SNAP_OBJ });
      const hSpan = [Math.min(oL, mLeft), Math.max(oR, mRight)];
      targetsY.push({ pos: oT, from: hSpan[0], to: hSpan[1], color: SNAP_OBJ });
      targetsY.push({ pos: oB, from: hSpan[0], to: hSpan[1], color: SNAP_OBJ });
      targetsY.push({ pos: oCY, from: hSpan[0], to: hSpan[1], color: SNAP_OBJ });
    }
    // Canvas edges + center: full-length lines
    targetsX.push({ pos: 0, from: 0, to: H, color: SNAP });
    targetsX.push({ pos: W / 2, from: 0, to: H, color: SNAP_CENTER });
    targetsX.push({ pos: W, from: 0, to: H, color: SNAP });
    targetsY.push({ pos: 0, from: 0, to: W, color: SNAP });
    targetsY.push({ pos: H / 2, from: 0, to: W, color: SNAP_CENTER });
    targetsY.push({ pos: H, from: 0, to: W, color: SNAP });

    // For X: moving object can align via its left, center, or right edge.
    // We snap the whole object by choosing the best (smallest) delta among its 3 anchors.
    const vGuides = [];
    let dx = null;
    let bestXd = thr + 1;
    for (const tgt of targetsX) {
      for (const [anchor] of [[mLeft, 'left'], [mCenterX, 'center'], [mRight, 'right']]) {
        const delta = tgt.pos - anchor;
        const ad = Math.abs(delta);
        if (ad <= thr && ad < bestXd) {
          bestXd = ad;
          dx = delta;
        }
      }
    }
    // Record which vertical lines are actually aligned (after applying dx) for drawing
    if (dx !== null) {
      const appliedLeft = mLeft + dx;
      const appliedRight = mRight + dx;
      const appliedCenter = mCenterX + dx;
      for (const tgt of targetsX) {
        if (Math.abs(tgt.pos - appliedLeft) <= 0.5 ||
            Math.abs(tgt.pos - appliedRight) <= 0.5 ||
            Math.abs(tgt.pos - appliedCenter) <= 0.5) {
          vGuides.push(tgt);
        }
      }
    }

    const hGuides = [];
    let dy = null;
    let bestYd = thr + 1;
    for (const tgt of targetsY) {
      for (const anchor of [mTop, mCenterY, mBottom]) {
        const delta = tgt.pos - anchor;
        const ad = Math.abs(delta);
        if (ad <= thr && ad < bestYd) {
          bestYd = ad;
          dy = delta;
        }
      }
    }
    if (dy !== null) {
      const appliedTop = mTop + dy;
      const appliedBottom = mBottom + dy;
      const appliedCenter = mCenterY + dy;
      for (const tgt of targetsY) {
        if (Math.abs(tgt.pos - appliedTop) <= 0.5 ||
            Math.abs(tgt.pos - appliedBottom) <= 0.5 ||
            Math.abs(tgt.pos - appliedCenter) <= 0.5) {
          hGuides.push(tgt);
        }
      }
    }

    if (dx === null && dy === null) {
      this.clearSnap();
      return;
    }

    if (dx !== null) t.set('left', t.left + dx);
    if (dy !== null) t.set('top', t.top + dy);
    t.setCoords();
    this.snapGuides = { v: vGuides, h: hGuides };
    this.drawOverlay();
  }

  clearSnap() {
    if ((this.snapGuides.v && this.snapGuides.v.length) || (this.snapGuides.h && this.snapGuides.h.length)) {
      this.snapGuides = { v: [], h: [] };
      this.drawOverlay();
    }
  }
}
