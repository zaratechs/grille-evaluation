import { ok, erreur, type Resultat } from './resultat';

export const NOM_LONGUEUR_MAX = 100;

/**
 * Valide un nom (critère, niveau, personne, modèle) : espaces de début et de fin retirés,
 * de 1 à `max` caractères. L'interface valide à la fin de la saisie, pas à chaque touche.
 */
export function lireNom(texte: string, max = NOM_LONGUEUR_MAX): Resultat<string> {
  const nom = texte.trim();
  if (nom === '') return erreur('nom-vide');
  if (nom.length > max) return erreur('nom-trop-long');
  return ok(nom);
}

/** Clé de comparaison des noms : sans majuscules, sans accents, espaces simplifiés. */
export const cleNom = (nom: string): string =>
  nom
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
