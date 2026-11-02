import { describe, it, expect } from 'vitest';
import {
  ajouterEtudiant,
  commenter,
  commenterGeneral,
  deplacerEtudiant,
  evaluer,
  reinitialiserEvaluation,
  renommerEtudiant,
  retirerEtudiant,
} from '../../src/domain/groupe';
import { cleNom } from '../../src/domain/noms';
import type { Dossier } from '../../src/domain/types';
import { critere, dossierAvec, etudiant, valeur } from './outils/fabrique';

const ids = (d: Dossier) => d.etudiants.map((e) => e.id);
const groupe = () =>
  dossierAvec([critere('a'), critere('b')], [etudiant('e1'), etudiant('e2'), etudiant('e3')]);
const premier = (d: Dossier) => d.etudiants[0];
const INTROUVABLE = { ok: false, erreur: 'etudiant-introuvable' };

describe('cleNom', () => {
  it('ignore les majuscules, les accents et les espaces multiples', () => {
    expect(cleNom('  Élise   Roy ')).toBe(cleNom('elise roy'));
    expect(cleNom('Ève Côté-Gagné')).toBe('eve cote-gagne');
    expect(cleNom('Léa Roy')).not.toBe(cleNom('Léo Roy'));
  });
});

describe('ajouterEtudiant', () => {
  it('ajoute à la fin une personne sans évaluation, nom sans espaces autour', () => {
    const d = valeur(ajouterEtudiant(dossierAvec(), 'x', '  Élise Roy '));
    expect(d.etudiants).toEqual([
      { id: 'x', nom: 'Élise Roy', niveaux: {}, commentaires: {}, commentaireGeneral: '' },
    ]);
  });

  it('refuse un nom vide ou trop long', () => {
    expect(ajouterEtudiant(groupe(), 'x', '  ')).toEqual({ ok: false, erreur: 'nom-vide' });
    expect(ajouterEtudiant(groupe(), 'x', 'x'.repeat(101))).toEqual({
      ok: false,
      erreur: 'nom-trop-long',
    });
  });

  it('décision 4 : refuse un nom déjà présent, même écrit autrement', () => {
    const d = valeur(ajouterEtudiant(dossierAvec(), 'x', 'Élise  Roy'));
    expect(ajouterEtudiant(d, 'y', 'elise roy')).toEqual({ ok: false, erreur: 'nom-en-double' });
    expect(valeur(ajouterEtudiant(d, 'y', 'Élise Roy B.')).etudiants).toHaveLength(2);
  });

  it('refuse un identifiant déjà pris', () => {
    expect(ajouterEtudiant(groupe(), 'e2', 'Autre')).toEqual({
      ok: false,
      erreur: 'identifiant-en-double',
    });
  });
});

describe('renommerEtudiant', () => {
  it('renomme une personne', () => {
    expect(premier(valeur(renommerEtudiant(groupe(), 'e1', ' Noé Roy ')))?.nom).toBe('Noé Roy');
  });

  it('permet de corriger la casse ou les accents de son propre nom', () => {
    const d = valeur(renommerEtudiant(groupe(), 'e1', 'noe roy'));
    expect(premier(valeur(renommerEtudiant(d, 'e1', 'Noé Roy')))?.nom).toBe('Noé Roy');
  });

  it('refuse le nom d’une autre personne, un nom vide ou une personne inconnue', () => {
    expect(renommerEtudiant(groupe(), 'e1', 'personne E2')).toEqual({
      ok: false,
      erreur: 'nom-en-double',
    });
    expect(renommerEtudiant(groupe(), 'e1', '')).toEqual({ ok: false, erreur: 'nom-vide' });
    expect(renommerEtudiant(groupe(), 'zz', 'Noé')).toEqual(INTROUVABLE);
  });
});

describe('retirerEtudiant et deplacerEtudiant', () => {
  it('retire une personne', () => {
    expect(ids(valeur(retirerEtudiant(groupe(), 'e2')))).toEqual(['e1', 'e3']);
    expect(retirerEtudiant(groupe(), 'zz')).toEqual(INTROUVABLE);
  });

  it('permet un groupe vide', () => {
    let d = groupe();
    for (const id of ['e1', 'e2', 'e3']) d = valeur(retirerEtudiant(d, id));
    expect(d.etudiants).toEqual([]);
  });

  it('déplace une personne, sans effet aux extrémités', () => {
    expect(ids(valeur(deplacerEtudiant(groupe(), 'e2', 'haut')))).toEqual(['e2', 'e1', 'e3']);
    expect(ids(valeur(deplacerEtudiant(groupe(), 'e2', 'bas')))).toEqual(['e1', 'e3', 'e2']);
    expect(ids(valeur(deplacerEtudiant(groupe(), 'e1', 'haut')))).toEqual(['e1', 'e2', 'e3']);
    expect(ids(valeur(deplacerEtudiant(groupe(), 'e3', 'bas')))).toEqual(['e1', 'e2', 'e3']);
    expect(deplacerEtudiant(groupe(), 'zz', 'bas')).toEqual(INTROUVABLE);
  });
});

