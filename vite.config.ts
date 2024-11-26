import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  build: {
    copyPublicDir: true,
    emptyOutDir: true,
    outDir: '../dist',
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    cssMinify: true,
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'src/options.html'),
        popup: resolve(__dirname, 'src/popup.html'),
      },
      output: {
        manualChunks: undefined,
        compact: true,
      },
    },
  },
});
