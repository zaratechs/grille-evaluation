import { describe, it, expect } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { CLE_DOSSIER } from '../../../src/data-access';
import { DossierProvider } from '../../../src/ui/etat';
import { Vue } from '../../../src/ui/layout';

function monter() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <Vue titre="Grille" outils={<button type="button">Suivante</button>}>
            <label>
              Titre <input />
            </label>
          </Vue>
        ),
      },
      { path: '/autre', element: <Vue titre="Autre">rien</Vue> },
    ],
    { initialEntries: ['/'] },
  );
  render(
    <DossierProvider>
      <RouterProvider router={router} />
    </DossierProvider>,
  );
  return router;
}

const titre = () => screen.getByRole('heading', { level: 1 });

describe('Vue', () => {
  it('au premier affichage, le focus reste en haut de la page (lien d’évitement)', () => {
    monter();
    expect(titre()).toHaveTextContent('Grille');
    expect(titre()).not.toHaveFocus();
  });

  it('après une navigation, aussi par le bouton Précédent, le focus va sur le titre', async () => {
    const router = monter();
    await act(() => router.navigate('/autre'));
    expect(titre()).toHaveTextContent('Autre');
    expect(titre()).toHaveFocus();
    await act(() => router.navigate(-1));
    expect(titre()).toHaveTextContent('Grille');
    expect(titre()).toHaveFocus();
  });

  it('un remplacement d’adresse (redirection) ne déplace pas le focus', async () => {
    const router = monter();
    await act(() => router.navigate('/autre', { replace: true }));
    expect(titre()).not.toHaveFocus();
  });

  it('les champs sont actifs, puis désactivés quand un autre onglet modifie le dossier', () => {
    monter();
    const champ = screen.getByRole('textbox', { name: 'Titre' });
    expect(champ).toBeEnabled();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CLE_DOSSIER }));
    });
    expect(champ).toBeDisabled();
  });

  it('les outils (ce qui ne modifie rien) restent actifs en lecture seule', () => {
    monter();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CLE_DOSSIER }));
    });
    expect(screen.getByRole('textbox', { name: 'Titre' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Suivante' })).toBeEnabled();
  });
});
