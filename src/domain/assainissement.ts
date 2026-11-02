import { NOM_CRITERE_PAR_DEFAUT } from './criteres';
import { TITRE_LONGUEUR_MAX, totalValide } from './dossier';
import { estObjet } from './migrations';
import { NIVEAUX_MAX, NIVEAUX_MIN, NIVEAUX_PAR_DEFAUT } from './niveaux';
import { NOM_LONGUEUR_MAX, couper, lireNom, nomUnique } from './noms';
import { POIDS_TOTAL } from './poids';
import { ok, erreur, type Resultat } from './resultat';
import type { Critere, CritereModele, Dossier, Etudiant, Modele } from './types';

/**
 * Réparation d'un dossier lu d'une sauvegarde ou d'un fichier, déjà passé par `migrer`.
 * Voir la spec de la phase 3, section 4. Ne lève jamais : tout ce qui peut être corrigé
 * l'est, et chaque correction est comptée dans le bilan. Seule une donnée qui n'est pas
 * du tout un dossier est refusée. Réparer un dossier déjà réparé ne change plus rien.
 */

export type BilanReparation = {
  /** Titre, total de points, ou liste (critères, groupe, modèles) illisibles. */
  parametresCorriges: number;
  niveauxCorriges: number;
  criteresEcartes: number;
  identifiantsRemplaces: number;
  /** Noms vides, tronqués, aux espaces retirés ou suffixés car en double. */
  nomsCorriges: number;
  poidsCorriges: number;
  descripteursCorriges: number;
  personnesEcartees: number;
  /** Niveaux évalués et commentaires écartés (hors bornes, critère disparu, non textuels). */
  evaluationsEcartees: number;
  modelesEcartes: number;
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
  personnesEcartees: 0,
  evaluationsEcartees: 0,
  modelesEcartes: 0,
});

type Contexte = { bilan: BilanReparation; nouvelId: () => string };

const estTexte = (v: unknown): v is string => typeof v === 'string';

/** Nom utilisable (espaces retirés, tronqué), ou `null` s'il est vide ou absent. */
function lireNomRepare(brut: unknown): string | null {
  if (!estTexte(brut)) return null;
  const lu = lireNom(brut);
  if (lu.ok) return lu.valeur;
  return lu.erreur === 'nom-vide' ? null : couper(brut.trim(), NOM_LONGUEUR_MAX);
}

/** Nom réparé et rendu unique ; `null` s'il est inutilisable (l'élément est écarté). */
function reparerNomUnique(brut: unknown, vus: Set<string>, ctx: Contexte): string | null {
  const lu = lireNomRepare(brut);
  if (lu === null) return null;
  const nom = nomUnique(lu, vus);
  if (nom !== brut) ctx.bilan.nomsCorriges += 1;
  return nom;
}

/** Identifiant gardé s'il est un texte non vide encore inutilisé ; sinon, nouveau. */
function reparerId(brut: unknown, vus: Set<string>, ctx: Contexte): string {
  let id: string;
  if (estTexte(brut) && brut !== '' && !vus.has(brut)) {
    id = brut;
  } else {
    id = ctx.nouvelId();
    ctx.bilan.identifiantsRemplaces += 1;
  }
  vus.add(id);
  return id;
}

/** Liste brute, ou liste vide (comptée) si ce n'en est pas une. */
function liste(brut: unknown, ctx: Contexte): unknown[] {
  if (Array.isArray(brut)) return brut;
  ctx.bilan.parametresCorriges += 1;
  return [];
}

/** Garde les objets d'une liste et compte ceux qui n'en sont pas. */
function objets(
  brut: unknown,
  ctx: Contexte,
  ecarte: keyof BilanReparation,
): Record<string, unknown>[] {
  const garde: Record<string, unknown>[] = [];
  for (const element of liste(brut, ctx)) {
    if (estObjet(element)) garde.push(element);
    else ctx.bilan[ecarte] += 1;
  }
  return garde;
}

function reparerNiveaux(brut: unknown, ctx: Contexte): string[] {
  const valide =
    Array.isArray(brut) &&
    brut.length >= NIVEAUX_MIN &&
    brut.length <= NIVEAUX_MAX &&
    brut.every(estTexte);
  if (!valide) {
    ctx.bilan.niveauxCorriges += 1;
    return [...NIVEAUX_PAR_DEFAUT];
  }
  return brut.map((libelle, i) => {
    const repare = lireNomRepare(libelle) ?? `Niveau ${i + 1}`;
    if (repare !== libelle) ctx.bilan.niveauxCorriges += 1;
    return repare;
  });
}

function reparerDescripteurs(brut: unknown, nbNiveaux: number, ctx: Contexte): string[] {
  const source: unknown[] = Array.isArray(brut) ? brut : [];
  const intacts = Array.isArray(brut) && brut.length === nbNiveaux && brut.every(estTexte);
  if (!intacts) ctx.bilan.descripteursCorriges += 1;
  return Array.from({ length: nbNiveaux }, (_, i) => {
    const d = source[i];
    return estTexte(d) ? d : '';
  });
}

