import { dossierVide } from '../../../src/domain/dossier';
import type { Critere, Dossier, Etudiant } from '../../../src/domain/types';

/** Critère de test : descripteurs vides alignés sur `nbNiveaux`. */
export const critere = (id: string, poids = 0, nbNiveaux = 5): Critere => ({
  id,
  nom: `Critère ${id}`,
  poids,
  descripteurs: Array.from({ length: nbNiveaux }, () => ''),
});

export const etudiant = (
  id: string,
  niveaux: Record<string, number> = {},
  commentaires: Record<string, string> = {},
): Etudiant => ({ id, nom: `Personne ${id}`, niveaux, commentaires, commentaireGeneral: '' });

/** Dossier vide auquel on ajoute des critères et des personnes, sans passer par le domaine. */
export function dossierAvec(criteres: Critere[] = [], etudiants: Etudiant[] = []): Dossier {
  const base = dossierVide();
  return { ...base, grille: { ...base.grille, criteres }, etudiants };
}

/** Exige un succès et renvoie la valeur ; fait échouer le test sinon. */
export function valeur<T>(r: { ok: true; valeur: T } | { ok: false; erreur: string }): T {
  if (!r.ok) throw new Error(`Échec inattendu : ${r.erreur}`);
  return r.valeur;
}
