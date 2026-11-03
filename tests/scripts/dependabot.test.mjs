import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FICHIER = resolve(import.meta.dirname, '../..', '.github/dependabot.yml');
const yml = existsSync(FICHIER) ? readFileSync(FICHIER, 'utf8') : '';

/** Les blocs `- package-ecosystem: …` du fichier, chacun avec ses lignes. */
const blocs = () =>
  yml
    .split(/^\s*- package-ecosystem:/m)
    .slice(1)
    .map((b) => ({ ecosysteme: /^\s*"?([\w-]+)"?/.exec(b)?.[1], texte: b }));

describe('Dependabot', () => {
  it('existe, en version 2', () => {
    expect(existsSync(FICHIER)).toBe(true);
    expect(yml).toMatch(/^version: 2\s*$/m);
  });

  it('surveille npm et les actions GitHub', () => {
    expect(blocs().map((b) => b.ecosysteme)).toEqual(['npm', 'github-actions']);
  });

  it('une fois par mois, à la racine du dépôt', () => {
    for (const b of blocs()) {
      expect(b.texte, b.ecosysteme).toMatch(/directory: ['"]?\/['"]?\s*$/m);
      expect(b.texte, b.ecosysteme).toMatch(/interval: ['"]?monthly['"]?\s*$/m);
    }
  });

  it('npm : mineures et correctifs groupés en une seule demande ; majeures une à une', () => {
    const npm = blocs().find((b) => b.ecosysteme === 'npm').texte;
    expect(npm).toMatch(/groups:/);
    expect(npm).toMatch(/update-types:\s*\n\s*- ['"]?minor['"]?\s*\n\s*- ['"]?patch['"]?/);
    expect(npm).not.toMatch(/- ['"]?major['"]?/);
  });
});
