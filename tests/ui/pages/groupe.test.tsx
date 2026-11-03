import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { dossierVide, type Dossier, type Etudiant } from '../../../src/domain';
import { enregistre, monterApp } from '../outils/monter';

const bouton = (nom: string, dans: HTMLElement = document.body) =>
  within(dans).getByRole('button', { name: nom });
const champNom = () => screen.getByRole('textbox', { name: 'Nom de la personne étudiante' });
const ligne = (nom: string) => screen.getByRole('row', { name: new RegExp(`^${nom}`) });
const noms = () => enregistre().etudiants.map((e) => e.nom);
const synthese = () => screen.getByRole('region', { name: 'Synthèse du groupe' });

const personne = (id: string, nom: string, champs: Partial<Etudiant> = {}): Etudiant => ({
  id,
  nom,
  niveaux: {},
  commentaires: {},
  commentaireGeneral: '',
  ...champs,
});

/** Grille à 2 critères (50 % chacun), 5 niveaux, 20 points ; trois personnes. */
function groupe(): Dossier {
  return {
    ...dossierVide(),
    grille: {
      ...dossierVide().grille,
      totalPoints: 20,
      criteres: [
        { id: 'c1', nom: 'Fond', poids: 500, descripteurs: ['', '', '', '', ''] },
        { id: 'c2', nom: 'Forme', poids: 500, descripteurs: ['', '', '', '', ''] },
      ],
    },
    etudiants: [
      personne('e1', 'Élise Roy', { niveaux: { c1: 5, c2: 3 } }),
      personne('e2', 'Noé Tremblay', { niveaux: { c1: 4 } }),
      personne('e3', 'Zoé Gagnon'),
    ],
  };
}

