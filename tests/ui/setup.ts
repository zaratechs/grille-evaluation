import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 25+ définit son propre `localStorage` global, inutilisable sans `--localstorage-file`
// (il vaut alors undefined) et qui masque celui de jsdom. On remet celui de jsdom.
// Sans effet sous Node 20-24, où jsdom fournit déjà le sien.
const jsdom = (globalThis as { jsdom?: { window: Window } }).jsdom;
for (const nom of ['localStorage', 'sessionStorage'] as const) {
  if (jsdom && globalThis[nom] === undefined) {
    Object.defineProperty(globalThis, nom, {
      value: jsdom.window[nom],
      configurable: true,
      writable: true,
    });
  }
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});
