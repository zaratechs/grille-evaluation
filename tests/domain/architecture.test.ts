import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DOMAINE = resolve(import.meta.dirname, '../../src/domain');

/** Le domaine reste pur : ni React, ni navigateur, ni interface. */
const IMPORTS_INTERDITS =
  /(?:from\s+|import\s*\(\s*)['"](react|react-dom|react-router)(?:\/[^'"]*)?['"]|['"][^'"]*\bui\/[^'"]*['"]/;
const GLOBAUX_INTERDITS = /\b(window|document|localStorage|sessionStorage|navigator)\b/;

const sansCommentaires = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

/** Renvoie les règles enfreintes par un fichier source. */
export function violations(source: string): string[] {
  const code = sansCommentaires(source);
  const trouvees: string[] = [];
  if (IMPORTS_INTERDITS.test(code)) trouvees.push('import interdit');
  if (GLOBAUX_INTERDITS.test(code)) trouvees.push('global du navigateur');
  return trouvees;
}

const fichiersDuDomaine = (): string[] =>
  existsSync(DOMAINE)
    ? readdirSync(DOMAINE, { recursive: true, encoding: 'utf8' })
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => join(DOMAINE, f))
    : [];

describe('détecteur de violations', () => {
  it.each([
    "import { useState } from 'react';",
    "import { createRoot } from 'react-dom/client';",
    "import { Link } from 'react-router';",
    "import { Footer } from '../ui/layout';",
    "const m = await import('react');",
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

describe('src/domain', () => {
  it('existe et contient des modules', () => {
    expect(fichiersDuDomaine().length).toBeGreaterThan(0);
  });

  it.each(fichiersDuDomaine())('%s reste pur', (fichier) => {
    expect(violations(readFileSync(fichier, 'utf8'))).toEqual([]);
  });
});
