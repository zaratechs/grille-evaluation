import { afterEach, describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { CLE_COPIE, CLE_DOSSIER } from '../../../src/data-access';
import { NIVEAUX_PAR_DEFAUT, dossierVide, nomFichier, type Dossier } from '../../../src/domain';
import { MESSAGES_ERREUR } from '../../../src/ui/messages';
import { enregistre, monterApp } from '../outils/monter';

const telecharger = vi.hoisted(() => vi.fn());
vi.mock('../../../src/data-access/fichiers', async (original) => ({
  ...(await original<object>()),
  telecharger,
}));

afterEach(() => vi.restoreAllMocks());

const JSON_TYPE = 'application/json';
const bouton = (nom: string, dans: HTMLElement = document.body) =>
  within(dans).getByRole('button', { name: nom });
const choixFichier = () => screen.getByLabelText('Choisir un fichier .json');
const fichier = (contenu: unknown, nom = 'sauvegarde.json') =>
  new File([typeof contenu === 'string' ? contenu : JSON.stringify(contenu)], nom, {
    type: JSON_TYPE,
  });
/** Le dernier fichier proposé au téléchargement. */
const dernier = () => telecharger.mock.calls.at(-1) as [string, string, string];

/** « Session » : un critère à 100 %, Élise évaluée et commentée, un modèle personnel. */
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
        commentaires: { c1: 'Clair.' },
        commentaireGeneral: 'Bravo.',
      },
    ],
    modelesPerso: [{ id: 'm1', nom: 'Mon modèle', niveaux: [...NIVEAUX_PAR_DEFAUT], criteres: [] }],
  };
}

/** Un autre dossier, tel qu'exporté ailleurs : une personne et un nouveau modèle. */
function autre(): Dossier {
  return {
    ...dossier(),
    grille: { ...dossier().grille, titre: 'Importée' },
    etudiants: [
      { id: 'x1', nom: 'Léa Côté', niveaux: {}, commentaires: {}, commentaireGeneral: '' },
    ],
    modelesPerso: [
      { id: 'm2', nom: 'Autre modèle', niveaux: [...NIVEAUX_PAR_DEFAUT], criteres: [] },
    ],
  };
}

describe('Données : exporter', () => {
  it('« Exporter tout » : grille, groupe et modèles', async () => {
    const { user } = monterApp('/donnees', dossier());
    await user.click(bouton('Exporter tout'));
    const [nom, contenu, type] = dernier();
    expect(nom).toBe(nomFichier('Session', new Date(), 'json'));
    expect(type).toBe(JSON_TYPE);
    expect(JSON.parse(contenu)).toEqual(dossier());
  });

  it('« Exporter la grille seule » : aucun nom de personne étudiante', async () => {
    const { user } = monterApp('/donnees', dossier());
    await user.click(bouton('Exporter la grille seule'));
    const [nom, contenu] = dernier();
    expect(nom).toBe(nomFichier('Session grille seule', new Date(), 'json'));
    expect(contenu).not.toContain('Élise');
    expect(JSON.parse(contenu)).not.toHaveProperty('etudiants');
  });
});

