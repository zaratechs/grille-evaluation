import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  POIDS_TOTAL,
  lirePoids,
  egaliserPoids,
  totalPoids,
  ponderationValide,
} from '../../src/domain/poids';

describe('lirePoids', () => {
  it.each([
    ['25', 250],
    ['16,7', 167],
    ['16.7', 167],
    ['0', 0],
    ['0,5', 5],
    ['100', 1000],
    ['100,0', 1000],
    ['  33,3  ', 333],
  ])('lit « %s » comme %i dixièmes', (texte, attendu) => {
    expect(lirePoids(texte)).toEqual({ ok: true, valeur: attendu });
  });

  it.each(['-1', '100,1', '101', '12,34', 'abc', '', '   ', ',5', '5,', '1e2', '+5', '1 000'])(
    'refuse « %s »',
    (texte) => {
      expect(lirePoids(texte)).toEqual({ ok: false, erreur: 'poids-invalide' });
    },
  );
});

describe('egaliserPoids', () => {
  it('répartit 100 % entre 6 critères sans erreur d’arrondi', () => {
    expect(egaliserPoids(6)).toEqual([167, 167, 167, 167, 166, 166]);
  });

  it('donne 100 % à un critère unique', () => {
    expect(egaliserPoids(1)).toEqual([1000]);
  });

  it('donne une liste vide sans critère', () => {
    expect(egaliserPoids(0)).toEqual([]);
  });

  it('totalise toujours 100 %, avec au plus 0,1 % d’écart entre deux poids', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (n) => {
        const poids = egaliserPoids(n);
        expect(poids).toHaveLength(n);
        expect(poids.reduce((a, b) => a + b, 0)).toBe(POIDS_TOTAL);
        expect(poids.every(Number.isInteger)).toBe(true);
        expect(Math.max(...poids) - Math.min(...poids)).toBeLessThanOrEqual(1);
      }),
    );
  });
});

describe('totalPoids et ponderationValide', () => {
  const avec = (...poids: number[]) => poids.map((p) => ({ poids: p }));

  it('additionne les poids', () => {
    expect(totalPoids(avec(250, 250, 500))).toBe(1000);
    expect(totalPoids([])).toBe(0);
  });

  it('est valide seulement à exactement 100 %', () => {
    expect(ponderationValide(avec(167, 167, 167, 167, 166, 166))).toBe(true);
    expect(ponderationValide(avec(500, 499))).toBe(false);
    expect(ponderationValide(avec(600, 500))).toBe(false);
    expect(ponderationValide([])).toBe(false);
  });
});
