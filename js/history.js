// Snapshot-based undo/redo for the whole project state.
//
// To keep snapshots small we strip base64 image data (dataUrl) out of items and
// keep a single id -> dataUrl asset map instead, so each screenshot is held in
// memory once no matter how many history steps exist.

const LIMIT = 60;
const DEBOUNCE_MS = 350;

export class HistoryManager {
  constructor(store) {
    this.store = store;
    this.past = [];
    this.future = [];
    this.current = null;
    this.timer = null;
    this.applying = false;
    this.assets = new Map(); // item.id -> dataUrl
    this.onApply = null;
  }

  init() {
    this.current = this.snap();
  }

  // Called by the store after every persistence (debounced into one step).
  schedule() {
    if (this.applying) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.commit(), DEBOUNCE_MS);
  }

  commit() {
    clearTimeout(this.timer);
    this.timer = null;
    if (this.applying) return;
    const s = this.snap();
    if (s === this.current) return;
    this.past.push(this.current);
    if (this.past.length > LIMIT) this.past.shift();
    this.current = s;
    this.future = [];
  }

  canUndo() {
    return this.past.length > 0 || this.timer != null;
  }

  canRedo() {
    return this.future.length > 0;
  }

  undo() {
    this.commit(); // flush any pending change first
    if (!this.past.length) return false;
    this.future.push(this.current);
    this.current = this.past.pop();
    this.apply(this.current);
    return true;
  }

  redo() {
    this.commit();
    if (!this.future.length) return false;
    this.past.push(this.current);
    this.current = this.future.pop();
    this.apply(this.current);
    return true;
  }

  // ---------- internals ----------

  captureAssets(project) {
    for (const it of (project.items || [])) {
      if (it && it.dataUrl && !this.assets.has(it.id)) this.assets.set(it.id, it.dataUrl);
    }
  }

  snap() {
    const p = this.store.project;
    this.captureAssets(p);
    const light = {
      ...p,
      items: (p.items || []).map(({ dataUrl, ...rest }) => rest),
    };
    return JSON.stringify({
      project: light,
      glossary: this.store.glossary,
      activeLang: this.store.activeLang || null,
    });
  }

  apply(s) {
    this.applying = true;
    try {
      const data = JSON.parse(s);
      const items = (data.project.items || []).map((it) => ({
        ...it,
        dataUrl: this.assets.get(it.id) || it.dataUrl || null,
      }));
      this.store.project = { ...data.project, items };
      this.store.glossary = data.glossary;
      this.store.activeLang = data.activeLang || null;
      this.store.saveToSession();
    } finally {
      this.applying = false;
    }
    if (typeof this.onApply === 'function') this.onApply();
  }
}