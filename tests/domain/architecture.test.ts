import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SRC = resolve(import.meta.dirname, '../../src');
const DOMAINE = join(SRC, 'domain');
const DATA_ACCESS = join(SRC, 'data-access');
const APP = resolve(import.meta.dirname, '../../app');

/** Le domaine reste pur : ni React, ni navigateur, ni interface, ni stockage. */
const IMPORTS_INTERDITS =
  /(?:from\s+|import\s*\(\s*)['"](react|react-dom|react-router)(?:\/[^'"]*)?['"]|['"][^'"]*\b(ui|data-access)(?:\/[^'"]*)?['"]/;
const GLOBAUX_INTERDITS = /\b(window|document|localStorage|sessionStorage|navigator)\b/;

/** Seul `src/data-access/` parle au stockage et aux fichiers du navigateur. */
const API_STOCKAGE = /\b(localStorage|sessionStorage|Blob|FileReader|createObjectURL)\b/;

const sansCommentaires = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

export const utiliseLeStockage = (source: string): boolean =>
  API_STOCKAGE.test(sansCommentaires(source));

/** Renvoie les règles enfreintes par un fichier du domaine. */
export function violations(source: string): string[] {
  const code = sansCommentaires(source);
  const trouvees: string[] = [];
  if (IMPORTS_INTERDITS.test(code)) trouvees.push('import interdit');
  if (GLOBAUX_INTERDITS.test(code)) trouvees.push('global du navigateur');
  return trouvees;
}

const fichiersTs = (dossier: string): string[] =>
  existsSync(dossier)
    ? readdirSync(dossier, { recursive: true, encoding: 'utf8' })
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => join(dossier, f))
    : [];

describe('détecteur de violations du domaine', () => {
  it.each([
    "import { useState } from 'react';",
    "import { createRoot } from 'react-dom/client';",
    "import { Link } from 'react-router';",
    "import { Footer } from '../ui/layout';",
    "const m = await import('react');",
    "import { charger } from '../data-access';",
    "import { nouvelId } from '../data-access/id';",
  ])('signale un import interdit : %s', (source) => {
    expect(violations(source)).toContain('import interdit');
  });

  it.each(['window.alert(1);', 'localStorage.getItem("x");', 'document.title = "x";'])(
    'signale un global du navigateur : %s',
    (source) => {
      expect(violations(source)).toContain('global du navigateur');
    },
  );

  it('laisse passer un module pur et les mentions en commentaire', () => {
    const source = [
      "import { ok } from './resultat';",
      '// Ne dépend pas du localStorage ni de React.',
      '/* window est interdit ici */',
      'export const double = (n: number) => n * 2;',
    ].join('\n');
    expect(violations(source)).toEqual([]);
  });
});

describe('détecteur d’accès au stockage du navigateur', () => {
  it.each([
    'localStorage.setItem("k", v);',
    'sessionStorage.clear();',
    'new Blob([texte]);',
    'new FileReader();',
    'URL.createObjectURL(blob);',
  ])('signale : %s', (source) => {
    expect(utiliseLeStockage(source)).toBe(true);
  });

  it('ignore les mentions en commentaire et un module sans accès', () => {
    expect(utiliseLeStockage('// rien dans le localStorage\nexport const x = 1;')).toBe(false);
  });
});

describe('src/domain', () => {
  it('existe et contient des modules', () => {
    expect(fichiersTs(DOMAINE).length).toBeGreaterThan(0);
  });

  it.each(fichiersTs(DOMAINE))('%s reste pur', (fichier) => {
    expect(violations(readFileSync(fichier, 'utf8'))).toEqual([]);
  });
});

describe('src/ hors data-access, et app/', () => {
  const fichiers = [
    ...fichiersTs(SRC).filter((f) => !f.startsWith(DATA_ACCESS)),
    ...fichiersTs(APP),
  ];

  it('inclut l’interface et le point d’entrée', () => {
    expect(fichiers.some((f) => f.includes(join('src', 'ui')))).toBe(true);
    expect(fichiers.some((f) => f.startsWith(APP))).toBe(true);
  });

  it.each(fichiers)('%s ne touche pas au stockage du navigateur', (fichier) => {
    expect(utiliseLeStockage(readFileSync(fichier, 'utf8'))).toBe(false);
  });
});
