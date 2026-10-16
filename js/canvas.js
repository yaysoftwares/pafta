import { generateId } from './utils.js';
import { OUTSIDE_DIM, OUTSIDE_OPACITY, PASTEBOARD_PX } from './constants.js';

export class CanvasManager {
  constructor(store, frameManager) {
    this.store = store;
    this.frameManager = frameManager;
    this.canvas = new fabric.Canvas('canvas', {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: '#1a1a1f',
    });
    this.currentItem = null;
    this.zoom = 1;
    // Extra logical pixels on every side so content outside the real canvas
    // stays visible (faded) instead of being clipped.
    this.pasteboard = PASTEBOARD_PX;
    this.outsideStyle = { color: OUTSIDE_DIM, opacity: OUTSIDE_OPACITY };
    this.rulerInset = 0; // extra space taken by rulers when fitting
    this.loading = false;
    this.currentLang = null;
    this.onSelection = null;
    this.onChange = null;
    this.onZoom = null;
    this.setupEvents();
  }

  setupEvents() {
    const fire = () => {
      if (!this.loading && this.onChange) this.onChange();
    };
    this.canvas.on('selection:created', (e) => {
      this.onSelectionChange(e.selected || [e.target]);
    });
    this.canvas.on('selection:updated', (e) => {
      this.onSelectionChange(e.selected || [e.target]);
    });
    this.canvas.on('selection:cleared', () => {
      this.onSelectionChange([]);
    });
    this.canvas.on('object:modified', fire);
    this.canvas.on('object:added', fire);
    this.canvas.on('object:removed', fire);
    this.canvas.on('text:changed', fire);
    // Keep the pasteboard fade fresh while things move (visual only).
    this.canvas.on('object:moving', () => this.refreshOutsideFade());
    this.canvas.on('object:scaling', () => this.refreshOutsideFade());
    this.canvas.on('object:rotating', () => this.refreshOutsideFade());
    this.canvas.on('object:modified', () => this.refreshOutsideFade());
  }

  /** Logical canvas bounds (the real artboard, without the pasteboard ring). */
  artboard() {
    return {
      left: 0,
      top: 0,
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight(),
    };
  }

  isOutsideArtboard(o) {
    if (!o) return false;
    if (o.dataId === 'artboard-bg') return false;
    let b;
    try {
      b = o.getBoundingRect(true, true);
    } catch (e) {
      return false;
    }
    const W = this.canvas.getWidth();
    const H = this.canvas.getHeight();
    return (b.left + b.width) <= 0 || b.left >= W || (b.top + b.height) <= 0 || b.top >= H;
  }

  intersectionArea(b, W, H) {
    const x0 = Math.max(0, b.left);
    const y0 = Math.max(0, b.top);
    const x1 = Math.min(W, b.left + b.width);
    const y1 = Math.min(H, b.top + b.height);
    if (x1 <= x0 || y1 <= y0) return 0;
    return (x1 - x0) * (y1 - y0);
  }

