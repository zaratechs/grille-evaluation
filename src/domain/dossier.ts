import { NIVEAUX_PAR_DEFAUT } from './niveaux';
import { ok, erreur, type Resultat } from './resultat';
import type { Dossier } from './types';

export const TITRE_LONGUEUR_MAX = 200;
export const TOTAL_POINTS_MAX = 1000;

/** Un dossier neuf : grille vide aux 5 niveaux par défaut, note sur 100, groupe vide. */
export const dossierVide = (): Dossier => ({
  version: 1,
  grille: { titre: '', totalPoints: 100, niveaux: [...NIVEAUX_PAR_DEFAUT], criteres: [] },
  etudiants: [],
  modelesPerso: [],
});

/** Le titre est gardé tel quel (il peut être vide). */
export function changerTitre(dossier: Dossier, titre: string): Resultat<Dossier> {
  if (titre.length > TITRE_LONGUEUR_MAX) return erreur('nom-trop-long');
  return ok({ ...dossier, grille: { ...dossier.grille, titre } });
}

/** De 0,01 à 1000, au plus 2 décimales. */
const totalValide = (total: number): boolean =>
  Number.isFinite(total) &&
  total >= 0.01 &&
  total <= TOTAL_POINTS_MAX &&
  Math.abs(total * 100 - Math.round(total * 100)) < 1e-9;

const FORMAT_TOTAL = /^(\d{1,4})(?:[.,](\d{1,2}))?$/;

/** Lit une saisie (« 12,5 », « 20 ») et la convertit en nombre. */
export function lireTotalPoints(texte: string): Resultat<number> {
  const correspondance = FORMAT_TOTAL.exec(texte.trim());
  if (!correspondance) return erreur('total-points-invalide');
  const [, entiers = '0', decimales = '0'] = correspondance;
  const total = Number(`${entiers}.${decimales}`);
  return totalValide(total) ? ok(total) : erreur('total-points-invalide');
}

export function changerTotalPoints(dossier: Dossier, totalPoints: number): Resultat<Dossier> {
  if (!totalValide(totalPoints)) return erreur('total-points-invalide');
  return ok({ ...dossier, grille: { ...dossier.grille, totalPoints } });
}
