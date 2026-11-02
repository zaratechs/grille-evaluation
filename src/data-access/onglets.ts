import { CLE_DOSSIER } from './stockage';

/**
 * Prévient quand un autre onglet modifie le dossier (décision 3 de la phase 3) : l'onglet
 * prévenu doit cesser d'enregistrer jusqu'au rechargement, sinon il effacerait le travail
 * fait ailleurs. Le navigateur n'envoie l'événement `storage` qu'aux AUTRES onglets ; une
 * clé `null` signifie que l'autre onglet a vidé tout le stockage.
 *
 * Renvoie la fonction qui arrête la surveillance.
 */
export function surveillerAutresOnglets(rappel: () => void): () => void {
  const ecouteur = (evenement: StorageEvent) => {
    if (evenement.key === CLE_DOSSIER || evenement.key === null) rappel();
  };
  window.addEventListener('storage', ecouteur);
  return () => window.removeEventListener('storage', ecouteur);
}
