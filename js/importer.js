export class Importer {
  constructor(store) {
    this.store = store;
  }

  async importZip(file) {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);
    
    if (content.file('state.json')) {
      const stateText = await content.file('state.json').async('text');
      const state = JSON.parse(stateText);
      this.store.importState(state);
    }
    
    if (content.file('glossary.json')) {
      const glossaryText = await content.file('glossary.json').async('text');
      const glossary = JSON.parse(glossaryText);
      this.store.glossary = glossary;
      this.store.saveToSession();
    }
    
    return true;
  }
}