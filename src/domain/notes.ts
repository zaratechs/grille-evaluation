import { POIDS_TOTAL, totalPoids } from './poids';
import type { Dossier, Etudiant, Grille } from './types';

/**
 * Calcul des notes. Voir la spec de la phase 2, section 4.5.
 *
 * La note est la fraction exacte Σ (niveau × poids) / (N × Σ poids), gardée en entiers
 * (numérateur et dénominateur) et arrondie une seule fois, demi vers le haut :
 * pourcentage en dixièmes (875 = 87,5 %), points en centièmes (1750 = 17,50).
 */

export type Note = {
  /** Dixièmes de pour cent. */
  pourcentage: number;
  /** Centièmes de point. */
  points: number;
};

export type ResultatNote =
  | { statut: 'vide' }
  | { statut: 'ponderation-invalide'; totalPoids: number; ecart: number }
  | { statut: 'incomplete'; evalues: number; aEvaluer: number }
  | ({ statut: 'complete'; appreciation: { niveau: number; libelle: string } } & Note);

export type SyntheseGroupe = {
  total: number;
  completes: number;
  moyenne: Note | null;
  mediane: Note | null;
};

/** a / b arrondi demi vers le haut, pour des entiers positifs : aucun calcul à virgule. */
const diviserArrondi = (a: number, b: number): number => Math.floor((2 * a + b) / (2 * b));

/** Note arrondie de la fraction num / den. */
const note = (grille: Grille, num: number, den: number): Note => ({
  pourcentage: diviserArrondi(POIDS_TOTAL * num, den),
  points: diviserArrondi(Math.round(grille.totalPoints * 100) * num, den),
});

type Fraction =
  Exclude<ResultatNote, { statut: 'complete' }> | { statut: 'complete'; num: number; den: number };

/** Numérateur exact de la note ; le dénominateur (N × 1000) est commun à tout le groupe. */
function fraction(grille: Grille, etudiant: Etudiant): Fraction {
  const { criteres, niveaux } = grille;
  if (criteres.length === 0) return { statut: 'vide' };
  const total = totalPoids(criteres);
  if (total !== POIDS_TOTAL) {
    return { statut: 'ponderation-invalide', totalPoids: total, ecart: total - POIDS_TOTAL };
  }
  const ponderes = criteres.filter((c) => c.poids > 0);
  let num = 0;
  let evalues = 0;
  for (const c of ponderes) {
    const niveau = etudiant.niveaux[c.id];
    if (niveau !== undefined) {
      evalues += 1;
      num += niveau * c.poids;
    }
  }
  if (evalues < ponderes.length) {
    return { statut: 'incomplete', evalues, aEvaluer: ponderes.length };
  }
  return { statut: 'complete', num, den: niveaux.length * POIDS_TOTAL };
}

export function calculerResultat(grille: Grille, etudiant: Etudiant): ResultatNote {
  const f = fraction(grille, etudiant);
  if (f.statut !== 'complete') return f;
  // Niveau le plus proche de fraction × N, égalité vers le haut. Chaque niveau vaut au
  // moins 1, donc le résultat est toujours entre 1 et N (vérifié par un test de propriété).
  const niveau = diviserArrondi(f.num * grille.niveaux.length, f.den);
  const libelle = grille.niveaux[niveau - 1] as string;
  return { statut: 'complete', ...note(grille, f.num, f.den), appreciation: { niveau, libelle } };
}

/** Moyenne et médiane des notes complètes du groupe, calculées sur les fractions exactes. */
export function synthese(dossier: Dossier): SyntheseGroupe {
  const { grille, etudiants } = dossier;
  const fractions = etudiants
    .map((e) => fraction(grille, e))
    .filter((f) => f.statut === 'complete');
  const base = { total: etudiants.length, completes: fractions.length };
  const premiere = fractions[0];
  if (premiere === undefined) return { ...base, moyenne: null, mediane: null };

  const { den } = premiere;
  const nums = fractions.map((f) => f.num).sort((a, b) => a - b);
  const somme = nums.reduce((a, b) => a + b, 0);
  // Médiane : la valeur du milieu (nombre impair) ou la moitié des deux du milieu (pair),
  // écrite sur 2 × den pour rester entière dans les deux cas.
  const milieu = Math.floor(nums.length / 2);
  const centre = nums.slice(milieu - 1 + (nums.length % 2), milieu + 1);
  const deuxFoisMediane = (centre.reduce((a, b) => a + b, 0) * 2) / centre.length;
  return {
    ...base,
    moyenne: note(grille, somme, nums.length * den),
    mediane: note(grille, deuxFoisMediane, 2 * den),
  };
}
