/** API publique de l'accès aux données : le seul endroit qui touche au navigateur. */
export { nouvelId } from './id';
export {
  PREFIXE,
  CLE_DOSSIER,
  CLE_COPIE,
  charger,
  enregistrer,
  reinitialiser,
  type Avertissement,
  type Chargement,
} from './stockage';
export { surveillerAutresOnglets } from './onglets';
export { TAILLE_MAX_IMPORT, exporterJSON, importerJSON, type Import } from './portabilite';
export { telecharger, lireFichier } from './fichiers';