describe('evaluer', () => {
  it('fixe puis efface le niveau d’un critère', () => {
    const d = valeur(evaluer(groupe(), 'e1', 'a', 4));
    expect(premier(d)?.niveaux).toEqual({ a: 4 });
    expect(premier(valeur(evaluer(d, 'e1', 'a', 1)))?.niveaux).toEqual({ a: 1 });
    expect(premier(valeur(evaluer(d, 'e1', 'a', null)))?.niveaux).toEqual({});
  });

  it('refuse un niveau hors bornes (de 1 à N)', () => {
    for (const n of [0, 6, 2.5, -1]) {
      expect(evaluer(groupe(), 'e1', 'a', n)).toEqual({ ok: false, erreur: 'niveau-invalide' });
    }
  });

  it('refuse un critère ou une personne inconnus', () => {
    expect(evaluer(groupe(), 'e1', 'zz', 3)).toEqual({ ok: false, erreur: 'critere-introuvable' });
    expect(evaluer(groupe(), 'zz', 'a', 3)).toEqual(INTROUVABLE);
  });

  it('ne touche qu’à la personne évaluée', () => {
    const d = valeur(evaluer(groupe(), 'e2', 'b', 5));
    expect(d.etudiants.map((e) => e.niveaux)).toEqual([{}, { b: 5 }, {}]);
  });
});

describe('commentaires', () => {
  it('écrit un commentaire par critère, texte gardé tel quel ; un texte vide l’efface', () => {
    const d = valeur(commenter(groupe(), 'e1', 'a', 'Bien.\nÀ préciser '));
    expect(premier(d)?.commentaires).toEqual({ a: 'Bien.\nÀ préciser ' });
    expect(premier(valeur(commenter(d, 'e1', 'a', '')))?.commentaires).toEqual({});
  });

  it('refuse un critère ou une personne inconnus', () => {
    expect(commenter(groupe(), 'e1', 'zz', 'x')).toEqual({
      ok: false,
      erreur: 'critere-introuvable',
    });
    expect(commenter(groupe(), 'zz', 'a', 'x')).toEqual(INTROUVABLE);
  });

  it('écrit le commentaire général', () => {
    const d = valeur(commenterGeneral(groupe(), 'e3', 'Bon travail.'));
    expect(d.etudiants[2]?.commentaireGeneral).toBe('Bon travail.');
    expect(commenterGeneral(groupe(), 'zz', 'x')).toEqual(INTROUVABLE);
  });
});

describe('reinitialiserEvaluation', () => {
  it('efface niveaux et commentaires d’une seule personne', () => {
    const d = dossierAvec(
      [critere('a')],
      [
        { ...etudiant('e1', { a: 3 }, { a: 'x' }), commentaireGeneral: 'g' },
        etudiant('e2', { a: 5 }),
      ],
    );
    const apres = valeur(reinitialiserEvaluation(d, 'e1'));
    expect(apres.etudiants).toEqual([
      { ...etudiant('e1'), commentaireGeneral: '' },
      etudiant('e2', { a: 5 }),
    ]);
    expect(reinitialiserEvaluation(d, 'zz')).toEqual(INTROUVABLE);
  });
});

describe('immuabilité', () => {
  it('aucune opération ne modifie le dossier reçu', () => {
    const d = dossierAvec([critere('a')], [etudiant('e1', { a: 3 }, { a: 'x' }), etudiant('e2')]);
    const copie = structuredClone(d);
    ajouterEtudiant(d, 'e3', 'Nouvelle');
    renommerEtudiant(d, 'e1', 'Autre');
    retirerEtudiant(d, 'e1');
    deplacerEtudiant(d, 'e2', 'haut');
    evaluer(d, 'e1', 'a', null);
    commenter(d, 'e1', 'a', '');
    commenterGeneral(d, 'e1', 'g');
    reinitialiserEvaluation(d, 'e1');
    expect(d).toEqual(copie);
  });
});
