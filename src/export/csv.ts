import type { RapportGroupe, RapportPersonne } from './contenu';

/**
 * CSV du groupe pour Excel en français (spec de la phase 5, section 7) : une ligne par
 * personne, séparateur « ; », virgule décimale, UTF-8 avec BOM, fins de ligne CRLF, toutes
 * les cellules entre guillemets (RFC 4180).
 */

const BOM = '\uFEFF';
const SEPARATEUR = ';';
const FIN_DE_LIGNE = '\r\n';

/** Un tableur exécuterait une cellule qui commence ainsi comme une formule. */
const DEBUT_DE_FORMULE = /^[=+\-@\t\r]/;

/** Entre guillemets, guillemets doublés ; une formule possible devient du texte. */
function cellule(texte: string): string {
  const sur = DEBUT_DE_FORMULE.test(texte) ? `'${texte}` : texte;
  return `"${sur.replace(/"/g, '""')}"`;
}

/** « 1 000,00 » → « 1000,00 » : l'espace des milliers empêche le tableur de lire le nombre. */
const nombre = (texte: string): string => texte.replace(/\u00a0/g, '');

function ligne(p: RapportPersonne, sur: string): string[] {
  const c = p.chiffres;
  return [
    p.personne,
    p.statut,
    c ? nombre(c.points) : '',
    nombre(sur),
    c ? nombre(c.pourcentage) : '',
    c ? c.appreciation : '',
    ...p.criteres.map((l) => (l.numero === null ? '' : String(l.numero))),
    ...p.criteres.map((l) => l.commentaire),
    p.commentaireGeneral ?? '',
  ];
}

export function exporterCSV(rapport: RapportGroupe): string {
  const entetes = [
    'Personne étudiante',
    'Statut',
    'Points',
    'Sur',
    'Pourcentage',
    'Appréciation',
    ...rapport.criteres.map((nom) => `${nom} (niveau)`),
    ...rapport.criteres.map((nom) => `${nom} (commentaire)`),
    'Commentaire général',
  ];
  const lignes = [entetes, ...rapport.personnes.map((p) => ligne(p, rapport.sur))];
  return BOM + lignes.map((l) => l.map(cellule).join(SEPARATEUR) + FIN_DE_LIGNE).join('');
}
