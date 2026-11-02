import { Link } from 'react-router';
import { Vue } from '../../layout';

export function IntrouvablePage() {
  return (
    <Vue titre="Page introuvable">
      <p className="text-texte-attenue">Cette adresse ne correspond à aucune page.</p>
      <p className="mt-6">
        <Link to="/" className="text-sm text-marque-700 underline">
          Revenir à l’accueil
        </Link>
      </p>
    </Vue>
  );
}
