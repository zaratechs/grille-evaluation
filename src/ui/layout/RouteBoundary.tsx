import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router';

export function RouteBoundary() {
  const erreur = useRouteError();
  // Trace pour le débogage ; la personne ne voit que le message.
  useEffect(() => {
    console.error('RouteBoundary a capturé :', erreur);
  }, [erreur]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-texte">Cette page a rencontré une erreur</h1>
      <p className="mt-3 text-texte-attenue">
        Vos données enregistrées ne sont pas touchées. Rechargez la page pour réessayer.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-champ bg-marque-700 px-4 py-2 text-sm font-medium text-surface hover:bg-marque-800"
        >
          Recharger la page
        </button>
        <Link to="/" className="text-sm text-marque-700 underline">
          Revenir à l’accueil
        </Link>
      </div>
    </div>
  );
}
