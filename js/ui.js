import { APPSTORE_PRESETS, GOOGLEPLAY_PRESETS, APP_VERSION, FONT_FAMILIES } from './constants.js';
import { buildFilename, sanitizeFilename, getTimestamp, generateId } from './utils.js';

export class UI {
  constructor(store, canvasManager, frameManager, textManager, translateManager, exporter, projectManager, importer) {
    this.store = store;
    this.canvasManager = canvasManager;
    this.frameManager = frameManager;
    this.textManager = textManager;
    this.translateManager = translateManager;
    this.exporter = exporter;
    this.projectManager = projectManager;
    this.importer = importer;
    this.pendingTranslations = null;
    this.ratioLocked = true;

    this.initElements();
    this.populateFonts();
    this.bindEvents();
    this.renderFrames();
    this.renderPresets();
    this.renderCustomFrames();
    this.renderLanguages();
    this.renderGlossary();
    this.renderLayers();
    this.renderItems();
    this.update();
    this.updateStatus();
    const active = this.store.getActiveItem();
    if (active) {
      this.canvasManager.setCurrentItem(active).then(() => {
        this.update();
        this.canvasManager.zoomFit();
      });
    } else {
      this.canvasManager.zoomFit();
    }
  }

  initElements() {
    this.btnNew = document.getElementById('btnNew');
    this.inputOpenZip = document.getElementById('inputOpenZip');
    this.btnOpenZip = document.getElementById('btnOpenZip');
    this.btnExportZip = document.getElementById('btnExportZip');
    this.btnExportAll = document.getElementById('btnExportAll');
    this.btnExportSelected = document.getElementById('btnExportSelected');
    this.inputAppName = document.getElementById('inputAppName');
    this.inputProjectName = document.getElementById('inputProjectName');
    this.inputImages = document.getElementById('inputImages');
    this.btnAddImages = document.getElementById('btnAddImages');
    this.itemsList = document.getElementById('itemsList');
    this.selectFrameCategory = document.getElementById('selectFrameCategory');
    this.framesList = document.getElementById('framesList');
    this.inputCustomFrame = document.getElementById('inputCustomFrame');
    this.btnUploadCustomFrame = document.getElementById('btnUploadCustomFrame');
    this.customFramesList = document.getElementById('customFramesList');
    this.btnZoomIn = document.getElementById('btnZoomIn');
    this.btnZoomOut = document.getElementById('btnZoomOut');
    this.btnZoomFit = document.getElementById('btnZoomFit');
    this.zoomLabel = document.getElementById('zoomLabel');
    this.activeItemName = document.getElementById('activeItemName');
    this.layersList = document.getElementById('layersList');
    this.btnAddText = document.getElementById('btnAddText');
    this.btnRemoveLayer = document.getElementById('btnRemoveLayer');
    this.btnLayerUp = document.getElementById('btnLayerUp');
    this.btnLayerDown = document.getElementById('btnLayerDown');
    this.btnLayerFront = document.getElementById('btnLayerFront');
    this.btnLayerBack = document.getElementById('btnLayerBack');
    this.inputFontFamily = document.getElementById('inputFontFamily');
    this.inputFontSize = document.getElementById('inputFontSize');
    this.inputFontColor = document.getElementById('inputFontColor');
    this.checkFontFill = document.getElementById('checkFontFill');
    this.checkFontBold = document.getElementById('checkFontBold');
    this.checkFontItalic = document.getElementById('checkFontItalic');
    this.selectStore = document.getElementById('selectStore');
    this.selectPreset = document.getElementById('selectPreset');
    this.btnApplyPreset = document.getElementById('btnApplyPreset');
    this.inputNewLang = document.getElementById('inputNewLang');
    this.btnAddLang = document.getElementById('btnAddLang');
    this.langsList = document.getElementById('langsList');
    this.selectActiveLang = document.getElementById('selectActiveLang');
    this.btnTranslate = document.getElementById('btnTranslate');
    this.inputPreserveTerm = document.getElementById('inputPreserveTerm');
    this.btnAddPreserve = document.getElementById('btnAddPreserve');
    this.preserveList = document.getElementById('preserveList');
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    this.statusProject = document.getElementById('statusProject');
    this.appVersion = document.getElementById('appVersion');
    this.fontSizeChips = document.getElementById('fontSizeChips');
    this.btnAlignLeft = document.getElementById('btnAlignLeft');
    this.btnAlignCenter = document.getElementById('btnAlignCenter');
    this.btnAlignRight = document.getElementById('btnAlignRight');
    this.inputCharSpacing = document.getElementById('inputCharSpacing');
    this.inputLineHeight = document.getElementById('inputLineHeight');
    this.panelTabs = document.getElementById('panelTabs');
    this.tabPanels = document.querySelectorAll('[data-tabpanel]');
    this.inputCanvasW = document.getElementById('inputCanvasW');
    this.inputCanvasH = document.getElementById('inputCanvasH');
    this.btnRatioLock = document.getElementById('btnRatioLock');
    this.canvasSizeLabel = document.getElementById('canvasSizeLabel');
    this.canvasSizeText = document.getElementById('canvasSizeText');
    this.canvasZoomText = document.getElementById('canvasZoomText');
    this.canvasContainer = document.getElementById('canvas-container');
    this.inputBgColor = document.getElementById('inputBgColor');
    this.checkBgTransparent = document.getElementById('checkBgTransparent');
    this.inputSelX = document.getElementById('inputSelX');
    this.inputSelY = document.getElementById('inputSelY');
    this.inputSelW = document.getElementById('inputSelW');
    this.inputSelH = document.getElementById('inputSelH');
    this.btnAlignH = document.getElementById('btnAlignH');
    this.btnAlignV = document.getElementById('btnAlignV');
    this.btnDownloadPng = document.getElementById('btnDownloadPng');
    this.modalTranslate = document.getElementById('modalTranslate');
    this.btnCloseTranslate = document.getElementById('btnCloseTranslate');
    this.btnCancelTranslate = document.getElementById('btnCancelTranslate');
    this.btnApplyTranslate = document.getElementById('btnApplyTranslate');
    this.translateTableBody = document.getElementById('translateTableBody');
    this.translateSourceLang = document.getElementById('translateSourceLang');
    if (this.appVersion) this.appVersion.textContent = APP_VERSION;
  }

