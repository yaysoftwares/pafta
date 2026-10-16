import { Store } from './store.js';
import { CanvasManager } from './canvas.js';
import { FrameManager } from './frames.js';
import { RulerManager } from './rulers.js';
import { TextManager } from './texts.js';
import { TranslateManager } from './translate.js';
import { Exporter } from './exporter.js';
import { Importer } from './importer.js';
import { ProjectManager } from './project.js';
import { HistoryManager } from './history.js';
import { UI } from './ui.js';

class App {
  constructor() {
    window.__app = this;
    this.store = new Store();
    this.frameManager = new FrameManager(this.store);
    this.canvasManager = new CanvasManager(this.store, this.frameManager);
    this.rulerManager = new RulerManager(this.canvasManager, this.store);
    this.textManager = new TextManager(this.store);
    this.translateManager = new TranslateManager(this.store);
    this.exporter = new Exporter(this.store, this.canvasManager);
    this.importer = new Importer(this.store);
    this.projectManager = new ProjectManager(this.store);
    this.history = new HistoryManager(this.store);
    this.store.onChange = () => this.history.schedule();
    this.ui = new UI(
      this.store,
      this.canvasManager,
      this.frameManager,
      this.textManager,
      this.translateManager,
      this.exporter,
      this.projectManager,
      this.importer,
      this.rulerManager,
      this.history
    );
    this.history.init();
    this.history.onApply = () => this.ui.afterHistoryApply();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});