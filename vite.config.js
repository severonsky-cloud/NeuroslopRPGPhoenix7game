import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    // Avoid postcss-load-config walking package.json on Windows PowerShell encodings.
    // The project currently uses plain inline CSS in HTML launchers and does not need a PostCSS pipeline.
    postcss: {
      plugins: [],
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        v3k: resolve(import.meta.dirname, 'v3k.html'),
        v3l: resolve(import.meta.dirname, 'v3l.html'),
        act1: resolve(import.meta.dirname, 'act1.html'),
        v3p2_ww2_live: resolve(import.meta.dirname, 'v3p2_ww2_live.html'),
        vehicle_lab: resolve(import.meta.dirname, 'vehicle_lab.html'),
      },
    },
  },
});
