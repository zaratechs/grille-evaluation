import { describe, it, expect } from 'vitest';
import { rapportGroupe, rapportPersonne, type RapportPersonne } from '../../src/export/contenu';
import { DATE, jeu } from './jeu';

const personne = (id: string, dossier = jeu()): RapportPersonne => {
  const r = rapportPersonne(dossier, id, DATE);
  if (!r.ok) throw new Error(r.erreur);
  return r.valeur;
};

describe('rapportPersonne', () => {
  it('en-tête : titre, nom, date en lettres à l’heure locale', () => {
    expect(personne('e1')).toMatchObject({
      titre: 'Travail de session',
      personne: 'Élise Roy',
      date: '2 novembre 2026',
    });
  });

  it('sans titre : « Grille d’évaluation »', () => {
    const d = jeu();
    d.grille.titre = '   ';
    expect(personne('e1', d).titre).toBe('Grille d’évaluation');
  });

  it('résultat complet : le texte de l’écran, et les chiffres pour le CSV', () => {
    expect(personne('e1')).toMatchObject({
      statut: 'Complète',
      resultat: '16,80 / 20 points · 84,0\u00a0% · Très bon',
      chiffres: { points: '16,80', sur: '20', pourcentage: '84,0', appreciation: 'Très bon' },
    });
  });

  it('une ligne par critère : poids, niveau, descripteur du niveau, commentaire', () => {
    expect(personne('e1').criteres).toEqual([
      {
        critere: 'Fond',
        poids: '60,0\u00a0%',
        niveau: '5 Excellent',
        numero: 5,
        descripteur: 'Remarquable.',
        commentaire: 'Clair.',
      },
      {
        critere: 'Forme',
        poids: '40,0\u00a0%',
        niveau: '3 Satisfaisant',
        numero: 3,
        descripteur: 'Correcte.',
        commentaire: '',
      },
      {
        critere: 'Bonus',
        poids: 'non noté',
        niveau: '—',
        numero: null,
        descripteur: '',
        commentaire: '',
      },
    ]);
  });

  it('commentaire général : gardé tel quel, ou null s’il est vide', () => {
    expect(personne('e1').commentaireGeneral).toBe('Très bon travail.');
    expect(personne('e2').commentaireGeneral).toBeNull();
    const d = jeu();
    d.etudiants[1]!.commentaireGeneral = '  \n ';
    expect(personne('e2', d).commentaireGeneral).toBeNull();
  });

  it('incomplète : le statut, aucune note', () => {
    expect(personne('e3')).toMatchObject({
      statut: 'Incomplète',
      resultat: 'Incomplète : 1 critère sur 2 évalué',
      chiffres: null,
    });
  });

  it('pas encore évaluée', () => {
    expect(personne('e4')).toMatchObject({
      statut: 'Pas encore évaluée',
      resultat: 'Pas encore évaluée',
      chiffres: null,
    });
  });

  it('poids différents de 100 % : « Note impossible », aucune note', () => {
    const d = jeu();
    d.grille.criteres[1]!.poids = 350;
    expect(personne('e1', d)).toMatchObject({
      statut: 'Note impossible',
      resultat: 'Note impossible : les poids font 95,0\u00a0%',
      chiffres: null,
    });
  });

  it('grille sans critère', () => {
    const d = jeu();
    d.grille.criteres = [];
    expect(personne('e1', d)).toMatchObject({ statut: 'Aucun critère', criteres: [] });
  });

  it('personne inconnue : erreur', () => {
    expect(rapportPersonne(jeu(), 'zz', DATE)).toEqual({
      ok: false,
      erreur: 'etudiant-introuvable',
    });
  });
});

describe('rapportGroupe', () => {
  it('titre, date, total et noms des critères', () => {
    expect(rapportGroupe(jeu(), DATE)).toMatchObject({
      titre: 'Travail de session',
      date: '2 novembre 2026',
      sur: '20',
      criteres: ['Fond', 'Forme', 'Bonus'],
    });
  });

  it('synthèse : les phrases de l’écran', () => {
    expect(rapportGroupe(jeu(), DATE).synthese).toEqual([
      '2 évaluations complètes sur 4',
      'Moyenne : 16,40 / 20 points (82,0\u00a0%)',
      'Médiane : 16,40 / 20 points (82,0\u00a0%)',
    ]);
  });

  it('une personne par rapport, dans l’ordre du groupe, identique au rapport seul', () => {
    const g = rapportGroupe(jeu(), DATE);
    expect(g.personnes.map((p) => p.personne)).toEqual([
      'Élise Roy',
      'Nguyễn Văn An',
      'Noé Tremblay',
      'Łukasz Nowak',
    ]);
    expect(g.personnes[1]).toEqual(personne('e2'));
  });

  it('groupe vide : aucune personne, synthèse « aucune évaluation »', () => {
    const d = jeu();
    d.etudiants = [];
    expect(rapportGroupe(d, DATE)).toMatchObject({
      personnes: [],
      synthese: ['Aucune évaluation complète sur 0.'],
    });
  });
});
