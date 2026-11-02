import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { dossierVide, type Dossier } from '../../../src/domain';
import { enregistre, monterApp } from '../outils/monter';

const champ = (nom: string) => screen.getByRole('textbox', { name: nom });
const bouton = (nom: string) => screen.getByRole('button', { name: nom });

/** Un dossier à N niveaux, un critère décrit au dernier niveau, une personne évaluée. */
function dossierA(n: number, evalueAuDernier = true): Dossier {
  const niveaux = Array.from({ length: n }, (_, i) => `Niveau ${i + 1}`);
  const descripteurs = niveaux.map((_, i) => (i === n - 1 ? 'Excellent travail.' : ''));
  return {
    ...dossierVide(),
    grille: {
      ...dossierVide().grille,
      niveaux,
      criteres: [{ id: 'c1', nom: 'Fond', poids: 1000, descripteurs }],
    },
    etudiants: [
      {
        id: 'e1',
        nom: 'Élise Roy',
        niveaux: evalueAuDernier ? { c1: n } : { c1: 1 },
        commentaires: {},
        commentaireGeneral: '',
      },
    ],
  };
}

describe('Grille : paramètres', () => {
  it('le titre saisi est enregistré à chaque frappe', async () => {
    const { user } = monterApp('/grille');
    await user.type(champ('Titre de la grille'), 'Session');
    expect(enregistre().grille.titre).toBe('Session');
  });

  it('les espaces en cours de frappe sont gardés dans le champ', async () => {
    const { user } = monterApp('/grille');
    await user.type(champ('Titre de la grille'), 'Travail de session');
    expect(champ('Titre de la grille')).toHaveValue('Travail de session');
  });

  it('un titre trop long reste dans le champ avec son message, sans être enregistré', async () => {
    const { user } = monterApp('/grille');
    await user.type(champ('Titre de la grille'), 'Court');
    await user.click(champ('Titre de la grille'));
    await user.paste('x'.repeat(200));
    expect(champ('Titre de la grille')).toHaveAttribute('aria-invalid', 'true');
    expect(champ('Titre de la grille')).toHaveAccessibleDescription(/trop long/);
    expect(enregistre().grille.titre).toBe('Court');
  });

  it('le total de points accepte la virgule ; un total illisible est signalé', async () => {
    const { user } = monterApp('/grille');
    const total = champ('Total de points');
    expect(total).toHaveValue('100');
    await user.clear(total);
    await user.type(total, '20,5');
    expect(enregistre().grille.totalPoints).toBe(20.5);
    await user.clear(total);
    await user.type(total, 'vingt');
    expect(total).toHaveAccessibleDescription(/total de points/i);
    expect(enregistre().grille.totalPoints).toBe(20.5);
  });

  it('en quittant un champ refusé, l’erreur reste affichée', async () => {
    const { user } = monterApp('/grille');
    await user.clear(champ('Total de points'));
    await user.tab();
    expect(champ('Total de points')).toHaveValue('');
    expect(champ('Total de points')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Grille : niveaux', () => {
  const niveaux = () => screen.getByRole('group', { name: /Niveaux/ });

  it('un champ par niveau, numéroté ; renommer est enregistré', async () => {
    const { user } = monterApp('/grille');
    // Les 5 niveaux par défaut du domaine.
    expect(within(niveaux()).getAllByRole('textbox')).toHaveLength(5);
    expect(champ('Libellé du niveau 5')).toHaveValue('Excellent');
    await user.clear(champ('Libellé du niveau 5'));
    await user.type(champ('Libellé du niveau 5'), 'Remarquable');
    expect(enregistre().grille.niveaux[4]).toBe('Remarquable');
  });

  it('un libellé vide est refusé, avec son message', async () => {
    const { user } = monterApp('/grille');
    await user.clear(champ('Libellé du niveau 1'));
    expect(champ('Libellé du niveau 1')).toHaveAccessibleDescription(/vide/);
  });

  it('ajouter un niveau ; à 10, le bouton est désactivé et dit pourquoi', async () => {
    const { user } = monterApp('/grille', dossierA(9));
    await user.click(bouton('Ajouter un niveau'));
    expect(enregistre().grille.niveaux).toHaveLength(10);
    expect(bouton('Ajouter un niveau')).toBeDisabled();
    expect(bouton('Ajouter un niveau')).toHaveAccessibleDescription(/au plus 10 niveaux/);
  });

  it('à 3 niveaux, « Retirer » est désactivé et dit pourquoi', () => {
    monterApp('/grille', dossierA(3));
    expect(bouton('Retirer le dernier niveau')).toBeDisabled();
    expect(bouton('Retirer le dernier niveau')).toHaveAccessibleDescription(/au moins 3/);
  });

  it('retirer un niveau sans évaluation ni descripteur se fait sans confirmation', async () => {
    const vierge = dossierA(5, false);
    vierge.grille.criteres[0]!.descripteurs = ['', '', '', '', ''];
    const { user } = monterApp('/grille', vierge);
    await user.click(bouton('Retirer le dernier niveau'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(enregistre().grille.niveaux).toHaveLength(4);
  });

  it('retirer un niveau utilisé demande confirmation, en disant ce qui sera effacé', async () => {
    const { user } = monterApp('/grille', dossierA(5));
    await user.click(bouton('Retirer le dernier niveau'));
    const fenetre = screen.getByRole('dialog', { name: 'Retirer le niveau « Niveau 5 » ?' });
    expect(fenetre).toHaveTextContent('1 évaluation sera effacée.');
    expect(fenetre).toHaveTextContent('1 descripteur sera effacé.');

    await user.click(within(fenetre).getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(enregistre().grille.niveaux).toHaveLength(5);

    await user.click(bouton('Retirer le dernier niveau'));
    await user.click(screen.getByRole('button', { name: 'Retirer le niveau' }));
    expect(enregistre().grille.niveaux).toHaveLength(4);
    expect(enregistre().etudiants[0]?.niveaux).toEqual({});
  });
});
