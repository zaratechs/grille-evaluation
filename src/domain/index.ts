/** API publique du domaine : l'interface et le stockage n'importent que ce fichier. */
export type * from './types';
export { ok, erreur, type Resultat } from './resultat';
export {
  TITRE_LONGUEUR_MAX,
  TOTAL_POINTS_MAX,
  dossierVide,
  changerTitre,
  lireTotalPoints,
  changerTotalPoints,
} from './dossier';
export { POIDS_TOTAL, lirePoids, egaliserPoids, totalPoids, ponderationValide } from './poids';
export {
  NIVEAUX_MIN,
  NIVEAUX_MAX,
  NIVEAUX_PAR_DEFAUT,
  ajouterNiveau,
  retirerNiveau,
  renommerNiveau,
} from './niveaux';
export { NOM_LONGUEUR_MAX } from './noms';
export type { Sens } from './listes';
export {
  ajouterCritere,
  renommerCritere,
  changerPoids,
  modifierDescripteur,
  deplacerCritere,
  retirerCritere,
} from './criteres';
export {
  ajouterEtudiant,
  renommerEtudiant,
  retirerEtudiant,
  deplacerEtudiant,
  evaluer,
  commenter,
  commenterGeneral,
  reinitialiserEvaluation,
} from './groupe';
export {
  calculerResultat,
  synthese,
  type Note,
  type ResultatNote,
  type SyntheseGroupe,
} from './notes';
export { formaterPoids, formaterPourcentage, formaterPoints } from './format';
export { appliquerModele, enregistrerModele, renommerModele, supprimerModele } from './modeles';
export { VERSION_COURANTE, MIGRATIONS, migrer, type Migration, type Donnees } from './migrations';
export { assainir, bilanVide, type BilanReparation, type Reparation } from './assainissement';
export { TITRE_FICHIER_MAX, nomFichier } from './nomFichier';
