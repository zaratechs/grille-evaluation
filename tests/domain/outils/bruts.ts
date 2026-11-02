import { NIVEAUX_PAR_DEFAUT } from '../../../src/domain/niveaux';

/** Données « brutes », telles que lues d'une sauvegarde ou d'un fichier, pour les tests de réparation. */

/** Générateur d'identifiants déterministe. */
export const compteur = (prefixe = 'n') => {
  let i = 0;
  return () => `${prefixe}${++i}`;
};

export const vides = (n = 5) => Array.from({ length: n }, () => '');

/** Critère brut valide, dont on remplace certains champs. */
export const critereBrut = (champs: Record<string, unknown> = {}) => ({
  id: 'a',
  nom: 'Clarté',
  poids: 1000,
  descripteurs: vides(),
  ...champs,
});

/** Dossier brut valide dont on remplace certains champs de la grille. */
export const brut = (grille: Record<string, unknown> = {}) => ({
  version: 1,
  grille: {
    titre: 'Session',
    totalPoints: 20,
    niveaux: [...NIVEAUX_PAR_DEFAUT],
    criteres: [critereBrut()],
    ...grille,
  },
  etudiants: [] as unknown,
  modelesPerso: [] as unknown,
});

/** Personne brute valide (critère « a » évalué à 3), dont on remplace certains champs. */
export const personneBrute = (champs: Record<string, unknown> = {}) => ({
  id: 'e1',
  nom: 'Élise Roy',
  niveaux: { a: 3 },
  commentaires: { a: 'Précis.' },
  commentaireGeneral: 'Bien.',
  ...champs,
});

/** Modèle personnel brut valide, dont on remplace certains champs. */
export const modeleBrut = (champs: Record<string, unknown> = {}) => ({
  id: 'm1',
  nom: 'Exposé',
  niveaux: ['Faible', 'Moyen', 'Fort'],
  criteres: [{ nom: 'Fond', poids: 1000, descripteurs: ['f1', 'f2', 'f3'] }],
  ...champs,
});

/** Dossier brut valide avec ce groupe et ces modèles personnels. */
export const avec = (etudiants: unknown, modelesPerso: unknown = []) => ({
  ...brut(),
  etudiants,
  modelesPerso,
});
