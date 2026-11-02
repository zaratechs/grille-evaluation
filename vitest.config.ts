import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

// Même valeur qu'au build (vite.config.ts) : les tests voient la vraie version.
const define = { __APP_VERSION__: JSON.stringify(pkg.version) };

export default defineConfig({
  define,
  test: {
    // Les projets reprennent la config racine (dont `define`) grâce à `extends: true`.
    // vitest 4 n'hérite pas `pool` et `testTimeout` : ils sont posés dans chaque projet.
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['tests/{domain,data,scripts}/**/*.{test,spec}.{mjs,ts}'],
          environment: 'node',
          pool: 'threads',
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          include: ['tests/{ui,data-access}/**/*.{test,spec}.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['tests/ui/setup.ts'],
          pool: 'threads',
          testTimeout: 15000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: ['src/**/index.ts', 'src/data/**'],
      thresholds: {
        'src/domain/**': { lines: 100, functions: 100, statements: 100, branches: 100 },
        'src/data-access/**': { lines: 100, functions: 100, statements: 100, branches: 100 },
      },
    },
  },
});
