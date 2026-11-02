import { describe, it, expect } from 'vitest';
import { ok, erreur, type Resultat } from '../../src/domain/resultat';

describe('Resultat', () => {
  it('ok() enveloppe une valeur', () => {
    expect(ok(42)).toEqual({ ok: true, valeur: 42 });
  });

  it('erreur() porte un code stable', () => {
    expect(erreur('nom-vide')).toEqual({ ok: false, erreur: 'nom-vide' });
  });

  it('se distingue par le champ ok', () => {
    const lire = (r: Resultat<number>): string => (r.ok ? `valeur ${r.valeur}` : r.erreur);
    expect(lire(ok(3))).toBe('valeur 3');
    expect(lire(erreur('poids-invalide'))).toBe('poids-invalide');
  });
});
