import { useMemo, useState, type ReactNode } from 'react';
import { ContexteSelection } from './useSelection';

/** Garde la personne choisie quand on passe d'une vue à l'autre. */
export function SelectionProvider({ children }: { children: ReactNode }) {
  const [personne, choisirPersonne] = useState<string | null>(null);
  const valeur = useMemo(() => ({ personne, choisirPersonne }), [personne]);
  return <ContexteSelection value={valeur}>{children}</ContexteSelection>;
}
