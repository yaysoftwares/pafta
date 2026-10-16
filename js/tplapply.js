// Applies a design template onto the Fabric canvas.
//
// The template recipe (js/templates.js) uses RELATIVE coords (0..1), so the
// same design scales to any canvas size. This manager paints bg + decor +
// screenshot slots + device bezel + recipe texts onto the live canvas.
//
// Screenshot flow: user clicks a slot -> file picker -> image fitted into
// the slot rect (cover crop, rounded corners, tilt preserved).

import { generateId } from './utils.js';
import { getTemplate } from './templates.js';

export class TemplateManager {
  constructor(store, canvasManager, textManager) {
    this.store = store;
    this.cm = canvasManager;
    this.textManager = textManager;
  }

  // ---------- public ----------

  /** Build a whole new item from a template (screenshot slots empty). */
  async createFromTemplate(templateId) {
    const tpl = getTemplate(templateId);
    if (!tpl) throw new Error('Unknown template: ' + templateId);
    const langs = this.store.project.langs && this.store.project.langs.length
      ? [...this.store.project.langs]
      : ['EN'];
    const item = {
      id: generateId(),
      filename: tpl.name + '.png',
      width: 0,
      height: 0,
      dataUrl: null,
      templateId: tpl.id,
      templateSlots: {},
      frame: null,
      frameLayout: null,
      screenLayout: null,
      slotLayouts: {},
      textLayers: (tpl.texts || []).map((t) => ({
        id: 'tpl_' + t.id,
        texts: Object.fromEntries(langs.map((l) => [l, (t.text && (t.text[l] || t.text.EN)) || ''])),
        style: {
          fontFamily: t.font || 'Inter',
          fontSize: t.size || 60,
          fill: t.color || '#141419',
          fontStyle: 'normal',
          fontWeight: t.bold ? 'bold' : 'normal',
          textAlign: (t.align || 'center').toLowerCase(),
          charSpacing: Math.round((t.spacing || 0) * 1000),
          lineHeight: t.lineHeight || 1.16,
          opacity: t.opacity != null ? t.opacity : 1,
          bg: t.pill ? t.pill.bg : null,
          bgPadX: t.pill ? t.pill.padx : 0,
          bgPadY: t.pill ? t.pill.pady : 0,
        },
      })),
      textMetrics: {},
      texts: {},
      translateMap: [],
    };
    this.store.addItem(item);
    return item;
  }

  /** Paint the template recipe onto the live canvas for the given item. */
  async renderTemplate(item) {
    const tpl = getTemplate(item.templateId);
    const c = this.cm.canvas;
    if (!tpl || !c) return;
    const W = c.getWidth();
    const H = c.getHeight();
    const S = W / 1290;

    this.paintBackground(c, tpl, W, H);
    this.paintDecor(c, tpl, W, H);

    const slots = [...(tpl.slots || [])].reverse();
    for (const slot of slots) {
      const dataUrl = item.templateSlots && item.templateSlots[slot.id];
      if (dataUrl) {
        try {
          await this.paintScreenshot(c, item, tpl, slot, dataUrl, W, H, S);
        } catch (e) {
          console.warn('Template slot image failed:', slot.id, e);
          this.paintPlaceholder(c, tpl, slot, W, H, S);
        }
      } else {
        this.paintPlaceholder(c, tpl, slot, W, H, S);
      }
    }

    if (tpl.frame === 'device') this.paintBezel(c, tpl, W, H, S);

    for (const t of tpl.texts || []) this.paintTemplateText(c, item, t, W, H, S);
    for (const t of this.cm.getTextObjects()) c.bringToFront(t);

    c.requestRenderAll();
    this.cm.refreshOutsideFade();
  }

