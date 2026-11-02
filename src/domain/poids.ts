import { ok, erreur, type Resultat } from './resultat';

/** 100 % exprimé en dixièmes de pour cent : les poids sont des entiers de 0 à 1000. */
export const POIDS_TOTAL = 1000;

/** Un nombre de 0 à 100, avec au plus une décimale (virgule ou point). */
const FORMAT_POIDS = /^(\d{1,3})(?:[.,](\d))?$/;

/** Lit une saisie (« 16,7 », « 16.7 ») et la convertit en dixièmes entiers (167). */
export function lirePoids(texte: string): Resultat<number> {
  const correspondance = FORMAT_POIDS.exec(texte.trim());
  if (!correspondance) return erreur('poids-invalide');
  const [, entiers = '0', decimale = '0'] = correspondance;
  const dixiemes = Number(entiers) * 10 + Number(decimale);
  return dixiemes <= POIDS_TOTAL ? ok(dixiemes) : erreur('poids-invalide');
}

/**
 * Répartit 100 % entre `n` critères, en entiers : chacun reçoit le quotient et le reste va
 * aux premiers. La somme vaut toujours exactement 1000.
 */
export function egaliserPoids(n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(POIDS_TOTAL / n);
  const reste = POIDS_TOTAL % n;
  return Array.from({ length: n }, (_, i) => (i < reste ? base + 1 : base));
}

export const totalPoids = (criteres: readonly { poids: number }[]): number =>
  criteres.reduce((somme, c) => somme + c.poids, 0);

export const ponderationValide = (criteres: readonly { poids: number }[]): boolean =>
  totalPoids(criteres) === POIDS_TOTAL;
