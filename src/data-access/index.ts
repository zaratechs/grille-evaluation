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
