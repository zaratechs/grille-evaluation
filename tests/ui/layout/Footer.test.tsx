import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import pkg from '../../../package.json' with { type: 'json' };
import { Footer } from '../../../src/ui/layout/Footer';

function monter() {
  const router = createMemoryRouter([{ path: '/*', element: <Footer /> }], {
    initialEntries: ['/'],
  });
  render(<RouterProvider router={router} />);
  return screen.getByRole('contentinfo');
}

describe('Footer', () => {
  it('nomme l’auteur avec son intitulé exact', () => {
    const pied = monter();
    expect(pied).toHaveTextContent('© 2026-2027');
    expect(pied).toHaveTextContent('Réda Hamza, Développeur technopédagogique');
  });

  it('crédite Paulo Mendonça pour les modèles de grilles', () => {
    expect(monter()).toHaveTextContent('Modèles de grilles : Paulo Mendonça');
  });

  it('renvoie vers la licence CC BY-NC-SA 4.0 dans un nouvel onglet', () => {
    const pied = monter();
    const lien = within(pied).getByRole('link', { name: /CC BY-NC-SA 4\.0/ });
    expect(lien).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr',
    );
    expect(lien).toHaveAttribute('target', '_blank');
    expect(lien.getAttribute('rel')?.split(' ')).toEqual(
      expect.arrayContaining(['noopener', 'noreferrer']),
    );
    // Le nom accessible prévient de l'ouverture d'un nouvel onglet.
    expect(lien).toHaveAccessibleName(/nouvel onglet/);
  });

  it('affiche la version de package.json', () => {
    expect(monter()).toHaveTextContent(`Version ${pkg.version}`);
  });

  it('renvoie vers la page Transparence', () => {
    const pied = monter();
    expect(within(pied).getByRole('link', { name: 'Transparence' })).toHaveAttribute(
      'href',
      '/transparence',
    );
  });

  it('ne contient ni « Tous droits réservés » ni courriel', () => {
    const pied = monter();
    expect(pied).not.toHaveTextContent(/tous droits réservés/i);
    expect(pied.textContent).not.toMatch(/@/);
    expect(pied.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});
