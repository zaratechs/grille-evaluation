const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

/** « 2 novembre 2026 », « 1er décembre 2026 » : la date du jour à l'heure locale. */
export function dateEnLettres(date: Date): string {
  const jour = date.getDate();
  return `${jour === 1 ? '1er' : jour} ${MOIS[date.getMonth()] as string} ${date.getFullYear()}`;
}