describe('Groupe : ajouter', () => {
  it('sans personne : une invitation, pas de synthèse', () => {
    monterApp('/groupe');
    expect(screen.getByText(/Aucune personne étudiante/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Synthèse du groupe' })).toBeNull();
  });

  it('Entrée ajoute la personne ; le champ se vide et garde le focus', async () => {
    const { user } = monterApp('/groupe');
    await user.type(champNom(), 'Élise Roy{Enter}');
    await user.type(champNom(), 'Noé Tremblay{Enter}');
    expect(noms()).toEqual(['Élise Roy', 'Noé Tremblay']);
    expect(champNom()).toHaveValue('');
    expect(champNom()).toHaveFocus();
    expect(screen.getAllByRole('row')).toHaveLength(3); // en-tête + 2 personnes
  });

  it('le bouton « Ajouter » rend aussi le focus au champ', async () => {
    const { user } = monterApp('/groupe');
    await user.type(champNom(), 'Élise Roy');
    await user.click(bouton('Ajouter'));
    expect(champNom()).toHaveFocus();
  });

  it('un nom déjà pris est refusé avec son message, et reste dans le champ', async () => {
    const { user } = monterApp('/groupe', groupe());
    await user.type(champNom(), 'elise ROY{Enter}');
    expect(champNom()).toHaveValue('elise ROY');
    expect(champNom()).toHaveAccessibleDescription(/déjà utilisé/);
    expect(noms()).toHaveLength(3);
    await user.type(champNom(), ' B');
    expect(champNom()).not.toHaveAttribute('aria-invalid');
  });

  it('un nom vide est refusé', async () => {
    const { user } = monterApp('/groupe');
    await user.type(champNom(), '   {Enter}');
    expect(champNom()).toHaveAccessibleDescription(/vide/);
  });
});

describe('Groupe : tableau', () => {
  it('une ligne par personne, avec l’état de son évaluation', () => {
    monterApp('/groupe', groupe());
    expect(ligne('Élise Roy')).toHaveTextContent('16,00 / 20 points · 80,0 % · Très bon');
    expect(ligne('Noé Tremblay')).toHaveTextContent('Incomplète : 1 critère sur 2 évalué');
    expect(ligne('Zoé Gagnon')).toHaveTextContent('Pas encore évaluée');
  });

  it('grille sans critère : le dit, au lieu d’une évaluation', () => {
    const d = groupe();
    d.grille.criteres = [];
    d.etudiants = d.etudiants.map((e) => ({ ...e, niveaux: {} }));
    monterApp('/groupe', d);
    expect(ligne('Élise Roy')).toHaveTextContent('Aucun critère dans la grille');
  });

  it('poids différents de 100 % : aucune note, mais la raison', () => {
    const d = groupe();
    d.grille.criteres[1]!.poids = 450;
    monterApp('/groupe', d);
    expect(ligne('Élise Roy')).toHaveTextContent('Note impossible : les poids font 95,0 %');
  });

  it('« Évaluer » ouvre l’évaluation de cette personne', async () => {
    const { user, router } = monterApp('/groupe', groupe());
    await user.click(within(ligne('Noé Tremblay')).getByRole('link', { name: 'Évaluer' }));
    expect(router.state.location.pathname).toBe('/evaluation');
    expect(router.state.location.search).toBe('?personne=e2');
  });

  it('renommer dans une fenêtre ; un nom pris est refusé ; Entrée valide', async () => {
    const { user } = monterApp('/groupe', groupe());
    await user.click(bouton('Renommer', ligne('Zoé Gagnon')));
    const f = screen.getByRole('dialog', { name: 'Renommer Zoé Gagnon' });
    const nom = within(f).getByRole('textbox', { name: 'Nom' });
    expect(nom).toHaveValue('Zoé Gagnon');
    expect(nom).toHaveFocus();
    await user.clear(nom);
    await user.type(nom, 'Noé Tremblay{Enter}');
    expect(nom).toHaveAccessibleDescription(/déjà utilisé/);
    await user.clear(nom);
    await user.type(nom, 'Zoé Gagnon-Roy{Enter}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(noms()[2]).toBe('Zoé Gagnon-Roy');
  });

  it('monter et descendre ; désactivés aux bouts', async () => {
    const { user } = monterApp('/groupe', groupe());
    expect(bouton('Monter', ligne('Élise Roy'))).toBeDisabled();
    expect(bouton('Descendre', ligne('Zoé Gagnon'))).toBeDisabled();
    await user.click(bouton('Monter', ligne('Zoé Gagnon')));
    expect(noms()).toEqual(['Élise Roy', 'Zoé Gagnon', 'Noé Tremblay']);
  });

  it('retirer une personne sans évaluation ni commentaire : sans confirmation', async () => {
    const { user } = monterApp('/groupe', groupe());
    await user.click(bouton('Retirer', ligne('Zoé Gagnon')));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(noms()).toEqual(['Élise Roy', 'Noé Tremblay']);
  });

  it('retirer une personne évaluée ou commentée demande confirmation', async () => {
    const d = groupe();
    d.etudiants[0] = { ...d.etudiants[0]!, commentaireGeneral: 'Très bien.' };
    const { user } = monterApp('/groupe', d);
    await user.click(bouton('Retirer', ligne('Élise Roy')));
    const f = screen.getByRole('dialog', { name: 'Retirer Élise Roy ?' });
    expect(f).toHaveTextContent('2 évaluations seront effacées.');
    expect(f).toHaveTextContent('1 commentaire sera effacé.');
    await user.click(bouton('Retirer la personne', f));
    expect(noms()).toEqual(['Noé Tremblay', 'Zoé Gagnon']);
  });
});

describe('Groupe : synthèse', () => {
  it('compte les évaluations complètes, avec moyenne et médiane', () => {
    const d = groupe();
    d.etudiants[1] = { ...d.etudiants[1]!, niveaux: { c1: 4, c2: 4 } };
    monterApp('/groupe', d);
    expect(synthese()).toHaveTextContent('2 évaluations complètes sur 3');
    expect(synthese()).toHaveTextContent('Moyenne : 16,00 / 20 points (80,0 %)');
    expect(synthese()).toHaveTextContent('Médiane : 16,00 / 20 points (80,0 %)');
  });

  it('sans évaluation complète, le dit au lieu d’afficher une moyenne', () => {
    const d = groupe();
    d.etudiants[0] = { ...d.etudiants[0]!, niveaux: {} };
    monterApp('/groupe', d);
    expect(synthese()).toHaveTextContent('Aucune évaluation complète sur 3.');
    expect(synthese()).not.toHaveTextContent('Moyenne');
  });
});
