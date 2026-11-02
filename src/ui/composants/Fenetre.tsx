import { useId, useRef, type ReactNode, type RefObject } from 'react';
import { Bouton } from './Bouton';
import { useModale } from './useModale';

type Props = {
  ouvert: boolean;
  titre: string;
  surFermer: () => void;
  /** L'élément qui reçoit le focus à l'ouverture ; sinon, le bouton « Fermer ». */
  focusInitial?: RefObject<HTMLElement | null>;
  children: ReactNode;
};

/** Fenêtre modale générique (choix d'un modèle, enregistrement…), avec « Fermer ». */
export function Fenetre({ ouvert, titre, surFermer, focusInitial, children }: Props) {
  const fermer = useRef<HTMLButtonElement>(null);
  const modale = useModale(ouvert, focusInitial ?? fermer, surFermer);
  const id = useId();
  if (!ouvert) return null;
  return (
    <dialog
      {...modale}
      aria-labelledby={id}
      className="m-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-carte border border-bordure bg-surface p-5 text-texte backdrop:bg-texte/40"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id={id} className="text-lg font-semibold">
          {titre}
        </h2>
        <Bouton ref={fermer} onClick={surFermer}>
          Fermer
        </Bouton>
      </div>
      <div className="mt-4">{children}</div>
    </dialog>
  );
}
