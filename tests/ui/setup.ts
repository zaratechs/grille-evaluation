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

// jsdom n'implémente pas l'ouverture des `<dialog>` : imitation minimale (attribut `open`,
// événement `close`). Le piégeage du focus est vérifié dans un vrai navigateur (tests e2e).
const dialogue = globalThis.HTMLDialogElement?.prototype;
if (dialogue && !('showModal' in dialogue && typeof dialogue.showModal === 'function')) {
  dialogue.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  dialogue.close = function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});
