import { buildFilename } from './utils.js';

export class Exporter {
  constructor(store, canvasManager) {
    this.store = store;
    this.canvasManager = canvasManager;
  }

  hasText(item) {
    return Boolean(
      (item.textLayers && item.textLayers.length) ||
      (item.texts && Object.keys(item.texts).length)
    );
  }

  async renderInto(zip, format, item, indexLabel = '') {
    const hasText = this.hasText(item);
    const langs = hasText ? this.store.project.langs : [null];
    const restoreLang = this.store.getActiveLang();
    const deviceName = [indexLabel, item.device?.name || 'Device'].filter(Boolean).join('_');

    for (const lang of langs) {
      if (lang) this.canvasManager.applyLang(lang);
      const dataUrl = this.canvasManager.toDataURL('png');
      const base64 = dataUrl.split(',')[1];
      const filename = buildFilename({
        deviceName,
        appName: this.store.project.appName,
        projectName: this.store.project.projectName,
        lang,
      });
      if (format !== 'googleplay') {
        zip.file(`AppStore/${filename}`, base64, { base64: true });
      }
      if (format !== 'appstore') {
        zip.file(`GooglePlay/${filename}`, base64, { base64: true });
      }
    }
    if (hasText && restoreLang) this.canvasManager.applyLang(restoreLang);
  }

  async exportSelected(format = 'both') {
    const active = this.store.getActiveItem();
    if (!active) {
      throw new Error('No active item');
    }
    const zip = new JSZip();
    await this.renderInto(zip, format, active);
    return zip.generateAsync({ type: 'blob' });
  }

  async exportAllZip(format = 'both') {
    const zip = new JSZip();
    const items = [...this.store.project.items];
    if (!items.length) {
      throw new Error('No screenshots to export');
    }
    const originalId = this.store.project.activeItemId;
    const originalLang = this.store.getActiveLang();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.store.project.activeItemId = item.id;
      await this.canvasManager.setCurrentItem(item);
      await this.renderInto(zip, format, item, String(i + 1).padStart(2, '0'));
    }

    this.store.project.activeItemId = originalId;
    const original = this.store.getActiveItem();
    if (original) {
      await this.canvasManager.setCurrentItem(original);
    }
    if (originalLang) this.canvasManager.applyLang(originalLang);
    this.store.persist();
    return zip.generateAsync({ type: 'blob' });
  }
}
