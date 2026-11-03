import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { COULEURS, type Rvb } from './couleurs';
import type { RapportGroupe, RapportPersonne } from './contenu';
import { NOTO_SANS_GRAS, NOTO_SANS_REGULIER } from './polices/notoSans';

/**
 * Rendu PDF (spec de la phase 5, section 6) : même hiérarchie que le Word, en Noto Sans
 * embarquée pour que tous les noms s'affichent. Lettre US portrait, marges de 2 cm, texte
 * réel et sélectionnable. Le contenu vient de `contenu.ts`.
 */

const LARGEUR = 612;
const HAUTEUR = 792;
/** 2 cm en points. */
const MARGE = (2 / 2.54) * 72;
const LARGEUR_UTILE = LARGEUR - 2 * MARGE;
const BAS = HAUTEUR - MARGE;

const POLICE = 'NotoSans';
const NOM_APPLICATION = 'Grille d’évaluation';
/** Interligne : 1,35 fois la taille du texte. */
const INTERLIGNE = 1.35;

const rvb = (c: Rvb): [number, number, number] => [c[0], c[1], c[2]];

/** Un document en cours d'écriture, avec sa position verticale. */
class Page {
  readonly doc: jsPDF;
  y = MARGE;

  constructor(titre: string) {
    this.doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
    this.doc.addFileToVFS('NotoSans-Regular.ttf', NOTO_SANS_REGULIER);
    this.doc.addFont('NotoSans-Regular.ttf', POLICE, 'normal');
    this.doc.addFileToVFS('NotoSans-Bold.ttf', NOTO_SANS_GRAS);
    this.doc.addFont('NotoSans-Bold.ttf', POLICE, 'bold');
    this.doc.setProperties({ title: titre, creator: NOM_APPLICATION });
    this.doc.setLanguage('fr-CA');
  }

  private police(taille: number, gras: boolean, couleur: Rvb) {
    this.doc.setFont(POLICE, gras ? 'bold' : 'normal');
    this.doc.setFontSize(taille);
    this.doc.setTextColor(...rvb(couleur));
  }

  /** Passe à la page suivante si `hauteur` ne tient plus. */
  private place(hauteur: number) {
    if (this.y + hauteur > BAS) this.nouvellePage();
  }

  nouvellePage() {
    this.doc.addPage();
    this.y = MARGE;
  }

  espace(points: number) {
    this.y += points;
  }

  /** Un texte qui passe à la ligne dans la largeur utile, et à la page si besoin. */
  texte(
    contenu: string,
    { taille = 10, gras = false, couleur = COULEURS.texte as Rvb, retrait = 0 } = {},
  ) {
    this.police(taille, gras, couleur);
    const hauteur = taille * INTERLIGNE;
    const lignes = this.doc.splitTextToSize(contenu, LARGEUR_UTILE - retrait) as string[];
    for (const ligne of lignes) {
      this.place(hauteur);
      this.y += hauteur;
      this.doc.text(ligne, MARGE + retrait, this.y - taille * 0.3);
    }
  }

  /** « Libellé : valeur », libellé en gras ; la valeur passe à la ligne sous elle-même. */
  champ(libelle: string, valeur: string) {
    const taille = 10;
    this.police(taille, true, COULEURS.texte);
    const etiquette = `${libelle} : `;
    const retrait = this.doc.getTextWidth(etiquette);
    this.police(taille, false, COULEURS.texte);
    const lignes = this.doc.splitTextToSize(valeur, LARGEUR_UTILE - retrait) as string[];
    const hauteur = taille * INTERLIGNE;
    this.place(hauteur);
    this.police(taille, true, COULEURS.texte);
    this.doc.text(etiquette, MARGE, this.y + hauteur - taille * 0.3);
    this.police(taille, false, COULEURS.texte);
    lignes.forEach((ligne, i) => {
      if (i > 0) this.place(hauteur);
      this.y += hauteur;
      this.doc.text(ligne, MARGE + retrait, this.y - taille * 0.3);
    });
    this.espace(2);
  }

