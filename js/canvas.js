import { generateId } from './utils.js';

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
    this.canvas.setZoom(this.zoom);
    const w = Math.round(this.canvas.getWidth() * this.zoom);
    const h = Math.round(this.canvas.getHeight() * this.zoom);
    const c = this.canvas;
    if (c.lowerCanvasEl) {
      c.lowerCanvasEl.style.width = w + 'px';
      c.lowerCanvasEl.style.height = h + 'px';
    }
    if (c.upperCanvasEl) {
      c.upperCanvasEl.style.width = w + 'px';
      c.upperCanvasEl.style.height = h + 'px';
    }
    if (c.wrapperEl) {
      c.wrapperEl.style.width = w + 'px';
      c.wrapperEl.style.height = h + 'px';
    }
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
    const availW = wrap.clientWidth - 40;
    const availH = wrap.clientHeight - 40;
    const w = this.canvas.getWidth();
    const h = this.canvas.getHeight();
    if (w <= 0 || h <= 0 || availW <= 0 || availH <= 0) return;
    this.applyZoom(Math.min(availW / w, availH / h, 1));
  }

  toDataURL(format = 'png') {
    const vt = this.canvas.viewportTransform;
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    let url;
    try {
      url = this.canvas.toDataURL({
        format,
        multiplier: 1,
        enableRetinaScaling: false,
        width: this.canvas.getWidth(),
        height: this.canvas.getHeight(),
      });
    } finally {
      this.canvas.setViewportTransform(vt);
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
}
