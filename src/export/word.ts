import {
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
} from 'docx';
import { COULEURS, hexDocx } from './couleurs';
import type { RapportGroupe, RapportPersonne } from './contenu';

/**
 * Rendu Word (spec de la phase 5, section 6), sur le modèle de revisionProgramme : Calibri,
 * titres de section en majuscules soulignés d'un filet, en-têtes de tableau sur fond plein
 * répétés à chaque page, lignes « Libellé : valeur ». Le contenu vient de `contenu.ts`.
 */

const MARQUE = hexDocx(COULEURS.marque);
const TEXTE = hexDocx(COULEURS.texte);
const BORDURE = hexDocx(COULEURS.bordure);
const BLANC = hexDocx(COULEURS.blanc);

/** Lettre US portrait (8,5 × 11 po) et marges de 2 cm, en vingtièmes de point. */
const PAGE = { largeur: 12240, hauteur: 15840, marge: 1134 };
const LARGEUR_UTILE = PAGE.largeur - 2 * PAGE.marge;

const NOM_APPLICATION = 'Grille d’évaluation';

/** Un texte, ses retours à la ligne rendus par des sauts de ligne Word. */
const runs = (texte: string, options: { bold?: boolean; color?: string } = {}): TextRun[] =>
  texte
    .split('\n')
    .map((ligne, i) => new TextRun({ text: ligne, break: i > 0 ? 1 : 0, ...options }));

/** « Libellé : valeur », libellé en gras. */
const champ = (libelle: string, valeur: string) =>
  new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: `${libelle} : `, bold: true }), ...runs(valeur)],
  });

/** Titre de section en majuscules, souligné d'un filet de la couleur de marque. */
const section = (titre: string) =>
  new Paragraph({
    keepNext: true,
    spacing: { before: 320, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: MARQUE, space: 2 } },
    children: [new TextRun({ text: titre.toUpperCase(), bold: true, color: MARQUE })],
  });

const BORDURES_CELLULE = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BORDURE },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDURE },
  left: { style: BorderStyle.SINGLE, size: 4, color: BORDURE },
  right: { style: BorderStyle.SINGLE, size: 4, color: BORDURE },
};

const cellule = (texte: string, largeur: number, entete = false) =>
  new TableCell({
    width: { size: largeur, type: WidthType.DXA },
    borders: BORDURES_CELLULE,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    ...(entete ? { shading: { type: ShadingType.SOLID, color: MARQUE, fill: MARQUE } } : {}),
    children: [
      new Paragraph({ children: runs(texte, entete ? { bold: true, color: BLANC } : {}) }),
    ],
  });

/**
 * Tableau dont l'en-tête se répète à chaque page et dont aucune ligne n'est coupée entre
 * deux pages. `parts` donne la part de la largeur de chaque colonne.
 */
function tableau(entetes: string[], lignes: string[][], parts: number[]): Table {
  const total = parts.reduce((a, b) => a + b, 0);
  const largeurs = parts.map((p) => Math.floor((LARGEUR_UTILE * p) / total));
  const rangee = (cellules: string[], entete: boolean) =>
    new TableRow({
      tableHeader: entete,
      cantSplit: true,
      children: cellules.map((c, i) => cellule(c, largeurs[i] as number, entete)),
    });
  return new Table({
    width: { size: LARGEUR_UTILE, type: WidthType.DXA },
    columnWidths: largeurs,
    rows: [rangee(entetes, true), ...lignes.map((l) => rangee(l, false))],
  });
}

/** Le bloc d'une personne : son nom en Titre 2, son résultat, ses critères, son commentaire. */
function blocPersonne(p: RapportPersonne, nouvellePage: boolean): (Paragraph | Table)[] {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      pageBreakBefore: nouvellePage,
      children: [new TextRun(p.personne)],
    }),
    champ('Résultat', p.resultat),
    section('Critères'),
    tableau(
      ['Critère', 'Poids', 'Niveau', 'Descripteur', 'Commentaire'],
      p.criteres.map((c) => [c.critere, c.poids, c.niveau, c.descripteur, c.commentaire]),
      [22, 11, 17, 27, 23],
    ),
    ...(p.commentaireGeneral === null
      ? []
      : [section('Commentaire général'), new Paragraph({ children: runs(p.commentaireGeneral) })]),
  ];
}

const enTete = (titre: string, date: string) => [
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(titre)] }),
  champ('Date', date),
];

const piedDePage = () =>
  new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            size: 18,
            color: hexDocx(COULEURS.texteAttenue),
            children: [
              `${NOM_APPLICATION} · page `,
              PageNumber.CURRENT,
              ' sur ',
              PageNumber.TOTAL_PAGES,
            ],
          }),
        ],
      }),
    ],
  });

async function rendre(
  titre: string,
  contenu: (Paragraph | Table)[],
): Promise<Uint8Array<ArrayBuffer>> {
  const titreStyle = { font: 'Calibri', bold: true, color: MARQUE };
  const doc = new Document({
    title: titre,
    creator: NOM_APPLICATION,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: TEXTE, language: { value: 'fr-CA' } },
          paragraph: { spacing: { line: 276 } },
        },
        heading1: { run: { ...titreStyle, size: 36 }, paragraph: { spacing: { after: 160 } } },
        heading2: {
          run: { ...titreStyle, size: 28 },
          paragraph: { spacing: { before: 240, after: 120 }, keepNext: true },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE.largeur, height: PAGE.hauteur },
            margin: {
              top: PAGE.marge,
              right: PAGE.marge,
              bottom: PAGE.marge,
              left: PAGE.marge,
            },
          },
        },
        footers: { default: piedDePage() },
        children: contenu,
      },
    ],
  });
  return new Uint8Array(await Packer.toArrayBuffer(doc));
}

/** Le document Word d'une personne. */
export function wordPersonne(p: RapportPersonne): Promise<Uint8Array<ArrayBuffer>> {
  return rendre(`${p.titre} — ${p.personne}`, [
    ...enTete(p.titre, p.date),
    ...blocPersonne(p, false),
  ]);
}

/** Le document Word du groupe : synthèse, puis une personne par page. */
export function wordGroupe(g: RapportGroupe): Promise<Uint8Array<ArrayBuffer>> {
  return rendre(`${g.titre} — Groupe`, [
    ...enTete(g.titre, g.date),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun('Synthèse du groupe')],
    }),
    ...g.synthese.map((s) => new Paragraph({ spacing: { after: 60 }, children: runs(s) })),
    section('Résultats'),
    tableau(
      ['Personne étudiante', 'Résultat'],
      g.personnes.map((p) => [p.personne, p.resultat]),
      [35, 65],
    ),
    ...g.personnes.flatMap((p) => blocPersonne(p, true)),
  ]);
}
