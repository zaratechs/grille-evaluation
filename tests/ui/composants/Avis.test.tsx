import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Avis, Bouton } from '../../../src/ui/composants';

describe('Avis', () => {
  it('un avis important est annoncé tout de suite (role="alert")', () => {
    render(<Avis importance="alerte">Cet onglet n’enregistre plus.</Avis>);
    expect(screen.getByRole('alert')).toHaveTextContent('Cet onglet n’enregistre plus.');
  });

  it('un avis d’information est annoncé poliment (role="status")', () => {
    render(<Avis importance="info">Import terminé.</Avis>);
    expect(screen.getByRole('status')).toHaveTextContent('Import terminé.');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('ses actions sont des boutons', async () => {
    const recharger = vi.fn();
    render(
      <Avis importance="alerte" actions={[{ libelle: 'Recharger', action: recharger }]}>
        Modifié ailleurs.
      </Avis>,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Recharger' }));
    expect(recharger).toHaveBeenCalledTimes(1);
  });

  it('« Fermer » n’apparaît que si l’avis peut être fermé', async () => {
    const fermer = vi.fn();
    const { rerender } = render(<Avis importance="info">Texte.</Avis>);
    expect(screen.queryByRole('button', { name: 'Fermer l’avis' })).toBeNull();
    rerender(
      <Avis importance="info" surFermer={fermer}>
        Texte.
      </Avis>,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Fermer l’avis' }));
    expect(fermer).toHaveBeenCalledTimes(1);
  });
});

describe('Bouton', () => {
  it('ne soumet jamais un formulaire par accident (type="button" par défaut)', () => {
    render(<Bouton>Égaliser</Bouton>);
    expect(screen.getByRole('button', { name: 'Égaliser' })).toHaveAttribute('type', 'button');
  });

  it('accepte type="submit" et la désactivation', () => {
    render(
      <Bouton type="submit" disabled>
        Ajouter
      </Bouton>,
    );
    const bouton = screen.getByRole('button', { name: 'Ajouter' });
    expect(bouton).toHaveAttribute('type', 'submit');
    expect(bouton).toBeDisabled();
  });
});
