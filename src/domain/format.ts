/**
 * Format français des nombres, sans `Intl` : le résultat est identique sur tous les
 * navigateurs et dans tous les exports. Les valeurs reçues sont des entiers déjà arrondis
 * (dixièmes de pour cent, centièmes de point), éventuellement négatifs (écart de pondération).
 */

/** Espace insécable : sépare les milliers et précède « % ». */
const NBSP = '\u00A0';

/** Écrit `entier / 10^decimales` avec une virgule et les milliers séparés. */
function decimal(entier: number, decimales: number): string {
  const signe = entier < 0 ? '-' : '';
  const chiffres = String(Math.abs(entier)).padStart(decimales + 1, '0');
  const partieEntiere = chiffres.slice(0, -decimales).replace(/\B(?=(\d{3})+$)/g, NBSP);
  return `${signe}${partieEntiere},${chiffres.slice(-decimales)}`;
}

/** 167 → « 16,7 % » */
export const formaterPoids = (dixiemes: number): string => `${decimal(dixiemes, 1)}${NBSP}%`;

/** 875 → « 87,5 % » */
export const formaterPourcentage = (dixiemes: number): string => formaterPoids(dixiemes);

/** 1750 → « 17,50 » */
export const formaterPoints = (centiemes: number): string => decimal(centiemes, 2);
