import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: {
    outDir: 'dist',
    // Le rendu PDF (police embarquée comprise, environ 755 Ko) n'est chargé qu'au premier
    // export : il ne pèse pas sur le premier affichage.
    chunkSizeWarningLimit: 800,
  },
});
