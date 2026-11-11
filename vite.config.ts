import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: false,
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: '',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        entryFileNames: 'game.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      }
    }
  }
});
