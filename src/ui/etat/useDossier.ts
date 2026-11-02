import { createContext, useContext } from 'react';
import type { Dossier, Resultat } from '../../domain';
import type { AvisApp } from './avis';

/** Une opération du domaine, déjà appliquée à ses arguments : `d => changerTitre(d, t)`. */
export type Operation = (dossier: Dossier) => Resultat<Dossier>;

export type EtatDossier = {
  dossier: Dossier;
  /**
   * Applique l'opération au dossier courant et l'enregistre aussitôt. En cas de refus, le
   * dossier ne change pas et le code d'erreur est rendu, pour que le champ l'affiche.
   */
  modifier: (operation: Operation) => Resultat<Dossier>;
  /** Vrai quand un autre onglet a modifié le dossier : plus rien n'est enregistré. */
  lectureSeule: boolean;
  avis: AvisApp[];
  fermerAvis: (cle: AvisApp['cle']) => void;
  /** Texte d'origine d'une sauvegarde réparée ou écartée, à proposer en téléchargement. */
  sauvegardeOrigine: string | undefined;
};

export const ContexteDossier = createContext<EtatDossier | null>(null);

export function useDossier(): EtatDossier {
  const etat = useContext(ContexteDossier);
  if (etat === null) throw new Error('useDossier doit être utilisé dans un DossierProvider.');
  return etat;
}
