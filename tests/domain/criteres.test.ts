import { describe, it, expect } from 'vitest';
import {
  ajouterCritere,
  changerPoids,
  deplacerCritere,
  egaliserCriteres,
  modifierDescripteur,
  renommerCritere,
  retirerCritere,
} from '../../src/domain/criteres';
import { dossierVide } from '../../src/domain/dossier';
import type { Dossier } from '../../src/domain/types';
import { critere, dossierAvec, etudiant, valeur } from './outils/fabrique';

const ids = (d: Dossier) => d.grille.criteres.map((c) => c.id);
const trois = () => dossierAvec([critere('a'), critere('b'), critere('c')]);
const INTROUVABLE = { ok: false, erreur: 'critere-introuvable' };

describe('ajouterCritere', () => {
  it('ajoute à la fin un critère sans poids, avec un descripteur vide par niveau', () => {
    const d = valeur(ajouterCritere(dossierVide(), 'x'));
    expect(d.grille.criteres).toEqual([
      { id: 'x', nom: 'Nouveau critère', poids: 0, descripteurs: ['', '', '', '', ''] },
    ]);
  });

  it('refuse un identifiant déjà pris', () => {
    expect(ajouterCritere(trois(), 'b')).toEqual({ ok: false, erreur: 'identifiant-en-double' });
  });
});

describe('renommerCritere', () => {
  it('renomme, espaces retirés', () => {
    const d = valeur(renommerCritere(trois(), 'b', '  Clarté  '));
    expect(d.grille.criteres[1]?.nom).toBe('Clarté');
  });

  it('refuse un nom vide, trop long ou un critère inconnu', () => {
    expect(renommerCritere(trois(), 'b', ' ')).toEqual({ ok: false, erreur: 'nom-vide' });
    expect(renommerCritere(trois(), 'b', 'x'.repeat(101))).toEqual({
      ok: false,
      erreur: 'nom-trop-long',
    });
    expect(renommerCritere(trois(), 'z', 'Clarté')).toEqual(INTROUVABLE);
  });
});

describe('changerPoids', () => {
  it('accepte un entier de 0 à 1000 dixièmes', () => {
    expect(valeur(changerPoids(trois(), 'a', 1000)).grille.criteres[0]?.poids).toBe(1000);
    expect(valeur(changerPoids(trois(), 'a', 0)).grille.criteres[0]?.poids).toBe(0);
  });

  it('refuse un poids hors bornes ou non entier', () => {
    for (const p of [-1, 1001, 16.7, Number.NaN]) {
      expect(changerPoids(trois(), 'a', p)).toEqual({ ok: false, erreur: 'poids-invalide' });
    }
    expect(changerPoids(trois(), 'z', 100)).toEqual(INTROUVABLE);
  });
});

describe('modifierDescripteur', () => {
  it('modifie le descripteur d’un niveau (de 1 à N), texte gardé tel quel', () => {
    const d = valeur(modifierDescripteur(trois(), 'c', 5, 'Ligne 1\nLigne 2 '));
    expect(d.grille.criteres[2]?.descripteurs).toEqual(['', '', '', '', 'Ligne 1\nLigne 2 ']);
  });

  it('refuse un niveau hors bornes ou un critère inconnu', () => {
    for (const n of [0, 6, 2.5]) {
      expect(modifierDescripteur(trois(), 'c', n, 'x')).toEqual({
        ok: false,
        erreur: 'niveau-invalide',
      });
    }
    expect(modifierDescripteur(trois(), 'z', 1, 'x')).toEqual(INTROUVABLE);
  });
});

describe('deplacerCritere', () => {
  it('monte et descend un critère', () => {
    expect(ids(valeur(deplacerCritere(trois(), 'b', 'haut')))).toEqual(['b', 'a', 'c']);
    expect(ids(valeur(deplacerCritere(trois(), 'b', 'bas')))).toEqual(['a', 'c', 'b']);
  });

  it('reste sans effet aux extrémités', () => {
    expect(ids(valeur(deplacerCritere(trois(), 'a', 'haut')))).toEqual(['a', 'b', 'c']);
    expect(ids(valeur(deplacerCritere(trois(), 'c', 'bas')))).toEqual(['a', 'b', 'c']);
  });

  it('refuse un critère inconnu', () => {
    expect(deplacerCritere(trois(), 'z', 'haut')).toEqual(INTROUVABLE);
  });
});

describe('retirerCritere', () => {
  it('retire le critère et ses niveaux et commentaires chez toutes les personnes', () => {
    const d = dossierAvec(
      [critere('a'), critere('b')],
      [
        etudiant('e1', { a: 3, b: 4 }, { a: 'bien', b: 'à revoir' }),
        etudiant('e2', { b: 2 }, { b: 'court' }),
      ],
    );
    const apres = valeur(retirerCritere(d, 'b'));
    expect(ids(apres)).toEqual(['a']);
    expect(apres.etudiants.map((e) => [e.niveaux, e.commentaires])).toEqual([
      [{ a: 3 }, { a: 'bien' }],
      [{}, {}],
    ]);
  });

  it('refuse un critère inconnu', () => {
    expect(retirerCritere(trois(), 'z')).toEqual(INTROUVABLE);
  });
});

describe('immuabilité', () => {
  it('aucune opération ne modifie le dossier reçu', () => {
    const d = dossierAvec([critere('a'), critere('b')], [etudiant('e1', { a: 3 }, { a: 'x' })]);
    const copie = structuredClone(d);
    ajouterCritere(d, 'c');
    renommerCritere(d, 'a', 'Autre');
    changerPoids(d, 'a', 300);
    modifierDescripteur(d, 'a', 1, 'texte');
    deplacerCritere(d, 'b', 'haut');
    retirerCritere(d, 'a');
    expect(d).toEqual(copie);
  });
});

describe('egaliserCriteres', () => {
  it('répartit 100 % également, le reste aux premiers critères', () => {
    const d = valeur(egaliserCriteres(trois()));
    expect(d.grille.criteres.map((c) => c.poids)).toEqual([334, 333, 333]);
  });

  it('ne touche à rien d’autre et ne modifie pas le dossier reçu', () => {
    const avant = trois();
    const copie = structuredClone(avant);
    const d = valeur(egaliserCriteres(avant));
    expect(avant).toEqual(copie);
    expect(d.grille.criteres.map((c) => c.nom)).toEqual(avant.grille.criteres.map((c) => c.nom));
  });

  it('sans critère : rien à égaliser, dossier rendu tel quel', () => {
    expect(valeur(egaliserCriteres(dossierVide()))).toEqual(dossierVide());
  });
});
