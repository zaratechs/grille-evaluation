import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../../app/routes';
import { CLE_DOSSIER } from '../../src/data-access';

function monterA(chemin: string) {
  const router = createMemoryRouter(routes, { initialEntries: [chemin] });
  render(<RouterProvider router={router} />);
  return router;
}

const titre = () => screen.getByRole('heading', { level: 1 });
const navigation = () => screen.getByRole('navigation', { name: 'Vues' });

const VUES = [
  ['/grille', 'Grille'],
  ['/evaluation', 'Évaluation'],
  ['/groupe', 'Groupe'],
  ['/donnees', 'Vos données'],
] as const;

describe('routes', () => {
  it('/ mène à la Grille', () => {
    const router = monterA('/');
    expect(router.state.location.pathname).toBe('/grille');
    expect(titre()).toHaveTextContent('Grille');
  });

  it.each(VUES)('%s : son titre, celui du document, et la coquille autour', (chemin, nom) => {
    monterA(chemin);
    expect(titre()).toHaveTextContent(nom);
    expect(document.title).toBe(`${nom} — Grille d’évaluation`);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('la navigation propose les quatre vues et marque la vue courante', () => {
    monterA('/groupe');
    const liens = within(navigation()).getAllByRole('link');
    expect(liens.map((l) => l.textContent)).toEqual(['Grille', 'Évaluation', 'Groupe', 'Données']);
    expect(within(navigation()).getByRole('link', { name: 'Groupe' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(navigation()).getByRole('link', { name: 'Grille' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('changer de vue place le focus sur le titre de la nouvelle vue', async () => {
    monterA('/grille');
    await userEvent.setup().click(within(navigation()).getByRole('link', { name: 'Groupe' }));
    expect(titre()).toHaveTextContent('Groupe');
    expect(titre()).toHaveFocus();
  });

  it('les avis s’affichent sur toutes les vues', () => {
    localStorage.setItem(CLE_DOSSIER, '{ abîmé');
    monterA('/evaluation');
    expect(screen.getByRole('alert')).toHaveTextContent('n’a pas pu être lue');
  });

  it('/transparence rend la page Transparence', () => {
    monterA('/transparence');
    expect(titre()).toHaveTextContent('Transparence');
  });

  it('un chemin inconnu rend la page introuvable, avec un lien vers l’accueil', () => {
    monterA('/nimporte-quoi');
    expect(titre()).toHaveTextContent('Page introuvable');
    const main = screen.getByRole('main');
    expect(within(main).getByRole('link', { name: 'Revenir à l’accueil' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('chaque page déclare un errorElement', () => {
    const enfants = routes[0]?.children ?? [];
    expect(routes[0]?.errorElement).toBeDefined();
    expect(enfants.length).toBeGreaterThanOrEqual(7);
    for (const r of enfants) expect(r.errorElement, String(r.path ?? 'index')).toBeDefined();
  });
});
