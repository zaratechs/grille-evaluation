import {
  formaterPoids,
  formaterPoints,
  formaterPourcentage,
  type Grille,
  type Note,
  type ResultatNote,
} from '../domain';
import { accorder } from './accords';

/** 20 → « 20 », 20,5 → « 20,5 » : le total de points de la grille. */
const total = (grille: Grille) => String(grille.totalPoints).replace('.', ',');

/** « 16,00 / 20 points (80,0 %) » */
export const texteNote = (grille: Grille, n: Note): string =>
  `${formaterPoints(n.points)} / ${total(grille)} points (${formaterPourcentage(n.pourcentage)})`;

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
      return `${formaterPoints(r.points)} / ${total(grille)} points · ${formaterPourcentage(
        r.pourcentage,
      )} · ${r.appreciation.libelle}`;
  }
}
