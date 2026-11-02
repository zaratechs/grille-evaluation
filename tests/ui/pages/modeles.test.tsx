import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { MODELES_FOURNIS } from '../../../src/data/modeles';
import { dossierVide, type Dossier } from '../../../src/domain';
import { enregistre, monterApp } from '../outils/monter';

const bouton = (nom: string | RegExp, dans: HTMLElement = document.body) =>
  within(dans).getByRole('button', { name: nom });
const fenetre = () => screen.getByRole('dialog', { name: 'Choisir un modèle' });
const listeFournis = () => within(fenetre()).getByRole('list', { name: /Modèles fournis/ });
const listePerso = () => within(fenetre()).getByRole('list', { name: 'Mes modèles' });

/** Un dossier avec un critère, une personne évaluée et deux modèles personnels. */
function dossier(): Dossier {
  return {
    ...dossierVide(),
    grille: {
      ...dossierVide().grille,
      titre: 'Session',
      criteres: [{ id: 'c1', nom: 'Fond', poids: 1000, descripteurs: ['', '', '', '', ''] }],
    },
    etudiants: [
      {
        id: 'e1',
        nom: 'Élise Roy',
        niveaux: { c1: 4 },
        commentaires: { c1: 'Bien.' },
        commentaireGeneral: 'À suivre.',
      },
    ],
    modelesPerso: [
      {
        id: 'm1',
        nom: 'Oral de fin de session',
        niveaux: ['A', 'B', 'C'],
        criteres: [{ nom: 'Voix', poids: 1000, descripteurs: ['', '', ''] }],
      },
      {
        id: 'm2',
        nom: 'Rapport court',
        niveaux: ['A', 'B', 'C'],
        criteres: [{ nom: 'Clarté', poids: 1000, descripteurs: ['', '', ''] }],
      },
    ],
  };
}

async function ouvrir(d?: Dossier) {
  const app = monterApp('/grille', d);
  await app.user.click(bouton('Partir d’un modèle…'));
  return app;
}

