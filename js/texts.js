export class TextManager {
  constructor(store) {
    this.store = store;
  }

  addTextLayer(item, text = 'New Text') {
    if (!item.texts) item.texts = {};
    for (const lang of this.store.project.langs) {
      if (!item.texts[lang]) item.texts[lang] = text;
    }
  }

  setText(item, lang, text) {
    if (!item.texts) item.texts = {};
    item.texts[lang] = text;
  }

  getText(item, lang) {
    if (!item.texts) return '';
    return item.texts[lang] || item.texts[this.store.project.langs[0]] || '';
  }
}