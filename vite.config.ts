import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['replicad-opencascadejs'],
  },
  build: {
    target: 'esnext',
    reportCompressedSize: false,
    chunkSizeWarningLimit: 3000,
    cssMinify: 'esbuild',
    minify: 'esbuild',
  },
});
