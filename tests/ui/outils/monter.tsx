import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../../../app/routes';
import { CLE_DOSSIER } from '../../../src/data-access';
import type { Dossier } from '../../../src/domain';

/** Monte toute l'application sur `chemin`, avec `dossier` déjà enregistré s'il est donné. */
export function monterApp(chemin: string, dossier?: Dossier) {
  if (dossier) localStorage.setItem(CLE_DOSSIER, JSON.stringify(dossier));
  const router = createMemoryRouter(routes, { initialEntries: [chemin] });
  render(<RouterProvider router={router} />);
  return { router, user: userEvent.setup() };
}

/** Le dossier tel qu'enregistré dans le navigateur. */
export const enregistre = (): Dossier =>
  JSON.parse(localStorage.getItem(CLE_DOSSIER) ?? 'null') as Dossier;
