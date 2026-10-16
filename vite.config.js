import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync } from 'node:fs';

export default defineConfig({
  plugins: [
    {
      name: 'copy-vendor',
      closeBundle() {
        mkdirSync('dist/vendor', { recursive: true });
        for (const f of ['fabric.min.js', 'jszip.min.js', 'FileSaver.min.js']) {
          copyFileSync(`vendor/${f}`, `dist/vendor/${f}`);
        }
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      external: [],
    },
  },
  resolve: {
    alias: {},
  },
});
