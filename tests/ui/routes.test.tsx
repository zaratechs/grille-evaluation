import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../../app/routes';

function monterA(chemin: string) {
  const router = createMemoryRouter(routes, { initialEntries: [chemin] });
  return render(<RouterProvider router={router} />);
}

const titre = () => screen.getByRole('heading', { level: 1 });

describe('routes', () => {
  it('/ rend l’accueil dans la coquille', () => {
    monterA('/');
    expect(titre()).toHaveTextContent('Grille d’évaluation');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
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
    expect(enfants.length).toBeGreaterThanOrEqual(3);
    for (const r of enfants) expect(r.errorElement, String(r.path ?? 'index')).toBeDefined();
  });
});
