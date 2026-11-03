import { beforeEach, describe, it, expect, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import { dossierVide, nomFichier, type Dossier, type Etudiant } from '../../../src/domain';
import { CLE_DOSSIER } from '../../../src/data-access';
import { enregistre, monterApp } from '../outils/monter';

const telecharger = vi.hoisted(() => vi.fn());
vi.mock('../../../src/data-access/fichiers', async (original) => ({
  ...(await original<object>()),
  telecharger,
}));
// Les rendus PDF et Word sont testés dans tests/export : ici, seulement les boutons.
const rendus = vi.hoisted(() => ({
  pdfPersonne: vi.fn(),
  pdfGroupe: vi.fn(),
  wordPersonne: vi.fn(),
  wordGroupe: vi.fn(),
}));
vi.mock('../../../src/export/pdf', () => ({
  pdfPersonne: rendus.pdfPersonne,
  pdfGroupe: rendus.pdfGroupe,
}));
vi.mock('../../../src/export/word', () => ({
  wordPersonne: rendus.wordPersonne,
  wordGroupe: rendus.wordGroupe,
}));
beforeEach(() => {
  telecharger.mockReset();
  for (const f of Object.values(rendus)) f.mockReset().mockResolvedValue(new Uint8Array([1, 2]));
});
const OCTETS = new Uint8Array([1, 2]);
const TYPE_PDF = 'application/pdf';
const TYPE_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const choixPersonne = () => screen.getByRole('combobox', { name: 'Personne' });
const critere = (nom: RegExp) => screen.getByRole('group', { name: nom });
const resultat = () => screen.getByRole('region', { name: 'Résultat' });
const bouton = (nom: string, dans: HTMLElement = document.body) =>
  within(dans).getByRole('button', { name: nom });
const lien = (nom: string) => screen.getByRole('link', { name: nom });
const personne = (id: string) => enregistre().etudiants.find((e) => e.id === id)!;

const etudiant = (id: string, nom: string, champs: Partial<Etudiant> = {}): Etudiant => ({
  id,
  nom,
  niveaux: {},
  commentaires: {},
  commentaireGeneral: '',
  ...champs,
});

/** Fond 60 %, Forme 40 %, Bonus 0 % ; 5 niveaux ; 20 points ; trois personnes. */
function dossier(): Dossier {
  return {
    ...dossierVide(),
    grille: {
      ...dossierVide().grille,
      totalPoints: 20,
      criteres: [
        {
          id: 'c1',
          nom: 'Fond',
          poids: 600,
          descripteurs: ['Hors sujet.', 'Superficiel.', 'Juste.', 'Solide.', 'Remarquable.'],
        },
        { id: 'c2', nom: 'Forme', poids: 400, descripteurs: ['', '', '', '', ''] },
        { id: 'c3', nom: 'Bonus', poids: 0, descripteurs: ['', '', '', '', ''] },
      ],
    },
    etudiants: [
      etudiant('e1', 'Élise Roy', { niveaux: { c1: 5, c2: 3 }, commentaires: { c1: 'Clair.' } }),
      etudiant('e2', 'Noé Tremblay'),
      etudiant('e3', 'Zoé Gagnon'),
    ],
  };
}

describe('Évaluation : vues vides', () => {
  it('sans personne : mène au Groupe', () => {
    monterApp('/evaluation');
    expect(screen.getByText(/Ajoutez d’abord des personnes/)).toBeInTheDocument();
    expect(lien('Aller au Groupe')).toHaveAttribute('href', '/groupe');
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('sans critère : mène à la Grille', () => {
    const d = dossier();
    d.grille.criteres = [];
    d.etudiants = d.etudiants.map((e) => ({ ...e, niveaux: {}, commentaires: {} }));
    monterApp('/evaluation', d);
    expect(screen.getByText(/La grille n’a encore aucun critère/)).toBeInTheDocument();
    expect(lien('Aller à la Grille')).toHaveAttribute('href', '/grille');
    expect(screen.queryByRole('radio')).toBeNull();
  });
});

describe('Évaluation : choisir la personne', () => {
  it('sans adresse précise : la première personne', () => {
    monterApp('/evaluation', dossier());
    expect(choixPersonne()).toHaveDisplayValue('Élise Roy');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(bouton('Précédente')).toBeDisabled();
  });

  it('l’adresse ?personne= choisit la personne', () => {
    monterApp('/evaluation?personne=e2', dossier());
    expect(choixPersonne()).toHaveDisplayValue('Noé Tremblay');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('une personne inconnue dans l’adresse donne la première', () => {
    monterApp('/evaluation?personne=zz', dossier());
    expect(choixPersonne()).toHaveDisplayValue('Élise Roy');
  });

  it('Suivante avance et met l’adresse à jour ; au bout, le focus passe à Précédente', async () => {
    const { user, router } = monterApp('/evaluation', dossier());
    await user.click(bouton('Suivante'));
    expect(choixPersonne()).toHaveDisplayValue('Noé Tremblay');
    expect(router.state.location.search).toBe('?personne=e2');
    await user.click(bouton('Suivante'));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(bouton('Suivante')).toBeDisabled();
    expect(bouton('Précédente')).toHaveFocus();
    await user.click(bouton('Précédente'));
    expect(choixPersonne()).toHaveDisplayValue('Noé Tremblay');
  });

  it('au début, Précédente passe le focus à Suivante', async () => {
    const { user } = monterApp('/evaluation?personne=e2', dossier());
    await user.click(bouton('Précédente'));
    expect(bouton('Suivante')).toHaveFocus();
  });

  it('la liste déroulante change de personne', async () => {
    const { user } = monterApp('/evaluation', dossier());
    await user.selectOptions(choixPersonne(), 'Zoé Gagnon');
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(resultat()).toHaveTextContent('Pas encore évaluée');
  });

  it('la personne reste choisie après un passage par une autre vue', async () => {
    const { user } = monterApp('/evaluation', dossier());
    await user.selectOptions(choixPersonne(), 'Zoé Gagnon');
    const vues = screen.getByRole('navigation', { name: 'Vues' });
    await user.click(within(vues).getByRole('link', { name: 'Groupe' }));
    await user.click(within(vues).getByRole('link', { name: 'Évaluation' }));
    expect(choixPersonne()).toHaveDisplayValue('Zoé Gagnon');
  });
});

describe('Évaluation : niveaux et résultat', () => {
  it('un groupe de boutons radio par critère, avec ses descripteurs', () => {
    monterApp('/evaluation', dossier());
    const fond = critere(/^Fond · 60,0\s%$/);
    expect(within(fond).getAllByRole('radio')).toHaveLength(5);
    const excellent = within(fond).getByRole('radio', { name: '5 Excellent' });
    expect(excellent).toBeChecked();
    expect(excellent).toHaveAccessibleDescription('Remarquable.');
    expect(within(critere(/^Forme/)).getByRole('radio', { name: '3 Satisfaisant' })).toBeChecked();
  });

  it('un critère de poids 0 est marqué « non noté »', () => {
    monterApp('/evaluation', dossier());
    expect(critere(/^Bonus · non noté$/)).toBeInTheDocument();
  });

  it('choisir un niveau enregistre et met le résultat à jour, annoncé poliment', async () => {
    const { user } = monterApp('/evaluation?personne=e2', dossier());
    expect(resultat()).toHaveTextContent('Pas encore évaluée');
    expect(within(resultat()).getByText(/Pas encore évaluée/)).toHaveAttribute(
      'aria-live',
      'polite',
    );
    await user.click(within(critere(/^Fond/)).getByRole('radio', { name: '4 Très bon' }));
    expect(personne('e2').niveaux).toEqual({ c1: 4 });
    expect(resultat()).toHaveTextContent('Incomplète : 1 critère sur 2 évalué');
    await user.click(within(critere(/^Forme/)).getByRole('radio', { name: '4 Très bon' }));
    // Le Bonus (poids 0) n'empêche pas la note complète.
    expect(resultat()).toHaveTextContent('16,00 / 20 points · 80,0 % · Très bon');
  });

  it('les flèches du clavier changent de niveau', async () => {
    const { user } = monterApp('/evaluation', dossier());
    const forme = critere(/^Forme/);
    await user.click(within(forme).getByRole('radio', { name: '3 Satisfaisant' }));
    await user.keyboard('{ArrowDown}');
    expect(within(forme).getByRole('radio', { name: '4 Très bon' })).toBeChecked();
    expect(personne('e1').niveaux.c2).toBe(4);
  });

  it('poids différents de 100 % : la raison, et un lien vers la Grille', () => {
    const d = dossier();
    d.grille.criteres[1]!.poids = 350;
    monterApp('/evaluation', d);
    expect(resultat()).toHaveTextContent('Note impossible : les poids font 95,0 %');
    expect(within(resultat()).getByRole('link', { name: 'Corriger les poids' })).toHaveAttribute(
      'href',
      '/grille',
    );
  });
});

describe('Évaluation : commentaires et effacement', () => {
  it('commentaire par critère et commentaire général, enregistrés à la frappe', async () => {
    const { user } = monterApp('/evaluation?personne=e2', dossier());
    await user.type(
      within(critere(/^Forme/)).getByRole('textbox', { name: 'Commentaire' }),
      'Soigné',
    );
    await user.type(screen.getByRole('textbox', { name: 'Commentaire général' }), 'Bravo');
    expect(personne('e2').commentaires).toEqual({ c2: 'Soigné' });
    expect(personne('e2').commentaireGeneral).toBe('Bravo');
  });

  it('changer de personne montre ses propres commentaires', async () => {
    const { user } = monterApp('/evaluation', dossier());
    const commentaireFond = () =>
      within(critere(/^Fond/)).getByRole('textbox', { name: 'Commentaire' });
    expect(commentaireFond()).toHaveValue('Clair.');
    await user.click(bouton('Suivante'));
    expect(commentaireFond()).toHaveValue('');
  });

  it('rien à effacer : le bouton est désactivé', () => {
    monterApp('/evaluation?personne=e3', dossier());
    expect(bouton('Effacer l’évaluation de cette personne')).toBeDisabled();
  });

  it('effacer l’évaluation demande confirmation, puis efface tout pour cette personne', async () => {
    const { user } = monterApp('/evaluation', dossier());
    await user.click(bouton('Effacer l’évaluation de cette personne'));
    const f = screen.getByRole('dialog', { name: 'Effacer l’évaluation de « Élise Roy » ?' });
    expect(f).toHaveTextContent('2 évaluations seront effacées.');
    expect(f).toHaveTextContent('1 commentaire sera effacé.');
    await user.click(bouton('Effacer l’évaluation', f));
    expect(personne('e1')).toMatchObject({ niveaux: {}, commentaires: {} });
    expect(resultat()).toHaveTextContent('Pas encore évaluée');
  });
});

describe('Évaluation : exporter cette personne', () => {
  const exports = () => screen.getByRole('group', { name: 'Exporter cette personne' });

  it('PDF et Word, sans CSV', () => {
    monterApp('/evaluation', dossier());
    expect(bouton('PDF', exports())).toBeEnabled();
    expect(bouton('Word', exports())).toBeEnabled();
    expect(within(exports()).queryByRole('button', { name: 'CSV' })).toBeNull();
  });

  it('PDF : le rapport de la personne choisie, nommé par titre et personne', async () => {
    const { user } = monterApp('/evaluation?personne=e2', dossier());
    await user.click(bouton('PDF', exports()));
    await screen.findByText(/^Fichier prêt :/);
    expect(rendus.pdfPersonne).toHaveBeenCalledWith(
      expect.objectContaining({ personne: 'Noé Tremblay', statut: 'Pas encore évaluée' }),
    );
    expect(telecharger).toHaveBeenCalledWith(
      nomFichier('Noé Tremblay', new Date(), 'pdf'),
      OCTETS,
      TYPE_PDF,
    );
    expect(screen.getByText(/Fichier prêt :/)).toHaveTextContent(
      nomFichier('Noé Tremblay', new Date(), 'pdf'),
    );
  });

  it('Word : un .docx, avec le titre de la grille dans le nom', async () => {
    const d = dossier();
    d.grille.titre = 'Travail de session';
    const { user } = monterApp('/evaluation', d);
    await user.click(bouton('Word', exports()));
    await screen.findByText(/^Fichier prêt :/);
    expect(rendus.wordPersonne).toHaveBeenCalledWith(
      expect.objectContaining({ personne: 'Élise Roy', titre: 'Travail de session' }),
    );
    expect(telecharger).toHaveBeenCalledWith(
      nomFichier('Travail de session Élise Roy', new Date(), 'docx'),
      OCTETS,
      TYPE_WORD,
    );
  });

  it('« Préparation… » pendant la création, sans double clic possible', async () => {
    let terminer: (o: Uint8Array) => void = () => {};
    rendus.pdfPersonne.mockReturnValueOnce(new Promise((r) => (terminer = r)));
    const { user } = monterApp('/evaluation', dossier());
    await user.click(bouton('PDF', exports()));
    const pret = bouton('Préparation…', exports());
    expect(pret).toHaveAttribute('aria-disabled', 'true');
    expect(pret).toHaveFocus();
    expect(bouton('Word', exports())).toHaveAttribute('aria-disabled', 'true');
    await user.click(pret);
    await user.click(bouton('Word', exports()));
    expect(rendus.pdfPersonne).toHaveBeenCalledTimes(1);
    expect(rendus.wordPersonne).not.toHaveBeenCalled();
    await act(async () => terminer(OCTETS));
    expect(bouton('PDF', exports())).not.toHaveAttribute('aria-disabled', 'true');
    expect(telecharger).toHaveBeenCalledTimes(1);
  });

  it('un échec affiche un avis, sans rien télécharger ; on peut réessayer', async () => {
    rendus.pdfPersonne.mockRejectedValueOnce(new Error('panne'));
    const { user } = monterApp('/evaluation', dossier());
    await user.click(bouton('PDF', exports()));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('Le fichier n’a pas pu être créé.');
    expect(telecharger).not.toHaveBeenCalled();
    await user.click(bouton('PDF', exports()));
    await vi.waitFor(() => expect(telecharger).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Évaluation : retirer le niveau d’un critère', () => {
  it('retire le niveau, garde le commentaire, met le résultat à jour', async () => {
    const { user } = monterApp('/evaluation', dossier());
    const fond = critere(/^Fond/);
    await user.click(bouton('Retirer le niveau', fond));
    expect(personne('e1').niveaux).toEqual({ c2: 3 });
    expect(personne('e1').commentaires).toEqual({ c1: 'Clair.' });
    expect(within(fond).getByRole('radio', { name: '5 Excellent' })).not.toBeChecked();
    expect(resultat()).toHaveTextContent('Incomplète');
  });

  it('le bouton disparaît et le focus va sur le premier niveau du critère', async () => {
    const { user } = monterApp('/evaluation', dossier());
    const fond = critere(/^Fond/);
    await user.click(bouton('Retirer le niveau', fond));
    expect(within(fond).queryByRole('button', { name: 'Retirer le niveau' })).toBeNull();
    expect(within(fond).getAllByRole('radio')[0]).toHaveFocus();
  });

  it('absent d’un critère sans niveau', () => {
    monterApp('/evaluation', dossier());
    expect(
      within(critere(/^Bonus/)).queryByRole('button', { name: 'Retirer le niveau' }),
    ).toBeNull();
  });
});

describe('Évaluation : lecture seule (dossier modifié dans un autre onglet)', () => {
  const autreOnglet = () =>
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CLE_DOSSIER }));
    });

  it('les modifications sont désactivées', () => {
    monterApp('/evaluation', dossier());
    autreOnglet();
    expect(within(critere(/^Fond/)).getAllByRole('radio')[0]).toBeDisabled();
    expect(
      within(critere(/^Fond/)).getByRole('button', { name: 'Retirer le niveau' }),
    ).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Commentaire général' })).toBeDisabled();
    expect(bouton('Effacer l’évaluation de cette personne')).toBeDisabled();
  });

  it('changer de personne reste possible : rien n’est modifié', async () => {
    const { user } = monterApp('/evaluation', dossier());
    autreOnglet();
    expect(choixPersonne()).toBeEnabled();
    await user.click(bouton('Suivante'));
    expect(choixPersonne()).toHaveValue('e2');
    await user.selectOptions(choixPersonne(), 'e3');
    expect(choixPersonne()).toHaveValue('e3');
    await user.click(bouton('Précédente'));
    expect(choixPersonne()).toHaveValue('e2');
  });
});
