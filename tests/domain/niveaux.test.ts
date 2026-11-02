import { describe, it, expect } from 'vitest';
import {
  changerTitre,
  changerTotalPoints,
  dossierVide,
  lireTotalPoints,
} from '../../src/domain/dossier';
import {
  NIVEAUX_MAX,
  NIVEAUX_MIN,
  NIVEAUX_PAR_DEFAUT,
  ajouterNiveau,
  renommerNiveau,
  retirerNiveau,
} from '../../src/domain/niveaux';
import type { Dossier } from '../../src/domain/types';
import { critere, dossierAvec, etudiant, valeur } from './outils/fabrique';

const nbNiveaux = (d: Dossier) => d.grille.niveaux.length;
const descripteursAlignes = (d: Dossier) =>
  d.grille.criteres.every((c) => c.descripteurs.length === nbNiveaux(d));

describe('dossierVide', () => {
  it('commence en version 1, avec les 5 niveaux par défaut, sans critère ni personne', () => {
    expect(dossierVide()).toEqual({
      version: 1,
      grille: { titre: '', totalPoints: 100, niveaux: [...NIVEAUX_PAR_DEFAUT], criteres: [] },
      etudiants: [],
      modelesPerso: [],
    });
  });

  it('reprend les libellés de l’outil d’origine, du plus faible au plus fort', () => {
    expect(NIVEAUX_PAR_DEFAUT).toEqual([
      'Insatisfaisant',
      'Faible',
      'Satisfaisant',
      'Très bon',
      'Excellent',
    ]);
  });

  it('renvoie un nouvel objet à chaque appel', () => {
    const a = dossierVide();
    a.grille.niveaux.push('modifié');
    expect(dossierVide().grille.niveaux).toHaveLength(5);
  });
});

describe('titre et total de points', () => {
  it('change le titre, jusqu’à 200 caractères', () => {
    const d = dossierVide();
    expect(valeur(changerTitre(d, 'Travail de session')).grille.titre).toBe('Travail de session');
    expect(changerTitre(d, 'x'.repeat(201))).toEqual({ ok: false, erreur: 'nom-trop-long' });
  });

  it.each([
    ['20', 20],
    ['12,5', 12.5],
    ['0,01', 0.01],
    [' 1000 ', 1000],
    ['99.99', 99.99],
  ])('lit le total « %s »', (texte, attendu) => {
    expect(lireTotalPoints(texte)).toEqual({ ok: true, valeur: attendu });
  });

  it.each(['0', '0,00', '1000,01', '12,345', '-5', 'abc', ''])(
    'refuse le total « %s »',
    (texte) => {
      expect(lireTotalPoints(texte)).toEqual({ ok: false, erreur: 'total-points-invalide' });
    },
  );

  it('change le total, de 0,01 à 1000 avec au plus 2 décimales', () => {
    const d = dossierVide();
    expect(valeur(changerTotalPoints(d, 12.5)).grille.totalPoints).toBe(12.5);
    for (const invalide of [0, -1, 1000.01, 12.345, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(changerTotalPoints(d, invalide)).toEqual({
        ok: false,
        erreur: 'total-points-invalide',
      });
    }
  });
});

describe('ajouterNiveau', () => {
  it('ajoute un niveau en haut et un descripteur vide à chaque critère', () => {
    const d = dossierAvec([critere('a'), critere('b')]);
    const apres = valeur(ajouterNiveau(d));
    expect(apres.grille.niveaux.at(-1)).toBe('Niveau 6');
    expect(descripteursAlignes(apres)).toBe(true);
    expect(apres.grille.criteres[0]?.descripteurs.at(-1)).toBe('');
  });

  it(`refuse au-delà de ${NIVEAUX_MAX} niveaux`, () => {
    let d = dossierAvec([critere('a')]);
    while (nbNiveaux(d) < NIVEAUX_MAX) d = valeur(ajouterNiveau(d));
    expect(descripteursAlignes(d)).toBe(true);
    expect(ajouterNiveau(d)).toEqual({ ok: false, erreur: 'niveaux-maximum' });
  });

  it('ne modifie pas le dossier reçu', () => {
    const d = dossierAvec([critere('a')]);
    const copie = structuredClone(d);
    ajouterNiveau(d);
    expect(d).toEqual(copie);
  });
});

describe('retirerNiveau', () => {
  it('retire le niveau le plus haut et son descripteur', () => {
    const d = dossierAvec([critere('a')]);
    const { dossier, evaluationsEffacees } = valeur(retirerNiveau(d));
    expect(dossier.grille.niveaux).toEqual(NIVEAUX_PAR_DEFAUT.slice(0, 4));
    expect(descripteursAlignes(dossier)).toBe(true);
    expect(evaluationsEffacees).toBe(0);
  });

  it('bug d’origine : efface les évaluations au niveau retiré au lieu de dépasser 100 %', () => {
    const d = dossierAvec(
      [critere('a', 500), critere('b', 500)],
      [etudiant('e1', { a: 5, b: 3 }), etudiant('e2', { a: 4, b: 5 }), etudiant('e3', { a: 2 })],
    );
    const { dossier, evaluationsEffacees } = valeur(retirerNiveau(d));
    expect(evaluationsEffacees).toBe(2);
    expect(dossier.etudiants.map((e) => e.niveaux)).toEqual([{ b: 3 }, { a: 4 }, { a: 2 }]);
    const max = nbNiveaux(dossier);
    expect(dossier.etudiants.every((e) => Object.values(e.niveaux).every((n) => n <= max))).toBe(
      true,
    );
  });

  it(`refuse en dessous de ${NIVEAUX_MIN} niveaux`, () => {
    let d = dossierVide();
    while (nbNiveaux(d) > NIVEAUX_MIN) d = valeur(retirerNiveau(d)).dossier;
    expect(retirerNiveau(d)).toEqual({ ok: false, erreur: 'niveaux-minimum' });
  });

  it('ne modifie pas le dossier reçu', () => {
    const d = dossierAvec([critere('a')], [etudiant('e1', { a: 5 })]);
    const copie = structuredClone(d);
    retirerNiveau(d);
    expect(d).toEqual(copie);
  });
});

describe('renommerNiveau', () => {
  it('renomme un niveau (numéroté de 1 à N), espaces retirés', () => {
    const d = valeur(renommerNiveau(dossierVide(), 1, '  À reprendre  '));
    expect(d.grille.niveaux[0]).toBe('À reprendre');
  });

  it('refuse un niveau hors bornes', () => {
    for (const n of [0, 6, 1.5]) {
      expect(renommerNiveau(dossierVide(), n, 'x')).toEqual({
        ok: false,
        erreur: 'niveau-invalide',
      });
    }
  });

  it('refuse un libellé vide ou trop long', () => {
    expect(renommerNiveau(dossierVide(), 1, '   ')).toEqual({ ok: false, erreur: 'nom-vide' });
    expect(renommerNiveau(dossierVide(), 1, 'x'.repeat(101))).toEqual({
      ok: false,
      erreur: 'nom-trop-long',
    });
  });
});