  /** Load a screenshot file into a template slot. */
  loadFileIntoSlot(item, slotId, file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!item.templateSlots) item.templateSlots = {};
        item.templateSlots[slotId] = e.target.result;
        const img = new Image();
        img.onload = () => {
          if (!item.width) { item.width = img.naturalWidth; item.height = img.naturalHeight; }
          this.store.saveToSession();
          resolve(item.templateSlots[slotId]);
        };
        img.onerror = () => { this.store.saveToSession(); resolve(item.templateSlots[slotId]); };
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  slotIds(item) {
    const tpl = getTemplate(item && item.templateId);
    return (tpl && tpl.slots ? tpl.slots.map((s) => s.id) : []);
  }

  slotHasImage(item, slotId) {
    return Boolean(item && item.templateSlots && item.templateSlots[slotId]);
  }

  // ---------- painters ----------

  paintBackground(c, tpl, W, H) {
    this.removeById('tpl-bg');
    const bg = tpl.bg || { type: 'solid', color: '#ffffff' };
    let fill = bg.color || '#ffffff';
    if (bg.type === 'gradient') {
      const a = ((bg.angle || 160) * Math.PI) / 180;
      const cx = W / 2, cy = H / 2;
      const half = (Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a))) / 2;
      fill = new fabric.Gradient({
        type: 'linear',
        coords: { x1: cx - Math.cos(a) * half, y1: cy - Math.sin(a) * half, x2: cx + Math.cos(a) * half, y2: cy + Math.sin(a) * half },
        colorStops: [{ offset: 0, color: bg.from || '#ffffff' }, { offset: 1, color: bg.to || '#000000' }],
      });
    } else if (bg.type === 'radial') {
      fill = new fabric.Gradient({
        type: 'radial',
        coords: { x1: W / 2, y1: H / 2, x2: W / 2, y2: H / 2, r1: 0, r2: Math.max(W, H) * 0.75 },
        colorStops: [{ offset: 0, color: bg.inner || '#333333' }, { offset: 1, color: bg.outer || '#000000' }],
      });
    }
    const rect = new fabric.Rect({ left: 0, top: 0, width: W, height: H, fill, selectable: false, evented: false, hoverCursor: 'default' });
    rect.dataId = 'tpl-bg';
    c.add(rect);
    c.sendToBack(rect);
  }

  paintDecor(c, tpl, W, H) {
    this.removeByPrefix('tpl-decor-');
    (tpl.decor || []).forEach((d, i) => {
      let obj = null;
      const common = { fill: d.color || '#000000', opacity: d.opacity != null ? d.opacity : 1, selectable: false, evented: false, hoverCursor: 'default' };
      if (d.kind === 'circle') {
        obj = new fabric.Circle({ ...common, left: (d.x || 0.5) * W, top: (d.y || 0.5) * H, radius: (d.r || 0.1) * W, originX: 'center', originY: 'center' });
      } else if (d.kind === 'rect') {
        const w = (d.w || 0.2) * W, h = (d.h || 0.1) * H;
        const rad = Math.min((d.radius || 0) * W, w / 2, h / 2);
        obj = new fabric.Rect({ ...common, left: (d.x || 0) * W, top: (d.y || 0) * H, width: w, height: h, rx: rad, ry: rad, angle: d.tilt || 0 });
      }
      if (obj) { obj.dataId = 'tpl-decor-' + i; c.add(obj); }
    });
  }

  slotRect(slot, W, H) {
    return { left: (slot.x || 0) * W, top: (slot.y || 0) * H, width: (slot.w || 0.4) * W, height: (slot.h || 0.4) * H, tilt: slot.tilt || 0 };
  }

  paintPlaceholder(c, tpl, slot, W, H, S) {
    this.removeById('tpl-slot-' + slot.id);
    const r = this.slotRect(slot, W, H);
    const rad = Math.min(r.width, r.height) * 0.06;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const box = new fabric.Rect({ left: cx, top: cy, width: r.width, height: r.height, rx: rad, ry: rad, originX: 'center', originY: 'center', fill: 'rgba(120,120,135,0.16)', stroke: 'rgba(120,120,135,0.85)', strokeWidth: Math.max(2, 3 * S), strokeDashArray: [14 * S, 10 * S] });
    const label = new fabric.Text('+  ' + slot.id.toUpperCase(), { left: cx, top: cy - 20 * S, originX: 'center', originY: 'center', fontSize: Math.max(28, 40 * S), fontFamily: 'Inter, Arial, sans-serif', fill: 'rgba(110,110,125,0.95)' });
    const hint = new fabric.Text('click to load screenshot', { left: cx, top: cy + 40 * S, originX: 'center', originY: 'center', fontSize: Math.max(22, 30 * S), fontFamily: 'Inter, Arial, sans-serif', fill: 'rgba(110,110,125,0.75)' });
    const g = new fabric.Group([box, label, hint], { left: r.left, top: r.top, angle: r.tilt, selectable: true, evented: true, hasControls: false, hasBorders: true, hoverCursor: 'pointer' });
    g.dataId = 'tpl-slot-' + slot.id;
    g.dataSlotId = slot.id;
    c.add(g);
  }

  async paintScreenshot(c, item, tpl, slot, dataUrl, W, H, S) {
    this.removeById('tpl-slot-' + slot.id);
    const r = this.slotRect(slot, W, H);
    const img = await this.cm.loadImageObj(dataUrl);
    const s = Math.max(r.width / img.width, r.height / img.height);
    const isMain = slot.id === 'screen' && tpl.frame === 'device';
    const rad = (isMain ? 0.055 : 0.04) * Math.min(r.width, r.height);
    const saved = (item.slotLayouts || {})[slot.id];
    img.set({
      originX: 'center', originY: 'center', left: 0, top: 0,
      scaleX: saved ? saved.scaleX : s, scaleY: saved ? saved.scaleY : s, angle: 0,
      selectable: false, evented: false,
      clipPath: new fabric.Rect({ width: r.width, height: r.height, rx: rad, ry: rad, originX: 'center', originY: 'center', absolutePositioned: true }),
    });
    img.setCoords();
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) { img.set({ left: saved.left, top: saved.top }); img.setCoords(); }
    const g = new fabric.Group([img], { left: r.left, top: r.top, angle: r.tilt, selectable: true, evented: true, hasControls: false, hasBorders: true, hoverCursor: 'move' });
    g.dataId = 'tpl-slot-' + slot.id;
    g.dataSlotId = slot.id;
    c.add(g);
  }

  paintBezel(c, tpl, W, H, S) {
    this.removeById('tpl-bezel');
    const main = (tpl.slots || []).find((s) => s.id === 'screen');
    if (!main) return;
    const r = this.slotRect(main, W, H);
    const pad = Math.min(r.width, r.height) * 0.045;
    const innerR = Math.min(r.width, r.height) * 0.055;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const frame = new fabric.Rect({ left: 0, top: 0, width: r.width + pad, height: r.height + pad, rx: innerR + pad / 2, ry: innerR + pad / 2, originX: 'center', originY: 'center', fill: 'transparent', stroke: '#0b0b0e', strokeWidth: pad * 2 });
    const edge = new fabric.Rect({ left: 0, top: 0, width: r.width + pad * 2, height: r.height + pad * 2, rx: innerR + pad, ry: innerR + pad, originX: 'center', originY: 'center', fill: 'transparent', stroke: 'rgba(255,255,255,0.16)', strokeWidth: Math.max(1.5, 2.5 * S) });
    const notch = new fabric.Rect({ left: 0, top: -(r.height / 2) + pad * 0.2, width: r.width * 0.30, height: pad * 0.85, rx: pad * 0.42, ry: pad * 0.42, originX: 'center', originY: 'top', fill: '#050507' });
    const g = new fabric.Group([frame, edge, notch], { left: cx, top: cy, angle: r.tilt, originX: 'center', originY: 'center', selectable: false, evented: false, hoverCursor: 'default' });
    g.dataId = 'tpl-bezel';
    c.add(g);
    c.bringToFront(g);
    for (const t of this.cm.getTextObjects()) c.bringToFront(t);
  }

  paintTemplateText(c, item, t, W, H, S) {
    const layer = (item.textLayers || []).find((l) => l.id === 'tpl_' + t.id);
    const lang = this.store.getActiveLang();
    const raw = (layer && layer.texts && (layer.texts[lang] || layer.texts.EN)) || (t.text && t.text.EN) || '';
    const style = (layer && layer.style) || {};
    const cx = (t.x != null ? t.x : 0.5) * W, cy = (t.y != null ? t.y : 0.5) * H;
    const metrics = (item.textMetrics || {})['tpl_' + t.id] || {};
    const anchor = t.anchor || 'top-center';
    let originX = 'center', originY = 'top';
    if (anchor.includes('left')) originX = 'left';
    else if (anchor.includes('right')) originX = 'right';
    if (anchor.startsWith('center')) { originX = 'center'; originY = 'center'; }
    else if (anchor.startsWith('bottom')) originY = 'bottom';
    const maxW = t.maxWidth ? t.maxWidth * W : W * 0.9;
    const obj = new fabric.Textbox(raw, {
      left: cx, top: cy, originX, originY, width: Math.min(maxW, W * 0.92),
      fontSize: (t.size || 60) * S, fontFamily: `'${style.fontFamily || t.font || 'Inter'}'`,
      fontWeight: style.fontWeight || (t.bold ? 'bold' : 'normal'), fontStyle: style.fontStyle || 'normal',
      fill: style.fill || t.color || '#141419', textAlign: style.textAlign || (t.align || 'center').toLowerCase(),
      lineHeight: style.lineHeight || t.lineHeight || 1.16, charSpacing: style.charSpacing != null ? style.charSpacing : Math.round((t.spacing || 0) * 1000),
      opacity: style.opacity != null ? style.opacity : (t.opacity != null ? t.opacity : 1),
      angle: t.tilt || 0, editable: true,
    });
    if (Number.isFinite(metrics.left) && Number.isFinite(metrics.top)) {
      obj.set({ left: metrics.left, top: metrics.top });
      if (Number.isFinite(metrics.scaleX)) obj.set('scaleX', metrics.scaleX);
      if (Number.isFinite(metrics.scaleY)) obj.set('scaleY', metrics.scaleY);
      if (Number.isFinite(metrics.angle)) obj.set('angle', metrics.angle);
    }
    obj.setCoords();
    obj.dataId = 'tpl-text-' + t.id;
    obj.dataLayerId = 'tpl_' + t.id;
    if (style.bg) { obj.dataBg = style.bg; obj.dataBgPadX = (style.bgPadX || 0) * S; obj.dataBgPadY = (style.bgPadY || 0) * S; }
    c.add(obj);
  }

  // ---------- helpers ----------

  removeById(dataId) {
    const c = this.cm.canvas;
    for (const o of [...c.getObjects()]) if (o.dataId === dataId) c.remove(o);
  }

  removeByPrefix(prefix) {
    const c = this.cm.canvas;
    for (const o of [...c.getObjects()]) if (typeof o.dataId === 'string' && o.dataId.startsWith(prefix)) c.remove(o);
  }

  /** Persist slot image pan (called on object:modified for slot groups). */
  persistSlotGeometry(item) {
    if (!item || !item.templateId) return false;
    const c = this.cm.canvas;
    let changed = false;
    item.slotLayouts = item.slotLayouts || {};
    for (const o of c.getObjects()) {
      if (o.dataSlotId && o._objects && o._objects[0] && o._objects[0].type === 'image') {
        const img = o._objects[0];
        item.slotLayouts[o.dataSlotId] = { left: img.left, top: img.top, scaleX: img.scaleX, scaleY: img.scaleY };
        changed = true;
      }
    }
    return changed;
  }
}
