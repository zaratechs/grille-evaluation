import type { Etudiant } from '../domain';

/** « 1 évaluation sera effacée. » / « 3 évaluations seront effacées. » */
export const accorder = (n: number, un: string, plusieurs: string): string =>
  `${n} ${n > 1 ? plusieurs : un}`;

/** Ce qu'une suppression effacerait, en phrases ; les nombres nuls sont omis. */
export function phrasesPertes(pertes: {
  evaluations?: number;
  commentaires?: number;
  descripteurs?: number;
}): string[] {
  const { evaluations = 0, commentaires = 0, descripteurs = 0 } = pertes;
  return [
    evaluations > 0 &&
      accorder(evaluations, 'évaluation sera effacée.', 'évaluations seront effacées.'),
    commentaires > 0 &&
      accorder(commentaires, 'commentaire sera effacé.', 'commentaires seront effacés.'),
    descripteurs > 0 &&
      accorder(descripteurs, 'descripteur sera effacé.', 'descripteurs seront effacés.'),
  ].filter((p): p is string => p !== false);
}

/** Ce qu'effacer l'évaluation de cette personne (ou la retirer) ferait perdre. */
export const pertesEtudiant = (e: Etudiant): string[] =>
  phrasesPertes({
    evaluations: Object.keys(e.niveaux).length,
    commentaires:
      Object.values(e.commentaires).filter((c) => c.trim() !== '').length +
      (e.commentaireGeneral.trim() !== '' ? 1 : 0),
  });
