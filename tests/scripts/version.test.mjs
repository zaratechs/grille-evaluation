import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RACINE = resolve(import.meta.dirname, '../..');
const lire = (f) => readFileSync(resolve(RACINE, f), 'utf8');
const pkg = JSON.parse(lire('package.json'));
const lock = JSON.parse(lire('package-lock.json'));
const lignes = lire('CHANGELOG.md').split(/\r?\n/);
const titres = lignes.filter((l) => l.startsWith('## ')).map((l) => l.slice(3));

describe('Version publiée', () => {
  it('1.0.0, la même dans package.json et package-lock.json', () => {
    expect(pkg.version).toBe('1.0.0');
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages[''].version).toBe(pkg.version);
  });

  it('le CHANGELOG a une section datée pour cette version', () => {
    const titre = titres.find((t) => t.startsWith(`[${pkg.version}] — `));
    expect(titre).toBeDefined();
    expect(titre.slice(`[${pkg.version}] — `.length)).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
  });

  it('« Non publié » reste en tête, vide, juste avant la dernière version', () => {
    expect(titres[0]).toBe('[Non publié]');
    expect(titres[1].startsWith(`[${pkg.version}]`)).toBe(true);
    const debut = lignes.indexOf('## [Non publié]');
    const fin = lignes.findIndex((l, i) => i > debut && l.startsWith('## '));
    expect(
      lignes
        .slice(debut + 1, fin)
        .join('')
        .trim(),
    ).toBe('');
  });
});
