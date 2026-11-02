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

/** Coupe un nom à `max` caractères, sans espace final. */
export const couper = (nom: string, max: number): string => nom.slice(0, max).trimEnd();

/**
 * Ajoute « (2) », « (3) »… jusqu'à obtenir un nom dont la clé est absente de `vus`, puis
 * réserve cette clé. Le suffixe reste sous la limite de longueur.
 */
export function nomUnique(nom: string, vus: Set<string>): string {
  let candidat = nom;
  for (let n = 2; vus.has(cleNom(candidat)); n++) {
    const suffixe = ` (${n})`;
    candidat = `${couper(nom, NOM_LONGUEUR_MAX - suffixe.length)}${suffixe}`;
  }
  vus.add(cleNom(candidat));
  return candidat;
}
