import { useEffect, useRef, type KeyboardEvent, type RefObject, type SyntheticEvent } from 'react';

/**
 * Ouvre un `<dialog>` en fenêtre modale (`showModal` : le navigateur piège le focus), place
 * le focus sur `focusInitial`, et le rend à l'élément d'origine à la fermeture.
 * Échap appelle `surFermer` ; l'événement ne remonte pas, pour qu'une confirmation ouverte
 * par-dessus une fenêtre ne ferme qu'elle-même.
 */
export function useModale(
  ouvert: boolean,
  focusInitial: RefObject<HTMLElement | null> | undefined,
  surFermer: () => void,
) {
  const fenetre = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogue = fenetre.current;
    if (!ouvert || !dialogue) return;
    const origine = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogue.showModal();
    focusInitial?.current?.focus();
    return () => {
      dialogue.close();
      origine?.focus();
    };
  }, [ouvert, focusInitial]);

  const fermer = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    surFermer();
  };

  return {
    ref: fenetre,
    // Le navigateur envoie `cancel` sur Échap ; on garde la main pour que l'état React décide.
    onCancel: fermer,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer(e);
    },
  };
}
