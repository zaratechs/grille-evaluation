import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculerResultat, synthese } from '../../src/domain/notes';
import { egaliserPoids } from '../../src/domain/poids';
import type { Critere, Dossier, Etudiant } from '../../src/domain/types';
import { critere, dossierAvec, etudiant } from './outils/fabrique';

/** Grille de `nbNiveaux` niveaux, notée sur `totalPoints`. */
function grilleDe(criteres: Critere[], nbNiveaux = 5, totalPoints = 20) {
  const base = dossierAvec(criteres).grille;
  const niveaux = Array.from({ length: nbNiveaux }, (_, i) => `N${i + 1}`);
  return { ...base, totalPoints, niveaux };
}

const sixEgalises = () => egaliserPoids(6).map((p, i) => critere(`c${i}`, p));
const partout = (criteres: Critere[], niveau: number) =>
  etudiant('e', Object.fromEntries(criteres.map((c) => [c.id, niveau])));

describe('calculerResultat : statuts', () => {
  it('vide : aucun critère', () => {
    expect(calculerResultat(grilleDe([]), etudiant('e'))).toEqual({ statut: 'vide' });
  });

  it('décision 3 : pondération invalide, avec l’écart à corriger', () => {
    const criteres = [critere('a', 600), critere('b', 300)];
    expect(calculerResultat(grilleDe(criteres), partout(criteres, 5))).toEqual({
      statut: 'ponderation-invalide',
      totalPoids: 900,
      ecart: -100,
    });
  });

  it('décision 2 : incomplète tant qu’un critère pondéré n’est pas évalué', () => {
    const criteres = [critere('a', 500), critere('b', 300), critere('c', 200)];
    expect(calculerResultat(grilleDe(criteres), etudiant('e', { a: 5 }))).toEqual({
      statut: 'incomplete',
      evalues: 1,
      aEvaluer: 3,
    });
  });

  it('un critère de poids 0 non évalué n’empêche pas la note', () => {
    const criteres = [critere('a', 1000), critere('formatif', 0)];
    const r = calculerResultat(grilleDe(criteres), etudiant('e', { a: 5 }));
    expect(r.statut).toBe('complete');
  });

  it('ignore une évaluation dont le critère n’est plus pondéré', () => {
    const criteres = [critere('a', 1000), critere('formatif', 0)];
    const r = calculerResultat(grilleDe(criteres), etudiant('e', { a: 5, formatif: 1 }));
    expect(r).toMatchObject({ statut: 'complete', pourcentage: 1000 });
  });
});

describe('calculerResultat : note exacte', () => {
  it('6 critères égalisés, tous au maximum : 100,0 % et 20,00 / 20', () => {
    const criteres = sixEgalises();
    expect(calculerResultat(grilleDe(criteres), partout(criteres, 5))).toEqual({
      statut: 'complete',
      pourcentage: 1000,
      points: 2000,
      appreciation: { niveau: 5, libelle: 'N5' },
    });
  });

  it('niveau 1 partout sur 5 niveaux vaut 20,0 % (pas 0)', () => {
    const criteres = sixEgalises();
    expect(calculerResultat(grilleDe(criteres), partout(criteres, 1))).toMatchObject({
      pourcentage: 200,
      points: 400,
      appreciation: { niveau: 1 },
    });
  });

  it('pondère chaque critère : 3/5 sur 75 % et 5/5 sur 25 % donnent 70,0 %', () => {
    const criteres = [critere('a', 750), critere('b', 250)];
    expect(calculerResultat(grilleDe(criteres), etudiant('e', { a: 3, b: 5 }))).toMatchObject({
      pourcentage: 700,
      points: 1400,
    });
  });

  it('arrondit une seule fois, demi vers le haut, là où le calcul à virgule se trompe', () => {
    // 4 niveaux, (4 × 0,1 % + 2 × 99,9 %) / 4 = 50,05 % exactement ; 2002 / 4000 * 1000
    // en virgule flottante donne 500,49999999999994, qui s'arrondirait à tort à 50,0 %.
    expect(Math.round((2002 / 4000) * 1000)).toBe(500);
    const criteres = [critere('a', 1, 4), critere('b', 999, 4)];
    const grille = grilleDe(criteres, 4, 10);
    expect(calculerResultat(grille, etudiant('e', { a: 4, b: 2 }))).toMatchObject({
      pourcentage: 501,
      points: 501,
    });
  });

  it('calcule les points depuis la fraction exacte, pas depuis le pourcentage arrondi', () => {
    // 2/3 de 12,5 points = 8,333… → 8,33 ; 66,7 % × 12,5 donnerait 8,34.
    const criteres = [critere('a', 1000, 3)];
    const grille = grilleDe(criteres, 3, 12.5);
    expect(calculerResultat(grille, etudiant('e', { a: 2 }))).toMatchObject({
      pourcentage: 667,
      points: 833,
    });
  });
});

