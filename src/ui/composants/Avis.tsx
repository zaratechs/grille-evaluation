import type { ReactNode } from 'react';
import { Bouton } from './Bouton';

export type ActionAvis = { libelle: string; action: () => void };

type Props = {
  /** « alerte » : annoncé tout de suite (`role="alert"`) ; « info » : poliment (`role="status"`). */
  importance: 'alerte' | 'info';
  actions?: ActionAvis[];
  surFermer?: () => void;
  children: ReactNode;
};

const STYLES = {
  alerte: 'border-statut-avertissement bg-statut-avertissement-fond text-statut-avertissement',
  info: 'border-statut-info bg-statut-info-fond text-statut-info',
};

/** Bande d'avis : un texte, des actions éventuelles, et « Fermer » s'il peut être fermé. */
export function Avis({ importance, actions = [], surFermer, children }: Props) {
  return (
    <div
      role={importance === 'alerte' ? 'alert' : 'status'}
      className={`flex flex-wrap items-center gap-3 rounded-carte border px-4 py-3 text-sm ${STYLES[importance]}`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {actions.map(({ libelle, action }) => (
        <Bouton key={libelle} onClick={action}>
          {libelle}
        </Bouton>
      ))}
      {surFermer && (
        <Bouton onClick={surFermer} aria-label="Fermer l’avis">
          Fermer
        </Bouton>
      )}
    </div>
  );
}
