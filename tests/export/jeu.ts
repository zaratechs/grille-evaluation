import { dossierVide, type Dossier, type Etudiant } from '../../src/domain';

/**
 * Jeu d'essai commun aux tests du contenu, du CSV, du Word et du PDF : les quatre doivent
 * dire la même chose. Grille de 20 points : Fond 60 %, Forme 40 %, Bonus 0 % (non noté).
 *
 * - Élise Roy : Fond 5, Forme 3 → 4200 / 5000 = 84,0 %, 16,80 points, « Très bon » ;
 * - Nguyễn Văn An : Fond 4, Forme 4 → 80,0 %, 16,00 points, « Très bon » ;
 * - Noé Tremblay : Fond 4 seulement → incomplète (1 critère sur 2) ;
 * - Łukasz Nowak : rien → pas encore évaluée.
 *
 * Synthèse : 2 complètes sur 4 ; moyenne et médiane 16,40 / 20 points (82,0 %).
 */
const personne = (id: string, nom: string, champs: Partial<Etudiant> = {}): Etudiant => ({
  id,
  nom,
  niveaux: {},
  commentaires: {},
  commentaireGeneral: '',
  ...champs,
});

export function jeu(): Dossier {
  return {
    ...dossierVide(),
    grille: {
      ...dossierVide().grille,
      titre: 'Travail de session',
      totalPoints: 20,
      criteres: [
        {
          id: 'c1',
          nom: 'Fond',
          poids: 600,
          descripteurs: ['Hors sujet.', 'Superficiel.', 'Juste.', 'Solide.', 'Remarquable.'],
        },
        { id: 'c2', nom: 'Forme', poids: 400, descripteurs: ['', '', 'Correcte.', '', ''] },
        { id: 'c3', nom: 'Bonus', poids: 0, descripteurs: ['', '', '', '', ''] },
      ],
    },
    etudiants: [
      personne('e1', 'Élise Roy', {
        niveaux: { c1: 5, c2: 3 },
        commentaires: { c1: 'Clair.' },
        commentaireGeneral: 'Très bon travail.',
      }),
      personne('e2', 'Nguyễn Văn An', { niveaux: { c1: 4, c2: 4 } }),
      personne('e3', 'Noé Tremblay', { niveaux: { c1: 4 } }),
      personne('e4', 'Łukasz Nowak'),
    ],
  };
}

/** Lundi 2 novembre 2026, 20 h 30 au Québec (déjà le 3 en UTC). */
export const DATE = new Date('2026-11-03T01:30:00Z');
