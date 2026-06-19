import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        v3k: resolve(import.meta.dirname, 'v3k.html'),
        v3l: resolve(import.meta.dirname, 'v3l.html'),
      },
    },
  },
});