describe('Données : importer', () => {
  it('dossier complet : la confirmation résume, puis un avis confirme', async () => {
    const { user } = monterApp('/donnees', dossier());
    await user.upload(choixFichier(), fichier(autre()));
    const f = await screen.findByRole('dialog', { name: 'Importer « sauvegarde.json » ?' });
    expect(f).toHaveTextContent('La grille et le groupe actuels seront remplacés.');
    expect(f).toHaveTextContent('Le fichier contient 1 personne étudiante.');
    expect(f).toHaveTextContent('1 modèle personnel sera ajouté.');
    await user.click(bouton('Importer', f));
    expect(enregistre().grille.titre).toBe('Importée');
    expect(enregistre().etudiants.map((e) => e.nom)).toEqual(['Léa Côté']);
    expect(enregistre().modelesPerso.map((m) => m.nom)).toEqual(['Mon modèle', 'Autre modèle']);
    expect(screen.getByRole('status')).toHaveTextContent('Import terminé.');
  });

  it('grille seule : le groupe est gardé, sans ses évaluations', async () => {
    const { user } = monterApp('/donnees', dossier());
    const { version, grille, modelesPerso } = autre();
    const grilleSeule = { version, grille, modelesPerso };
    await user.upload(choixFichier(), fichier(grilleSeule, 'grille.json'));
    const f = await screen.findByRole('dialog', { name: 'Importer « grille.json » ?' });
    expect(f).toHaveTextContent('La grille actuelle sera remplacée.');
    expect(f).toHaveTextContent(
      'Le groupe est gardé, mais ses évaluations et ses commentaires par critère seront effacés.',
    );
    await user.click(bouton('Importer', f));
    expect(enregistre().etudiants).toEqual([
      expect.objectContaining({ nom: 'Élise Roy', niveaux: {}, commentaires: {} }),
    ]);
  });

  it('fichier réparé : l’avis donne le bilan', async () => {
    const { user } = monterApp('/donnees', dossier());
    const abime = { ...autre(), grille: { ...autre().grille, totalPoints: 'vingt' } };
    await user.upload(choixFichier(), fichier(abime));
    await user.click(bouton('Importer', await screen.findByRole('dialog')));
    expect(screen.getByRole('status')).toHaveTextContent('Le fichier a été réparé');
    expect(screen.getByRole('status')).toHaveTextContent('1 paramètre corrigé');
  });

  it('fichier refusé : le message du code, et rien ne change', async () => {
    const { user } = monterApp('/donnees', dossier());
    await user.upload(choixFichier(), fichier('{ pas du json'));
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES_ERREUR['json-invalide']);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(enregistre()).toEqual(dossier());
  });

  it('« Annuler » ne change rien ; le même fichier peut être choisi à nouveau', async () => {
    const { user } = monterApp('/donnees', dossier());
    await user.upload(choixFichier(), fichier(autre()));
    await user.click(bouton('Annuler', await screen.findByRole('dialog')));
    expect(enregistre()).toEqual(dossier());
    expect(choixFichier()).toHaveValue('');
    await user.upload(choixFichier(), fichier(autre()));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});

describe('Données : copie de secours', () => {
  it('sans copie : pas de bouton', () => {
    monterApp('/donnees', dossier());
    expect(screen.queryByRole('button', { name: /copie de secours/ })).toBeNull();
  });

  it('avec une copie : le bouton télécharge le texte d’origine', async () => {
    localStorage.setItem(CLE_COPIE, '{ original');
    const { user } = monterApp('/donnees', dossier());
    await user.click(bouton('Télécharger la copie de secours'));
    expect(dernier()).toEqual([
      nomFichier('copie de secours', new Date(), 'json'),
      '{ original',
      JSON_TYPE,
    ]);
  });
});

describe('Données : tout effacer', () => {
  it('confirmation qui dit ce qui sera perdu, puis dossier vide et copie effacée', async () => {
    localStorage.setItem(CLE_COPIE, '{ original');
    const { user } = monterApp('/donnees', dossier());
    await user.click(bouton('Tout effacer…'));
    const f = screen.getByRole('dialog', { name: 'Tout effacer ?' });
    expect(f).toHaveTextContent('1 critère');
    expect(f).toHaveTextContent('1 personne étudiante');
    expect(f).toHaveTextContent('1 modèle personnel');
    await user.click(bouton('Tout effacer', f));
    expect(enregistre()).toEqual(dossierVide());
    expect(Object.keys(localStorage)).toEqual([CLE_DOSSIER]);
    expect(screen.queryByRole('button', { name: /copie de secours/ })).toBeNull();
  });

  it('« Annuler » ne change rien', async () => {
    const { user } = monterApp('/donnees', dossier());
    await user.click(bouton('Tout effacer…'));
    await user.click(bouton('Annuler', screen.getByRole('dialog')));
    expect(enregistre()).toEqual(dossier());
  });

  it('stockage qui refuse : le message, et rien ne change', async () => {
    const { user } = monterApp('/donnees', dossier());
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('refusé');
    });
    await user.click(bouton('Tout effacer…'));
    await user.click(bouton('Tout effacer', screen.getByRole('dialog')));
    expect(screen.getByRole('alert')).toHaveTextContent(MESSAGES_ERREUR['ecriture-impossible']);
    expect(enregistre()).toEqual(dossier());
  });
});
