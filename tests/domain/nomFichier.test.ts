import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { nomFichier } from '../../src/domain/nomFichier';

const LE_2_NOVEMBRE = new Date(2026, 10, 2, 10, 0);

describe('nomFichier', () => {
  it.each([
    ['Travail de session — Hiver !', 'grille-travail-de-session-hiver-2026-11-02.json'],
    ['Étude de cas : « Élève » à l’oral', 'grille-etude-de-cas-eleve-a-l-oral-2026-11-02.json'],
    ['Cœur et Ægée', 'grille-coeur-et-aegee-2026-11-02.json'],
    ['  --Projet 3/4--  ', 'grille-projet-3-4-2026-11-02.json'],
    ['A\\B:C*D?E"F<G>H|I', 'grille-a-b-c-d-e-f-g-h-i-2026-11-02.json'],
  ])('« %s » → %s', (titre, attendu) => {
    expect(nomFichier(titre, LE_2_NOVEMBRE, 'json')).toBe(attendu);
  });

  it('titre vide ou sans lettre ni chiffre → « grille » et la date', () => {
    expect(nomFichier('', LE_2_NOVEMBRE, 'json')).toBe('grille-2026-11-02.json');
    expect(nomFichier(' — !? ', LE_2_NOVEMBRE, 'json')).toBe('grille-2026-11-02.json');
  });

  it('coupe le titre à 60 caractères, sans tiret final', () => {
    const titre = `${'a'.repeat(59)} ${'b'.repeat(140)}`;
    const nom = nomFichier(titre, LE_2_NOVEMBRE, 'json');
    expect(nom).toBe(`grille-${'a'.repeat(59)}-2026-11-02.json`);
  });

  it('accepte l’extension avec ou sans point', () => {
    expect(nomFichier('Session', LE_2_NOVEMBRE, '.pdf')).toBe('grille-session-2026-11-02.pdf');
    expect(nomFichier('Session', LE_2_NOVEMBRE, 'docx')).toBe('grille-session-2026-11-02.docx');
  });

  it('écrit le mois et le jour sur deux chiffres', () => {
    expect(nomFichier('S', new Date(2027, 0, 5), 'csv')).toBe('grille-s-2027-01-05.csv');
  });
});

describe('date locale (bug de l’outil Scrum de la Trousse)', () => {
  let fuseau: string | undefined;
  beforeEach(() => {
    fuseau = process.env.TZ;
    process.env.TZ = 'America/Toronto';
  });
  afterEach(() => {
    if (fuseau === undefined) delete process.env.TZ;
    else process.env.TZ = fuseau;
  });

  it('le 2 novembre à 23 h 30 au Québec reste le 2 novembre', () => {
    const soir = new Date(2026, 10, 2, 23, 30);
    // La date UTC, utilisée par l'outil d'origine, donnerait déjà le lendemain.
    expect(soir.toISOString().slice(0, 10)).toBe('2026-11-03');
    expect(nomFichier('Session', soir, 'json')).toBe('grille-session-2026-11-02.json');
  });
});
