import { describe, it, expect } from 'vitest';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { rapportGroupe, rapportPersonne, type RapportPersonne } from '../../src/export/contenu';
import { pdfGroupe, pdfPersonne } from '../../src/export/pdf';
import type { Dossier } from '../../src/domain';
import { DATE, jeu } from './jeu';

const LARGEUR = 612;
const HAUTEUR = 792;
/** 2 cm en points. */
const MARGE = (2 / 2.54) * 72;
const TOLERANCE = 0.5;

const rapport = (id: string, dossier: Dossier = jeu()): RapportPersonne => {
  const r = rapportPersonne(dossier, id, DATE);
  if (!r.ok) throw new Error(r.erreur);
  return r.valeur;
};

type Bout = { texte: string; x: number; y: number; largeur: number };
type Page = { taille: number[]; bouts: Bout[]; texte: string };

/** Relit le PDF : pour chaque page, sa taille et ses bouts de texte placés. */
async function relire(octets: Uint8Array) {
  const pdf = await getDocument({ data: octets.slice() }).promise;
  const pages: Page[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const contenu = await page.getTextContent();
    const bouts = contenu.items
      .filter((i) => 'str' in i && i.str.trim() !== '')
      .map((i) => {
        const b = i as { str: string; transform: number[]; width: number };
        return { texte: b.str, x: b.transform[4]!, y: b.transform[5]!, largeur: b.width };
      });
    pages.push({ taille: [...page.view], bouts, texte: bouts.map((b) => b.texte).join('\n') });
  }
  const { info } = (await pdf.getMetadata()) as { info: { Title?: string } };
  return { pages, titre: info.Title, brut: new TextDecoder('latin1').decode(octets) };
}

/**
 * Noto Sans dessine l'espace insécable comme l'espace : à la relecture, pdfjs rend donc une
 * espace simple. L'espace reste insécable à l'écriture (jsPDF ne coupe qu'aux espaces).
 */
const lu = (texte: string) => texte.replace(/\u00a0/g, ' ');

const tout = (pages: Page[]) => pages.map((p) => p.texte).join('\n');

describe('pdfPersonne', () => {
  it('produit un PDF', async () => {
    const octets = await pdfPersonne(rapport('e1'));
    expect(new TextDecoder().decode(octets.slice(0, 5))).toBe('%PDF-');
  });

  it('une page Lettre US portrait', async () => {
    const { pages } = await relire(await pdfPersonne(rapport('e1')));
    expect(pages).toHaveLength(1);
    expect(pages[0]!.taille).toEqual([0, 0, LARGEUR, HAUTEUR]);
  });

  it('contient l’en-tête, le résultat, les critères et le commentaire général', async () => {
    const texte = tout((await relire(await pdfPersonne(rapport('e1')))).pages);
    for (const attendu of [
      'Travail de session',
      'Élise Roy',
      '2 novembre 2026',
      lu('16,80 / 20 points · 84,0\u00a0% · Très bon'),
      'Fond',
      lu('60,0\u00a0%'),
      '5 Excellent',
      'Remarquable.',
      'Clair.',
      'non noté',
      'COMMENTAIRE GÉNÉRAL',
      'Très bon travail.',
    ]) {
      expect(texte).toContain(attendu);
    }
  });

  it('les noms « Nguyễn » et « Łukasz » s’écrivent avec tous leurs caractères', async () => {
    expect(tout((await relire(await pdfPersonne(rapport('e2')))).pages)).toContain('Nguyễn Văn An');
    expect(tout((await relire(await pdfPersonne(rapport('e4')))).pages)).toContain('Łukasz Nowak');
  });

  it('incomplète : le statut, sans note ; sans commentaire général : pas de section', async () => {
    const texte = tout((await relire(await pdfPersonne(rapport('e3')))).pages);
    expect(texte).toContain('Incomplète : 1 critère sur 2 évalué');
    expect(texte).not.toContain('/ 20 points');
    expect(texte).not.toContain('COMMENTAIRE GÉNÉRAL');
  });

  it('pied de page « Grille d’évaluation · page 1 sur 1 »', async () => {
    const { pages } = await relire(await pdfPersonne(rapport('e1')));
    expect(pages[0]!.texte).toContain('Grille d’évaluation · page 1 sur 1');
  });

  it('aucun texte hors des marges ; le pied de page reste dans la page', async () => {
    const { pages } = await relire(await pdfPersonne(rapport('e1')));
    for (const b of pages[0]!.bouts) {
      expect(b.x, b.texte).toBeGreaterThanOrEqual(MARGE - TOLERANCE);
      expect(b.x + b.largeur, b.texte).toBeLessThanOrEqual(LARGEUR - MARGE + TOLERANCE);
      expect(b.y, b.texte).toBeLessThanOrEqual(HAUTEUR - MARGE + TOLERANCE);
      expect(b.y, b.texte).toBeGreaterThanOrEqual(MARGE / 2);
    }
  });

  it('métadonnées : titre du document et langue fr-CA', async () => {
    const { titre, brut } = await relire(await pdfPersonne(rapport('e1')));
    expect(titre).toBe('Travail de session — Élise Roy');
    expect(brut).toContain('/Lang (fr-CA)');
  });

  it('un très long commentaire passe à la ligne, sans déborder', async () => {
    const d = jeu();
    d.etudiants[0]!.commentaires.c1 = 'Argumentation solide et bien appuyée. '.repeat(40);
    d.etudiants[0]!.commentaireGeneral = 'Travail sérieux. '.repeat(200);
    const { pages } = await relire(await pdfPersonne(rapport('e1', d)));
    expect(pages.length).toBeGreaterThan(1);
    for (const p of pages) {
      for (const b of p.bouts) {
        expect(b.x + b.largeur, b.texte).toBeLessThanOrEqual(LARGEUR - MARGE + TOLERANCE);
      }
    }
    expect(pages.at(-1)!.texte).toContain(`page ${pages.length} sur ${pages.length}`);
  });
});

