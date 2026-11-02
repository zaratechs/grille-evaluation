/** Longueur maximale de la partie « titre » du nom de fichier. */
export const TITRE_FICHIER_MAX = 60;

/** « Travail de session — Hiver ! » → « travail-de-session-hiver » : sans accents ni espaces. */
function simplifier(titre: string): string {
  return (
    titre
      .toLowerCase()
      // Ligatures que la décomposition Unicode ne sépare pas.
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, TITRE_FICHIER_MAX)
      .replace(/-+$/, '')
  );
}

const deuxChiffres = (n: number): string => String(n).padStart(2, '0');

/**
 * Date du jour en heure locale (AAAA-MM-JJ). Pas `toISOString()`, qui donne la date UTC :
 * au Québec, le lendemain dès 19 h ou 20 h.
 */
const dateLocale = (date: Date): string =>
  `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}`;

/** Nom sûr pour un fichier exporté : `grille-<titre>-<AAAA-MM-JJ>.<extension>`. */
export function nomFichier(titre: string, date: Date, extension: string): string {
  const partie = simplifier(titre);
  const ext = extension.replace(/^\./, '');
  return `grille-${partie === '' ? '' : `${partie}-`}${dateLocale(date)}.${ext}`;
}
