import { telecharger } from '../data-access';
import { nomFichier, type Dossier } from '../domain';
import { rapportGroupe, rapportPersonne } from '../export/contenu';

/**
 * Exports PDF, Word et CSV (phase 5). Les rendus sont chargés par `import()` au premier
 * clic : jsPDF, docx et la police ne pèsent pas sur le premier affichage du site.
 */

export type Format = 'pdf' | 'word' | 'csv';

const TYPES: Record<Format, string> = {
  pdf: 'application/pdf',
  word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  csv: 'text/csv;charset=utf-8',
};

const EXTENSIONS: Record<Format, string> = { pdf: 'pdf', word: 'docx', csv: 'csv' };

/** « Travail de session Élise Roy » → `grille-travail-de-session-elise-roy-2026-11-02.pdf`. */
const nom = (dossier: Dossier, suite: string, format: Format, date: Date) =>
  nomFichier(
    [dossier.grille.titre.trim(), suite].filter((t) => t !== '').join(' '),
    date,
    EXTENSIONS[format],
  );

/** Crée et télécharge le fichier d'une personne ; rend son nom. */
export async function exporterPersonne(
  dossier: Dossier,
  id: string,
  format: 'pdf' | 'word',
): Promise<string> {
  const date = new Date();
  const r = rapportPersonne(dossier, id, date);
  if (!r.ok) throw new Error(r.erreur);
  const contenu =
    format === 'pdf'
      ? await (await import('../export/pdf')).pdfPersonne(r.valeur)
      : await (await import('../export/word')).wordPersonne(r.valeur);
  const fichier = nom(dossier, r.valeur.personne, format, date);
  telecharger(fichier, contenu, TYPES[format]);
  return fichier;
}

/** Crée et télécharge le fichier du groupe ; rend son nom. */
export async function exporterGroupe(dossier: Dossier, format: Format): Promise<string> {
  const date = new Date();
  const r = rapportGroupe(dossier, date);
  const contenu =
    format === 'pdf'
      ? await (await import('../export/pdf')).pdfGroupe(r)
      : format === 'word'
        ? await (await import('../export/word')).wordGroupe(r)
        : (await import('../export/csv')).exporterCSV(r);
  const fichier = nom(dossier, 'groupe', format, date);
  telecharger(fichier, contenu, TYPES[format]);
  return fichier;
}
