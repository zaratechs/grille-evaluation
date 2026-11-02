import { lireNom } from './noms';
import { ok, erreur, type Resultat } from './resultat';
import type { Dossier } from './types';

export const NIVEAUX_MIN = 3;
export const NIVEAUX_MAX = 10;

/** Libellés de l'outil d'origine ; index 0 = niveau 1 (le plus faible). */
export const NIVEAUX_PAR_DEFAUT: readonly string[] = Object.freeze([
  'Insatisfaisant',
  'Faible',
  'Satisfaisant',
  'Très bon',
  'Excellent',
]);

/** Un niveau est un entier de 1 au nombre de niveaux de la grille. */
export const niveauValide = (dossier: Dossier, niveau: number): boolean =>
  Number.isInteger(niveau) && niveau >= 1 && niveau <= dossier.grille.niveaux.length;

/** Ajoute un niveau en haut (nouveau maximum) et un descripteur vide à chaque critère. */
export function ajouterNiveau(dossier: Dossier): Resultat<Dossier> {
  const { grille } = dossier;
  if (grille.niveaux.length >= NIVEAUX_MAX) return erreur('niveaux-maximum');
  return ok({
    ...dossier,
    grille: {
      ...grille,
      niveaux: [...grille.niveaux, `Niveau ${grille.niveaux.length + 1}`],
      criteres: grille.criteres.map((c) => ({ ...c, descripteurs: [...c.descripteurs, ''] })),
    },
  });
}

/**
 * Retire le niveau le plus haut et son descripteur. Les évaluations à ce niveau sont
 * effacées (sinon la note dépasserait 100 %) ; leur nombre est renvoyé pour que
 * l'interface puisse prévenir.
 */
export function retirerNiveau(
  dossier: Dossier,
): Resultat<{ dossier: Dossier; evaluationsEffacees: number }> {
  const { grille } = dossier;
  if (grille.niveaux.length <= NIVEAUX_MIN) return erreur('niveaux-minimum');
  const retire = grille.niveaux.length;
  let evaluationsEffacees = 0;
  const etudiants = dossier.etudiants.map((e) => {
    const niveaux = Object.fromEntries(Object.entries(e.niveaux).filter(([, n]) => n !== retire));
    evaluationsEffacees += Object.keys(e.niveaux).length - Object.keys(niveaux).length;
    return { ...e, niveaux };
  });
  return ok({
    dossier: {
      ...dossier,
      grille: {
        ...grille,
        niveaux: grille.niveaux.slice(0, -1),
        criteres: grille.criteres.map((c) => ({ ...c, descripteurs: c.descripteurs.slice(0, -1) })),
      },
      etudiants,
    },
    evaluationsEffacees,
  });
}

/** Renomme le niveau `niveau` (de 1 à N). */
export function renommerNiveau(
  dossier: Dossier,
  niveau: number,
  libelle: string,
): Resultat<Dossier> {
  if (!niveauValide(dossier, niveau)) return erreur('niveau-invalide');
  const nom = lireNom(libelle);
  if (!nom.ok) return nom;
  const niveaux = dossier.grille.niveaux.map((l, i) => (i === niveau - 1 ? nom.valeur : l));
  return ok({ ...dossier, grille: { ...dossier.grille, niveaux } });
}
