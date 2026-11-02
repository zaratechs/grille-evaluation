import { Link, Outlet } from 'react-router';
import { Footer } from './Footer';

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-champ focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-marque-700"
      >
        Aller au contenu
      </a>
      <header className="border-b border-bordure bg-surface">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
          <Link to="/" className="text-base font-semibold text-marque-700 hover:underline">
            Grille d’évaluation
          </Link>
        </div>
      </header>
      <main id="contenu" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
