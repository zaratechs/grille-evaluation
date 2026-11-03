import { describe, it, expect } from 'vitest';
import { rapportGroupe } from '../../src/export/contenu';
import { exporterCSV } from '../../src/export/csv';
import type { Dossier } from '../../src/domain';
import { DATE, jeu } from './jeu';

const csv = (dossier: Dossier = jeu()) => exporterCSV(rapportGroupe(dossier, DATE));

/** Les lignes, sans le BOM ni la ligne vide finale ; valable sans retour à la ligne dans les cellules. */
const lignes = (texte: string) => texte.slice(1).split('\r\n').slice(0, -1);

/** Les cellules d'une ligne, guillemets retirés ; valable sans `;` dans les cellules. */
const cellules = (ligne: string) => ligne.split(';').map((c) => c.slice(1, -1).replace(/""/g, '"'));

describe('exporterCSV : format', () => {
  it('commence par le BOM UTF-8 et finit chaque ligne par CRLF', () => {
    const t = csv();
    expect(t.startsWith('\uFEFF')).toBe(true);
    expect(t.endsWith('\r\n')).toBe(true);
    expect(t.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    expect(lignes(t)).toHaveLength(5); // en-têtes + 4 personnes
  });

  it('chaque cellule est entre guillemets, séparée par « ; »', () => {
    for (const ligne of lignes(csv())) expect(ligne).toMatch(/^"[^]*"$/);
    expect(lignes(csv())[0]).toContain('";"');
  });

  it('en-têtes : personne, résultat, un niveau puis un commentaire par critère, commentaire général', () => {
    expect(cellules(lignes(csv())[0]!)).toEqual([
      'Personne étudiante',
      'Statut',
      'Points',
      'Sur',
      'Pourcentage',
      'Appréciation',
      'Fond (niveau)',
      'Forme (niveau)',
      'Bonus (niveau)',
      'Fond (commentaire)',
      'Forme (commentaire)',
      'Bonus (commentaire)',
      'Commentaire général',
    ]);
  });
});

describe('exporterCSV : contenu', () => {
  it('évaluation complète : virgule décimale, mêmes notes que le contenu', () => {
    expect(cellules(lignes(csv())[1]!)).toEqual([
      'Élise Roy',
      'Complète',
      '16,80',
      '20',
      '84,0',
      'Très bon',
      '5',
      '3',
      '',
      'Clair.',
      '',
      '',
      'Très bon travail.',
    ]);
    expect(cellules(lignes(csv())[2]!).slice(0, 6)).toEqual([
      'Nguyễn Văn An',
      'Complète',
      '16,00',
      '20',
      '80,0',
      'Très bon',
    ]);
  });

  it('incomplète ou pas encore évaluée : aucune note, aucun zéro', () => {
    expect(cellules(lignes(csv())[3]!).slice(0, 9)).toEqual([
      'Noé Tremblay',
      'Incomplète',
      '',
      '20',
      '',
      '',
      '4',
      '',
      '',
    ]);
    expect(cellules(lignes(csv())[4]!).slice(0, 6)).toEqual([
      'Łukasz Nowak',
      'Pas encore évaluée',
      '',
      '20',
      '',
      '',
    ]);
  });

  it('poids différents de 100 % : « Note impossible », sans note', () => {
    const d = jeu();
    d.grille.criteres[1]!.poids = 350;
    expect(cellules(lignes(csv(d))[1]!).slice(1, 6)).toEqual(['Note impossible', '', '20', '', '']);
  });

  it('total de 1 000 points : nombres sans espace de milliers, pour le tableur', () => {
    const d = jeu();
    d.grille.totalPoints = 1000;
    expect(cellules(lignes(csv(d))[1]!).slice(2, 4)).toEqual(['840,00', '1000']);
  });

  it('guillemets doublés, « ; » et retours à la ligne gardés dans la cellule', () => {
    const d = jeu();
    d.etudiants[0]!.commentaireGeneral = 'Dit « bien » ; écrit "très bien".\nÀ suivre.';
    const t = csv(d);
    expect(t).toContain('"Dit « bien » ; écrit ""très bien"".\nÀ suivre."\r\n');
  });

  it('groupe vide : seulement les en-têtes', () => {
    const d = jeu();
    d.etudiants = [];
    expect(lignes(csv(d))).toHaveLength(1);
  });
});

describe('exporterCSV : injection de formules', () => {
  it.each(['=SOMME(A1)', '+33 6', '-5 ans', '@cmd', '\tTab', '\rRetour'])(
    'une cellule qui commence par « %s » est précédée d’une apostrophe',
    (nom) => {
      const d = jeu();
      d.etudiants[0]!.nom = nom;
      d.etudiants[0]!.commentaires.c2 = nom;
      const t = csv(d);
      const attendu = `"'${nom}"`;
      expect(t.split(attendu)).toHaveLength(3); // le nom et le commentaire
    },
  );

  it('un texte ordinaire et les nombres de l’application restent tels quels', () => {
    const ligne = lignes(csv())[1]!;
    expect(ligne).not.toContain("'");
  });
});
