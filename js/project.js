import { APP_VERSION } from './constants.js';
import { getTimestamp } from './utils.js';

export class ProjectManager {
  constructor(store) {
    this.store = store;
  }

  newProject() {
    this.store.reset();
    this.store.persist();
  }

  async exportZip() {
    const zip = new JSZip();
    
    const manifest = {
      name: 'screenshot-framer',
      version: APP_VERSION,
      createdAt: new Date().toISOString(),
      appName: this.store.project.appName,
      projectName: this.store.project.projectName,
      langs: this.store.project.langs,
      storeMode: 'both',
      assets: { images: 0, frames: this.store.customFrames.length },
      itemCount: this.store.project.items.length,
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    
    const state = this.store.exportState();
    zip.file('state.json', JSON.stringify(state, null, 2));
    
    zip.file('glossary.json', JSON.stringify(this.store.glossary, null, 2));
    
    if (this.store.project.items.length > 0) {
      const imagesFolder = zip.folder('images');
      this.store.project.items.forEach((item, idx) => {
        if (item.dataUrl) {
          const base64 = item.dataUrl.split(',')[1];
          imagesFolder.file(`item_${idx}.png`, base64, { base64: true });
        }
      });
    }
    
    if (this.store.customFrames.length > 0) {
      const framesFolder = zip.folder('frames');
      this.store.customFrames.forEach((frame, idx) => {
        if (frame.dataUrl) {
          const base64 = frame.dataUrl.split(',')[1];
          framesFolder.file(frame.name || `frame_${idx}.png`, base64, { base64: true });
        }
      });
    }
    
    return zip.generateAsync({ type: 'blob' });
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
      this.store.persist();
    }
    
    return true;
  }
}