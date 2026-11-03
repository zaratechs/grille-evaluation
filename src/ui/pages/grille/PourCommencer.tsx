import { useId } from 'react';
import { Link } from 'react-router';

const STYLE_LIEN = 'font-medium text-marque-700 underline hover:text-marque-800';

/**
 * Première utilisation : trois étapes, de la grille à l'export. Les boutons de la vue
 * sont seulement nommés, pour ne pas avoir deux boutons du même nom sur la page.
 */
export function PourCommencer() {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 rounded-carte border border-marque-700 bg-marque-50 p-5 text-sm leading-relaxed text-texte"
    >
      <h2 id={id} className="text-lg font-semibold text-marque-700">
        Pour commencer
      </h2>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          <strong>Construisez la grille</strong> : partez d’un des 25 modèles avec « Partir d’un
          modèle… », ou ajoutez vos critères un à un avec « Ajouter un critère ».
        </li>
        <li>
          <strong>Ajoutez vos personnes étudiantes</strong> dans la vue{' '}
          <Link to="/groupe" className={STYLE_LIEN}>
            Groupe
          </Link>
          .
        </li>
        <li>
          <strong>Évaluez</strong> chaque personne dans la vue{' '}
          <Link to="/evaluation" className={STYLE_LIEN}>
            Évaluation
          </Link>
          , puis exportez les résultats en PDF, Word ou CSV.
        </li>
      </ol>
      <p>
        Tout est enregistré automatiquement dans ce navigateur. Pour garder une copie ou changer
        d’ordinateur, exportez vos données depuis{' '}
        <Link to="/donnees" className={STYLE_LIEN}>
          Vos données
        </Link>
        .
      </p>
    </section>
  );
}
