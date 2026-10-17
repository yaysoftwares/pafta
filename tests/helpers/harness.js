import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { vi } from 'vitest';
import { UI } from '../../js/ui.js';
import { Store } from '../../js/store.js';

const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const bodyHtml = indexHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? '';

/** Mount the real index.html markup (minus scripts) into the jsdom document. */
export function installDom() {
  document.body.innerHTML = bodyHtml;
}

function makeCanvas(objects = []) {
  return {
    backgroundColor: null,
    getObjects: () => objects,
    getActiveObject: () => null,
    getWidth: () => 900,
    getHeight: () => 1600,
    setWidth: vi.fn(),
    setHeight: vi.fn(),
    requestRenderAll: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    discardActiveObject: vi.fn(),
  };
}

export function makeManagers(objects = []) {
  const canvasManager = {
    canvas: makeCanvas(objects),
    loading: false,
    zoom: 1,
    setCurrentItem: vi.fn(async () => {}),
    zoomFit: vi.fn(),
    applyLang: vi.fn(),
    applyZoom: vi.fn(),
    getTextObjects: () => [],
    findFrame: () => null,
    findScreen: () => null,
    toDataURL: () => 'data:image/png;base64,',
  };

  return {
    canvasManager,
    frameManager: {
      getFrames: () => [],
      getCustomFrames: () => [],
      addCustomFrame: vi.fn(),
      applyFrame: vi.fn(),
      applyCustomFrame: vi.fn(),
      clearFrame: vi.fn(),
    },
    textManager: { setText: vi.fn() },
    translateManager: { isOnline: () => false, translateText: vi.fn(), applyGlossary: vi.fn() },
    exporter: { exportAllZip: vi.fn(), exportSelected: vi.fn() },
    projectManager: { exportZip: vi.fn(), newProject: vi.fn() },
    importer: { importZip: vi.fn() },
    rulerManager: {
      enabled: false,
      guidesEnabled: false,
      highlightCenter: false,
      snapEnabled: false,
      sync: vi.fn(),
      setRulersEnabled: vi.fn(),
      setGuidesEnabled: vi.fn(),
      setSnapEnabled: vi.fn(),
    },
    history: { init: vi.fn(), undo: vi.fn(), redo: vi.fn(), schedule: vi.fn(), onApply: null },
    templateManager: null,
  };
}

export function makeItem(id, name = 'Screenshot', dataUrl = 'data:image/png;base64,AAAA') {
  return { id, name, dataUrl };
}

/** Build a fully wired UI on top of a fresh Store and the real markup. */
export function createUI() {
  installDom();
  sessionStorage.clear();
  const store = new Store();
  const managers = makeManagers();
  const ui = new UI(
    store,
    managers.canvasManager,
    managers.frameManager,
    managers.textManager,
    managers.translateManager,
    managers.exporter,
    managers.projectManager,
    managers.importer,
    managers.rulerManager,
    managers.history,
    managers.templateManager,
  );
  return { ui, store, ...managers };
}
