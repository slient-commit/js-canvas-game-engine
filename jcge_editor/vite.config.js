import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    fs: {
      // Allow serving files from the parent repo (engine source)
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer')
    }
  },
  test: {
    environment: 'node'
  }
});
