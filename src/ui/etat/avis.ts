import type { Chargement } from '../../data-access';
import { MESSAGES_AVERTISSEMENT, MESSAGES_ERREUR, phrasesBilan } from '../messages';

/**
 * Avis de l'application, décrits sans React : les actions sont des noms, que la bande
 * d'avis relie aux bons gestes (télécharger, recharger, exporter, aller à Données).
 */
export type ActionAvisApp = 'telecharger-originale' | 'recharger' | 'exporter' | 'aller-donnees';

export type AvisApp = {
  /** Un seul avis par clé : un nouvel avis remplace celui de même clé. */
  cle: 'chargement' | 'ecriture' | 'autre-onglet';
  importance: 'alerte' | 'info';
  texte: string;
  details: string[];
  actions: ActionAvisApp[];
  fermable: boolean;
};

/** L'avis à afficher après le chargement, ou rien si la sauvegarde a été lue sans souci. */
export function avisChargement(chargement: Chargement): AvisApp | null {
  const { avertissement, bilan } = chargement;
  if (avertissement === undefined) return null;
  const refuse = avertissement === 'lecture-impossible';
  return {
    cle: 'chargement',
    importance: 'alerte',
    texte: MESSAGES_AVERTISSEMENT[avertissement],
    details: bilan ? phrasesBilan(bilan) : [],
    // Stockage refusé : rien à télécharger, mais il faut exporter avant de fermer la page.
    actions: refuse ? ['aller-donnees'] : ['telecharger-originale'],
    fermable: !refuse,
  };
}

export const AVIS_ECRITURE: AvisApp = {
  cle: 'ecriture',
  importance: 'alerte',
  texte: `${MESSAGES_ERREUR['ecriture-impossible']} Exportez votre dossier pour ne pas le perdre.`,
  details: [],
  actions: ['exporter'],
  fermable: false,
};

export const AVIS_AUTRE_ONGLET: AvisApp = {
  cle: 'autre-onglet',
  importance: 'alerte',
  texte:
    'Ce dossier a été modifié dans un autre onglet. Cet onglet n’enregistre plus : rechargez la page pour reprendre le travail le plus récent.',
  details: [],
  actions: ['recharger'],
  fermable: false,
};

/** Ajoute un avis, en remplaçant celui de même clé. */
export const avecAvis = (liste: readonly AvisApp[], avis: AvisApp): AvisApp[] => [
  ...liste.filter((a) => a.cle !== avis.cle),
  avis,
];

export const sansAvis = (liste: readonly AvisApp[], cle: AvisApp['cle']): AvisApp[] =>
  liste.filter((a) => a.cle !== cle);
