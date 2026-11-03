import { createContext, useContext } from 'react';

export type EtatSelection = {
  /** La dernière personne évaluée, gardée le temps de la visite (en mémoire seulement). */
  personne: string | null;
  choisirPersonne: (id: string) => void;
};

export const ContexteSelection = createContext<EtatSelection | null>(null);

export function useSelection(): EtatSelection {
  const etat = useContext(ContexteSelection);
  if (etat === null) throw new Error('useSelection doit être utilisé dans un SelectionProvider.');
  return etat;
}