/** Nom, poids et descripteurs d'un critère (de grille ou de modèle). */
function reparerContenuCritere(
  c: Record<string, unknown>,
  nbNiveaux: number,
  ctx: Contexte,
): CritereModele {
  const nom = lireNomRepare(c.nom) ?? NOM_CRITERE_PAR_DEFAUT;
  if (nom !== c.nom) ctx.bilan.nomsCorriges += 1;
  const poids =
    typeof c.poids === 'number' &&
    Number.isInteger(c.poids) &&
    c.poids >= 0 &&
    c.poids <= POIDS_TOTAL
      ? c.poids
      : null;
  if (poids === null) ctx.bilan.poidsCorriges += 1;
  return {
    nom,
    poids: poids ?? 0,
    descripteurs: reparerDescripteurs(c.descripteurs, nbNiveaux, ctx),
  };
}

function reparerCriteres(brut: unknown, nbNiveaux: number, ctx: Contexte): Critere[] {
  const vus = new Set<string>();
  return objets(brut, ctx, 'criteresEcartes').map((c) => ({
    id: reparerId(c.id, vus, ctx),
    ...reparerContenuCritere(c, nbNiveaux, ctx),
  }));
}

/** Garde les entrées valides d'un enregistrement « id du critère → valeur ». */
function reparerParCritere<T>(
  brut: unknown,
  garder: (cle: string, valeur: unknown) => valeur is T,
  ctx: Contexte,
): Record<string, T> {
  if (!estObjet(brut)) {
    ctx.bilan.evaluationsEcartees += 1;
    return {};
  }
  const garde: Record<string, T> = {};
  for (const [cle, valeur] of Object.entries(brut)) {
    if (garder(cle, valeur)) garde[cle] = valeur;
    else ctx.bilan.evaluationsEcartees += 1;
  }
  return garde;
}

function reparerEtudiants(brut: unknown, grille: Dossier['grille'], ctx: Contexte): Etudiant[] {
  const ids = new Set(grille.criteres.map((c) => c.id));
  const n = grille.niveaux.length;
  const niveauValide = (cle: string, v: unknown): v is number =>
    ids.has(cle) && typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= n;
  const commentaireValide = (cle: string, v: unknown): v is string =>
    ids.has(cle) && estTexte(v) && v !== '';

  const idsVus = new Set<string>();
  const nomsVus = new Set<string>();
  const etudiants: Etudiant[] = [];
  for (const e of objets(brut, ctx, 'personnesEcartees')) {
    const nom = reparerNomUnique(e.nom, nomsVus, ctx);
    if (nom === null) {
      ctx.bilan.personnesEcartees += 1;
      continue;
    }
    if (!estTexte(e.commentaireGeneral)) ctx.bilan.evaluationsEcartees += 1;
    etudiants.push({
      id: reparerId(e.id, idsVus, ctx),
      nom,
      niveaux: reparerParCritere(e.niveaux, niveauValide, ctx),
      commentaires: reparerParCritere(e.commentaires, commentaireValide, ctx),
      commentaireGeneral: estTexte(e.commentaireGeneral) ? e.commentaireGeneral : '',
    });
  }
  return etudiants;
}

function reparerModeles(brut: unknown, ctx: Contexte): Modele[] {
  const idsVus = new Set<string>();
  const nomsVus = new Set<string>();
  const modeles: Modele[] = [];
  for (const m of objets(brut, ctx, 'modelesEcartes')) {
    const nom = reparerNomUnique(m.nom, nomsVus, ctx);
    if (nom === null) {
      ctx.bilan.modelesEcartes += 1;
      continue;
    }
    const id = reparerId(m.id, idsVus, ctx);
    const niveaux = reparerNiveaux(m.niveaux, ctx);
    const criteres = objets(m.criteres, ctx, 'criteresEcartes').map((c) =>
      reparerContenuCritere(c, niveaux.length, ctx),
    );
    modeles.push({ id, nom, niveaux, criteres });
  }
  return modeles;
}

export function assainir(donnees: unknown, nouvelId: () => string): Resultat<Reparation> {
  if (!estObjet(donnees) || !estObjet(donnees.grille)) return erreur('pas-un-dossier');
  const ctx: Contexte = { bilan: bilanVide(), nouvelId };
  const g = donnees.grille;

  let titre = estTexte(g.titre) ? g.titre : '';
  if (titre.length > TITRE_LONGUEUR_MAX) titre = titre.slice(0, TITRE_LONGUEUR_MAX);
  if (titre !== g.titre) ctx.bilan.parametresCorriges += 1;

  const totalPoints =
    typeof g.totalPoints === 'number' && totalValide(g.totalPoints) ? g.totalPoints : null;
  if (totalPoints === null) ctx.bilan.parametresCorriges += 1;

  const niveaux = reparerNiveaux(g.niveaux, ctx);
  const grille: Dossier['grille'] = {
    titre,
    totalPoints: totalPoints ?? 100,
    niveaux,
    criteres: reparerCriteres(g.criteres, niveaux.length, ctx),
  };
  const dossier: Dossier = {
    version: 1,
    grille,
    etudiants: reparerEtudiants(donnees.etudiants, grille, ctx),
    modelesPerso: reparerModeles(donnees.modelesPerso, ctx),
  };
  const modifie = Object.values(ctx.bilan).some((n) => n > 0);
  return ok({ dossier, modifie, bilan: ctx.bilan });
}
