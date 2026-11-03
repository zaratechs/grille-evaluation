import {
  calculerResultat,
  erreur,
  formaterPoids,
  formaterPoints,
  formaterPourcentage,
  ok,
  synthese,
  type Dossier,
  type Etudiant,
  type Resultat,
  type ResultatNote,
} from '../domain';
import { dateEnLettres, phrasesSynthese, texteResultat, texteTotal } from '../textes';

/**
 * Contenu des documents exportés (spec de la phase 5, section 4) : tout ce qui sera écrit,
 * déjà en texte. Les rendus PDF, Word et CSV ne font que la mise en forme, et ne calculent
 * rien : la note et les phrases sont celles de l'écran.
 */

export type Statut =
  'Complète' | 'Incomplète' | 'Pas encore évaluée' | 'Note impossible' | 'Aucun critère';

export type LigneCritere = {
  critere: string;
  /** « 60,0 % », ou « non noté » pour un poids 0. */
  poids: string;
  /** « 5 Excellent », ou « — » si le critère n'est pas évalué. */
  niveau: string;
  /** Le niveau en chiffre, pour le CSV ; `null` s'il n'est pas évalué. */
  numero: number | null;
  /** Le descripteur du niveau obtenu ; vide s'il n'y en a pas. */
  descripteur: string;
  commentaire: string;
};

/** Les nombres d'une note complète, sans unité, pour le CSV. */
export type Chiffres = { points: string; sur: string; pourcentage: string; appreciation: string };

export type RapportPersonne = {
  titre: string;
  personne: string;
  date: string;
  statut: Statut;
  /** Le texte de l'écran : « 16,80 / 20 points · 84,0 % · Très bon », « Incomplète : … »… */
  resultat: string;
  /** `null` si l'évaluation n'est pas complète : aucune note inventée. */
  chiffres: Chiffres | null;
  criteres: LigneCritere[];
  /** `null` si vide : la section n'est pas écrite. */
  commentaireGeneral: string | null;
};

export type RapportGroupe = {
  titre: string;
  date: string;
  /** Total de points de la grille : « 20 ». */
  sur: string;
  /** Noms des critères, dans l'ordre de la grille (colonnes du CSV). */
  criteres: string[];
  /** Les phrases de la synthèse, comme à l'écran. */
  synthese: string[];
  personnes: RapportPersonne[];
};

const TITRE_PAR_DEFAUT = 'Grille d’évaluation';

const titre = (dossier: Dossier): string => dossier.grille.titre.trim() || TITRE_PAR_DEFAUT;

function statut(r: ResultatNote): Statut {
  switch (r.statut) {
    case 'vide':
      return 'Aucun critère';
    case 'ponderation-invalide':
      return 'Note impossible';
    case 'incomplete':
      return r.evalues === 0 ? 'Pas encore évaluée' : 'Incomplète';
    case 'complete':
      return 'Complète';
  }
}

/** « 84,0 % » → « 84,0 » */
const sansPourcent = (texte: string): string => texte.replace(/\u00a0%$/, '');

function rapport(dossier: Dossier, e: Etudiant, date: Date): RapportPersonne {
  const { grille } = dossier;
  const r = calculerResultat(grille, e);
  const general = e.commentaireGeneral.trim() === '' ? null : e.commentaireGeneral;
  return {
    titre: titre(dossier),
    personne: e.nom,
    date: dateEnLettres(date),
    statut: statut(r),
    resultat: texteResultat(grille, r),
    chiffres:
      r.statut === 'complete'
        ? {
            points: formaterPoints(r.points),
            sur: texteTotal(grille),
            pourcentage: sansPourcent(formaterPourcentage(r.pourcentage)),
            appreciation: r.appreciation.libelle,
          }
        : null,
    criteres: grille.criteres.map((c) => {
      // Le domaine garantit un niveau de 1 à N et un descripteur par niveau.
      const n = e.niveaux[c.id];
      return {
        critere: c.nom,
        poids: c.poids === 0 ? 'non noté' : formaterPoids(c.poids),
        niveau: n === undefined ? '—' : `${n} ${grille.niveaux[n - 1] as string}`,
        numero: n ?? null,
        descripteur: n === undefined ? '' : (c.descripteurs[n - 1] as string),
        commentaire: e.commentaires[c.id] ?? '',
      };
    }),
    commentaireGeneral: general,
  };
}

/** Le contenu du document d'une personne. */
export function rapportPersonne(
  dossier: Dossier,
  id: string,
  date: Date,
): Resultat<RapportPersonne> {
  const e = dossier.etudiants.find((x) => x.id === id);
  return e ? ok(rapport(dossier, e, date)) : erreur('etudiant-introuvable');
}

/** Le contenu du document du groupe : synthèse, puis chaque personne dans l'ordre. */
export function rapportGroupe(dossier: Dossier, date: Date): RapportGroupe {
  const { grille } = dossier;
  return {
    titre: titre(dossier),
    date: dateEnLettres(date),
    sur: texteTotal(grille),
    criteres: grille.criteres.map((c) => c.nom),
    synthese: phrasesSynthese(grille, synthese(dossier)),
    personnes: dossier.etudiants.map((e) => rapport(dossier, e, date)),
  };
}