  /** Fade objects that cross the canvas edge so off-canvas parts stay visible but dimmed. */
  refreshOutsideFade() {
    if (this.loading) return;
    if (this._fadeQueued) return;
    this._fadeQueued = true;
    const run = () => {
      this._fadeQueued = false;
      if (this.loading) return;
      let dirty = false;
      for (const o of this.canvas.getObjects()) {
        if (o.dataId === 'artboard-bg') continue;
        let b;
        try {
          b = o.getBoundingRect(true, true);
        } catch (e) {
          continue;
        }
        const W = this.canvas.getWidth();
        const H = this.canvas.getHeight();
        const total = b.width * b.height;
        const inter = this.intersectionArea(b, W, H);
        const ratio = total > 0 ? inter / total : 0;
        const want = ratio >= 1 ? 1 : 1 - (1 - this.outsideStyle.opacity) * (1 - ratio);
        if (o.dataOutsideFade !== ratio || Math.abs(o.opacity - want) > 0.001) {
          o.dataOutsideFade = ratio;
          o.opacity = want;
          o.dirty = true;
          dirty = true;
        }
      }
      if (dirty && !this.loading) this.canvas.requestRenderAll();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else run();
  }

  onSelectionChange(objects) {
    if (this.onSelection) this.onSelection(objects);
  }

  findScreen() {
    return this.canvas.getObjects().find(o => o.dataId === 'screen') || null;
  }

  findFrame() {
    return this.canvas.getObjects().find(o => o.dataId === 'frame') || null;
  }

  getTextObjects() {
    return this.canvas.getObjects().filter(o => o.dataId && String(o.dataId).startsWith('text_'));
  }

  clear() {
    this.canvas.clear();
    const p = this.store ? this.store.project : null;
    this.canvas.backgroundColor = (p && p.bgTransparent) ? null : ((p && p.bgColor) || '#1a1a1f');
  }

  setCurrentItem(item) {
    return this.loadItem(item);
  }

  async loadItem(item) {
    this.loading = true;
    this.clear();
    this.currentItem = item;
    try {
      if (!item || !item.dataUrl) {
        this.canvas.setWidth(900);
        this.canvas.setHeight(1600);
      } else {
        const img = await this.loadImageObj(item.dataUrl);
        img.set({
          left: 0,
          top: 0,
          selectable: true,
          evented: true,
          dataId: 'screen',
          hasControls: true,
          hasBorders: true,
          cornerStyle: 'circle',
          transparentCorners: false,
        });
        const maxW = 1400;
        const maxH = 1800;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        if (scale < 1) img.scale(scale);
        this.canvas.add(img);
        this.canvas.sendToBack(img);
        this.canvas.setWidth(img.getScaledWidth());
        this.canvas.setHeight(img.getScaledHeight());

        if (item.frame && this.frameManager) {
          try {
            await this.frameManager.restoreFrame(this, item);
          } catch (e) {
            console.warn('Frame restore failed:', e);
          }
        }
        const screen = this.findScreen();
        if (screen && item.screenLayout) {
          screen.set({
            left: item.screenLayout.left ?? 0,
            top: item.screenLayout.top ?? 0,
            scaleX: item.screenLayout.scaleX ?? 1,
            scaleY: item.screenLayout.scaleY ?? 1,
          });
          screen.setCoords();
        }
        if (item.canvasSize && item.canvasSize.w > 0 && item.canvasSize.h > 0) {
          this.canvas.setWidth(item.canvasSize.w);
          this.canvas.setHeight(item.canvasSize.h);
        }
        this.restoreTexts(item);
      }
      const lang = this.store ? this.store.getActiveLang() : null;
      if (lang) this.applyLang(lang);
    } finally {
      this.loading = false;
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
      this.applyZoom(this.zoom);
    }
  }

  restoreTexts(item) {
    if (!item.textLayers || !item.textLayers.length) return;
    const lang = this.store ? this.store.getActiveLang() : 'EN';
    for (const l of item.textLayers) {
      const texts = { ...(l.texts || {}) };
      const value = texts[lang] ?? Object.values(texts)[0] ?? '';
      const t = new fabric.IText(value, {
        left: l.left ?? 40,
        top: l.top ?? 40,
        angle: l.angle || 0,
        fontSize: l.fontSize || 36,
        fontFamily: l.fontFamily || 'Arial',
        fontWeight: l.fontWeight || 'normal',
        fontStyle: l.fontStyle || 'normal',
        textAlign: l.textAlign || 'left',
        charSpacing: l.charSpacing || 0,
        lineHeight: l.lineHeight || 1.16,
        fill: l.fill || '#ffffff',
        stroke: l.stroke || '',
        strokeWidth: l.strokeWidth || 0,
        scaleX: l.scaleX ?? 1,
        scaleY: l.scaleY ?? 1,
        originX: l.originX || 'left',
        originY: l.originY || 'top',
        dataId: l.id || 'text_' + generateId(),
        texts,
      });
      this.canvas.add(t);
    }
  }

  applyLang(lang) {
    const prev = this.currentLang;
    const objs = this.getTextObjects();
    for (const o of objs) {
      if (!o.texts) o.texts = {};
      if (prev && prev !== lang && o.text != null) o.texts[prev] = o.text;
      const value = o.texts[lang] ?? Object.values(o.texts)[0] ?? '';
      o.set('text', value);
    }
    this.currentLang = lang;
    this.canvas.requestRenderAll();
  }

  applyPreset(preset) {
    const objs = this.canvas.getObjects();
    if (objs.length) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const o of objs) {
        const b = o.getBoundingRect(true, true);
        minX = Math.min(minX, b.left);
        minY = Math.min(minY, b.top);
        maxX = Math.max(maxX, b.left + b.width);
        maxY = Math.max(maxY, b.top + b.height);
      }
      const bw = maxX - minX;
      const bh = maxY - minY;
      if (bw > 0 && bh > 0) {
        const s = Math.min(preset.width / bw, preset.height / bh);
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const tx = preset.width / 2;
        const ty = preset.height / 2;
        for (const o of objs) {
          o.set({
            left: (o.left - cx) * s + tx,
            top: (o.top - cy) * s + ty,
            scaleX: (o.scaleX || 1) * s,
            scaleY: (o.scaleY || 1) * s,
          });
          o.setCoords();
        }
      }
    }
    this.canvas.setWidth(preset.width);
    this.canvas.setHeight(preset.height);
    this.canvas.requestRenderAll();
    this.applyZoom(this.zoom);
  }

  applyZoom(z) {
    this.zoom = Math.min(Math.max(z || 1, 0.05), 5);
    const c = this.canvas;
    const pb = this.pasteboard || 0;
    const zx = this.zoom;
    // Viewport with pasteboard offset: logical (0,0) renders at (pb,pb).
    // This keeps content outside the real canvas visible (faded) instead
    // of being clipped at the element edge.
    c.setViewportTransform([zx, 0, 0, zx, pb * zx, pb * zx]);

    // Resize the backing store (real pixel buffer) + CSS to the on-screen size
    // (artboard + pasteboard ring). Without this, fabric renders into the
    // logical-size buffer and the browser stretches it via CSS, which blurs
    // everything whenever zoom !== 1.
    // getWidth()/getHeight() stay logical (used for export, rulers, snapping).
    const dpr = window.devicePixelRatio || 1;
    const dispW = Math.max(1, Math.round((c.getWidth() + pb * 2) * zx));
    const dispH = Math.max(1, Math.round((c.getHeight() + pb * 2) * zx));
    const bufW = Math.max(1, Math.round(dispW * dpr));
    const bufH = Math.max(1, Math.round(dispH * dpr));
    for (const el of [c.lowerCanvasEl, c.upperCanvasEl]) {
      if (!el) continue;
      el.width = bufW;
      el.height = bufH;
      el.style.width = dispW + 'px';
      el.style.height = dispH + 'px';
    }
    // Assigning el.width resets the 2d context transform to identity, wiping
    // the dpr scale fabric's _initRetinaScaling had installed. Re-apply it
    // absolutely (setTransform, not scale) so on-screen rendering fills the
    // full dpr buffer on HiDPI screens instead of shrinking to 1/dpr.
    if (c.contextContainer && typeof c.contextContainer.setTransform === 'function') {
      c.contextContainer.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (c.contextTop && typeof c.contextTop.setTransform === 'function') {
      c.contextTop.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (c.wrapperEl) {
      c.wrapperEl.style.width = dispW + 'px';
      c.wrapperEl.style.height = dispH + 'px';
    }
    if (typeof c.calcOffset === 'function') c.calcOffset();
    c.requestRenderAll();
    this.refreshOutsideFade();
    if (this.onZoom) this.onZoom(this.zoom);
  }

  zoomIn() {
    this.applyZoom(this.zoom * 1.25);
  }

  zoomOut() {
    this.applyZoom(this.zoom / 1.25);
  }

  zoomFit() {
    const wrap = document.querySelector('.canvas-wrapper');
    if (!wrap) return;
    const pad = 40 + (this.rulerInset || 0);
    const availW = wrap.clientWidth - pad;
    const availH = wrap.clientHeight - pad;
    const pb = this.pasteboard || 0;
    const w = this.canvas.getWidth() + pb * 2;
    const h = this.canvas.getHeight() + pb * 2;
    if (w <= 0 || h <= 0 || availW <= 0 || availH <= 0) return;
    this.applyZoom(Math.min(availW / w, availH / h, 1));
  }

  toDataURL(format = 'png') {
    // Export the artboard (logical W×H) 1:1.
    //
    // Why the viewport swap: our on-screen viewport is [z,0,0,z,pb*z,pb*z]
    // (zoom + pasteboard offset). fabric's toCanvasElement() derives its
    // export viewport from the CURRENT viewportTransform, so exporting
    // directly would bake zoom/pasteboard into the PNG (wrong size/shift).
    // Resetting to identity + cropping W×H gives an exact 1:1 artboard PNG.
    //
    // Why renderOnAddRemove=false + cancelRequestedRender: setViewportTransform()
    // schedules an on-screen repaint via requestRenderAll(). Suppressing it
    // during the synchronous swap/restore means the visible canvas never
    // repaints mid-export — no flicker/shift on screen. Repaint afterwards so
    // the screen never stays stale (e.g. after cancelling a pending frame).
    const c = this.canvas;
    const prev = c.viewportTransform.slice();
    const was = c.renderOnAddRemove;
    c.renderOnAddRemove = false;
    if (typeof c.cancelRequestedRender === 'function') c.cancelRequestedRender();
    c.setViewportTransform([1, 0, 0, 1, 0, 0]);
    let url;
    try {
      url = c.toDataURL({
        format,
        multiplier: 1,
        enableRetinaScaling: false,
        left: 0,
        top: 0,
        width: c.getWidth(),
        height: c.getHeight(),
      });
    } finally {
      c.renderOnAddRemove = was;
      c.setViewportTransform(prev);
      c.requestRenderAll();
    }
    return url;
  }

  loadImageObj(url) {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(url, (img, isError) => {
        if (!img || isError || !img.width) reject(new Error('Failed to load image'));
        else resolve(img);
      });
    });
  }

  /** Add a shape object at canvas center (circle or rect). */
  addShape(kind = 'circle') {
    const c = this.canvas;
    const W = c.getWidth();
    const H = c.getHeight();
    const size = Math.min(W, H) * 0.25;
    const color = '#3b82f6';
    let obj;
    if (kind === 'circle') {
      obj = new fabric.Circle({
        left: W / 2,
        top: H / 2,
        radius: size / 2,
        fill: color,
        opacity: 0.92,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        cornerStyle: 'circle',
        transparentCorners: false,
        dataId: 'shape-circle',
      });
    } else {
      obj = new fabric.Rect({
        left: W / 2 - size / 2,
        top: H / 2 - size / 2,
        width: size,
        height: size,
        rx: Math.max(8, size * 0.08),
        ry: Math.max(8, size * 0.08),
        fill: color,
        opacity: 0.92,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        cornerStyle: 'circle',
        transparentCorners: false,
        dataId: 'shape-rect',
      });
    }
    c.add(obj);
    c.setActiveObject(obj);
    c.requestRenderAll();
    this.refreshOutsideFade();
    return obj;
  }

  /** Fabric text objects on the canvas (textbox / i-text). */
  getTextObjects() {
    return this.canvas.getObjects().filter(
      (o) => o.type === 'i-text' || o.type === 'textbox'
    );
  }
}
