import { Link, NavLink, Outlet } from 'react-router';
import { DossierProvider, SelectionProvider } from '../etat';
import { BandeAvis } from './BandeAvis';
import { Footer } from './Footer';

const VUES = [
  ['/grille', 'Grille'],
  ['/evaluation', 'Évaluation'],
  ['/groupe', 'Groupe'],
  ['/donnees', 'Données'],
] as const;

/** Coquille : en-tête et navigation, avis, vue courante, pied de page. */
export function AppShell() {
  return (
    <DossierProvider>
      <SelectionProvider>
        <div className="flex min-h-screen flex-col">
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-champ focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-marque-700"
          >
            Aller au contenu
          </a>
          <header className="border-b border-bordure bg-surface">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
              <Link to="/" className="text-base font-semibold text-marque-700 hover:underline">
                Grille d’évaluation
              </Link>
              <nav aria-label="Vues">
                <ul className="flex flex-wrap gap-1">
                  {VUES.map(([chemin, nom]) => (
                    <li key={chemin}>
                      <NavLink
                        to={chemin}
                        className={({ isActive }) =>
                          `block rounded-champ px-3 py-1.5 text-sm ${
                            isActive
                              ? 'bg-marque-50 font-semibold text-marque-700'
                              : 'text-texte hover:bg-surface-attenue'
                          }`
                        }
                      >
                        {nom}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </header>
          <BandeAvis />
          <main id="contenu" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            <Outlet />
          </main>
          <Footer />
        </div>
      </SelectionProvider>
    </DossierProvider>
  );
}