describe('pdfGroupe', () => {
  it('synthèse en première page, puis chaque personne sur sa propre page', async () => {
    const { pages, titre } = await relire(await pdfGroupe(rapportGroupe(jeu(), DATE)));
    expect(titre).toBe('Travail de session — Groupe');
    expect(pages[0]!.texte).toContain('Synthèse du groupe');
    expect(pages[0]!.texte).toContain('2 évaluations complètes sur 4');
    expect(pages[0]!.texte).toContain(lu('Moyenne : 16,40 / 20 points (82,0\u00a0%)'));
    const noms = ['Élise Roy', 'Nguyễn Văn An', 'Noé Tremblay', 'Łukasz Nowak'];
    // Page 2 à 5 : une personne chacune, son nom en tête de page.
    expect(pages).toHaveLength(5);
    noms.forEach((nom, i) => expect(pages[i + 1]!.bouts[0]!.texte).toBe(nom));
  });

  it('groupe vide : la synthèse seulement', async () => {
    const d = jeu();
    d.etudiants = [];
    const { pages } = await relire(await pdfGroupe(rapportGroupe(d, DATE)));
    expect(pages).toHaveLength(1);
    expect(pages[0]!.texte).toContain('Aucune évaluation complète sur 0.');
  });

  it('40 personnes très commentées : aucune ligne de critère coupée, en-tête répété', async () => {
    const d = jeu();
    d.etudiants = Array.from({ length: 40 }, (_, i) => ({
      id: `p${i}`,
      nom: `Personne ${i}`,
      niveaux: { c1: 1 + (i % 5), c2: 1 + ((i + 2) % 5) },
      // Chaque ligne commence et finit par un repère unique, à retrouver sur la même page.
      commentaires: Object.fromEntries(
        ['c1', 'c2', 'c3'].map((c) => [
          c,
          `DEBUT${i}${c} ${'Commentaire détaillé sur ce critère. '.repeat(8 + (i % 7) * 4)}FIN${i}${c}`,
        ]),
      ),
      commentaireGeneral: 'Bilan général du travail. '.repeat(20),
    }));
    const { pages } = await relire(await pdfGroupe(rapportGroupe(d, DATE)));
    const pageDe = (repere: string) =>
      pages.findIndex((p) => p.bouts.some((b) => b.texte.split(' ').includes(repere)));
    for (let i = 0; i < 40; i++) {
      for (const c of ['c1', 'c2', 'c3']) {
        const debut = pageDe(`DEBUT${i}${c}`);
        expect(debut, `DEBUT${i}${c}`).toBeGreaterThan(0);
        expect(pageDe(`FIN${i}${c}`), `ligne ${i}/${c} coupée`).toBe(debut);
        expect(pages[debut]!.texte, `en-tête page ${debut + 1}`).toContain('Descripteur');
      }
    }
    for (const [n, p] of pages.entries()) {
      expect(p.texte).toContain(`page ${n + 1} sur ${pages.length}`);
    }
  }, 60_000);
});