describe('Choisir un modèle', () => {
  it('liste les 25 modèles fournis, crédités, et les modèles personnels', async () => {
    await ouvrir(dossier());
    expect(within(listeFournis()).getAllByRole('button')).toHaveLength(25);
    expect(
      within(listePerso())
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Oral de fin de session', 'Rapport court']);
    expect(fenetre()).toHaveTextContent('Paulo Mendonça');
    expect(fenetre()).toHaveTextContent('CC BY-NC-SA 4.0');
  });

  it('sans modèle personnel, la fenêtre dit comment en créer un', async () => {
    await ouvrir();
    expect(within(fenetre()).queryByRole('list', { name: 'Mes modèles' })).toBeNull();
    expect(fenetre()).toHaveTextContent(/Enregistrer comme modèle/);
  });

  it('le focus va sur la recherche ; elle filtre en ignorant accents et majuscules', async () => {
    const { user } = await ouvrir(dossier());
    const recherche = within(fenetre()).getByRole('searchbox', { name: 'Rechercher un modèle' });
    expect(recherche).toHaveFocus();
    await user.type(recherche, 'ETUDE');
    expect(
      within(listeFournis())
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Étude de cas', 'Étude comparative']);
    await user.clear(recherche);
    await user.type(recherche, 'zzz');
    expect(fenetre()).toHaveTextContent('Aucun modèle ne correspond à « zzz ».');
  });

  it('choisir un modèle montre son aperçu : niveaux, critères et poids', async () => {
    const { user } = await ouvrir();
    const etude = MODELES_FOURNIS.find((m) => m.nom === 'Étude de cas')!;
    await user.click(bouton('Étude de cas', listeFournis()));
    expect(bouton('Étude de cas', listeFournis())).toHaveAttribute('aria-pressed', 'true');
    const apercu = within(fenetre()).getByRole('region', { name: 'Étude de cas' });
    expect(apercu).toHaveTextContent(`${etude.niveaux.length} niveaux`);
    const lignes = within(apercu).getAllByRole('listitem');
    expect(lignes).toHaveLength(etude.criteres.length);
    expect(lignes[0]).toHaveTextContent(etude.criteres[0]!.nom);
    expect(lignes[0]).toHaveTextContent(/\d+,\d\s%/);
  });

  it('grille vide : le modèle s’applique directement, la fenêtre se ferme', async () => {
    const { user } = await ouvrir();
    await user.click(bouton('Étude de cas', listeFournis()));
    await user.click(bouton('Appliquer ce modèle'));
    expect(screen.queryByRole('dialog')).toBeNull();
    const etude = MODELES_FOURNIS.find((m) => m.nom === 'Étude de cas')!;
    expect(enregistre().grille.criteres.map((c) => c.nom)).toEqual(
      etude.criteres.map((c) => c.nom),
    );
    expect(bouton('Partir d’un modèle…')).toHaveFocus();
  });

  it('grille déjà remplie : confirmation qui dit ce qui sera remplacé et effacé', async () => {
    const { user } = await ouvrir(dossier());
    await user.click(bouton('Rapport court', listePerso()));
    await user.click(bouton('Appliquer ce modèle'));
    const confirmation = screen.getByRole('dialog', { name: 'Appliquer « Rapport court » ?' });
    expect(confirmation).toHaveTextContent('1 critère actuel sera remplacé.');
    expect(confirmation).toHaveTextContent('1 évaluation sera effacée.');
    expect(confirmation).toHaveTextContent('1 commentaire sera effacé.');
    expect(confirmation).toHaveTextContent('Les commentaires généraux sont gardés.');

    await user.click(bouton('Annuler', confirmation));
    expect(enregistre().grille.criteres[0]?.nom).toBe('Fond');

    await user.click(bouton('Appliquer ce modèle'));
    await user.click(bouton('Appliquer le modèle'));
    expect(enregistre().grille.criteres.map((c) => c.nom)).toEqual(['Clarté']);
    expect(enregistre().grille.titre).toBe('Session');
    expect(enregistre().etudiants[0]).toMatchObject({
      niveaux: {},
      commentaireGeneral: 'À suivre.',
    });
  });
});

describe('Modèles personnels', () => {
  it('enregistrer la grille comme modèle ; un nom déjà pris est refusé avec son message', async () => {
    const { user } = monterApp('/grille', dossier());
    await user.click(bouton('Enregistrer comme modèle…'));
    const f = screen.getByRole('dialog', { name: 'Enregistrer comme modèle' });
    const nom = within(f).getByRole('textbox', { name: 'Nom du modèle' });
    expect(nom).toHaveFocus();
    await user.type(nom, 'rapport COURT');
    await user.click(bouton('Enregistrer', f));
    expect(nom).toHaveAccessibleDescription(/déjà utilisé/);
    expect(enregistre().modelesPerso).toHaveLength(2);

    await user.clear(nom);
    await user.type(nom, 'Ma grille{Enter}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(enregistre().modelesPerso.map((m) => m.nom)).toEqual([
      'Oral de fin de session',
      'Rapport court',
      'Ma grille',
    ]);
  });

  it('renommer un modèle personnel depuis son aperçu', async () => {
    const { user } = await ouvrir(dossier());
    await user.click(bouton('Rapport court', listePerso()));
    const nom = within(fenetre()).getByRole('textbox', { name: 'Nom du modèle' });
    await user.clear(nom);
    await user.type(nom, 'Rapport long');
    expect(enregistre().modelesPerso[1]?.nom).toBe('Rapport long');
    await user.clear(nom);
    await user.type(nom, 'Oral de fin de session');
    expect(nom).toHaveAccessibleDescription(/déjà utilisé/);
  });

  it('les modèles fournis ne se renomment pas et ne se suppriment pas', async () => {
    const { user } = await ouvrir();
    await user.click(bouton('Débat', listeFournis()));
    expect(within(fenetre()).queryByRole('textbox', { name: 'Nom du modèle' })).toBeNull();
    expect(within(fenetre()).queryByRole('button', { name: 'Supprimer ce modèle' })).toBeNull();
  });

  it('supprimer un modèle personnel, après confirmation', async () => {
    const { user } = await ouvrir(dossier());
    await user.click(bouton('Oral de fin de session', listePerso()));
    await user.click(bouton('Supprimer ce modèle'));
    const confirmation = screen.getByRole('dialog', {
      name: 'Supprimer le modèle « Oral de fin de session » ?',
    });
    expect(confirmation).toHaveTextContent(/grilles déjà construites/);
    await user.click(bouton('Supprimer', confirmation));
    expect(enregistre().modelesPerso.map((m) => m.nom)).toEqual(['Rapport court']);
    expect(within(fenetre()).queryByRole('region')).toBeNull();
  });
});
