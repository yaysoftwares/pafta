import { generateId } from './utils.js';
import { APP_VERSION, DEFAULT_LANGS, COMMON_PRESERVE_TERMS } from './constants.js';
import { IdbAdapter, STORAGE_KEY } from './storage.js';

export class Store {
  constructor({ adapter = new IdbAdapter() } = {}) {
    this.adapter = adapter;
    this.onChange = null; // optional hook, e.g. history manager
    this.onPersistError = null; // (err) => void, e.g. UI flash
    this._writeChain = null; // son yazmayı beklemek için Promise zinciri
    this.reset();
  }

  reset() {
    this.activeLang = null;
    this.project = {
      id: generateId(),
      appName: '',
      projectName: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      langs: [...DEFAULT_LANGS],
      items: [],
      activeItemId: null,
    };
    this.glossary = {
      preserve: [...COMMON_PRESERVE_TERMS],
      translateMap: [],
    };
    this.customFrames = [];
  }

  /** Kayıtlı proje durumunu adapter'dan okur. IDB boşsa eski sessionStorage
   *  verisini tek seferlik göç eder. Hata boş projeyle devam etmeye yol açar. */
  async hydrate() {
    try {
      const raw = await this.adapter.get(STORAGE_KEY);
      if (!raw) {
        await this.migrateFromSession();
        return;
      }
      const data = JSON.parse(raw);
      if (data.project) this.project = data.project;
      if (data.glossary) this.glossary = data.glossary;
      if (data.customFrames) this.customFrames = data.customFrames;
      if (data.activeLang !== undefined) this.activeLang = data.activeLang;
    } catch (e) {
      console.error('Failed to hydrate store:', e);
    }
  }

  /** Eski sessionStorage anahtarını okur, varsa belleğe yükler ve IndexedDB'ye yazar.
   *  Göç sadece bir kez gerçekleşir: sonraki öbür açışta IDB zaten dolu. */
  async migrateFromSession() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      if (!data) return false;
      const parsed = JSON.parse(data);
      if (parsed.project) this.project = parsed.project;
      if (parsed.glossary) this.glossary = parsed.glossary;
      if (parsed.customFrames) this.customFrames = parsed.customFrames;
      if (parsed.activeLang !== undefined) this.activeLang = parsed.activeLang;
      await this.persist();
      return true;
    } catch (e) {
      console.error('Failed to migrate sessionStorage:', e);
      return false;
    }
  }

  /** Aynı payload, artık asenkrondan adapter üzerinden yazılır. Yazmalar
   *  sıralı zincirlenir; hata oluştuysa onPersistError kancası yüzeye çıkarır. */
  persist() {
    const payload = JSON.stringify({
      project: this.project,
      glossary: this.glossary,
      customFrames: this.customFrames,
      activeLang: this.activeLang || null,
    });
    this._writeChain = (this._writeChain || Promise.resolve()).then(() =>
      this.adapter.set(STORAGE_KEY, payload)
    ).catch((e) => {
      if (typeof this.onPersistError === 'function') this.onPersistError(e);
    });
    if (typeof this.onChange === 'function') this.onChange();
    return this._writeChain;
  }

  /** Son persist çağrısının bitmesini bekler (testlerde yük sonrası okuma için). */
  whenPersisted() {
    return this._writeChain || Promise.resolve();
  }

  updateProject(updates) {
    Object.assign(this.project, updates);
    this.project.updatedAt = new Date().toISOString();
    this.persist();
  }

  addItem(item) {
    this.project.items.push(item);
    this.project.activeItemId = item.id;
    this.persist();
  }

  updateItem(id, updates) {
    const item = this.project.items.find(i => i.id === id);
    if (item) {
      Object.assign(item, updates);
      this.project.updatedAt = new Date().toISOString();
      this.persist();
    }
  }

  removeItem(id) {
    this.project.items = this.project.items.filter(i => i.id !== id);
    if (this.project.activeItemId === id) {
      this.project.activeItemId = this.project.items[0]?.id || null;
    }
    this.persist();
  }

  getActiveItem() {
    return this.project.items.find(i => i.id === this.project.activeItemId) || null;
  }

  addLang(lang) {
    const code = lang.toUpperCase().trim();
    if (code && !this.project.langs.includes(code)) {
      this.project.langs.push(code);
      this.persist();
    }
  }

  removeLang(lang) {
    this.project.langs = this.project.langs.filter(l => l !== lang);
    this.persist();
  }

  setActiveLang(lang) {
    if (this.project.langs.includes(lang)) {
      this.activeLang = lang;
      this.persist();
    }
  }

  getActiveLang() {
    return this.activeLang || this.project.langs[0] || 'EN';
  }

  addPreserveTerm(term) {
    const t = term.trim();
    if (t && !this.glossary.preserve.includes(t)) {
      this.glossary.preserve.push(t);
      this.persist();
    }
  }

  removePreserveTerm(term) {
    this.glossary.preserve = this.glossary.preserve.filter(t => t !== term);
    this.persist();
  }

  addTranslateMap(from, to) {
    this.glossary.translateMap.push({ from: from.trim(), to: to.trim() });
    this.persist();
  }

  exportState() {
    return {
      version: APP_VERSION,
      createdAt: this.project.createdAt,
      updatedAt: this.project.updatedAt,
      project: this.project,
      glossary: this.glossary,
    };
  }

  importState(data) {
    if (data.project) {
      this.project = { ...this.project, ...data.project };
    }
    if (data.glossary) {
      this.glossary = { ...this.glossary, ...data.glossary };
    }
    this.persist();
  }
}
