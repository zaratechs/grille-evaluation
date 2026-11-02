import { describe, it, expect } from 'vitest';
import * as domaine from '../../src/domain';

describe('API publique du domaine', () => {
  it.each([
    'ok',
    'erreur',
    'dossierVide',
    'changerTitre',
    'lireTotalPoints',
    'changerTotalPoints',
    'lirePoids',
    'egaliserPoids',
    'ponderationValide',
    'ajouterNiveau',
    'retirerNiveau',
    'renommerNiveau',
    'ajouterCritere',
    'renommerCritere',
    'changerPoids',
    'modifierDescripteur',
    'deplacerCritere',
    'retirerCritere',
    'ajouterEtudiant',
    'renommerEtudiant',
    'retirerEtudiant',
    'deplacerEtudiant',
    'evaluer',
    'commenter',
    'commenterGeneral',
    'reinitialiserEvaluation',
    'calculerResultat',
    'synthese',
    'formaterPoids',
    'formaterPourcentage',
    'formaterPoints',
    'appliquerModele',
    'enregistrerModele',
    'renommerModele',
    'supprimerModele',
    'migrer',
    'assainir',
    'bilanVide',
  ])('exporte %s', (nom) => {
    expect(typeof (domaine as Record<string, unknown>)[nom]).toBe('function');
  });

  it('exporte les constantes', () => {
    expect(domaine.VERSION_COURANTE).toBe(1);
    expect(domaine.POIDS_TOTAL).toBe(1000);
    expect(domaine.NIVEAUX_PAR_DEFAUT).toHaveLength(5);
    expect(domaine.NIVEAUX_MIN).toBe(3);
    expect(domaine.NIVEAUX_MAX).toBe(10);
    expect(domaine.NOM_LONGUEUR_MAX).toBe(100);
    expect(domaine.TITRE_LONGUEUR_MAX).toBe(200);
    expect(domaine.TOTAL_POINTS_MAX).toBe(1000);
  });
});
