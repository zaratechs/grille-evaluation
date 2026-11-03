import { describe, it, expect } from 'vitest';
import type { Etudiant } from '../../src/domain';
import { accorder, pertesEtudiant, phrasesPertes } from '../../src/textes/accords';

describe('accorder', () => {
  it('singulier pour 0 et 1, pluriel au-delà', () => {
    expect(accorder(0, 'critère', 'critères')).toBe('0 critère');
    expect(accorder(1, 'critère', 'critères')).toBe('1 critère');
    expect(accorder(2, 'critère', 'critères')).toBe('2 critères');
  });
});

describe('phrasesPertes', () => {
  it('une phrase par perte, les nombres nuls omis', () => {
    expect(phrasesPertes({ evaluations: 2, commentaires: 1, descripteurs: 3 })).toEqual([
      '2 évaluations seront effacées.',
      '1 commentaire sera effacé.',
      '3 descripteurs seront effacés.',
    ]);
    expect(phrasesPertes({ evaluations: 1, commentaires: 2, descripteurs: 1 })).toEqual([
      '1 évaluation sera effacée.',
      '2 commentaires seront effacés.',
      '1 descripteur sera effacé.',
    ]);
    expect(phrasesPertes({})).toEqual([]);
  });
});

describe('pertesEtudiant', () => {
  const e = (champs: Partial<Etudiant>): Etudiant => ({
    id: 'e1',
    nom: 'Élise Roy',
    niveaux: {},
    commentaires: {},
    commentaireGeneral: '',
    ...champs,
  });

  it('compte les évaluations et les commentaires non vides, dont le général', () => {
    expect(
      pertesEtudiant(
        e({
          niveaux: { c1: 3, c2: 4 },
          commentaires: { c1: 'Clair.', c2: '   ' },
          commentaireGeneral: 'Bravo.',
        }),
      ),
    ).toEqual(['2 évaluations seront effacées.', '2 commentaires seront effacés.']);
  });

  it('rien à perdre : aucune phrase', () => {
    expect(pertesEtudiant(e({ commentaireGeneral: '  ' }))).toEqual([]);
  });
});
