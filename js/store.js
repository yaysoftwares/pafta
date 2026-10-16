import { generateId } from './utils.js';
import { APP_VERSION, DEFAULT_LANGS, COMMON_PRESERVE_TERMS } from './constants.js';

export class Store {
  constructor() {
    this.reset();
    this.loadFromSession();
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

  loadFromSession() {
    try {
      const data = sessionStorage.getItem('screenshot-framer-store');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.project) this.project = parsed.project;
        if (parsed.glossary) this.glossary = parsed.glossary;
        if (parsed.customFrames) this.customFrames = parsed.customFrames;
        if (parsed.activeLang) this.activeLang = parsed.activeLang;
      }
    } catch (e) {
      console.warn('Failed to load session:', e);
    }
  }

  saveToSession() {
    try {
      sessionStorage.setItem('screenshot-framer-store', JSON.stringify({
        project: this.project,
        glossary: this.glossary,
        customFrames: this.customFrames,
        activeLang: this.activeLang || null,
      }));
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  }

  updateProject(updates) {
    Object.assign(this.project, updates);
    this.project.updatedAt = new Date().toISOString();
    this.saveToSession();
  }

  addItem(item) {
    this.project.items.push(item);
    this.project.activeItemId = item.id;
    this.saveToSession();
  }

  updateItem(id, updates) {
    const item = this.project.items.find(i => i.id === id);
    if (item) {
      Object.assign(item, updates);
      this.project.updatedAt = new Date().toISOString();
      this.saveToSession();
    }
  }

  removeItem(id) {
    this.project.items = this.project.items.filter(i => i.id !== id);
    if (this.project.activeItemId === id) {
      this.project.activeItemId = this.project.items[0]?.id || null;
    }
    this.saveToSession();
  }

  getActiveItem() {
    return this.project.items.find(i => i.id === this.project.activeItemId) || null;
  }

  addLang(lang) {
    const code = lang.toUpperCase().trim();
    if (code && !this.project.langs.includes(code)) {
      this.project.langs.push(code);
      this.saveToSession();
    }
  }

  removeLang(lang) {
    this.project.langs = this.project.langs.filter(l => l !== lang);
    this.saveToSession();
  }

  setActiveLang(lang) {
    if (this.project.langs.includes(lang)) {
      this.activeLang = lang;
      this.saveToSession();
    }
  }

  getActiveLang() {
    return this.activeLang || this.project.langs[0] || 'EN';
  }

  addPreserveTerm(term) {
    const t = term.trim();
    if (t && !this.glossary.preserve.includes(t)) {
      this.glossary.preserve.push(t);
      this.saveToSession();
    }
  }

  removePreserveTerm(term) {
    this.glossary.preserve = this.glossary.preserve.filter(t => t !== term);
    this.saveToSession();
  }

  addTranslateMap(from, to) {
    this.glossary.translateMap.push({ from: from.trim(), to: to.trim() });
    this.saveToSession();
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
    this.saveToSession();
  }
}