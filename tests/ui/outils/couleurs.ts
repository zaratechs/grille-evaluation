// Outils de test pour les couleurs : lecture des tokens, contraste WCAG, détection des hex.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * Un hex CSS (#rgb, #rgba, #rrggbb, #rrggbbaa) : ni précédé de « & » (entité HTML),
 * ni suivi d'une lettre ou d'un chiffre (ancre « #accueil »).
 */
const HEX = /(?<!&)#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![0-9a-z_-])/gi;

export function trouverHex(contenu: string): string[] {
  return contenu.match(HEX) ?? [];
}

/** Lit les `--color-*` d'un fichier de tokens ; résout les `var(--color-*)` simples. */
export function lireTokens(css: string): Record<string, string> {
  const brut: Record<string, string> = {};
  for (const m of css.matchAll(/--color-([\w-]+)\s*:\s*([^;]+);/g)) {
    const [, nom, valeur] = m;
    if (nom && valeur) brut[nom] = valeur.trim();
  }
  const resolu: Record<string, string> = {};
  for (const [nom, valeur] of Object.entries(brut)) {
    const ref = /^var\(--color-([\w-]+)\)$/.exec(valeur);
    resolu[nom] = ref?.[1] ? (brut[ref[1]] ?? valeur) : valeur;
  }
  return resolu;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`Couleur non prise en charge : ${hex}`);
  const canaux = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canaux.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/** Rapport de contraste WCAG 2.x entre deux couleurs #rrggbb (de 1 à 21). */
export function contraste(a: string, b: string): number {
  const [clair, fonce] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((clair ?? 0) + 0.05) / ((fonce ?? 0) + 0.05);
}

/** Liste récursive des fichiers d'un dossier, filtrés par extension. */
export function listerFichiers(dossier: string, extensions: string[]): string[] {
  const acc: string[] = [];
  let noms: string[];
  try {
    noms = readdirSync(dossier);
  } catch {
    return acc;
  }
  for (const nom of noms) {
    const complet = join(dossier, nom);
    if (statSync(complet).isDirectory()) acc.push(...listerFichiers(complet, extensions));
    else if (extensions.includes(extname(nom))) acc.push(complet);
  }
  return acc;
}

export const lire = (chemin: string) => readFileSync(chemin, 'utf8');
