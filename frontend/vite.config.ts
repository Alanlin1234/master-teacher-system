import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      '/photos': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      '/demo_videos': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      '/edu-api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/edu-api/, '')
      }
    }
  }
});
