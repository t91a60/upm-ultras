import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/upm-ultras/',
  plugins: [tailwindcss()],
  build: {
    target: 'es2020',
  },
});
