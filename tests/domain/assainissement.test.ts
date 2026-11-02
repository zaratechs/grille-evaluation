import { describe, it, expect } from 'vitest';
import { assainir, bilanVide } from '../../src/domain/assainissement';
import { ajouterCritere, changerPoids, modifierDescripteur } from '../../src/domain/criteres';
import { changerTitre, dossierVide } from '../../src/domain/dossier';
import { ajouterEtudiant, evaluer } from '../../src/domain/groupe';
import { NIVEAUX_PAR_DEFAUT } from '../../src/domain/niveaux';
import type { Dossier } from '../../src/domain/types';
import { valeur } from './outils/fabrique';

const compteur = () => {
  let i = 0;
  return () => `n${++i}`;
};

const vides = (n = 5) => Array.from({ length: n }, () => '');

/** Critère brut valide, dont on remplace certains champs. */
const critereBrut = (champs: Record<string, unknown> = {}) => ({
  id: 'a',
  nom: 'Clarté',
  poids: 1000,
  descripteurs: vides(),
  ...champs,
});

/** Dossier brut (tel que lu d'un fichier) dont on remplace certains champs de la grille. */
const brut = (grille: Record<string, unknown> = {}) => ({
  version: 1,
  grille: {
    titre: 'Session',
    totalPoints: 20,
    niveaux: [...NIVEAUX_PAR_DEFAUT],
    criteres: [critereBrut()],
    ...grille,
  },
  etudiants: [],
  modelesPerso: [],
});

/** Répare et renvoie le résultat ; fait échouer le test en cas de refus. */
const reparer = (donnees: unknown) => valeur(assainir(donnees, compteur()));
const grilleReparee = (donnees: unknown) => reparer(donnees).dossier.grille;

describe('dossier intact', () => {
  it('ressort identique, sans correction', () => {
    let d: Dossier = dossierVide();
    d = valeur(changerTitre(d, 'Travail de session'));
    d = valeur(ajouterCritere(d, 'c1'));
    d = valeur(changerPoids(d, 'c1', 1000));
    d = valeur(modifierDescripteur(d, 'c1', 3, 'Satisfaisant\nsur deux lignes'));
    d = valeur(ajouterEtudiant(d, 'e1', 'Élise Roy'));
    d = valeur(evaluer(d, 'e1', 'c1', 4));
    const r = reparer(JSON.parse(JSON.stringify(d)));
    expect(r).toEqual({ dossier: d, modifie: false, bilan: bilanVide() });
  });

  it('ignore les champs inconnus sans les compter', () => {
    const r = reparer({ ...brut(), inconnu: 1, grille: { ...brut().grille, autre: 'x' } });
    expect(r.modifie).toBe(false);
    expect(r.dossier).not.toHaveProperty('inconnu');
    expect(r.dossier.grille).not.toHaveProperty('autre');
  });

  it('ne modifie pas les données reçues', () => {
    const donnees = brut({ titre: 42, criteres: [critereBrut({ poids: -3 })] });
    const copie = structuredClone(donnees);
    reparer(donnees);
    expect(donnees).toEqual(copie);
  });
});

describe('refus : pas un dossier', () => {
  it.each([
    ['null', null],
    ['un texte', 'dossier'],
    ['une liste', [1, 2]],
    ['un objet sans grille', { version: 1 }],
    ['une grille qui n’est pas un objet', { version: 1, grille: [] }],
  ])('%s', (_, donnees) => {
    expect(assainir(donnees, compteur())).toEqual({ ok: false, erreur: 'pas-un-dossier' });
  });
});

describe('titre et total de points', () => {
  it.each([
    [42, ''],
    [null, ''],
    ['x'.repeat(250), 'x'.repeat(200)],
  ])('titre %j → corrigé', (titre, attendu) => {
    const r = reparer(brut({ titre }));
    expect(r.dossier.grille.titre).toBe(attendu);
    expect(r.bilan.parametresCorriges).toBe(1);
  });

  it.each([0, -5, 1000.5, 12.345, '20', null, Number.NaN])('total %j → 100', (totalPoints) => {
    const r = reparer(brut({ totalPoints }));
    expect(r.dossier.grille.totalPoints).toBe(100);
    expect(r.bilan.parametresCorriges).toBe(1);
  });

  it('garde un total valide à 2 décimales', () => {
    expect(grilleReparee(brut({ totalPoints: 12.5 })).totalPoints).toBe(12.5);
  });
});

