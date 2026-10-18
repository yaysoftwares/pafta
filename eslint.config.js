import js from '@eslint/js';

// Tarayıcı ortamındaki js/ dosyaları için globaller.
// fabric, JSZip, saveAs vendor/ üzerinden (<script>) global olarak yüklenir.
const browserGlobals = {
  window: true, document: true, navigator: true, location: true, history: true,
  localStorage: true, sessionStorage: true, console: true,
  Image: true, FileReader: true, Blob: true, File: true, URL: true,
  URLSearchParams: true, FormData: true, Event: true, CustomEvent: true,
  MouseEvent: true, KeyboardEvent: true, WheelEvent: true,
  ResizeObserver: true, MutationObserver: true,
  setTimeout: true, clearTimeout: true, setInterval: true, clearInterval: true,
  requestAnimationFrame: true, cancelAnimationFrame: true,
  confirm: true, alert: true, prompt: true,
  fetch: true, Headers: true, Request: true, Response: true,
  atob: true, btoa: true, DOMParser: true,
  Promise: true, Map: true, Set: true, ArrayBuffer: true, DataView: true,
  TextEncoder: true, TextDecoder: true, AbortController: true, AbortSignal: true,
  structuredClone: true,
  fabric: true, JSZip: true, saveAs: true,
};

// Node ortamındaki test ve yapılandırma dosyaları için globaller.
const nodeGlobals = {
  process: true, Buffer: true, console: true,
  setTimeout: true, clearTimeout: true, setInterval: true, clearInterval: true,
  setImmediate: true, clearImmediate: true,
  require: true, module: true, exports: true,
  __dirname: true, __filename: true, global: true,
};

const domGlobals = {
  window: true, document: true, sessionStorage: true, localStorage: true,
};

export default [
  js.configs.recommended,
  {
    ignores: ['vendor/**', 'dist/**', 'fonts/**', 'node_modules/**'],
  },
  {
    files: ['tests/**/*.js', '*.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...nodeGlobals, ...domGlobals },
    },
  },
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: browserGlobals,
    },
  },
];
