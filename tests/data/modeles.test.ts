import { describe, it, expect } from 'vitest';
import { AUTEUR_MODELES, LICENCE_MODELES, MODELES_FOURNIS } from '../../src/data/modeles';
import { NIVEAUX_PAR_DEFAUT } from '../../src/domain/niveaux';

/** Identifiants et noms de l'outil d'origine, dans le même ordre (sans la numérotation). */
const ORIGINE: [string, string][] = [
  ['EtudeCas', 'Étude de cas'],
  ['PresOrale', 'Présentation orale'],
  ['TravailEcrit', 'Travail écrit'],
  ['RapportPro', 'Rapport professionnel'],
  ['TeamWork', "Travail d'équipe"],
  ['Portfolio', 'Portfolio'],
  ['ProjetIntegrateur', 'Projet intégrateur'],
  ['ExamenPratique', 'Examen pratique'],
  ['ExamenTheorique', 'Examen théorique'],
  ['JournalReflexif', 'Journal réflexif'],
  ['Simulation', 'Simulation'],
  ['DemoTech', 'Démonstration technique'],
  ['CapsuleVideo', 'Capsule vidéo'],
  ['Infographie', 'Infographie'],
  ['QuizFormatif', 'Quiz formatif'],
  ['EntrevueSim', 'Entrevue simulée'],
  ['ResolProbleme', 'Résolution de problème'],
  ['Labo', 'Laboratoire'],
  ['MicroEns', 'Micro-enseignement'],
  ['CarteConcept', 'Carte conceptuelle'],
  ['PlanAction', "Plan d'action"],
  ['AnalyseDonnees', 'Analyse de données'],
  ['Debat', 'Débat'],
  ['DiscussionDir', 'Discussion dirigée'],
  ['EtudeCompar', 'Étude comparative'],
];

describe('les 25 modèles fournis', () => {
  it('reprennent les modèles de l’outil d’origine, dans le même ordre', () => {
    expect(MODELES_FOURNIS.map((m) => [m.id, m.nom])).toEqual(ORIGINE);
  });

  it('ont des identifiants uniques', () => {
    expect(new Set(MODELES_FOURNIS.map((m) => m.id)).size).toBe(25);
  });

  it.each(MODELES_FOURNIS.map((m) => [m.nom, m] as const))(
    '« %s » : 5 niveaux par défaut, 5 critères de 20 %, 5 descripteurs remplis',
    (_, modele) => {
      expect(modele.niveaux).toEqual(NIVEAUX_PAR_DEFAUT);
      expect(modele.criteres).toHaveLength(5);
      for (const c of modele.criteres) {
        expect(c.nom.trim()).not.toBe('');
        expect(c.nom.length).toBeLessThanOrEqual(100);
        expect(c.poids).toBe(200);
        expect(c.descripteurs).toHaveLength(5);
        expect(c.descripteurs.every((d) => d.trim() !== '')).toBe(true);
      }
    },
  );

  it('place le descripteur du niveau le plus faible en premier', () => {
    const analyse = MODELES_FOURNIS[0]?.criteres[0];
    expect(analyse?.nom).toBe('Analyse de la situation');
    expect(analyse?.descripteurs[0]).toMatch(/^Analyse superficielle/);
    expect(analyse?.descripteurs[4]).toMatch(/^Analyse exhaustive/);
  });

  it('créditent Paulo Mendonça et la licence CC BY-NC-SA 4.0', () => {
    expect(AUTEUR_MODELES).toBe('Paulo Mendonça');
    expect(LICENCE_MODELES).toBe('CC BY-NC-SA 4.0');
  });

  // `npm run check:neutralite` analyse aussi src/data ; ce test vérifie en plus l'absence
  // de tout nom d'établissement générique ou de courriel dans le texte des modèles.
  it('ne nomment aucun établissement et ne contiennent aucun courriel', () => {
    const texte = JSON.stringify(MODELES_FOURNIS);
    expect(texte).not.toMatch(/c[ée]gep|coll[èe]ge|universit[ée]|@/i);
  });
});