describe('niveaux', () => {
  it.each([
    ['absents', undefined],
    ['pas une liste', 'Excellent'],
    ['trop peu', ['A', 'B']],
    ['trop nombreux', Array.from({ length: 11 }, (_, i) => `N${i}`)],
    ['un libellé qui n’est pas du texte', ['A', 'B', 3]],
  ])('%s → les 5 niveaux par défaut', (_, niveaux) => {
    const r = reparer(brut({ niveaux }));
    expect(r.dossier.grille.niveaux).toEqual(NIVEAUX_PAR_DEFAUT);
    expect(r.bilan.niveauxCorriges).toBe(1);
  });

  it('remplace un libellé vide par « Niveau N » et tronque un libellé trop long', () => {
    const r = reparer(
      brut({
        niveaux: ['Faible', '  ', 'x'.repeat(120)],
        criteres: [critereBrut({ descripteurs: vides(3) })],
      }),
    );
    expect(r.dossier.grille.niveaux).toEqual(['Faible', 'Niveau 2', 'x'.repeat(100)]);
    expect(r.bilan.niveauxCorriges).toBe(2);
  });
});

describe('critères', () => {
  it('liste absente ou invalide → aucun critère', () => {
    const r = reparer(brut({ criteres: 'Clarté' }));
    expect(r.dossier.grille.criteres).toEqual([]);
    expect(r.bilan.parametresCorriges).toBe(1);
  });

  it('écarte un critère qui n’est pas un objet', () => {
    const r = reparer(brut({ criteres: [critereBrut(), 'texte', null, [1]] }));
    expect(r.dossier.grille.criteres.map((c) => c.id)).toEqual(['a']);
    expect(r.bilan.criteresEcartes).toBe(3);
  });

  it('remplace un identifiant absent, vide ou en double', () => {
    const r = reparer(
      brut({
        criteres: [
          critereBrut({ id: 'a', poids: 250 }),
          critereBrut({ id: 'a', poids: 250 }),
          critereBrut({ id: '', poids: 250 }),
          critereBrut({ id: 7, poids: 250 }),
        ],
      }),
    );
    expect(r.dossier.grille.criteres.map((c) => c.id)).toEqual(['a', 'n1', 'n2', 'n3']);
    expect(r.bilan.identifiantsRemplaces).toBe(3);
  });

  it.each([
    ['vide', '   ', 'Nouveau critère'],
    ['absent', undefined, 'Nouveau critère'],
    ['pas du texte', 12, 'Nouveau critère'],
    ['trop long', `  ${'y'.repeat(130)}`, 'y'.repeat(100)],
    ['avec des espaces autour', '  Clarté  ', 'Clarté'],
  ])('nom %s → corrigé', (_, nom, attendu) => {
    const r = reparer(brut({ criteres: [critereBrut({ nom })] }));
    expect(r.dossier.grille.criteres[0]?.nom).toBe(attendu);
    expect(r.bilan.nomsCorriges).toBe(1);
  });

  it.each([-1, 1001, 16.7, '500', null, undefined])('poids %j → 0', (poids) => {
    const r = reparer(brut({ criteres: [critereBrut({ poids })] }));
    expect(r.dossier.grille.criteres[0]?.poids).toBe(0);
    expect(r.bilan.poidsCorriges).toBe(1);
  });

  it.each([
    ['trop courts', ['a', 'b'], ['a', 'b', '', '', '']],
    ['trop longs', ['1', '2', '3', '4', '5', '6', '7'], ['1', '2', '3', '4', '5']],
    ['pas du texte', ['a', 2, null, 'd', 'e'], ['a', '', '', 'd', 'e']],
    ['absents', undefined, vides()],
  ])('descripteurs %s → réalignés', (_, descripteurs, attendu) => {
    const r = reparer(brut({ criteres: [critereBrut({ descripteurs })] }));
    expect(r.dossier.grille.criteres[0]?.descripteurs).toEqual(attendu);
    expect(r.bilan.descripteursCorriges).toBe(1);
  });

  it('réaligne les descripteurs sur les niveaux par défaut quand les niveaux sont remplacés', () => {
    const r = reparer(brut({ niveaux: 'x', criteres: [critereBrut({ descripteurs: vides(3) })] }));
    expect(r.dossier.grille.criteres[0]?.descripteurs).toEqual(vides(5));
  });

  it('compte chaque correction une fois, et seulement les vraies', () => {
    const r = reparer(
      brut({
        titre: 1,
        criteres: [
          critereBrut({ id: 'a', poids: 'x', nom: '' }),
          critereBrut({ id: 'b', poids: 0 }),
          'écarté',
        ],
      }),
    );
    expect(r.modifie).toBe(true);
    expect(r.bilan).toEqual({
      ...bilanVide(),
      parametresCorriges: 1,
      criteresEcartes: 1,
      nomsCorriges: 1,
      poidsCorriges: 1,
    });
  });
});
