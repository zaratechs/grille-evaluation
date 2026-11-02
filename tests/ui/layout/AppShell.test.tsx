import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppShell } from '../../../src/ui/layout/AppShell';

function monter() {
  const router = createMemoryRouter(
    [{ path: '/', element: <AppShell />, children: [{ index: true, element: <p>contenu</p> }] }],
    { initialEntries: ['/'] },
  );
  return render(<RouterProvider router={router} />);
}

describe('AppShell', () => {
  it('présente les repères en-tête, contenu principal et pied de page', () => {
    monter();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('affiche le nom de l’application dans l’en-tête, avec un lien vers l’accueil', () => {
    monter();
    const lien = within(screen.getByRole('banner')).getByRole('link', {
      name: 'Grille d’évaluation',
    });
    expect(lien).toHaveAttribute('href', '/');
  });

  it('rend la page enfant dans le contenu principal', () => {
    monter();
    expect(within(screen.getByRole('main')).getByText('contenu')).toBeInTheDocument();
  });

  it('offre un lien d’évitement vers le contenu principal, en premier', () => {
    const { container } = monter();
    const lien = screen.getByRole('link', { name: 'Aller au contenu' });
    expect(lien).toHaveAttribute('href', '#contenu');
    expect(container.querySelector('a')).toBe(lien);
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenu');
  });
});
