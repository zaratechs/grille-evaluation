import { NOM_CRITERE_PAR_DEFAUT } from './criteres';
import { TITRE_LONGUEUR_MAX, totalValide } from './dossier';
import { estObjet } from './migrations';
import { NIVEAUX_MAX, NIVEAUX_MIN, NIVEAUX_PAR_DEFAUT } from './niveaux';
import { NOM_LONGUEUR_MAX, lireNom } from './noms';
import { POIDS_TOTAL } from './poids';
import { ok, erreur, type Resultat } from './resultat';
import type { Critere, Dossier, Etudiant, Modele } from './types';

/**
 * Réparation d'un dossier lu d'une sauvegarde ou d'un fichier, déjà passé par `migrer`.
 * Voir la spec de la phase 3, section 4. Ne lève jamais : tout ce qui peut être corrigé
 * l'est, et chaque correction est comptée dans le bilan. Seule une donnée qui n'est pas
 * du tout un dossier est refusée.
 */

export type BilanReparation = {
  /** Titre, total de points ou liste de critères illisibles. */
  parametresCorriges: number;
  niveauxCorriges: number;
  criteresEcartes: number;
  identifiantsRemplaces: number;
  nomsCorriges: number;
  poidsCorriges: number;
  descripteursCorriges: number;
};

export type Reparation = { dossier: Dossier; modifie: boolean; bilan: BilanReparation };

export const bilanVide = (): BilanReparation => ({
  parametresCorriges: 0,
  niveauxCorriges: 0,
  criteresEcartes: 0,
  identifiantsRemplaces: 0,
  nomsCorriges: 0,
  poidsCorriges: 0,
  descripteursCorriges: 0,
});

const estTexte = (v: unknown): v is string => typeof v === 'string';

/** Nom valide : espaces retirés ; vide ou absent → `parDefaut` ; trop long → tronqué. */
function reparerNom(brut: unknown, parDefaut: string): string {
  if (!estTexte(brut)) return parDefaut;
  const lu = lireNom(brut);
  if (lu.ok) return lu.valeur;
  return lu.erreur === 'nom-vide' ? parDefaut : brut.trim().slice(0, NOM_LONGUEUR_MAX).trim();
}

/** Identifiant gardé s'il est un texte non vide encore inutilisé ; sinon, nouveau. */
function reparerId(
  brut: unknown,
  vus: Set<string>,
  nouvelId: () => string,
  bilan: BilanReparation,
): string {
  let id: string;
  if (estTexte(brut) && brut !== '' && !vus.has(brut)) {
    id = brut;
  } else {
    id = nouvelId();
    bilan.identifiantsRemplaces += 1;
  }
  vus.add(id);
  return id;
}

function reparerNiveaux(brut: unknown, bilan: BilanReparation): string[] {
  const valide =
    Array.isArray(brut) &&
    brut.length >= NIVEAUX_MIN &&
    brut.length <= NIVEAUX_MAX &&
    brut.every(estTexte);
  if (!valide) {
    bilan.niveauxCorriges += 1;
    return [...NIVEAUX_PAR_DEFAUT];
  }
  return brut.map((libelle, i) => {
    const repare = reparerNom(libelle, `Niveau ${i + 1}`);
    if (repare !== libelle) bilan.niveauxCorriges += 1;
    return repare;
  });
}

function reparerDescripteurs(brut: unknown, nbNiveaux: number, bilan: BilanReparation) {
  const liste: unknown[] = Array.isArray(brut) ? brut : [];
  const descripteurs = Array.from({ length: nbNiveaux }, (_, i) => {
    const d = liste[i];
    return estTexte(d) ? d : '';
  });
  const intacts = Array.isArray(brut) && brut.length === nbNiveaux && brut.every(estTexte);
  if (!intacts) bilan.descripteursCorriges += 1;
  return descripteurs;
}

function reparerCriteres(
  brut: unknown,
  nbNiveaux: number,
  nouvelId: () => string,
  bilan: BilanReparation,
): Critere[] {
  if (!Array.isArray(brut)) {
    bilan.parametresCorriges += 1;
    return [];
  }
  const vus = new Set<string>();
  const criteres: Critere[] = [];
  for (const c of brut) {
    if (!estObjet(c)) {
      bilan.criteresEcartes += 1;
      continue;
    }
    const nom = reparerNom(c.nom, NOM_CRITERE_PAR_DEFAUT);
    if (nom !== c.nom) bilan.nomsCorriges += 1;
    const poids =
      typeof c.poids === 'number' &&
      Number.isInteger(c.poids) &&
      c.poids >= 0 &&
      c.poids <= POIDS_TOTAL
        ? c.poids
        : null;
    if (poids === null) bilan.poidsCorriges += 1;
    criteres.push({
      id: reparerId(c.id, vus, nouvelId, bilan),
      nom,
      poids: poids ?? 0,
      descripteurs: reparerDescripteurs(c.descripteurs, nbNiveaux, bilan),
    });
  }
  return criteres;
}

export function assainir(donnees: unknown, nouvelId: () => string): Resultat<Reparation> {
  if (!estObjet(donnees) || !estObjet(donnees.grille)) return erreur('pas-un-dossier');
  const bilan = bilanVide();
  const g = donnees.grille;

  let titre = estTexte(g.titre) ? g.titre : '';
  if (titre.length > TITRE_LONGUEUR_MAX) titre = titre.slice(0, TITRE_LONGUEUR_MAX);
  if (titre !== g.titre) bilan.parametresCorriges += 1;

  const totalPoints =
    typeof g.totalPoints === 'number' && totalValide(g.totalPoints) ? g.totalPoints : null;
  if (totalPoints === null) bilan.parametresCorriges += 1;

  const niveaux = reparerNiveaux(g.niveaux, bilan);
  const dossier: Dossier = {
    version: 1,
    grille: {
      titre,
      totalPoints: totalPoints ?? 100,
      niveaux,
      criteres: reparerCriteres(g.criteres, niveaux.length, nouvelId, bilan),
    },
    // Réparés à la tâche 3 du plan de la phase 3.
    etudiants: donnees.etudiants as Etudiant[],
    modelesPerso: donnees.modelesPerso as Modele[],
  };
  return ok({ dossier, modifie: Object.values(bilan).some((n) => n > 0), bilan });
}
