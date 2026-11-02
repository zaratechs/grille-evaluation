import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Champ } from '../../../src/ui/composants';

describe('Champ', () => {
  it('a une étiquette visible liée au champ', () => {
    render(<Champ etiquette="Titre" valeur="Session" surSaisie={() => {}} />);
    const champ = screen.getByRole('textbox', { name: 'Titre' });
    expect(champ).toHaveValue('Session');
    expect(champ).not.toHaveAttribute('aria-invalid');
  });

  it('transmet chaque frappe', async () => {
    const surSaisie = vi.fn();
    render(<Champ etiquette="Titre" valeur="" surSaisie={surSaisie} />);
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Titre' }), 'ab');
    expect(surSaisie).toHaveBeenNthCalledWith(1, 'a');
    expect(surSaisie).toHaveBeenNthCalledWith(2, 'b');
  });

  it('une erreur est liée au champ et le marque invalide', () => {
    render(
      <Champ
        etiquette="Nom"
        valeur=""
        surSaisie={() => {}}
        erreur="Le nom ne peut pas être vide."
      />,
    );
    const champ = screen.getByRole('textbox', { name: 'Nom' });
    expect(champ).toHaveAttribute('aria-invalid', 'true');
    expect(champ).toHaveAccessibleDescription('Le nom ne peut pas être vide.');
  });

  it('une aide est liée au champ, avec l’erreur s’il y en a une', () => {
    render(
      <Champ
        etiquette="Poids"
        valeur="x"
        surSaisie={() => {}}
        aide="En pourcentage."
        erreur="Poids illisible."
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Poids' })).toHaveAccessibleDescription(
      'En pourcentage. Poids illisible.',
    );
  });

  it('en plusieurs lignes, c’est une zone de texte', () => {
    render(<Champ etiquette="Commentaire" valeur="" surSaisie={() => {}} multiligne />);
    expect(screen.getByRole('textbox', { name: 'Commentaire' }).tagName).toBe('TEXTAREA');
  });

  it('peut être désactivé (lecture seule)', () => {
    render(<Champ etiquette="Titre" valeur="" surSaisie={() => {}} desactive />);
    expect(screen.getByRole('textbox', { name: 'Titre' })).toBeDisabled();
  });
});