  bindEvents() {
    const cm = this.canvasManager;

    // Project
    this.btnNew.addEventListener('click', () => {
      if (!confirm('Start a new project? Current work will be cleared.')) return;
      this.projectManager.newProject();
      cm.currentLang = null;
      cm.setCurrentItem(null);
      this.inputAppName.value = '';
      this.inputProjectName.value = '';
      this.update();
      this.flash('New project created');
    });

    this.btnOpenZip.addEventListener('click', () => this.inputOpenZip.click());
    this.inputOpenZip.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        await this.importer.importZip(file);
        cm.currentLang = null;
        await this.afterProjectChange();
        this.flash('Project loaded');
      } catch (err) {
        console.error(err);
        this.flash('Failed to open ZIP: ' + err.message, true);
      }
    });

    this.btnExportZip.addEventListener('click', async () => {
      try {
        const blob = await this.projectManager.exportZip();
        window.saveAs(blob, this.zipName());
        this.flash('Project ZIP exported');
      } catch (err) {
        console.error(err);
        this.flash('Export failed: ' + err.message, true);
      }
    });

    this.btnExportAll.addEventListener('click', async () => {
      try {
        this.btnExportAll.disabled = true;
        const blob = await this.exporter.exportAllZip('both');
        window.saveAs(blob, this.zipName('png'));
        this.flash('All screenshots exported');
      } catch (err) {
        console.error(err);
        this.flash('Export failed: ' + err.message, true);
      } finally {
        this.update();
      }
    });

    this.btnExportSelected.addEventListener('click', async () => {
      try {
        const blob = await this.exporter.exportSelected('both');
        window.saveAs(blob, this.zipName('selected'));
        this.flash('Active screenshot exported');
      } catch (err) {
        console.error(err);
        this.flash('Export failed: ' + err.message, true);
      }
    });

    this.inputAppName.addEventListener('change', () => {
      this.store.updateProject({ appName: this.inputAppName.value.trim() });
      this.updateStatus();
    });
    this.inputProjectName.addEventListener('change', () => {
      this.store.updateProject({ projectName: this.inputProjectName.value.trim() });
      this.updateStatus();
    });

    // Images
    this.btnAddImages.addEventListener('click', () => this.inputImages.click());
    this.inputImages.addEventListener('change', (e) => {
      this.handleImageFiles(e.target.files);
    });

    // Frames
    this.selectFrameCategory.addEventListener('change', () => this.renderFrames());
    this.btnUploadCustomFrame.addEventListener('click', () => this.inputCustomFrame.click());
    this.inputCustomFrame.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        const url = await this.readFile(file);
        this.frameManager.addCustomFrame(url, file.name.replace(/\.[^.]+$/, ''));
        this.renderCustomFrames();
        this.flash('Custom frame added');
      } catch (err) {
        console.error(err);
        this.flash('Failed to read frame: ' + err.message, true);
      }
    });

    this.framesList.addEventListener('click', (e) => {
      const el = e.target.closest('[data-frame-id]');
      if (!el) return;
      this.applyFrameById(el.dataset.frameId);
    });

    this.customFramesList.addEventListener('click', (e) => {
      const el = e.target.closest('[data-frame-id]');
      if (!el) return;
      this.applyCustomFrameById(el.dataset.frameId);
    });

    // Zoom
    this.btnZoomIn.addEventListener('click', () => cm.zoomIn());
    this.btnZoomOut.addEventListener('click', () => cm.zoomOut());
    this.btnZoomFit.addEventListener('click', () => cm.zoomFit());

    // Layers
    this.btnAddText.addEventListener('click', () => this.addTextLayer());
    this.btnRemoveLayer.addEventListener('click', () => {
      const obj = cm.canvas.getActiveObject();
      if (!obj || obj.dataId === 'screen') return;
      cm.canvas.remove(obj);
      cm.canvas.discardActiveObject();
      cm.canvas.requestRenderAll();
      this.persistComposition();
      this.update();
    });
    const move = (fn) => () => {
      const obj = cm.canvas.getActiveObject();
      if (!obj) return;
      fn(obj);
      cm.canvas.requestRenderAll();
      this.persistComposition();
      this.renderLayers();
    };
    this.btnLayerUp.addEventListener('click', move(o => cm.canvas.bringForward(o)));
    this.btnLayerDown.addEventListener('click', move(o => cm.canvas.sendBackwards(o)));
    this.btnLayerFront.addEventListener('click', move(o => cm.canvas.bringToFront(o)));
    this.btnLayerBack.addEventListener('click', move(o => cm.canvas.sendToBack(o)));

    // Font controls
    this.inputFontFamily.addEventListener('change', async () => {
      this.applyFontStyle();
      await this.ensureFont(this.inputFontFamily.value);
    });
    for (const el of [this.inputFontSize, this.checkFontFill, this.checkFontBold, this.checkFontItalic, this.inputCharSpacing, this.inputLineHeight]) {
      el.addEventListener('change', () => this.applyFontStyle());
    }
    this.inputFontColor.addEventListener('input', () => this.applyFontStyle());
    this.fontSizeChips.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-size]');
      if (!btn) return;
      this.inputFontSize.value = btn.dataset.size;
      this.applyFontStyle();
      this.updateSizeChips();
    });
    this.btnAlignLeft.addEventListener('click', () => this.setTextAlign('left'));
    this.btnAlignCenter.addEventListener('click', () => this.setTextAlign('center'));
    this.btnAlignRight.addEventListener('click', () => this.setTextAlign('right'));

    // Tabs
    this.panelTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      for (const b of this.panelTabs.querySelectorAll('.tab')) {
        b.classList.toggle('active', b === btn);
      }
      for (const p of this.tabPanels) {
        p.classList.toggle('active', p.dataset.tabpanel === btn.dataset.tab);
      }
    });

    // Canvas size
    this.inputCanvasW.addEventListener('change', () => this.applyCanvasSize('w'));
    this.inputCanvasH.addEventListener('change', () => this.applyCanvasSize('h'));
    this.inputCanvasW.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.applyCanvasSize('w'); });
    this.inputCanvasH.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.applyCanvasSize('h'); });
    this.btnRatioLock.addEventListener('click', () => {
      this.ratioLocked = !this.ratioLocked;
      this.btnRatioLock.classList.toggle('active', this.ratioLocked);
      this.flash(this.ratioLocked ? 'Aspect ratio locked' : 'Aspect ratio unlocked');
    });

    // Background
    this.inputBgColor.addEventListener('change', () => this.applyBackground());
    this.checkBgTransparent.addEventListener('change', () => this.applyBackground());

    // Selection geometry
    this.inputSelX.addEventListener('change', () => this.applySelectionField('x'));
    this.inputSelY.addEventListener('change', () => this.applySelectionField('y'));
    this.inputSelW.addEventListener('change', () => this.applySelectionField('w'));
    this.inputSelH.addEventListener('change', () => this.applySelectionField('h'));
    this.btnAlignH.addEventListener('click', () => this.centerSelection('h'));
    this.btnAlignV.addEventListener('click', () => this.centerSelection('v'));

    // Download current canvas
    this.btnDownloadPng.addEventListener('click', () => this.downloadCurrentPng());

    // Presets
    this.selectStore.addEventListener('change', () => this.renderPresets());
    this.btnApplyPreset.addEventListener('click', () => {
      const list = this.selectStore.value === 'appstore' ? APPSTORE_PRESETS : GOOGLEPLAY_PRESETS;
      const preset = list.find(p => p.id === this.selectPreset.value);
      if (!preset) return;
      cm.applyPreset(preset);
      cm.zoomFit();
      this.persistComposition();
      this.flash(`Canvas set to ${preset.name} (${preset.width}×${preset.height})`);
    });

    // Languages
    this.btnAddLang.addEventListener('click', () => this.addLanguage());
    this.inputNewLang.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addLanguage();
    });
    this.langsList.addEventListener('click', (e) => {
      const el = e.target.closest('[data-lang-remove]');
      if (el) this.removeLanguage(el.dataset.langRemove);
    });
    this.selectActiveLang.addEventListener('change', () => {
      const lang = this.selectActiveLang.value;
      this.store.setActiveLang(lang);
      cm.applyLang(lang);
      this.renderLayers();
      this.persistComposition();
    });
    this.btnTranslate.addEventListener('click', () => this.onTranslate());

    // Glossary
    this.btnAddPreserve.addEventListener('click', () => this.addPreserveTerm());
    this.inputPreserveTerm.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addPreserveTerm();
    });
    this.preserveList.addEventListener('click', (e) => {
      const el = e.target.closest('[data-term-remove]');
      if (!el) return;
      this.store.removePreserveTerm(el.dataset.termRemove);
      this.renderGlossary();
    });

    // Translate modal
    this.btnCloseTranslate.addEventListener('click', () => this.closeTranslateModal());
    this.btnCancelTranslate.addEventListener('click', () => this.closeTranslateModal());
    this.btnApplyTranslate.addEventListener('click', () => this.applyTranslations());
    this.modalTranslate.addEventListener('click', (e) => {
      if (e.target === this.modalTranslate) this.closeTranslateModal();
    });

    // Canvas callbacks
    cm.onSelection = (objects) => this.onSelection(objects);
    cm.onChange = () => {
      this.persistComposition();
      this.renderLayers();
      this.syncSelectionUI();
      this.syncCanvasSizeUI();
    };
    cm.onZoom = (z) => {
      this.zoomLabel.textContent = Math.round(z * 100) + '%';
      this.syncCanvasSizeUI();
    };

    // Re-render text once locally bundled webfonts are ready
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        for (const o of this.canvasManager.getTextObjects()) {
          o.dirty = true;
          if (o.initDimensions) o.initDimensions();
        }
        this.canvasManager.canvas.requestRenderAll();
      });
    }

    // Network status
    window.addEventListener('online', () => this.updateStatus());
    window.addEventListener('offline', () => this.updateStatus());
  }

  // ---------- helpers ----------

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  zipName(suffix = '') {
    const parts = [
      sanitizeFilename(this.store.project.appName),
      sanitizeFilename(this.store.project.projectName),
    ].filter(Boolean);
    const base = parts.join('_') || 'screenshot-framer';
    return [base, suffix, getTimestamp()].filter(Boolean).join('_') + '.zip';
  }

  flash(msg, isError = false) {
    this.statusProject.textContent = msg;
    this.statusProject.style.color = isError ? 'var(--danger)' : 'var(--text-light)';
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => {
      this.statusProject.style.color = '';
      this.updateStatus();
    }, 3500);
  }

  async afterProjectChange() {
    this.inputAppName.value = this.store.project.appName || '';
    this.inputProjectName.value = this.store.project.projectName || '';
    const active = this.store.getActiveItem();
    await this.canvasManager.setCurrentItem(active);
    this.update();
    this.updateStatus();
  }

  // ---------- items (screenshots) ----------

  async handleImageFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    let added = 0;
    for (const file of files) {
      try {
        const dataUrl = await this.readFile(file);
        this.store.addItem({
          id: generateId(),
          name: file.name.replace(/\.[^.]+$/, ''),
          dataUrl,
          device: null,
          frame: null,
          texts: {},
          textLayers: [],
        });
        added++;
      } catch (err) {
        console.error('Failed to read', file.name, err);
      }
    }
    this.inputImages.value = '';
    const active = this.store.getActiveItem();
    if (active) await this.canvasManager.setCurrentItem(active);
    this.update();
    this.canvasManager.zoomFit();
    if (added) this.flash(`${added} screenshot(s) added — total ${this.store.project.items.length}`);
    else this.flash('No images could be read', true);
  }

  renderItems() {
    const items = this.store.project.items;
    this.itemsList.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'item item-empty';
      empty.textContent = 'No screenshots yet';
      this.itemsList.appendChild(empty);
      return;
    }
    items.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'item item-row' + (item.id === this.store.project.activeItemId ? ' active' : '');
      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = `${i + 1}. ${item.name || 'Screenshot'}`;
      div.appendChild(name);
      if (item.device && item.device.name) {
        const badge = document.createElement('span');
        badge.style.cssText = 'font-size: 10px; color: var(--text-light);';
        badge.textContent = item.device.name;
        div.appendChild(badge);
      }
      div.addEventListener('click', async () => {
        if (item.id === this.store.project.activeItemId) return;
        this.store.project.activeItemId = item.id;
        this.store.saveToSession();
        await this.canvasManager.setCurrentItem(item);
        this.update();
        this.canvasManager.zoomFit();
      });
      this.itemsList.appendChild(div);
    });
  }

  // ---------- frames ----------

  async applyFrameById(id) {
    if (id === 'none') {
      this.frameManager.clearFrame(this.canvasManager);
      const item = this.store.getActiveItem();
      if (item) {
        item.frame = null;
        item.device = null;
        this.persistComposition();
      }
      this.update();
      this.canvasManager.zoomFit();
      return;
    }
    const def = this.frameManager.getFrames('all').find(f => f.id === id);
    if (!def) return;
    try {
      await this.frameManager.applyFrame(this.canvasManager, def);
      const item = this.store.getActiveItem();
      if (item) {
        item.device = { id: def.id, name: def.name, width: def.width, height: def.height };
        item.frame = { kind: 'device', id: def.id };
        this.persistComposition();
      }
      this.update();
      this.canvasManager.zoomFit();
      this.flash(`${def.name} frame applied`);
    } catch (err) {
      console.error(err);
      this.flash('Frame failed to load: ' + err.message, true);
    }
  }

  async applyCustomFrameById(id) {
    const cf = this.frameManager.getCustomFrames().find(f => f.id === id);
    if (!cf) return;
    try {
      await this.frameManager.applyCustomFrame(this.canvasManager, cf);
      const item = this.store.getActiveItem();
      if (item) {
        item.device = { id: cf.id, name: cf.name };
        item.frame = { kind: 'custom', id: cf.id };
        this.persistComposition();
      }
      this.update();
      this.canvasManager.zoomFit();
      this.flash(`Custom frame "${cf.name}" applied`);
    } catch (err) {
      console.error(err);
      this.flash('Frame failed to load: ' + err.message, true);
    }
  }

  renderFrames() {
    const cat = this.selectFrameCategory.value || 'all';
    const item = this.store.getActiveItem();
    this.framesList.innerHTML = '';

    const none = document.createElement('div');
    none.className = 'item' + (!item || !item.frame ? ' active' : '');
    none.dataset.frameId = 'none';
    none.textContent = 'No Frame (raw screenshot)';
    this.framesList.appendChild(none);

    for (const f of this.frameManager.getFrames(cat)) {
      const div = document.createElement('div');
      div.className = 'item item-row' + (item && item.frame && item.frame.kind === 'device' && item.frame.id === f.id ? ' active' : '');
      div.dataset.frameId = f.id;
      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = f.name;
      div.appendChild(name);
      const dim = document.createElement('span');
      dim.style.cssText = 'font-size: 10px; color: var(--text-light);';
      dim.textContent = `${f.width}×${f.height}`;
      div.appendChild(dim);
      this.framesList.appendChild(div);
    }
  }

  renderCustomFrames() {
    const frames = this.frameManager.getCustomFrames();
    const item = this.store.getActiveItem();
    this.customFramesList.innerHTML = '';
    if (!frames.length) {
      const empty = document.createElement('div');
      empty.className = 'item item-empty';
      empty.textContent = 'No custom frames';
      this.customFramesList.appendChild(empty);
      return;
    }
    for (const cf of frames) {
      const div = document.createElement('div');
      div.className = 'item' + (item && item.frame && item.frame.kind === 'custom' && item.frame.id === cf.id ? ' active' : '');
      div.dataset.frameId = cf.id;
      div.textContent = cf.name;
      this.customFramesList.appendChild(div);
    }
  }

  // ---------- presets ----------

  renderPresets() {
    const list = this.selectStore.value === 'appstore' ? APPSTORE_PRESETS : GOOGLEPLAY_PRESETS;
    this.selectPreset.innerHTML = '';
    for (const p of list) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.width}×${p.height})`;
      this.selectPreset.appendChild(opt);
    }
  }

  // ---------- layers & text ----------

  layerLabel(obj) {
    if (obj.dataId === 'screen') {
      const item = this.store.getActiveItem();
      return `Screenshot: ${item ? (item.name || 'image') : ''}`;
    }
    if (obj.dataId === 'frame') return 'Device Frame';
    const text = (obj.text || '').replace(/\s+/g, ' ').trim();
    return text ? `Text: "${text.slice(0, 22)}${text.length > 22 ? '…' : ''}"` : 'Text';
  }

  renderLayers() {
    const canvas = this.canvasManager.canvas;
    const objs = canvas.getObjects().slice().reverse();
    const active = canvas.getActiveObject();
    this.layersList.innerHTML = '';
    if (!objs.length) {
      const empty = document.createElement('div');
      empty.className = 'item item-empty';
      empty.textContent = 'Canvas is empty';
      this.layersList.appendChild(empty);
      return;
    }
    for (const obj of objs) {
      const div = document.createElement('div');
      div.className = 'layer-item' + (obj === active ? ' active' : '');
      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = this.layerLabel(obj);
      div.appendChild(name);
      div.addEventListener('click', () => {
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
        this.renderLayers();
        this.onSelection([obj]);
      });
      this.layersList.appendChild(div);
    }
  }

  addTextLayer() {
    const canvas = this.canvasManager.canvas;
    const lang = this.store.getActiveLang();
    const content = 'New Text';
    const texts = {};
    for (const l of this.store.project.langs) texts[l] = content;
    const t = new fabric.IText(content, {
      left: Math.max(20, Math.round(canvas.getWidth() / 8)),
      top: Math.max(20, Math.round(canvas.getHeight() / 12)),
      fontSize: Number(this.inputFontSize.value) || 36,
      fontFamily: this.inputFontFamily.value || 'Arial',
      fill: this.checkFontFill.checked ? this.inputFontColor.value : 'transparent',
      fontWeight: this.checkFontBold.checked ? 'bold' : 'normal',
      fontStyle: this.checkFontItalic.checked ? 'italic' : 'normal',
      dataId: 'text_' + generateId(),
      texts,
    });
    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.requestRenderAll();
    this.persistComposition();
    this.update();
    this.onSelection([t]);
  }

  applyFontStyle() {
    const obj = this.canvasManager.canvas.getActiveObject();
    if (!obj || !obj.dataId || !String(obj.dataId).startsWith('text_')) return;
    const filled = this.checkFontFill.checked;
    const charSpacing = Math.round((Number(this.inputCharSpacing.value) || 0) * 1000);
    const lineHeight = Number(this.inputLineHeight.value) || 1.16;
    obj.set({
      fontFamily: this.inputFontFamily.value,
      fontSize: Number(this.inputFontSize.value) || 36,
      fill: filled ? this.inputFontColor.value : 'transparent',
      stroke: filled ? '' : this.inputFontColor.value,
      strokeWidth: filled ? 0 : 1,
      fontWeight: this.checkFontBold.checked ? 'bold' : 'normal',
      fontStyle: this.checkFontItalic.checked ? 'italic' : 'normal',
      charSpacing,
      lineHeight,
    });
    obj.dirty = true;
    if (obj.initDimensions) obj.initDimensions();
    this.canvasManager.canvas.requestRenderAll();
    this.persistComposition();
    this.renderLayers();
    this.syncSelectionUI();
  }

  updateSizeChips() {
    const size = Number(this.inputFontSize.value);
    for (const btn of this.fontSizeChips.querySelectorAll('[data-size]')) {
      btn.classList.toggle('active', Number(btn.dataset.size) === size);
    }
  }

  setTextAlign(align) {
    const obj = this.canvasManager.canvas.getActiveObject();
    if (!obj || !obj.dataId || !String(obj.dataId).startsWith('text_')) return;
    const b = obj.getBoundingRect(true, true);
    if (align === 'left') {
      obj.set({ textAlign: 'left', originX: 'left' });
      obj.set('left', b.left);
    } else if (align === 'center') {
      obj.set({ textAlign: 'center', originX: 'center' });
      obj.set('left', b.left + b.width / 2);
    } else {
      obj.set({ textAlign: 'right', originX: 'right' });
      obj.set('left', b.left + b.width);
    }
    obj.setCoords();
    this.canvasManager.canvas.requestRenderAll();
    this.persistComposition();
    this.syncSelectionUI();
    this.updateAlignButtons(obj.textAlign);
  }

  updateAlignButtons(align) {
    this.btnAlignLeft.classList.toggle('active', align !== 'center' && align !== 'right');
    this.btnAlignCenter.classList.toggle('active', align === 'center');
    this.btnAlignRight.classList.toggle('active', align === 'right');
  }

  // ---------- canvas size / background / selection geometry ----------

  syncCanvasSizeUI() {
    const c = this.canvasManager.canvas;
    const w = Math.round(c.getWidth());
    const h = Math.round(c.getHeight());
    const text = `${w} × ${h}`;
    if (this.canvasSizeLabel) this.canvasSizeLabel.textContent = `${text} px`;
    if (this.canvasSizeText) this.canvasSizeText.textContent = text;
    if (this.canvasZoomText) this.canvasZoomText.textContent = Math.round(this.canvasManager.zoom * 100) + '%';
    if (document.activeElement !== this.inputCanvasW) this.inputCanvasW.value = w;
    if (document.activeElement !== this.inputCanvasH) this.inputCanvasH.value = h;
  }

  applyCanvasSize(source = 'w') {
    const c = this.canvasManager.canvas;
    const curW = c.getWidth();
    const curH = c.getHeight();
    let w = parseInt(this.inputCanvasW.value, 10);
    let h = parseInt(this.inputCanvasH.value, 10);
    if (!Number.isFinite(w) || w < 16) w = Math.round(curW);
    if (!Number.isFinite(h) || h < 16) h = Math.round(curH);
    if (this.ratioLocked && curW > 0 && curH > 0) {
      const ratio = curW / curH;
      if (source === 'w') h = Math.max(16, Math.round(w / ratio));
      else w = Math.max(16, Math.round(h * ratio));
    }
    c.setWidth(w);
    c.setHeight(h);
    this.canvasManager.applyZoom(this.canvasManager.zoom);
    c.requestRenderAll();
    this.persistComposition();
    this.syncCanvasSizeUI();
    this.flash(`Canvas size: ${w} × ${h}`);
  }

  applyBackground() {
    const transparent = this.checkBgTransparent.checked;
    const color = this.inputBgColor.value;
    this.canvasManager.canvas.backgroundColor = transparent ? null : color;
    this.canvasManager.canvas.requestRenderAll();
    if (this.canvasContainer) this.canvasContainer.classList.toggle('checker', transparent);
    this.store.updateProject({ bgColor: color, bgTransparent: transparent });
    this.flash(transparent ? 'Transparent background' : `Background ${color}`);
  }

  syncBackgroundUI() {
    const p = this.store.project;
    const transparent = Boolean(p.bgTransparent);
    const color = p.bgColor || '#1a1a1f';
    const desired = transparent ? null : color;
    const c = this.canvasManager.canvas;
    if (c.backgroundColor !== desired) {
      c.backgroundColor = desired;
      c.requestRenderAll();
    }
    if (document.activeElement !== this.inputBgColor) this.inputBgColor.value = color;
    this.checkBgTransparent.checked = transparent;
    if (this.canvasContainer) this.canvasContainer.classList.toggle('checker', transparent);
  }

  syncSelectionUI() {
    const obj = this.canvasManager.canvas.getActiveObject();
    const enabled = Boolean(obj);
    for (const el of [this.inputSelX, this.inputSelY, this.inputSelW, this.inputSelH, this.btnAlignH, this.btnAlignV]) {
      el.disabled = !enabled;
    }
    if (!obj) return;
    const b = obj.getBoundingRect(true, true);
    if (document.activeElement !== this.inputSelX) this.inputSelX.value = Math.round(b.left);
    if (document.activeElement !== this.inputSelY) this.inputSelY.value = Math.round(b.top);
    if (document.activeElement !== this.inputSelW) this.inputSelW.value = Math.round(obj.getScaledWidth());
    if (document.activeElement !== this.inputSelH) this.inputSelH.value = Math.round(obj.getScaledHeight());
  }

  applySelectionField(field) {
    const obj = this.canvasManager.canvas.getActiveObject();
    if (!obj) return;
    const val = Number(field === 'x' ? this.inputSelX.value
      : field === 'y' ? this.inputSelY.value
        : field === 'w' ? this.inputSelW.value
          : this.inputSelH.value);
    if (!Number.isFinite(val)) return;
    const b = obj.getBoundingRect(true, true);
    if (field === 'x') {
      obj.set('left', obj.left + (val - b.left));
    } else if (field === 'y') {
      obj.set('top', obj.top + (val - b.top));
    } else if (field === 'w') {
      const sw = obj.getScaledWidth();
      if (sw > 0 && val > 1) obj.set('scaleX', obj.scaleX * (val / sw));
    } else {
      const sh = obj.getScaledHeight();
      if (sh > 0 && val > 1) obj.set('scaleY', obj.scaleY * (val / sh));
    }
    obj.setCoords();
    this.canvasManager.canvas.requestRenderAll();
    this.persistComposition();
    this.syncSelectionUI();
    this.renderLayers();
  }

  centerSelection(axis) {
    const obj = this.canvasManager.canvas.getActiveObject();
    if (!obj) return;
    const c = this.canvasManager.canvas;
    const b = obj.getBoundingRect(true, true);
    if (axis === 'h') {
      obj.set('left', obj.left + ((c.getWidth() - b.width) / 2 - b.left));
    } else {
      obj.set('top', obj.top + ((c.getHeight() - b.height) / 2 - b.top));
    }
    obj.setCoords();
    c.requestRenderAll();
    this.persistComposition();
    this.syncSelectionUI();
  }

  // ---------- fonts ----------

  populateFonts() {
    const sel = this.inputFontFamily;
    sel.innerHTML = '';
    for (const group of FONT_FAMILIES) {
      const og = document.createElement('optgroup');
      og.label = group.group;
      for (const fam of group.fonts) {
        const opt = document.createElement('option');
        opt.value = fam;
        opt.textContent = fam;
        opt.style.fontFamily = `'${fam}'`;
        og.appendChild(opt);
      }
      sel.appendChild(og);
    }
    sel.value = 'Arial';
  }

  async ensureFont(family) {
    if (!family || !document.fonts || !document.fonts.load) return;
    const isBundled = FONT_FAMILIES.some(g => g.fonts.includes(family) && g.group !== 'System');
    if (!isBundled) return;
    try {
      await Promise.all([
        document.fonts.load(`400 32px "${family}"`),
        document.fonts.load(`700 32px "${family}"`),
      ]);
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font load failed:', family, e);
    }
    for (const o of this.canvasManager.getTextObjects()) {
      o.dirty = true;
      if (o.initDimensions) o.initDimensions();
    }
    this.canvasManager.canvas.requestRenderAll();
    this.syncSelectionUI();
  }

  // ---------- download ----------

  pngName() {
    const item = this.store.getActiveItem();
    const hasText = item && ((item.textLayers && item.textLayers.length) || (item.texts && Object.keys(item.texts).length));
    return buildFilename({
      deviceName: item?.device?.name || 'screenshot',
      appName: this.store.project.appName,
      projectName: this.store.project.projectName,
      lang: hasText ? this.store.getActiveLang() : null,
    });
  }

  async downloadCurrentPng() {
    try {
      const dataUrl = this.canvasManager.toDataURL('png');
      const blob = await (await fetch(dataUrl)).blob();
      window.saveAs(blob, this.pngName());
      this.flash('PNG downloaded');
    } catch (err) {
      console.error(err);
      this.flash('Download failed: ' + err.message, true);
    }
  }

  onSelection(objects) {
    const obj = objects && objects.length === 1 ? objects[0] : null;
    const isText = Boolean(obj && obj.dataId && String(obj.dataId).startsWith('text_'));
    const isScreen = Boolean(obj && obj.dataId === 'screen');

    for (const el of [this.inputFontFamily, this.inputFontSize, this.inputFontColor, this.checkFontFill, this.checkFontBold, this.checkFontItalic]) {
      el.disabled = !isText;
    }
    if (isText) {
      this.inputFontFamily.value = obj.fontFamily || 'Arial';
      if (FONT_FAMILIES.some(g => g.group !== 'System' && g.fonts.includes(obj.fontFamily))) {
        this.ensureFont(obj.fontFamily);
      }
      this.inputFontSize.value = Math.round(obj.fontSize) || 36;
      const color = typeof obj.fill === 'string' && obj.fill.startsWith('#') ? obj.fill : '#ffffff';
      this.inputFontColor.value = color;
      this.checkFontFill.checked = !obj.stroke;
      this.checkFontBold.checked = obj.fontWeight === 'bold';
      this.checkFontItalic.checked = obj.fontStyle === 'italic';
      this.inputCharSpacing.value = (obj.charSpacing || 0) / 1000;
      this.inputLineHeight.value = obj.lineHeight || 1.16;
      this.updateSizeChips();
      this.updateAlignButtons(obj.textAlign);
    }

    const hasObj = Boolean(obj);
    for (const el of [this.btnLayerUp, this.btnLayerDown, this.btnLayerFront, this.btnLayerBack]) {
      el.disabled = !hasObj;
    }
    this.btnRemoveLayer.disabled = !hasObj || isScreen;
    this.syncSelectionUI();
    this.renderLayers();
  }

  persistComposition() {
    const item = this.store.getActiveItem();
    if (!item || this.canvasManager.loading) return;
    const lang = this.store.getActiveLang();
    const layers = [];
    for (const o of this.canvasManager.getTextObjects()) {
      if (!o.texts) o.texts = {};
      if (lang && o.text != null) o.texts[lang] = o.text;
      layers.push({
        id: o.dataId,
        texts: { ...o.texts },
        left: o.left,
        top: o.top,
        angle: o.angle || 0,
        fontSize: o.fontSize,
        fontFamily: o.fontFamily,
        fontWeight: o.fontWeight,
        fontStyle: o.fontStyle,
        textAlign: o.textAlign,
        charSpacing: o.charSpacing,
        lineHeight: o.lineHeight,
        fill: o.fill,
        stroke: o.stroke,
        strokeWidth: o.strokeWidth,
        scaleX: o.scaleX ?? 1,
        scaleY: o.scaleY ?? 1,
        originX: o.originX,
        originY: o.originY,
      });
    }
    item.textLayers = layers;
    item.texts = {};
    if (layers[0]) {
      for (const [l, val] of Object.entries(layers[0].texts)) {
        this.textManager.setText(item, l, val);
      }
    }
    const screen = this.canvasManager.findScreen();
    const frameObj = this.canvasManager.findFrame();
    item.screenLayout = screen
      ? { left: screen.left, top: screen.top, scaleX: screen.scaleX, scaleY: screen.scaleY }
      : null;
    item.frameLayout = frameObj
      ? { left: frameObj.left, top: frameObj.top, scaleX: frameObj.scaleX, scaleY: frameObj.scaleY }
      : null;
    item.canvasSize = {
      w: this.canvasManager.canvas.getWidth(),
      h: this.canvasManager.canvas.getHeight(),
    };
    this.store.saveToSession();
  }

  // ---------- languages ----------

  addLanguage() {
    const code = (this.inputNewLang.value || '').trim();
    if (!code) return;
    const before = this.store.project.langs.length;
    this.store.addLang(code);
    this.inputNewLang.value = '';
    if (this.store.project.langs.length === before) {
      this.flash('Language already exists', true);
      return;
    }
    this.renderLanguages();
    this.persistComposition();
    this.flash(`Language ${code.toUpperCase()} added`);
  }

  removeLanguage(lang) {
    if (this.store.project.langs.length <= 1) {
      this.flash('At least one language is required', true);
      return;
    }
    this.store.removeLang(lang);
    if (this.store.getActiveLang() === lang) {
      this.store.setActiveLang(this.store.project.langs[0]);
      this.canvasManager.applyLang(this.store.getActiveLang());
    }
    this.renderLanguages();
    this.persistComposition();
  }

  renderLanguages() {
    const langs = this.store.project.langs;
    const active = this.store.getActiveLang();
    this.langsList.innerHTML = '';
    for (const lang of langs) {
      const div = document.createElement('div');
      div.className = 'item item-row' + (lang === active ? ' active' : '');
      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = lang;
      div.appendChild(name);
      const btn = document.createElement('button');
      btn.dataset.langRemove = lang;
      btn.style.cssText = 'padding: 0 6px; font-size: 11px;';
      btn.textContent = '×';
      btn.title = 'Remove language';
      div.appendChild(btn);
      this.langsList.appendChild(div);
    }
    this.selectActiveLang.innerHTML = '';
    for (const lang of langs) {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.textContent = lang;
      this.selectActiveLang.appendChild(opt);
    }
    this.selectActiveLang.value = active;
    if (this.selectActiveLang.value !== active && langs.length) {
      this.selectActiveLang.value = langs[0];
    }
  }

  // ---------- glossary ----------

  addPreserveTerm() {
    const term = (this.inputPreserveTerm.value || '').trim();
    if (!term) return;
    const before = this.store.glossary.preserve.length;
    this.store.addPreserveTerm(term);
    this.inputPreserveTerm.value = '';
    if (this.store.glossary.preserve.length === before) {
      this.flash('Term already exists', true);
      return;
    }
    this.renderGlossary();
  }

  renderGlossary() {
    const terms = this.store.glossary.preserve;
    this.preserveList.innerHTML = '';
    if (!terms.length) {
      const empty = document.createElement('div');
      empty.className = 'item item-empty';
      empty.textContent = 'No terms yet';
      this.preserveList.appendChild(empty);
      return;
    }
    for (const term of terms) {
      const div = document.createElement('div');
      div.className = 'item item-row';
      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = term;
      div.appendChild(name);
      const btn = document.createElement('button');
      btn.dataset.termRemove = term;
      btn.style.cssText = 'padding: 0 6px; font-size: 11px;';
      btn.textContent = '×';
      btn.title = 'Remove term';
      div.appendChild(btn);
      this.preserveList.appendChild(div);
    }
  }

  // ---------- translation ----------

  async onTranslate() {
    if (!this.translateManager.isOnline()) {
      this.flash('Offline — translation needs internet', true);
      return;
    }
    const source = this.store.project.langs[0] || 'EN';
    const targets = this.store.project.langs.filter(l => l !== source);
    if (!targets.length) {
      this.flash(`Add a target language besides ${source} first`, true);
      return;
    }
    const layers = this.canvasManager.getTextObjects();
    if (!layers.length) {
      this.flash('Add a text layer first', true);
      return;
    }

    const rows = [];
    this.flash('Translating…');
    for (const layer of layers) {
      const srcText = ((layer.texts && layer.texts[source]) || layer.text || '').trim();
      if (!srcText) continue;
      for (const target of targets) {
        let result = '';
        let error = false;
        try {
          const raw = await this.translateManager.translateText(srcText, source.toLowerCase(), target.toLowerCase());
          result = this.translateManager.applyGlossary(raw);
        } catch (e) {
          console.error('Translate failed:', e);
          error = true;
        }
        rows.push({ layer, source, target, srcText, result, error });
      }
    }
    if (!rows.length) {
      this.flash('Nothing to translate — text is empty', true);
      return;
    }

    this.pendingTranslations = rows;
    this.translateSourceLang.textContent = source;
    this.translateTableBody.innerHTML = '';
    for (const row of rows) {
      const tr = document.createElement('tr');
      const tdLayer = document.createElement('td');
      tdLayer.textContent = this.layerLabel(row.layer);
      const tdLang = document.createElement('td');
      tdLang.textContent = row.target;
      const tdSrc = document.createElement('td');
      tdSrc.textContent = row.srcText;
      const tdRes = document.createElement('td');
      const ta = document.createElement('textarea');
      ta.value = row.result;
      if (row.error) ta.placeholder = 'Translation failed — type manually';
      tdRes.appendChild(ta);
      row.el = ta;
      tr.append(tdLayer, tdLang, tdSrc, tdRes);
      this.translateTableBody.appendChild(tr);
    }
    this.modalTranslate.classList.add('active');
  }

  applyTranslations() {
    if (!this.pendingTranslations) return;
    const lang = this.store.getActiveLang();
    for (const row of this.pendingTranslations) {
      const value = row.el ? row.el.value : row.result;
      if (!row.layer.texts) row.layer.texts = {};
      row.layer.texts[row.target] = value;
      if (lang === row.target) {
        row.layer.set('text', value);
        row.layer.dirty = true;
      }
    }
    this.canvasManager.canvas.requestRenderAll();
    this.closeTranslateModal();
    this.persistComposition();
    this.renderLayers();
    this.flash('Translations applied');
  }

  closeTranslateModal() {
    this.modalTranslate.classList.remove('active');
    this.pendingTranslations = null;
    this.translateTableBody.innerHTML = '';
  }

  // ---------- status / update ----------

  updateStatus() {
    const online = navigator.onLine;
    this.statusDot.className = 'status-dot ' + (online ? 'online' : 'offline');
    this.statusText.textContent = online ? 'Online' : 'Offline';
    this.statusProject.style.color = '';
    this.statusProject.textContent =
      this.store.project.projectName || this.store.project.appName || 'No project';
  }

  update() {
    this.renderItems();
    this.renderFrames();
    this.renderCustomFrames();
    this.renderPresets();
    this.renderLanguages();
    this.renderGlossary();
    this.renderLayers();

    const item = this.store.getActiveItem();
    this.activeItemName.textContent = item ? (item.name || 'Screenshot') : 'None';
    this.btnExportSelected.disabled = !item;
    this.btnExportAll.disabled = !this.store.project.items.length;
    this.btnExportZip.disabled = !this.store.project.items.length;
    this.btnDownloadPng.disabled = this.canvasManager.canvas.getObjects().length === 0;
    this.inputAppName.value = this.store.project.appName || '';
    this.inputProjectName.value = this.store.project.projectName || '';
    this.syncBackgroundUI();
    this.syncCanvasSizeUI();
    this.syncSelectionUI();

    const activeObj = this.canvasManager.canvas.getActiveObject();
    const isText = Boolean(activeObj && activeObj.dataId && String(activeObj.dataId).startsWith('text_'));
    for (const el of [this.inputFontFamily, this.inputFontSize, this.inputFontColor, this.checkFontFill, this.checkFontBold, this.checkFontItalic]) {
      el.disabled = !isText;
    }
    const hasObj = Boolean(activeObj);
    for (const el of [this.btnLayerUp, this.btnLayerDown, this.btnLayerFront, this.btnLayerBack]) {
      el.disabled = !hasObj;
    }
    this.btnRemoveLayer.disabled = !hasObj || activeObj.dataId === 'screen';
    this.zoomLabel.textContent = Math.round(this.canvasManager.zoom * 100) + '%';
  }
}
