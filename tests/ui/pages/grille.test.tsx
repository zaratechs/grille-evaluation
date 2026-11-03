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

describe('Grille : critères', () => {
  const carte = (n: number) => screen.getByRole('group', { name: new RegExp(`^Critère ${n}`) });
  const cartes = () => screen.queryAllByRole('group', { name: /^Critère \d/ });
  const total = () => screen.getByRole('status', { name: 'Total des poids' });

  /** Deux critères (60 % et 40 %), une personne évaluée et commentée sur le premier. */
  function deux(): Dossier {
    const d = dossierA(5, false);
    d.grille.criteres = [
      { id: 'c1', nom: 'Fond', poids: 600, descripteurs: ['Rien.', '', '', '', ''] },
      { id: 'c2', nom: 'Forme', poids: 400, descripteurs: ['', '', '', '', ''] },
    ];
    d.etudiants[0] = { ...d.etudiants[0]!, niveaux: { c1: 3 }, commentaires: { c1: 'Bien.' } };
    return d;
  }

  it('sans critère : une invitation à en ajouter un', () => {
    monterApp('/grille');
    expect(cartes()).toHaveLength(0);
    expect(screen.getByText(/Aucun critère/)).toBeInTheDocument();
  });

  it('ajouter un critère : une carte apparaît, le focus va sur son nom', async () => {
    const { user } = monterApp('/grille');
    await user.click(bouton('Ajouter un critère'));
    expect(cartes()).toHaveLength(1);
    const nom = within(carte(1)).getByRole('textbox', { name: 'Nom' });
    expect(nom).toHaveValue('Nouveau critère');
    expect(nom).toHaveFocus();
    expect(enregistre().grille.criteres).toHaveLength(1);
  });

  it('renommer ; un nom vide est refusé avec son message', async () => {
    const { user } = monterApp('/grille', deux());
    const nom = within(carte(2)).getByRole('textbox', { name: 'Nom' });
    await user.clear(nom);
    expect(nom).toHaveAccessibleDescription(/vide/);
    await user.type(nom, 'Présentation');
    expect(enregistre().grille.criteres[1]?.nom).toBe('Présentation');
    expect(carte(2)).toHaveAccessibleName('Critère 2 : Présentation');
  });

  it('poids : virgule ou point acceptés, texte refusé avec son message', async () => {
    const { user } = monterApp('/grille', deux());
    const poids = within(carte(1)).getByRole('textbox', { name: 'Poids (%)' });
    expect(poids).toHaveValue('60,0');
    await user.clear(poids);
    await user.type(poids, '16,7');
    expect(enregistre().grille.criteres[0]?.poids).toBe(167);
    await user.clear(poids);
    await user.type(poids, '33.3');
    expect(enregistre().grille.criteres[0]?.poids).toBe(333);
    await user.clear(poids);
    await user.type(poids, 'beaucoup');
    expect(poids).toHaveAccessibleDescription(/0 à 100/);
    expect(enregistre().grille.criteres[0]?.poids).toBe(333);
  });

  it('le total des poids est annoncé en direct, en texte', async () => {
    const { user } = monterApp('/grille', deux());
    expect(total()).toHaveTextContent(/100,0\s%\s✓/);
    const poids = within(carte(2)).getByRole('textbox', { name: 'Poids (%)' });
    await user.clear(poids);
    await user.type(poids, '35');
    expect(total()).toHaveTextContent(/95,0\s% — il manque 5,0\s%/);
    await user.clear(poids);
    await user.type(poids, '50');
    expect(total()).toHaveTextContent(/110,0\s% — 10,0\s% de trop/);
  });

  it('« Égaliser » répartit 100 % entre les critères', async () => {
    const d = deux();
    d.grille.criteres.push({ id: 'c3', nom: 'Oral', poids: 0, descripteurs: ['', '', '', '', ''] });
    const { user } = monterApp('/grille', d);
    await user.click(bouton('Égaliser les poids'));
    expect(enregistre().grille.criteres.map((c) => c.poids)).toEqual([334, 333, 333]);
    expect(within(carte(1)).getByRole('textbox', { name: 'Poids (%)' })).toHaveValue('33,4');
  });

  it('un champ de descripteur par niveau, nommé d’après le niveau', async () => {
    const { user } = monterApp('/grille', deux());
    const champs = within(carte(2)).getAllByRole('textbox', { name: /^Descripteur/ });
    expect(champs).toHaveLength(5);
    const excellent = within(carte(2)).getByRole('textbox', {
      name: 'Descripteur du niveau 5 (Niveau 5)',
    });
    await user.type(excellent, 'Soigné.');
    expect(enregistre().grille.criteres[1]?.descripteurs[4]).toBe('Soigné.');
  });

  it('monter et descendre ; désactivés aux bouts', async () => {
    const { user } = monterApp('/grille', deux());
    expect(within(carte(1)).getByRole('button', { name: 'Monter' })).toBeDisabled();
    expect(within(carte(2)).getByRole('button', { name: 'Descendre' })).toBeDisabled();
    await user.click(within(carte(2)).getByRole('button', { name: 'Monter' }));
    expect(enregistre().grille.criteres.map((c) => c.id)).toEqual(['c2', 'c1']);
    expect(carte(1)).toHaveAccessibleName('Critère 1 : Forme');
  });

  it('retirer un critère vierge se fait sans confirmation', async () => {
    const { user } = monterApp('/grille', deux());
    await user.click(within(carte(2)).getByRole('button', { name: 'Retirer' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(enregistre().grille.criteres.map((c) => c.id)).toEqual(['c1']);
  });

  it('retirer un critère utilisé demande confirmation, en disant ce qui sera effacé', async () => {
    const { user } = monterApp('/grille', deux());
    await user.click(within(carte(1)).getByRole('button', { name: 'Retirer' }));
    const fenetre = screen.getByRole('dialog', { name: 'Retirer le critère « Fond » ?' });
    expect(fenetre).toHaveTextContent('1 évaluation sera effacée.');
    expect(fenetre).toHaveTextContent('1 commentaire sera effacé.');
    expect(fenetre).toHaveTextContent('1 descripteur sera effacé.');
    await user.click(within(fenetre).getByRole('button', { name: 'Retirer le critère' }));
    expect(enregistre().grille.criteres.map((c) => c.id)).toEqual(['c2']);
    expect(enregistre().etudiants[0]?.niveaux).toEqual({});
  });
});

describe('Grille : « Pour commencer »', () => {
  const encadre = () => screen.getByRole('region', { name: 'Pour commencer' });

  it('grille vide : trois étapes numérotées, avec les noms des boutons de la vue', () => {
    monterApp('/grille');
    const etapes = within(within(encadre()).getByRole('list')).getAllByRole('listitem');
    expect(etapes).toHaveLength(3);
    expect(etapes[0]).toHaveTextContent('Construisez la grille');
    expect(etapes[0]).toHaveTextContent('« Partir d’un modèle… »');
    expect(etapes[0]).toHaveTextContent('« Ajouter un critère »');
    expect(etapes[1]).toHaveTextContent('Ajoutez vos personnes étudiantes');
    expect(etapes[2]).toHaveTextContent('Évaluez');
    expect(etapes[2]).toHaveTextContent('PDF, Word ou CSV');
    expect(encadre().querySelector('ol')).not.toBeNull();
  });

  it('des liens vers Groupe, Évaluation et Vos données ; aucun bouton en double', () => {
    monterApp('/grille');
    const lien = (nom: string) => within(encadre()).getByRole('link', { name: nom });
    expect(lien('Groupe')).toHaveAttribute('href', '/groupe');
    expect(lien('Évaluation')).toHaveAttribute('href', '/evaluation');
    expect(lien('Vos données')).toHaveAttribute('href', '/donnees');
    expect(within(encadre()).queryByRole('button')).toBeNull();
    expect(encadre()).toHaveTextContent('Tout est enregistré automatiquement dans ce navigateur.');
  });

  it('disparaît dès le premier critère', async () => {
    const { user } = monterApp('/grille');
    await user.click(bouton('Ajouter un critère'));
    expect(screen.queryByRole('region', { name: 'Pour commencer' })).toBeNull();
  });

  it('absent quand la grille a des critères', () => {
    monterApp('/grille', dossierA(5));
    expect(screen.queryByRole('region', { name: 'Pour commencer' })).toBeNull();
  });
});
