import { erreur, ok, type Resultat } from '../domain';
import { TAILLE_MAX_IMPORT } from './portabilite';

/** Délai avant de libérer le fichier : certains navigateurs lisent l'adresse après le clic. */
const DELAI_LIBERATION_MS = 1000;

/** Propose un fichier au téléchargement (export JSON, puis PDF, CSV et Word en phase 5). */
export function telecharger(nom: string, contenu: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([contenu], { type }));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  document.body.append(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), DELAI_LIBERATION_MS);
}

/** Lit un fichier choisi par l'utilisateur ; refuse au-delà de 5 Mo sans le lire. */
export async function lireFichier(fichier: File): Promise<Resultat<string>> {
  if (fichier.size > TAILLE_MAX_IMPORT) return erreur('fichier-trop-gros');
  try {
    return ok(await fichier.text());
  } catch {
    return erreur('fichier-illisible');
  }
}
