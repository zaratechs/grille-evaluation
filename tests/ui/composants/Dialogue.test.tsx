import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialogue } from '../../../src/ui/composants';

/** Un bouton qui ouvre une confirmation, comme dans les vues. */
function Exemple({ surConfirmer }: { surConfirmer: () => void }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOuvert(true)}>
        Retirer le critère
      </button>
      <Dialogue
        ouvert={ouvert}
        titre="Retirer ce critère ?"
        confirmer="Retirer"
        surConfirmer={() => {
          surConfirmer();
          setOuvert(false);
        }}
        surAnnuler={() => setOuvert(false)}
      >
        12 évaluations seront effacées.
      </Dialogue>
    </>
  );
}

const monter = () => {
  const surConfirmer = vi.fn();
  render(<Exemple surConfirmer={surConfirmer} />);
  return { surConfirmer, user: userEvent.setup() };
};

describe('Dialogue', () => {
  it('fermé : rien n’est affiché', () => {
    monter();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ouvert : fenêtre nommée par son titre, décrite par son texte, focus sur « Annuler »', async () => {
    const { user } = monter();
    await user.click(screen.getByRole('button', { name: 'Retirer le critère' }));
    const fenetre = screen.getByRole('dialog', { name: 'Retirer ce critère ?' });
    expect(fenetre).toHaveAccessibleDescription('12 évaluations seront effacées.');
    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus();
  });

  it('« Confirmer » appelle l’action, puis le focus revient sur le bouton d’ouverture', async () => {
    const { user, surConfirmer } = monter();
    const ouvrir = screen.getByRole('button', { name: 'Retirer le critère' });
    await user.click(ouvrir);
    await user.click(screen.getByRole('button', { name: 'Retirer' }));
    expect(surConfirmer).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(ouvrir).toHaveFocus();
  });

  it.each([
    [
      '« Annuler »',
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Annuler' })),
    ],
    ['Échap', async (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}')],
  ])('%s ferme sans agir et rend le focus', async (_, fermer) => {
    const { user, surConfirmer } = monter();
    const ouvrir = screen.getByRole('button', { name: 'Retirer le critère' });
    await user.click(ouvrir);
    await fermer(user);
    expect(surConfirmer).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(ouvrir).toHaveFocus();
  });
});
