import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // vitest 4 n'hérite pas `pool` et `testTimeout` de la racine vers `test.projects` :
    // ils sont donc posés dans chaque projet.
    projects: [
      {
        test: {
          name: 'node',
          include: ['tests/{domain,data,scripts}/**/*.{test,spec}.{mjs,ts}'],
          environment: 'node',
          pool: 'threads',
        },
      },
      {
        test: {
          name: 'jsdom',
          include: ['tests/ui/**/*.{test,spec}.{ts,tsx}'],
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
      },
    },
  },
});
