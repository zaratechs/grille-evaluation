import { describe, it, expect } from 'vitest';
import { dossierVide, type Grille } from '../../src/domain';
import { texteNote, texteResultat } from '../../src/textes/resultats';

const grille = (totalPoints = 20): Grille => ({ ...dossierVide().grille, totalPoints });

describe('texteResultat', () => {
  it('grille sans critère', () => {
    expect(texteResultat(grille(), { statut: 'vide' })).toBe('Aucun critère dans la grille');
  });

  it('poids différents de 100 % : la raison, sans note', () => {
    expect(
      texteResultat(grille(), { statut: 'ponderation-invalide', totalPoids: 950, ecart: -50 }),
    ).toBe('Note impossible : les poids font 95,0 %');
  });

  it('aucun critère évalué : « Pas encore évaluée »', () => {
    expect(texteResultat(grille(), { statut: 'incomplete', evalues: 0, aEvaluer: 3 })).toBe(
      'Pas encore évaluée',
    );
  });

  it('incomplète, au singulier et au pluriel', () => {
    expect(texteResultat(grille(), { statut: 'incomplete', evalues: 1, aEvaluer: 3 })).toBe(
      'Incomplète : 1 critère sur 3 évalué',
    );
    expect(texteResultat(grille(), { statut: 'incomplete', evalues: 2, aEvaluer: 3 })).toBe(
      'Incomplète : 2 critères sur 3 évalués',
    );
  });

  it('complète : points, pourcentage et appréciation ; total décimal avec une virgule', () => {
    const r = {
      statut: 'complete' as const,
      points: 1680,
      pourcentage: 840,
      appreciation: { niveau: 4, libelle: 'Très bon' },
    };
    expect(texteResultat(grille(), r)).toBe('16,80 / 20 points · 84,0 % · Très bon');
    expect(texteResultat(grille(20.5), r)).toContain('/ 20,5 points');
  });
});

describe('texteNote', () => {
  it('points et pourcentage', () => {
    expect(texteNote(grille(), { points: 1600, pourcentage: 800 })).toBe(
      '16,00 / 20 points (80,0 %)',
    );
  });
});
