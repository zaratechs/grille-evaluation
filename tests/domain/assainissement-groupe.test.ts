import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { assainir, bilanVide } from '../../src/domain/assainissement';
import { NIVEAUX_PAR_DEFAUT } from '../../src/domain/niveaux';
import { valeur } from './outils/fabrique';
import { avec, brut, compteur, critereBrut, modeleBrut, personneBrute } from './outils/bruts';
import { regleEnfreinte } from './outils/regles';

const reparer = (donnees: unknown) => valeur(assainir(donnees, compteur()));

describe('groupe', () => {
  it('garde une personne valide telle quelle', () => {
    const r = reparer(avec([personneBrute()]));
    expect(r.dossier.etudiants).toEqual([personneBrute()]);
    expect(r.modifie).toBe(false);
  });

  it('liste absente ou invalide → groupe vide', () => {
    const r = reparer(avec('Élise'));
    expect(r.dossier.etudiants).toEqual([]);
    expect(r.bilan.parametresCorriges).toBe(1);
  });

  it.each([
    ['qui n’est pas un objet', 'Élise'],
    ['sans nom', personneBrute({ id: 'e2', nom: undefined })],
    ['au nom vide', personneBrute({ id: 'e2', nom: '   ' })],
    ['au nom qui n’est pas du texte', personneBrute({ id: 'e2', nom: 12 })],
  ])('écarte une personne %s', (_, personne) => {
    const r = reparer(avec([personneBrute(), personne]));
    expect(r.dossier.etudiants.map((e) => e.id)).toEqual(['e1']);
    expect(r.bilan.personnesEcartees).toBe(1);
  });

  it('remplace un identifiant absent ou en double', () => {
    const r = reparer(
      avec([personneBrute(), personneBrute({ nom: 'Noé' }), personneBrute({ id: 3, nom: 'Léa' })]),
    );
    expect(r.dossier.etudiants.map((e) => e.id)).toEqual(['e1', 'n1', 'n2']);
    expect(r.bilan.identifiantsRemplaces).toBe(2);
  });

  it('retire les espaces autour d’un nom et tronque un nom trop long', () => {
    const r = reparer(
      avec([
        personneBrute({ nom: '  Élise Roy ' }),
        personneBrute({ id: 'e2', nom: 'z'.repeat(120) }),
      ]),
    );
    expect(r.dossier.etudiants.map((e) => e.nom)).toEqual(['Élise Roy', 'z'.repeat(100)]);
    expect(r.bilan.nomsCorriges).toBe(2);
  });

  it('décision 4 de la phase 2 : suffixe un nom en double, même écrit autrement', () => {
    const r = reparer(
      avec([
        personneBrute({ id: 'e1', nom: 'Élise Roy' }),
        personneBrute({ id: 'e2', nom: 'elise  ROY' }),
        personneBrute({ id: 'e3', nom: 'Élise Roy (2)' }),
        personneBrute({ id: 'e4', nom: 'Élise Roy' }),
      ]),
    );
    expect(r.dossier.etudiants.map((e) => e.nom)).toEqual([
      'Élise Roy',
      'elise  ROY (2)',
      'Élise Roy (2) (2)',
      'Élise Roy (3)',
    ]);
    expect(r.bilan.nomsCorriges).toBe(3);
  });

  it('garde le suffixe sous la limite de 100 caractères', () => {
    const long = 'w'.repeat(100);
    const r = reparer(avec([personneBrute({ nom: long }), personneBrute({ id: 'e2', nom: long })]));
    expect(r.dossier.etudiants[1]?.nom).toBe(`${'w'.repeat(96)} (2)`);
  });

  it('écarte les niveaux hors bornes, non entiers ou d’un critère disparu', () => {
    const { grille } = brut({
      criteres: [critereBrut({ id: 'a', poids: 500 }), critereBrut({ id: 'b', poids: 500 })],
    });
    const r = reparer({
      ...avec([
        personneBrute({ niveaux: { a: 6, b: 2, c: 3, d: '4' }, commentaires: {} }),
        personneBrute({ id: 'e2', nom: 'Noé', niveaux: { a: 0, b: 2.5 }, commentaires: {} }),
      ]),
      grille,
    });
    expect(r.dossier.etudiants.map((e) => e.niveaux)).toEqual([{ b: 2 }, {}]);
    expect(r.bilan.evaluationsEcartees).toBe(5);
  });

  it('écarte les commentaires vides, non textuels ou d’un critère disparu', () => {
    const r = reparer(
      avec([
        personneBrute({ commentaires: { a: 'ok', b: 'disparu', c: 3 } }),
        personneBrute({ id: 'e2', nom: 'Noé', commentaires: { a: '' } }),
      ]),
    );
    expect(r.dossier.etudiants.map((e) => e.commentaires)).toEqual([{ a: 'ok' }, {}]);
    expect(r.bilan.evaluationsEcartees).toBe(3);
  });

  it.each([
    ['niveaux', 'x', { niveaux: {} }],
    ['niveaux', [3], { niveaux: {} }],
    ['commentaires', null, { commentaires: {} }],
    ['commentaireGeneral', 4, { commentaireGeneral: '' }],
  ])('%s invalide (%j) → vidé', (champ, valeurBrute, attendu) => {
    const r = reparer(avec([personneBrute({ [champ]: valeurBrute })]));
    expect(r.dossier.etudiants[0]).toMatchObject(attendu);
    expect(r.bilan.evaluationsEcartees).toBe(1);
  });
});