  /** Titre de section en majuscules, souligné d'un filet de la couleur de marque. */
  section(titre: string) {
    this.place(60); // le titre ne reste pas seul en bas de page
    this.espace(12);
    this.texte(titre.toUpperCase(), { taille: 10, gras: true, couleur: COULEURS.marque });
    this.doc.setDrawColor(...rvb(COULEURS.marque));
    this.doc.setLineWidth(1);
    this.doc.line(MARGE, this.y + 2, LARGEUR - MARGE, this.y + 2);
    this.espace(8);
  }

  /** En-tête répété à chaque page ; une ligne n'est jamais coupée entre deux pages. */
  tableau(entetes: string[], lignes: string[][], parts: number[]) {
    const total = parts.reduce((a, b) => a + b, 0);
    autoTable(this.doc, {
      startY: this.y,
      margin: { top: MARGE, right: MARGE, bottom: MARGE, left: MARGE },
      head: [entetes],
      body: lignes,
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      styles: {
        font: POLICE,
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak',
        valign: 'top',
        textColor: rvb(COULEURS.texte),
        lineColor: rvb(COULEURS.bordure),
        lineWidth: 0.5,
      },
      headStyles: {
        fontStyle: 'bold',
        fillColor: rvb(COULEURS.marque),
        textColor: rvb(COULEURS.blanc),
      },
      columnStyles: Object.fromEntries(
        parts.map((p, i) => [i, { cellWidth: (LARGEUR_UTILE * p) / total }]),
      ),
    });
    // jspdf-autotable note la fin du tableau sur le document.
    this.y = (this.doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  }

  /** Pied de page sur chaque page, une fois le nombre de pages connu ; puis les octets. */
  terminer(): Uint8Array<ArrayBuffer> {
    const total = this.doc.getNumberOfPages();
    for (let n = 1; n <= total; n++) {
      this.doc.setPage(n);
      this.police(8, false, COULEURS.texteAttenue);
      this.doc.text(
        `${NOM_APPLICATION} · page ${n} sur ${total}`,
        LARGEUR - MARGE,
        HAUTEUR - MARGE / 2,
        {
          align: 'right',
        },
      );
    }
    return new Uint8Array(this.doc.output('arraybuffer'));
  }
}

const titre1 = (p: Page, texte: string) =>
  p.texte(texte, { taille: 18, gras: true, couleur: COULEURS.marque });

const titre2 = (p: Page, texte: string) =>
  p.texte(texte, { taille: 14, gras: true, couleur: COULEURS.marque });

function blocPersonne(page: Page, r: RapportPersonne) {
  titre2(page, r.personne);
  page.espace(4);
  page.champ('Résultat', r.resultat);
  page.section('Critères');
  page.tableau(
    ['Critère', 'Poids', 'Niveau', 'Descripteur', 'Commentaire'],
    r.criteres.map((c) => [c.critere, c.poids, c.niveau, c.descripteur, c.commentaire]),
    [22, 11, 17, 27, 23],
  );
  if (r.commentaireGeneral !== null) {
    page.section('Commentaire général');
    page.texte(r.commentaireGeneral);
  }
}

function enTete(page: Page, titre: string, date: string) {
  titre1(page, titre);
  page.espace(4);
  page.champ('Date', date);
  page.espace(8);
}

/** Le PDF d'une personne. */
export async function pdfPersonne(r: RapportPersonne): Promise<Uint8Array<ArrayBuffer>> {
  const page = new Page(`${r.titre} — ${r.personne}`);
  enTete(page, r.titre, r.date);
  blocPersonne(page, r);
  return page.terminer();
}

/** Le PDF du groupe : synthèse en première page, puis une personne par page. */
export async function pdfGroupe(g: RapportGroupe): Promise<Uint8Array<ArrayBuffer>> {
  const page = new Page(`${g.titre} — Groupe`);
  enTete(page, g.titre, g.date);
  titre2(page, 'Synthèse du groupe');
  for (const s of g.synthese) page.texte(s);
  page.section('Résultats');
  page.tableau(
    ['Personne étudiante', 'Résultat'],
    g.personnes.map((p) => [p.personne, p.resultat]),
    [35, 65],
  );
  for (const p of g.personnes) {
    page.nouvellePage();
    blocPersonne(page, p);
  }
  return page.terminer();
}
