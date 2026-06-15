import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/upm-ultras/',
  plugins: [tailwindcss()],
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        panel: resolve(__dirname, 'panel/index.html'),
      },
    },
  },
});
