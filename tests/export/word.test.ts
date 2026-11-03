import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { rapportGroupe, rapportPersonne, type RapportPersonne } from '../../src/export/contenu';
import { wordGroupe, wordPersonne } from '../../src/export/word';
import type { Dossier } from '../../src/domain';
import { DATE, jeu } from './jeu';

/** Le rapport d'une personne du jeu d'essai. */
const rapport = (id: string, dossier: Dossier = jeu()): RapportPersonne => {
  const r = rapportPersonne(dossier, id, DATE);
  if (!r.ok) throw new Error(r.erreur);
  return r.valeur;
};

/** Ouvre le .docx et rend ses parties XML utiles. */
async function ouvrir(octets: Uint8Array) {
  const zip = await JSZip.loadAsync(octets);
  const partie = async (nom: string) => (await zip.file(nom)?.async('string')) ?? '';
  const document = await partie('word/document.xml');
  const pieds = await Promise.all(
    Object.keys(zip.files)
      .filter((n) => /^word\/footer\d*\.xml$/.test(n))
      .map((n) => partie(n)),
  );
  return {
    document,
    styles: await partie('word/styles.xml'),
    pied: pieds.join(''),
    core: await partie('docProps/core.xml'),
    /** Le texte seul, sans balises. */
    texte: document.replace(/<w:br\/>/g, '\n').replace(/<[^>]+>/g, ''),
  };
}

const compter = (xml: string, motif: RegExp) => (xml.match(motif) ?? []).length;

describe('wordPersonne', () => {
  it('produit une archive .docx valide', async () => {
    const octets = await wordPersonne(rapport('e1'));
    expect(octets).toBeInstanceOf(Uint8Array);
    expect(String.fromCharCode(octets[0]!, octets[1]!)).toBe('PK');
  });

  it('contient l’en-tête, le résultat, les critères et le commentaire général', async () => {
    const { texte } = await ouvrir(await wordPersonne(rapport('e1')));
    for (const attendu of [
      'Travail de session',
      'Élise Roy',
      '2 novembre 2026',
      '16,80 / 20 points · 84,0\u00a0% · Très bon',
      'Fond',
      '60,0\u00a0%',
      '5 Excellent',
      'Remarquable.',
      'Clair.',
      'Bonus',
      'non noté',
      'Très bon travail.',
    ]) {
      expect(texte).toContain(attendu);
    }
  });

  it('libellés en gras « Date : » et « Résultat : »', async () => {
    const { document, texte } = await ouvrir(await wordPersonne(rapport('e1')));
    expect(texte).toContain('Date : 2 novembre 2026');
    expect(texte).toContain('Résultat : 16,80');
    expect(document).toMatch(/<w:b\/>[^]*?Date : /);
  });

  it('incomplète : le statut, sans note', async () => {
    const { texte } = await ouvrir(await wordPersonne(rapport('e3')));
    expect(texte).toContain('Incomplète : 1 critère sur 2 évalué');
    expect(texte).not.toMatch(/\/ 20 points/);
  });

  it('sans commentaire général : pas de section', async () => {
    const { texte } = await ouvrir(await wordPersonne(rapport('e2')));
    expect(texte).not.toContain('COMMENTAIRE GÉNÉRAL');
    const avec = await ouvrir(await wordPersonne(rapport('e1')));
    expect(avec.texte).toContain('COMMENTAIRE GÉNÉRAL');
  });

  it('un commentaire sur plusieurs lignes garde ses retours à la ligne', async () => {
    const d = jeu();
    d.etudiants[0]!.commentaireGeneral = 'Première ligne.\nDeuxième ligne.';
    const { texte } = await ouvrir(await wordPersonne(rapport('e1', d)));
    expect(texte).toContain('Première ligne.\nDeuxième ligne.');
  });

  it('page Lettre US portrait, marges de 2 cm', async () => {
    const { document } = await ouvrir(await wordPersonne(rapport('e1')));
    expect(document).toMatch(/<w:pgSz w:w="12240" w:h="15840"/);
    for (const cote of ['top', 'right', 'bottom', 'left']) {
      expect(document).toMatch(new RegExp(`w:${cote}="1134"`));
    }
  });

  it('styles Word : Titre 1 pour la grille, Titre 2 pour la personne ; Calibri', async () => {
    const { document, styles } = await ouvrir(await wordPersonne(rapport('e1')));
    expect(document).toMatch(/<w:pStyle w:val="Heading1"\/>[^]*?Travail de session/);
    expect(document).toMatch(/<w:pStyle w:val="Heading2"\/>[^]*?Élise Roy/);
    expect(styles).toContain('Calibri');
    expect(styles).toContain('fr-CA');
  });

  it('tableau : en-tête répété à chaque page, lignes insécables', async () => {
    const { document } = await ouvrir(await wordPersonne(rapport('e1')));
    expect(compter(document, /<w:tblHeader\/>/g)).toBe(1);
    // En-tête + 3 critères, aucune ligne coupée entre deux pages.
    expect(compter(document, /<w:cantSplit\/>/g)).toBe(4);
  });

  it('pied de page : « Grille d’évaluation · page X sur Y »', async () => {
    const { pied } = await ouvrir(await wordPersonne(rapport('e1')));
    expect(pied).toContain('Grille d’évaluation · page ');
    expect(pied).toMatch(/PAGE/);
    expect(pied).toMatch(/NUMPAGES/);
  });

  it('métadonnées : le titre du document', async () => {
    const { core } = await ouvrir(await wordPersonne(rapport('e1')));
    expect(core).toContain('Travail de session — Élise Roy');
  });
});

describe('wordGroupe', () => {
  const groupe = async (dossier: Dossier = jeu()) =>
    ouvrir(await wordGroupe(rapportGroupe(dossier, DATE)));

  it('synthèse d’abord, avec un tableau Personne / Résultat', async () => {
    const { texte } = await groupe();
    const synthese = texte.indexOf('Synthèse du groupe');
    expect(synthese).toBeGreaterThan(-1);
    expect(texte).toContain('2 évaluations complètes sur 4');
    expect(texte).toContain('Moyenne : 16,40 / 20 points (82,0\u00a0%)');
    expect(texte.indexOf('Personne étudiante')).toBeGreaterThan(synthese);
    expect(texte).toContain('Pas encore évaluée');
  });

  it('chaque personne en Titre 2, après un saut de page, dans l’ordre du groupe', async () => {
    const { document, texte } = await groupe();
    expect(compter(document, /<w:pageBreakBefore\/>/g)).toBe(4);
    const positions = ['Élise Roy', 'Nguyễn Văn An', 'Noé Tremblay', 'Łukasz Nowak'].map((n) =>
      texte.lastIndexOf(n),
    );
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    // Synthèse et 4 personnes, chacune en Titre 2.
    expect(compter(document, /<w:pStyle w:val="Heading2"\/>/g)).toBe(5);
  });

  it('tableaux : un en-tête répété par tableau (synthèse + 4 personnes)', async () => {
    const { document } = await groupe();
    expect(compter(document, /<w:tblHeader\/>/g)).toBe(5);
  });

  it('groupe vide : la synthèse seulement, sans saut de page', async () => {
    const d = jeu();
    d.etudiants = [];
    const { document, texte } = await groupe(d);
    expect(texte).toContain('Aucune évaluation complète sur 0.');
    expect(compter(document, /<w:pageBreakBefore\/>/g)).toBe(0);
  });

  it('métadonnées : le titre du document', async () => {
    const { core } = await groupe();
    expect(core).toContain('Travail de session — Groupe');
  });
});
