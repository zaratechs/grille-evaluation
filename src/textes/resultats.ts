import {
  formaterPoids,
  formaterPoints,
  formaterPourcentage,
  ponderationValide,
  totalPoids,
  type Grille,
  type Note,
  type ResultatNote,
  type SyntheseGroupe,
} from '../domain';
import { accorder } from './accords';

/** 20 → « 20 », 20,5 → « 20,5 » : le total de points de la grille. */
export const texteTotal = (grille: Grille): string => String(grille.totalPoints).replace('.', ',');

/** « 16,00 / 20 points (80,0 %) » */
export const texteNote = (grille: Grille, n: Note): string =>
  `${formaterPoints(n.points)} / ${texteTotal(grille)} points (${formaterPourcentage(n.pourcentage)})`;

/** Le résultat d'une personne, pour chacun des quatre statuts du domaine. */
export function texteResultat(grille: Grille, r: ResultatNote): string {
  switch (r.statut) {
    case 'vide':
      // « vide » : la grille n'a encore aucun critère.
      return 'Aucun critère dans la grille';
    case 'ponderation-invalide':
      return `Note impossible : les poids font ${formaterPoids(r.totalPoids)}`;
    case 'incomplete':
      if (r.evalues === 0) return 'Pas encore évaluée';
      return `Incomplète : ${accorder(r.evalues, 'critère', 'critères')} sur ${r.aEvaluer} ${
        r.evalues > 1 ? 'évalués' : 'évalué'
      }`;
    case 'complete':
      return `${formaterPoints(r.points)} / ${texteTotal(grille)} points · ${formaterPourcentage(
        r.pourcentage,
      )} · ${r.appreciation.libelle}`;
  }
}

/** « 2 évaluations complètes sur 4 », moyenne et médiane ; ou « Aucune évaluation complète sur 4. » */
export function phrasesSynthese(grille: Grille, s: SyntheseGroupe): string[] {
  // Même phrase que pour une personne : sans poids valides, aucune note n'est calculée.
  if (grille.criteres.length > 0 && !ponderationValide(grille.criteres)) {
    return [`Note impossible : les poids font ${formaterPoids(totalPoids(grille.criteres))}`];
  }
  if (!s.moyenne || !s.mediane) return [`Aucune évaluation complète sur ${s.total}.`];
  return [
    `${accorder(s.completes, 'évaluation complète', 'évaluations complètes')} sur ${s.total}`,
    `Moyenne : ${texteNote(grille, s.moyenne)}`,
    `Médiane : ${texteNote(grille, s.mediane)}`,
  ];
}
