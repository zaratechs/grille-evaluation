import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { COULEURS, JETONS, hexDocx } from '../../src/export/couleurs';
import { lire, lireTokens } from '../ui/outils/couleurs';

const tokens = lireTokens(lire(resolve(import.meta.dirname, '../../src/ui/tokens.css')));

/** « #0c4a6e » → [12, 74, 110] */
const rvb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

describe('couleurs des documents', () => {
  it.each(Object.keys(COULEURS) as (keyof typeof COULEURS)[])(
    '%s correspond à son jeton de tokens.css',
    (nom) => {
      const jeton = tokens[JETONS[nom]];
      expect(jeton, `jeton --color-${JETONS[nom]} introuvable`).toBeDefined();
      expect([...COULEURS[nom]]).toEqual(rvb(jeton as string));
    },
  );

  it('hexDocx écrit RRGGBB, sans dièse, pour Word', () => {
    expect(hexDocx([12, 74, 110])).toBe('0C4A6E');
    expect(hexDocx([255, 255, 255])).toBe('FFFFFF');
  });
});