describe('calculerResultat : appréciation globale', () => {
  it('donne le niveau le plus proche', () => {
    const criteres = [critere('a', 500), critere('b', 500)];
    // (4 + 5) / 2 = 4,5 → égalité, vers le haut
    expect(calculerResultat(grilleDe(criteres), etudiant('e', { a: 4, b: 5 }))).toMatchObject({
      appreciation: { niveau: 5, libelle: 'N5' },
    });
    // (0,7 × 4 + 0,3 × 2) = 3,4 → 3
    const inegaux = [critere('a', 700), critere('b', 300)];
    expect(calculerResultat(grilleDe(inegaux), etudiant('e', { a: 4, b: 2 }))).toMatchObject({
      appreciation: { niveau: 3, libelle: 'N3' },
    });
  });

  it('tranche une égalité vers le haut', () => {
    const criteres = [critere('a', 500, 4), critere('b', 500, 4)];
    expect(calculerResultat(grilleDe(criteres, 4), etudiant('e', { a: 2, b: 3 }))).toMatchObject({
      appreciation: { niveau: 3 },
    });
  });
});

describe('calculerResultat : propriétés', () => {
  it('une note complète reste entre 1/N et 100 %, et les points ne dépassent jamais le total', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 10 }),
        fc.integer({ min: 1, max: 8 }),
        fc.integer({ min: 1, max: 100_000 }),
        fc.infiniteStream(fc.nat()),
        (nbNiveaux, nbCriteres, totalCentiemes, hasard) => {
          const criteres = egaliserPoids(nbCriteres).map((p, i) => critere(`c${i}`, p, nbNiveaux));
          const niveaux = Object.fromEntries(
            criteres.map((c) => [c.id, (hasard.next().value % nbNiveaux) + 1]),
          );
          const grille = grilleDe(criteres, nbNiveaux, totalCentiemes / 100);
          const r = calculerResultat(grille, etudiant('e', niveaux));
          if (r.statut !== 'complete') throw new Error(`statut ${r.statut}`);
          expect(r.pourcentage).toBeGreaterThanOrEqual(Math.floor(1000 / nbNiveaux));
          expect(r.pourcentage).toBeLessThanOrEqual(1000);
          expect(r.points).toBeGreaterThanOrEqual(0);
          expect(r.points).toBeLessThanOrEqual(totalCentiemes);
          expect(r.appreciation.niveau).toBeGreaterThanOrEqual(1);
          expect(r.appreciation.niveau).toBeLessThanOrEqual(nbNiveaux);
        },
      ),
    );
  });
});

describe('synthese du groupe', () => {
  const criteres = [critere('a', 500), critere('b', 500)];
  const groupe = (etudiants: Etudiant[]): Dossier => ({
    ...dossierAvec(criteres, etudiants),
    grille: grilleDe(criteres),
  });

  it('groupe vide : rien à calculer', () => {
    expect(synthese(groupe([]))).toEqual({
      total: 0,
      completes: 0,
      moyenne: null,
      mediane: null,
    });
  });

  it('exclut et compte les personnes incomplètes', () => {
    const s = synthese(
      groupe([etudiant('e1', { a: 5, b: 5 }), etudiant('e2', { a: 3 }), etudiant('e3')]),
    );
    expect(s).toEqual({
      total: 3,
      completes: 1,
      moyenne: { pourcentage: 1000, points: 2000 },
      mediane: { pourcentage: 1000, points: 2000 },
    });
  });

  it('moyenne et médiane d’un nombre impair de personnes', () => {
    // 100 %, 60 %, 50 % → moyenne 70 %, médiane 60 %
    const s = synthese(
      groupe([
        etudiant('e1', { a: 5, b: 5 }),
        etudiant('e2', { a: 3, b: 3 }),
        etudiant('e3', { a: 2, b: 3 }),
      ]),
    );
    expect(s.moyenne).toEqual({ pourcentage: 700, points: 1400 });
    expect(s.mediane).toEqual({ pourcentage: 600, points: 1200 });
  });

  it('médiane d’un nombre pair : moitié des deux du milieu, arrondie une fois', () => {
    // 100 %, 70 %, 60 %, 50 % → médiane 65 % ; moyenne 70 %
    const s = synthese(
      groupe([
        etudiant('e1', { a: 5, b: 5 }),
        etudiant('e2', { a: 3, b: 4 }),
        etudiant('e3', { a: 3, b: 3 }),
        etudiant('e4', { a: 2, b: 3 }),
      ]),
    );
    expect(s.mediane).toEqual({ pourcentage: 650, points: 1300 });
    expect(s.moyenne).toEqual({ pourcentage: 700, points: 1400 });
  });

  it('aucune note si la pondération est invalide', () => {
    const invalide: Dossier = {
      ...dossierAvec([critere('a', 400)], [etudiant('e1', { a: 5 })]),
    };
    expect(synthese(invalide)).toEqual({ total: 1, completes: 0, moyenne: null, mediane: null });
  });
});