describe('modèles personnels', () => {
  it('garde un modèle valide tel quel', () => {
    const r = reparer(avec([], [modeleBrut()]));
    expect(r.dossier.modelesPerso).toEqual([modeleBrut()]);
    expect(r.modifie).toBe(false);
  });

  it('liste absente ou invalide → aucun modèle', () => {
    const r = reparer(avec([], { m1: modeleBrut() }));
    expect(r.dossier.modelesPerso).toEqual([]);
    expect(r.bilan.parametresCorriges).toBe(1);
  });

  it.each([
    ['qui n’est pas un objet', 'Exposé'],
    ['sans nom utilisable', modeleBrut({ id: 'm2', nom: ' ' })],
  ])('écarte un modèle %s', (_, modele) => {
    const r = reparer(avec([], [modeleBrut(), modele]));
    expect(r.dossier.modelesPerso.map((m) => m.id)).toEqual(['m1']);
    expect(r.bilan.modelesEcartes).toBe(1);
  });

  it('suffixe un nom en double et remplace un identifiant en double', () => {
    const r = reparer(avec([], [modeleBrut(), modeleBrut({ nom: 'exposé' })]));
    expect(r.dossier.modelesPerso.map((m) => [m.id, m.nom])).toEqual([
      ['m1', 'Exposé'],
      ['n1', 'exposé (2)'],
    ]);
    expect(r.bilan.nomsCorriges).toBe(1);
    expect(r.bilan.identifiantsRemplaces).toBe(1);
  });

  it('répare ses niveaux et ses critères comme ceux de la grille', () => {
    const modele = modeleBrut({
      niveaux: 'x',
      criteres: [{ nom: '', poids: 'lourd', descripteurs: ['a'] }, 'écarté'],
    });
    const r = reparer(avec([], [modele]));
    expect(r.dossier.modelesPerso[0]).toEqual({
      id: 'm1',
      nom: 'Exposé',
      niveaux: [...NIVEAUX_PAR_DEFAUT],
      criteres: [{ nom: 'Nouveau critère', poids: 0, descripteurs: ['a', '', '', '', ''] }],
    });
    expect(r.bilan).toEqual({
      ...bilanVide(),
      niveauxCorriges: 1,
      nomsCorriges: 1,
      poidsCorriges: 1,
      descripteursCorriges: 1,
      criteresEcartes: 1,
    });
  });

  it('liste de critères invalide → aucun critère', () => {
    const r = reparer(avec([], [modeleBrut({ criteres: null })]));
    expect(r.dossier.modelesPerso[0]?.criteres).toEqual([]);
    expect(r.bilan.parametresCorriges).toBe(1);
  });
});

describe('propriétés', () => {
  // Valeurs proches d'un dossier valide, mêlées à n'importe quoi, pour atteindre souvent
  // les branches profondes de la réparation.
  const texte = fc.oneof(fc.string({ maxLength: 120 }), fc.constant('a'), fc.anything());
  const entier = fc.oneof(fc.integer({ min: -2, max: 1200 }), fc.anything());
  const critere = fc.oneof(
    fc.record({
      id: fc.oneof(fc.constantFrom('a', 'b', ''), fc.anything()),
      nom: texte,
      poids: entier,
      descripteurs: fc.oneof(fc.array(texte, { maxLength: 12 }), fc.anything()),
    }),
    fc.anything(),
  );
  const niveaux = fc.oneof(fc.array(texte, { minLength: 2, maxLength: 11 }), fc.anything());
  const personne = fc.oneof(
    fc.record({
      id: fc.oneof(fc.constantFrom('e1', 'e2'), fc.anything()),
      nom: fc.oneof(fc.constantFrom('Élise', 'élise', 'Élise (2)', ' '), texte),
      niveaux: fc.oneof(fc.dictionary(fc.constantFrom('a', 'b', 'c'), entier), fc.anything()),
      commentaires: fc.oneof(fc.dictionary(fc.constantFrom('a', 'b', 'c'), texte), fc.anything()),
      commentaireGeneral: texte,
    }),
    fc.anything(),
  );
  const modele = fc.oneof(
    fc.record({
      id: fc.oneof(fc.constantFrom('m1', 'm2'), fc.anything()),
      nom: fc.oneof(fc.constantFrom('Exposé', 'exposé'), texte),
      niveaux,
      criteres: fc.oneof(fc.array(critere, { maxLength: 4 }), fc.anything()),
    }),
    fc.anything(),
  );
  const dossier = fc.oneof(
    fc.record({
      version: fc.constant(1),
      grille: fc.oneof(
        fc.record({
          titre: texte,
          totalPoints: fc.oneof(fc.double(), fc.constantFrom(20, 12.5), fc.anything()),
          niveaux,
          criteres: fc.oneof(fc.array(critere, { maxLength: 6 }), fc.anything()),
        }),
        fc.anything(),
      ),
      etudiants: fc.oneof(fc.array(personne, { maxLength: 6 }), fc.anything()),
      modelesPerso: fc.oneof(fc.array(modele, { maxLength: 3 }), fc.anything()),
    }),
    fc.anything(),
  );

  it('ne lève jamais, et le résultat respecte toutes les règles de la phase 2', () => {
    fc.assert(
      fc.property(dossier, (donnees) => {
        const r = assainir(donnees, compteur());
        if (r.ok) expect(regleEnfreinte(r.valeur.dossier)).toBeNull();
      }),
      { numRuns: 500 },
    );
  });

  it('réparer deux fois ne change plus rien', () => {
    fc.assert(
      fc.property(dossier, (donnees) => {
        const premiere = assainir(donnees, compteur());
        if (!premiere.ok) return;
        const seconde = valeur(assainir(premiere.valeur.dossier, compteur('z')));
        expect(seconde).toEqual({
          dossier: premiere.valeur.dossier,
          modifie: false,
          bilan: bilanVide(),
        });
      }),
      { numRuns: 500 },
    );
  });
});
