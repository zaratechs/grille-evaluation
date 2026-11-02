import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { useDossier } from '../etat';

type Props = { titre: string; children: ReactNode };

/**
 * Cadre commun à chaque vue : un `<h1>`, le titre du document et le focus.
 * Après une navigation (lien ou bouton Précédent), le focus va sur le `<h1>`, pour qu'un
 * lecteur d'écran annonce la nouvelle vue. Au premier affichage et après une redirection,
 * il reste en haut de la page, où le lien d'évitement est le premier arrêt.
 * En lecture seule (autre onglet), tous les champs de la vue sont désactivés.
 */
export function Vue({ titre, children }: Props) {
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
    <section>
      <h1 ref={entete} tabIndex={-1} className="text-2xl font-semibold text-texte">
        {titre}
      </h1>
      <fieldset disabled={lectureSeule} className="m-0 mt-6 min-w-0 border-0 p-0">
        {children}
      </fieldset>
    </section>
  );
}
