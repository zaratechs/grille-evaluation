import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router';
import { RouteBoundary } from '../../../src/ui/layout/RouteBoundary';

afterEach(() => vi.restoreAllMocks());

function Explose(): never {
  throw new Error('boum');
}

function monter(entree: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Outlet />,
        children: [
          { path: 'ok', element: <p>page OK</p>, errorElement: <RouteBoundary /> },
          { path: 'ko', element: <Explose />, errorElement: <RouteBoundary /> },
        ],
      },
    ],
    { initialEntries: [entree] },
  );
  return render(<RouterProvider router={router} />);
}

describe('RouteBoundary', () => {
  it('remplace une page qui plante par un message clair', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    monter('/ko');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Cette page a rencontré une erreur' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('boum')).toBeNull(); // le détail technique n'est pas montré
  });

  it('propose de recharger la page et de revenir à l’accueil', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    monter('/ko');
    expect(screen.getByRole('button', { name: 'Recharger la page' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Revenir à l’accueil' })).toHaveAttribute('href', '/');
  });

  it('trace l’erreur dans la console pour le débogage', () => {
    const espion = vi.spyOn(console, 'error').mockImplementation(() => {});
    monter('/ko');
    expect(espion).toHaveBeenCalledWith('RouteBoundary a capturé :', expect.any(Error));
  });

  it('laisse les autres pages intactes', () => {
    monter('/ok');
    expect(screen.getByText('page OK')).toBeInTheDocument();
  });
});
