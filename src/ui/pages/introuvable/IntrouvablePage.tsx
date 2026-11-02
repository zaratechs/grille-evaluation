import { Link } from 'react-router';

export function IntrouvablePage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-texte">Page introuvable</h1>
      <p className="mt-3 text-texte-attenue">Cette adresse ne correspond à aucune page.</p>
      <p className="mt-6">
        <Link to="/" className="text-sm text-marque-700 underline">
          Revenir à l’accueil
        </Link>
      </p>
    </section>
  );
}
