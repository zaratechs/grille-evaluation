import { describe, it, expect } from 'vitest';
import {
  appliquerModele,
  enregistrerModele,
  renommerModele,
  supprimerModele,
} from '../../src/domain/modeles';
import type { Dossier, Modele } from '../../src/domain/types';
import { critere, dossierAvec, etudiant, valeur } from './outils/fabrique';

/** Générateur d'identifiants déterministe pour les tests. */
const compteur = (prefixe = 'n') => {
  let i = 0;
  return () => `${prefixe}${++i}`;
};

const modele: Modele = {
  id: 'm',
  nom: 'Exposé',
  niveaux: ['Faible', 'Moyen', 'Fort'],
  criteres: [
    { nom: 'Fond', poids: 600, descripteurs: ['f1', 'f2', 'f3'] },
    { nom: 'Forme', poids: 400, descripteurs: ['g1', 'g2', 'g3'] },
  ],
};

/** Dossier déjà en cours : titre, total, critères évalués et commentés. */
function enCours(): Dossier {
  const base = dossierAvec(
    [critere('a', 1000)],
    [{ ...etudiant('e1', { a: 4 }, { a: 'précis' }), commentaireGeneral: 'Bon travail.' }],
  );
  return { ...base, grille: { ...base.grille, titre: 'Session', totalPoints: 20 } };
}

describe('appliquerModele', () => {
  it('remplace les niveaux et les critères, avec de nouveaux identifiants', () => {
    const d = appliquerModele(enCours(), modele, compteur());
    expect(d.grille.niveaux).toEqual(['Faible', 'Moyen', 'Fort']);
    expect(d.grille.criteres).toEqual([
      { id: 'n1', nom: 'Fond', poids: 600, descripteurs: ['f1', 'f2', 'f3'] },
      { id: 'n2', nom: 'Forme', poids: 400, descripteurs: ['g1', 'g2', 'g3'] },
    ]);
  });

  it('garde le titre et le total de points', () => {
    const d = appliquerModele(enCours(), modele, compteur());
    expect(d.grille.titre).toBe('Session');
    expect(d.grille.totalPoints).toBe(20);
  });

  it('efface les niveaux et commentaires par critère du groupe, garde les commentaires généraux', () => {
    const d = appliquerModele(enCours(), modele, compteur());
    expect(d.etudiants).toEqual([{ ...etudiant('e1'), commentaireGeneral: 'Bon travail.' }]);
  });

  it('ne partage aucun tableau avec le modèle', () => {
    const d = appliquerModele(enCours(), modele, compteur());
    d.grille.niveaux.push('x');
    d.grille.criteres[0]?.descripteurs.push('x');
    expect(modele.niveaux).toHaveLength(3);
    expect(modele.criteres[0]?.descripteurs).toHaveLength(3);
  });

  it('ne modifie ni le dossier ni le modèle reçus', () => {
    const d = enCours();
    const copies = structuredClone([d, modele]);
    appliquerModele(d, modele, compteur());
    expect([d, modele]).toEqual(copies);
  });
});

describe('modèles personnels', () => {
  it('enregistre la grille courante (niveaux, critères, poids, descripteurs) sans les évaluations', () => {
    const d = valeur(enregistrerModele(enCours(), 'p1', '  Mon modèle  '));
    expect(d.modelesPerso).toEqual([
      {
        id: 'p1',
        nom: 'Mon modèle',
        niveaux: ['Insatisfaisant', 'Faible', 'Satisfaisant', 'Très bon', 'Excellent'],
        criteres: [{ nom: 'Critère a', poids: 1000, descripteurs: ['', '', '', '', ''] }],
      },
    ]);
  });

  it('s’applique comme un modèle fourni, avec ses propres poids', () => {
    const avecModele = valeur(enregistrerModele(enCours(), 'p1', 'Mon modèle'));
    const perso = avecModele.modelesPerso[0] as Modele;
    const d = appliquerModele(avecModele, perso, compteur());
    expect(d.grille.criteres.map((c) => [c.nom, c.poids])).toEqual([['Critère a', 1000]]);
    expect(d.modelesPerso).toEqual(avecModele.modelesPerso);
  });

  it('refuse un nom vide, trop long, déjà pris ou un identifiant déjà pris', () => {
    const d = valeur(enregistrerModele(enCours(), 'p1', 'Mon modèle'));
    expect(enregistrerModele(d, 'p2', ' ')).toEqual({ ok: false, erreur: 'nom-vide' });
    expect(enregistrerModele(d, 'p2', 'x'.repeat(101))).toEqual({
      ok: false,
      erreur: 'nom-trop-long',
    });
    expect(enregistrerModele(d, 'p2', 'mon  MODELE')).toEqual({
      ok: false,
      erreur: 'nom-en-double',
    });
    expect(enregistrerModele(d, 'p1', 'Autre')).toEqual({
      ok: false,
      erreur: 'identifiant-en-double',
    });
  });

  it('renomme un modèle personnel', () => {
    let d = valeur(enregistrerModele(enCours(), 'p1', 'Un'));
    d = valeur(enregistrerModele(d, 'p2', 'Deux'));
    expect(valeur(renommerModele(d, 'p1', 'un')).modelesPerso.map((m) => m.nom)).toEqual([
      'un',
      'Deux',
    ]);
    expect(renommerModele(d, 'p1', 'deux')).toEqual({ ok: false, erreur: 'nom-en-double' });
    expect(renommerModele(d, 'p1', '')).toEqual({ ok: false, erreur: 'nom-vide' });
    expect(renommerModele(d, 'zz', 'Trois')).toEqual({ ok: false, erreur: 'modele-introuvable' });
  });

  it('supprime un modèle personnel sans toucher à la grille', () => {
    const d = valeur(enregistrerModele(enCours(), 'p1', 'Un'));
    const apres = valeur(supprimerModele(d, 'p1'));
    expect(apres.modelesPerso).toEqual([]);
    expect(apres.grille).toEqual(d.grille);
    expect(supprimerModele(d, 'zz')).toEqual({ ok: false, erreur: 'modele-introuvable' });
  });

  it('un modèle enregistré ne suit pas les modifications ultérieures de la grille', () => {
    const d = valeur(enregistrerModele(enCours(), 'p1', 'Un'));
    d.grille.niveaux.push('x');
    d.grille.criteres[0]?.descripteurs.push('x');
    expect(d.modelesPerso[0]?.niveaux).toHaveLength(5);
    expect(d.modelesPerso[0]?.criteres[0]?.descripteurs).toHaveLength(5);
  });
});
