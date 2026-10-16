export class TranslateManager {
  constructor(store) {
    this.store = store;
  }

  isOnline() {
    return navigator.onLine;
  }

  applyGlossary(text) {
    let result = text;
    for (const term of this.store.glossary.preserve) {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(regex, term);
    }
    for (const map of this.store.glossary.translateMap) {
      const regex = new RegExp(map.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(regex, map.to);
    }
    return result;
  }

  async translateText(text, source, target) {
    if (!this.isOnline()) throw new Error('Not online');
    if (!text) return text;
    
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodedText}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      throw new Error('Translation failed');
    } catch (e) {
      console.error('Translate error:', e);
      throw e;
    }
  }
}