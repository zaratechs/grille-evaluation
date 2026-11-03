import { describe, it, expect } from 'vitest';
import { dateEnLettres } from '../../src/textes/dates';

// Les tests tournent à l'heure du Québec (vitest.config.ts).
describe('dateEnLettres', () => {
  it('jour, mois en lettres et année', () => {
    expect(dateEnLettres(new Date(2026, 10, 2, 10))).toBe('2 novembre 2026');
    expect(dateEnLettres(new Date(2027, 0, 31))).toBe('31 janvier 2027');
    expect(dateEnLettres(new Date(2026, 7, 15))).toBe('15 août 2026');
  });

  it('le premier du mois s’écrit « 1er »', () => {
    expect(dateEnLettres(new Date(2026, 11, 1))).toBe('1er décembre 2026');
  });

  it('à l’heure locale : le soir au Québec reste le même jour, même si UTC a changé', () => {
    expect(dateEnLettres(new Date('2026-11-03T01:30:00Z'))).toBe('2 novembre 2026');
  });
});
