import { DEVICE_FRAMES } from './constants.js';

export class FrameManager {
  constructor(store) {
    this.store = store;
    this.customFrames = [];
  }

  getFrames(category = 'all') {
    if (category === 'all') return DEVICE_FRAMES;
    if (category === 'others') {
      return DEVICE_FRAMES.filter(f => !['ios', 'android'].includes(f.category));
    }
    return DEVICE_FRAMES.filter(f => f.category === category);
  }

  getCustomFrames() {
    return this.store ? this.store.customFrames : this.customFrames;
  }

  addCustomFrame(url, name) {
    const frame = { id: 'custom_' + Date.now() + Math.floor(Math.random() * 1000), name, dataUrl: url };
    if (this.store) {
      this.store.customFrames.push(frame);
      this.store.persist();
    } else {
      this.customFrames.push(frame);
    }
    return frame;
  }

  bezel(frame) {
    return Math.max(10, Math.round(Math.min(frame.width, frame.height) * 0.028));
  }

  buildDeviceSVG(frame) {
    const b = this.bezel(frame);
    const fw = frame.width;
    const fh = frame.height;
    const W = fw + b * 2;
    const H = fh + b * 2;
    const r = Math.round(Math.min(W, H) * 0.11);
    const ri = Math.max(6, r - b);
    const rr = (x, y, w, h, rad) => {
      rad = Math.min(rad, w / 2, h / 2);
      return `M${x + rad},${y} H${x + w - rad} A${rad},${rad} 0 0 1 ${x + w},${y + rad}` +
        ` V${y + h - rad} A${rad},${rad} 0 0 1 ${x + w - rad},${y + h}` +
        ` H${x + rad} A${rad},${rad} 0 0 1 ${x},${y + h - rad}` +
        ` V${y + rad} A${rad},${rad} 0 0 1 ${x + rad},${y} Z`;
    };
    const ringPath = rr(0, 0, W, H, r) + ' ' + rr(b, b, fw, fh, ri);

    let extra = '';
    if (frame.os === 'ios') {
      const iw = Math.round(fw * 0.26);
      const ih = Math.round(iw * 0.32);
      const ix = Math.round((W - iw) / 2);
      const iy = b + Math.round(fh * 0.016);
      extra += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="${ih / 2}" fill="#050507"/>`;
    } else if (frame.os === 'android') {
      const cr = Math.max(6, Math.round(fw * 0.026));
      const cy = b + Math.round(fh * 0.026) + cr;
      extra += `<circle cx="${W / 2}" cy="${cy}" r="${cr}" fill="#050507"/>`;
    }

    const edge = `<rect x="${b + 0.5}" y="${b + 0.5}" width="${fw - 1}" height="${fh - 1}" rx="${ri}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>`;

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
      `<defs><linearGradient id="bez" x1="0" y1="0" x2="1" y2="0">` +
      `<stop offset="0" stop-color="#0a0a0c"/><stop offset="0.5" stop-color="#16161a"/><stop offset="1" stop-color="#0a0a0c"/>` +
      `</linearGradient></defs>` +
      `<path d="${ringPath}" fill="url(#bez)" fill-rule="evenodd"/>` +
      extra + edge +
      `</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(url, (img, isError) => {
        if (!img || isError || !img.width) reject(new Error('Failed to load frame image'));
        else resolve(img);
      });
    });
  }

  placeFrameObject(cm, img) {
    img.set({
      left: 0,
      top: 0,
      dataId: 'frame',
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      cornerStyle: 'circle',
      transparentCorners: false,
    });
    cm.canvas.add(img);
    cm.canvas.bringToFront(img);
    for (const t of cm.getTextObjects()) cm.canvas.bringToFront(t);
  }

  fitScreen(cm, x, y, w, h) {
    const screen = cm.findScreen();
    if (!screen) return;
    const s = Math.min(w / screen.width, h / screen.height);
    screen.set({
      scaleX: s,
      scaleY: s,
      left: x + (w - screen.width * s) / 2,
      top: y + (h - screen.height * s) / 2,
      originX: 'left',
      originY: 'top',
    });
    screen.setCoords();
  }

  async applyFrame(cm, frame, frameLayout = null) {
    const b = this.bezel(frame);
    const W = frame.width + b * 2;
    const H = frame.height + b * 2;
    const img = await this.loadImage(this.buildDeviceSVG(frame));
    const old = cm.findFrame();
    if (old) cm.canvas.remove(old);
    this.placeFrameObject(cm, img);
    if (frameLayout) {
      img.set({
        left: frameLayout.left ?? 0,
        top: frameLayout.top ?? 0,
        scaleX: frameLayout.scaleX ?? 1,
        scaleY: frameLayout.scaleY ?? 1,
      });
      img.setCoords();
    }
    cm.canvas.setWidth(W);
    cm.canvas.setHeight(H);
    this.fitScreen(cm, b, b, frame.width, frame.height);
    cm.canvas.requestRenderAll();
    cm.applyZoom(cm.zoom);
    return frame;
  }

  async applyCustomFrame(cm, cf, frameLayout = null) {
    const img = await this.loadImage(cf.dataUrl);
    const old = cm.findFrame();
    if (old) cm.canvas.remove(old);
    this.placeFrameObject(cm, img);
    if (frameLayout) {
      img.set({
        left: frameLayout.left ?? 0,
        top: frameLayout.top ?? 0,
        scaleX: frameLayout.scaleX ?? 1,
        scaleY: frameLayout.scaleY ?? 1,
      });
      img.setCoords();
    }
    const W = img.width;
    const H = img.height;
    cm.canvas.setWidth(W);
    cm.canvas.setHeight(H);
    this.fitScreen(cm, 0, 0, W, H);
    cm.canvas.requestRenderAll();
    cm.applyZoom(cm.zoom);
    return cf;
  }

  clearFrame(cm) {
    const old = cm.findFrame();
    if (old) cm.canvas.remove(old);
    const screen = cm.findScreen();
    if (screen) {
      cm.canvas.setWidth(screen.getScaledWidth());
      cm.canvas.setHeight(screen.getScaledHeight());
    }
    cm.canvas.requestRenderAll();
    cm.applyZoom(cm.zoom);
  }

  restoreFrame(cm, item) {
    const f = item.frame;
    if (!f) return Promise.resolve();
    const layout = item.frameLayout || null;
    if (f.kind === 'device') {
      const def = DEVICE_FRAMES.find(d => d.id === f.id);
      if (def) return this.applyFrame(cm, def, layout);
    } else if (f.kind === 'custom') {
      const cf = this.getCustomFrames().find(c => c.id === f.id);
      if (cf) return this.applyCustomFrame(cm, cf, layout);
    }
    return Promise.resolve();
  }
}
