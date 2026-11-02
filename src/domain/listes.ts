export type Sens = 'haut' | 'bas';

/** Copie de `entrees` sans la clé `cle`. */
export const sans = <T>(entrees: Record<string, T>, cle: string): Record<string, T> =>
  Object.fromEntries(Object.entries(entrees).filter(([c]) => c !== cle));

/**
 * Échange l'élément `id` avec son voisin. Renvoie `null` si l'élément n'existe pas, et
 * la liste inchangée aux extrémités.
 */
export function deplacer<T extends { id: string }>(
  liste: readonly T[],
  id: string,
  sens: Sens,
): T[] | null {
  const i = liste.findIndex((e) => e.id === id);
  if (i === -1) return null;
  const j = sens === 'haut' ? i - 1 : i + 1;
  const element = liste[i];
  const voisin = liste[j];
  if (element === undefined || voisin === undefined) return [...liste];
  const copie = [...liste];
  copie[i] = voisin;
  copie[j] = element;
  return copie;
}
