import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { useDossier } from '../etat';

type Props = {
  titre: string;
  /** Placé avant les champs et jamais désactivé : seulement ce qui ne modifie rien. */
  outils?: ReactNode;
  /**
   * Comme `outils`, mais collée en bas de l'écran sur téléphone (sous 480 px), à portée du
   * pouce ; elle se pose à la fin de la vue, sans masquer le dernier champ.
   */
  barre?: ReactNode;
  children: ReactNode;
};

/**
 * Cadre commun à chaque vue : un `<h1>`, le titre du document et le focus.
 * Après une navigation (lien ou bouton Précédent), le focus va sur le `<h1>`, pour qu'un
 * lecteur d'écran annonce la nouvelle vue. Au premier affichage et après une redirection,
 * il reste en haut de la page, où le lien d'évitement est le premier arrêt.
 * En lecture seule (autre onglet), tous les champs de la vue sont désactivés, sauf ceux
 * de `outils` (par exemple, changer de personne).
 */
export function Vue({ titre, outils, barre, children }: Props) {
  const { lectureSeule } = useDossier();
  const entete = useRef<HTMLHeadingElement>(null);
  const type = useNavigationType();
  const { key } = useLocation();

  useEffect(() => {
    document.title = `${titre} — Grille d’évaluation`;
  }, [titre]);

  useEffect(() => {
    // La première adresse porte la clé « default » ; une redirection est un REPLACE.
    if (type === 'PUSH' || (type === 'POP' && key !== 'default')) entete.current?.focus();
  }, [key, type]);

  return (
    <section className="flex flex-col">
      <h1 ref={entete} tabIndex={-1} className="text-2xl font-semibold text-texte">
        {titre}
      </h1>
      {outils !== undefined && <div className="mt-6">{outils}</div>}
      {barre !== undefined && (
        <div className="mt-3 max-[480px]:sticky max-[480px]:bottom-0 max-[480px]:z-10 max-[480px]:order-last max-[480px]:mt-6 max-[480px]:border-t max-[480px]:border-bordure max-[480px]:bg-surface max-[480px]:py-2">
          {barre}
        </div>
      )}
      <fieldset disabled={lectureSeule} className="m-0 mt-6 min-w-0 border-0 p-0">
        {children}
      </fieldset>
    </section>
  );
}
