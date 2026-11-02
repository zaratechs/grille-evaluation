import { totalValide } from '../../../src/domain/dossier';
import { NIVEAUX_MAX, NIVEAUX_MIN } from '../../../src/domain/niveaux';
import { cleNom, lireNom } from '../../../src/domain/noms';
import type { CritereModele, Dossier } from '../../../src/domain/types';

const nomValide = (n: string) => {
  const lu = lireNom(n);
  return lu.ok && lu.valeur === n;
};

const niveauxValides = (niveaux: string[]) =>
  niveaux.length >= NIVEAUX_MIN && niveaux.length <= NIVEAUX_MAX && niveaux.every(nomValide);

const criteresValides = (criteres: CritereModele[], nbNiveaux: number) =>
  criteres.every(
    (c) =>
      nomValide(c.nom) &&
      Number.isInteger(c.poids) &&
      c.poids >= 0 &&
      c.poids <= 1000 &&
      c.descripteurs.length === nbNiveaux &&
      c.descripteurs.every((x) => typeof x === 'string'),
  );

const uniques = (valeurs: string[]) => new Set(valeurs).size === valeurs.length;

/**
 * Vérifie toutes les règles que le domaine garantit (phase 2) sur un dossier.
 * Renvoie la première règle enfreinte, ou `null` si le dossier est valide.
 */
export function regleEnfreinte(d: Dossier): string | null {
  const { grille, etudiants, modelesPerso } = d;
  const n = grille.niveaux.length;
  if (d.version !== 1) return 'version';
  if (typeof grille.titre !== 'string' || grille.titre.length > 200) return 'titre';
  if (!totalValide(grille.totalPoints)) return 'total de points';
  if (!niveauxValides(grille.niveaux)) return 'niveaux';
  if (!criteresValides(grille.criteres, n)) return 'critères';
  const ids = grille.criteres.map((c) => c.id);
  if (!uniques(ids) || ids.includes('')) return 'identifiants des critères';

  if (!uniques(etudiants.map((e) => e.id))) return 'identifiants des personnes';
  if (!etudiants.every((e) => nomValide(e.nom))) return 'noms des personnes';
  if (!uniques(etudiants.map((e) => cleNom(e.nom)))) return 'doublons de personnes';
  for (const e of etudiants) {
    for (const [cle, niveau] of Object.entries(e.niveaux)) {
      if (!ids.includes(cle) || !Number.isInteger(niveau) || niveau < 1 || niveau > n) {
        return 'niveau évalué';
      }
    }
    for (const [cle, texte] of Object.entries(e.commentaires)) {
      if (!ids.includes(cle) || typeof texte !== 'string' || texte === '') return 'commentaire';
    }
    if (typeof e.commentaireGeneral !== 'string') return 'commentaire général';
  }

  if (!uniques(modelesPerso.map((m) => m.id))) return 'identifiants des modèles';
  if (!uniques(modelesPerso.map((m) => cleNom(m.nom)))) return 'doublons de modèles';
  for (const m of modelesPerso) {
    if (!nomValide(m.nom) || !niveauxValides(m.niveaux)) return 'modèle';
    if (!criteresValides(m.criteres, m.niveaux.length)) return 'critères de modèle';
  }
  return null;
}
