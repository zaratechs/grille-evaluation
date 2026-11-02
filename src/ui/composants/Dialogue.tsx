import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Bouton, type Variante } from './Bouton';

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
  const fenetre = useRef<HTMLDialogElement>(null);
  const annuler = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    const dialogue = fenetre.current;
    if (!ouvert || !dialogue) return;
    const origine = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogue.showModal();
    annuler.current?.focus();
    return () => {
      dialogue.close();
      origine?.focus();
    };
  }, [ouvert]);

  if (!ouvert) return null;
  return (
    <dialog
      ref={fenetre}
      aria-labelledby={`${id}-titre`}
      aria-describedby={`${id}-texte`}
      // Échap : on garde la main pour que l'état React décide de la fermeture.
      onCancel={(e) => {
        e.preventDefault();
        surAnnuler();
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        surAnnuler();
      }}
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
