import { describe, it, expect } from 'vitest';
import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialogue, Fenetre } from '../../../src/ui/composants';

function Exemple() {
  const [ouverte, setOuverte] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
  const recherche = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" onClick={() => setOuverte(true)}>
        Partir d’un modèle…
      </button>
      <Fenetre
        ouvert={ouverte}
        titre="Choisir un modèle"
        surFermer={() => setOuverte(false)}
        focusInitial={recherche}
      >
        <label>
          Rechercher <input ref={recherche} />
        </label>
        <button type="button" onClick={() => setConfirmer(true)}>
          Appliquer
        </button>
        <Dialogue
          ouvert={confirmer}
          titre="Remplacer la grille ?"
          confirmer="Remplacer"
          surConfirmer={() => setConfirmer(false)}
          surAnnuler={() => setConfirmer(false)}
        >
          Les critères seront remplacés.
        </Dialogue>
      </Fenetre>
    </>
  );
}

const monter = () => {
  render(<Exemple />);
  return userEvent.setup();
};
const ouvrir = () => screen.getByRole('button', { name: 'Partir d’un modèle…' });

describe('Fenetre', () => {
  it('fermée : rien n’est affiché', () => {
    monter();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ouverte : nommée par son titre, focus sur l’élément choisi', async () => {
    const user = monter();
    await user.click(ouvrir());
    expect(screen.getByRole('dialog', { name: 'Choisir un modèle' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Rechercher' })).toHaveFocus();
  });

  it.each([
    [
      '« Fermer »',
      (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Fermer' })),
    ],
    ['Échap', (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}')],
  ])('%s ferme la fenêtre et rend le focus', async (_, fermer) => {
    const user = monter();
    await user.click(ouvrir());
    await fermer(user);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(ouvrir()).toHaveFocus();
  });

  it('Échap dans une confirmation ouverte par-dessus ne ferme que la confirmation', async () => {
    const user = monter();
    await user.click(ouvrir());
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));
    expect(screen.getByRole('dialog', { name: 'Remplacer la grille ?' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Remplacer la grille ?' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Choisir un modèle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Appliquer' })).toHaveFocus();
  });
});
