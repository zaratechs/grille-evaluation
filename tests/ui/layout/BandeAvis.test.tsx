import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { dossierVide, ok } from '../../../src/domain';
import type { AvisApp, EtatDossier } from '../../../src/ui/etat';
import { ContexteDossier } from '../../../src/ui/etat/useDossier';
import { BandeAvis } from '../../../src/ui/layout/BandeAvis';

const telecharger = vi.hoisted(() => vi.fn());
vi.mock('../../../src/data-access/fichiers', async (original) => ({
  ...(await original<object>()),
  telecharger,
}));

const avis = (champs: Partial<AvisApp>): AvisApp => ({
  cle: 'chargement',
  importance: 'alerte',
  texte: 'Texte de l’avis.',
  details: [],
  actions: [],
  fermable: false,
  ...champs,
});

function monter(liste: AvisApp[], autres: Partial<EtatDossier> = {}) {
  const etat: EtatDossier = {
    dossier: { ...dossierVide(), grille: { ...dossierVide().grille, titre: 'Session' } },
    modifier: () => ok(dossierVide()),
    lectureSeule: false,
    avis: liste,
    fermerAvis: vi.fn(),
    sauvegardeOrigine: '{ original',
    ...autres,
  };
  const router = createMemoryRouter(
    [
      { path: '/', element: <BandeAvis /> },
      { path: '/donnees', element: <p>vue Données</p> },
    ],
    { initialEntries: ['/'] },
  );
  render(
    <ContexteDossier value={etat}>
      <RouterProvider router={router} />
    </ContexteDossier>,
  );
  return { etat, router, user: userEvent.setup() };
}

afterEach(() => vi.restoreAllMocks());

describe('BandeAvis', () => {
  it('sans avis, rien n’est affiché', () => {
    monter([]);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('affiche le texte et le détail en liste', () => {
    monter([avis({ details: ['1 poids corrigé', '2 noms corrigés'] })]);
    const bande = screen.getByRole('alert');
    expect(bande).toHaveTextContent('Texte de l’avis.');
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      '1 poids corrigé',
      '2 noms corrigés',
    ]);
  });

  it('« Télécharger l’originale » télécharge le texte d’origine, avec un nom daté', async () => {
    const { user } = monter([avis({ actions: ['telecharger-originale'] })]);
    await user.click(screen.getByRole('button', { name: 'Télécharger l’originale' }));
    expect(telecharger).toHaveBeenCalledWith(
      expect.stringMatching(/^grille-copie-de-secours-\d{4}-\d{2}-\d{2}\.json$/),
      '{ original',
      'application/json',
    );
  });

  it('« Exporter maintenant » télécharge le dossier courant, nommé d’après son titre', async () => {
    const { user } = monter([avis({ cle: 'ecriture', actions: ['exporter'] })]);
    await user.click(screen.getByRole('button', { name: 'Exporter maintenant' }));
    const [nom, contenu, type] = telecharger.mock.calls.at(-1) as [string, string, string];
    expect(nom).toMatch(/^grille-session-\d{4}-\d{2}-\d{2}\.json$/);
    expect(JSON.parse(contenu).grille.titre).toBe('Session');
    expect(type).toBe('application/json');
  });

  it('« Aller à Vos données » ouvre la vue Données', async () => {
    const { user } = monter([avis({ actions: ['aller-donnees'] })]);
    await user.click(screen.getByRole('button', { name: 'Aller à Vos données' }));
    expect(screen.getByText('vue Données')).toBeInTheDocument();
  });

  it('« Recharger la page » recharge la page', async () => {
    const recharger = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    const { user } = monter([avis({ cle: 'autre-onglet', actions: ['recharger'] })]);
    await user.click(screen.getByRole('button', { name: 'Recharger la page' }));
    expect(recharger).toHaveBeenCalledWith(0);
  });

  it('« Fermer » n’apparaît que pour un avis fermable, et le retire', async () => {
    const { etat, user } = monter([avis({ fermable: true }), avis({ cle: 'ecriture' })]);
    const fermer = screen.getAllByRole('button', { name: 'Fermer l’avis' });
    expect(fermer).toHaveLength(1);
    await user.click(fermer[0]!);
    expect(etat.fermerAvis).toHaveBeenCalledWith('chargement');
  });
});
