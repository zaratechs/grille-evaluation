import { useId, useRef, type ReactNode } from 'react';
import { Bouton, type Variante } from './Bouton';
import { useModale } from './useModale';

type Props = {
  ouvert: boolean;
  titre: string;
  /** Texte de l'action, par exemple « Retirer ». */
  confirmer: string;
  variante?: Variante;
  surConfirmer: () => void;
  surAnnuler: () => void;
  children: ReactNode;
};

/**
 * Fenêtre de confirmation sur `<dialog>` natif (`showModal`) : le navigateur piège le focus.
 * Le focus va sur « Annuler », l'action la plus sûre ; Échap annule ; à la fermeture, le
 * focus revient sur l'élément qui avait ouvert la fenêtre.
 */
export function Dialogue({
  ouvert,
  titre,
  confirmer,
  variante = 'danger',
  surConfirmer,
  surAnnuler,
  children,
}: Props) {
  const annuler = useRef<HTMLButtonElement>(null);
  const modale = useModale(ouvert, annuler, surAnnuler);
  const id = useId();

  if (!ouvert) return null;
  return (
    <dialog
      {...modale}
      aria-labelledby={`${id}-titre`}
      aria-describedby={`${id}-texte`}
      className="m-auto w-full max-w-md rounded-carte border border-bordure bg-surface p-5 text-texte backdrop:bg-texte/40"
    >
      <h2 id={`${id}-titre`} className="text-lg font-semibold">
        {titre}
      </h2>
      <div id={`${id}-texte`} className="mt-2 text-sm">
        {children}
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Bouton ref={annuler} onClick={surAnnuler}>
          Annuler
        </Bouton>
        <Bouton variante={variante} onClick={surConfirmer}>
          {confirmer}
        </Bouton>
      </div>
    </dialog>
  );
}
