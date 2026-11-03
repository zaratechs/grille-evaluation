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

const npm = () => blocs().find((b) => b.ecosysteme === 'npm').texte;

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

  it('attend 14 jours après la publication d’une version (règle des deux semaines)', () => {
    for (const b of blocs()) {
      expect(b.texte, b.ecosysteme).toMatch(/cooldown:\s*\n\s*default-days: 14\s*$/m);
    }
  });

  it('npm : mineures et correctifs groupés en une seule demande ; majeures une à une', () => {
    expect(npm()).toMatch(/update-types:\s*\n\s*- ['"]?minor['"]?\s*\n\s*- ['"]?patch['"]?/);
    expect(npm()).not.toMatch(/- ['"]?major['"]?/);
  });

  it('vitest et @vitest/* montent ensemble, même en version majeure', () => {
    const groupe = /vitest:\s*\n\s*patterns:\s*\n((?:\s*- .+\n?)+)/.exec(npm());
    expect(groupe).not.toBeNull();
    const motifs = [...groupe[1].matchAll(/- ['"]?([^'"\n]+)['"]?/g)].map((m) => m[1].trim());
    expect(motifs).toEqual(['vitest', '@vitest/*']);
    // Le premier groupe qui correspond l'emporte : celui de vitest passe avant les mineures.
    expect(npm().indexOf('vitest:')).toBeLessThan(npm().indexOf('mineures-et-correctifs:'));
  });

  it('@types/node ne change pas de version majeure seul : il suit le minimum de Node', () => {
    expect(npm()).toMatch(
      /ignore:\s*\n(?:\s*#.*\n)*\s*- dependency-name: ['"]@types\/node['"]\s*\n\s*update-types:\s*\n\s*- ['"]version-update:semver-major['"]/,
    );
  });
});
