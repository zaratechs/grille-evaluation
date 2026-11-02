import { describe, it, expect } from 'vitest';
import { MESSAGES_AVERTISSEMENT, MESSAGES_ERREUR, phrasesBilan } from '../../src/ui/messages';
import { bilanVide } from '../../src/domain';

describe('messages', () => {
  it.each(Object.entries(MESSAGES_ERREUR))('erreur « %s » : une phrase en français', (_, texte) => {
    expect(texte.trim()).toMatch(/^[A-ZÀ-Ý].*\.$/);
  });

  it.each(Object.entries(MESSAGES_AVERTISSEMENT))(
    'avertissement « %s » : une phrase',
    (_, texte) => {
      expect(texte.trim()).toMatch(/^[A-ZÀ-Ý].*\.$/);
    },
  );

  it('couvre chaque avertissement de la phase 3', () => {
    expect(Object.keys(MESSAGES_AVERTISSEMENT).sort()).toEqual(
      ['illisible', 'lecture-impossible', 'repare', 'version-future'].sort(),
    );
  });

  it('des messages distincts, pour que chaque cas se reconnaisse', () => {
    const textes = Object.values(MESSAGES_ERREUR);
    expect(new Set(textes).size).toBe(textes.length);
  });
});

describe('phrasesBilan', () => {
  it('un bilan vide ne donne aucune phrase', () => {
    expect(phrasesBilan(bilanVide())).toEqual([]);
  });

  it('une phrase par correction, au singulier ou au pluriel', () => {
    const bilan = { ...bilanVide(), poidsCorriges: 2, personnesEcartees: 1 };
    expect(phrasesBilan(bilan)).toEqual(['2 poids corrigés', '1 personne étudiante écartée']);
  });

  it('donne une phrase pour chaque type de correction', () => {
    const bilan = Object.fromEntries(Object.keys(bilanVide()).map((cle) => [cle, 1]));
    const phrases = phrasesBilan(bilan as ReturnType<typeof bilanVide>);
    expect(phrases).toHaveLength(Object.keys(bilanVide()).length);
    for (const phrase of phrases) expect(phrase).toMatch(/^1 \S/);
  });
});
