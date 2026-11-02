import { deplacer, sans, type Sens } from './listes';
import { niveauValide } from './niveaux';
import { cleNom, lireNom } from './noms';
import { ok, erreur, type Resultat } from './resultat';
import type { Dossier, Etudiant } from './types';

/** Applique `modifier` à la personne `id`, ou refuse si elle n'existe pas. */
function modifierEtudiant(
  dossier: Dossier,
  id: string,
  modifier: (e: Etudiant) => Etudiant,
): Resultat<Dossier> {
  if (!dossier.etudiants.some((e) => e.id === id)) return erreur('etudiant-introuvable');
  return ok({
    ...dossier,
    etudiants: dossier.etudiants.map((e) => (e.id === id ? modifier(e) : e)),
  });
}

/** Valide le nom et refuse celui d'une autre personne du groupe (décision 4). */
function lireNomUnique(dossier: Dossier, nom: string, sauf?: string): Resultat<string> {
  const lu = lireNom(nom);
  if (!lu.ok) return lu;
  const cle = cleNom(lu.valeur);
  const pris = dossier.etudiants.some((e) => e.id !== sauf && cleNom(e.nom) === cle);
  return pris ? erreur('nom-en-double') : lu;
}

/** Ajoute à la fin une personne sans évaluation. */
export function ajouterEtudiant(dossier: Dossier, id: string, nom: string): Resultat<Dossier> {
  if (dossier.etudiants.some((e) => e.id === id)) return erreur('identifiant-en-double');
  const lu = lireNomUnique(dossier, nom);
  if (!lu.ok) return lu;
  const nouveau: Etudiant = {
    id,
    nom: lu.valeur,
    niveaux: {},
    commentaires: {},
    commentaireGeneral: '',
  };
  return ok({ ...dossier, etudiants: [...dossier.etudiants, nouveau] });
}

export function renommerEtudiant(dossier: Dossier, id: string, nom: string): Resultat<Dossier> {
  const lu = lireNomUnique(dossier, nom, id);
  if (!lu.ok) return lu;
  return modifierEtudiant(dossier, id, (e) => ({ ...e, nom: lu.valeur }));
}

/** Le groupe peut devenir vide. */
export function retirerEtudiant(dossier: Dossier, id: string): Resultat<Dossier> {
  if (!dossier.etudiants.some((e) => e.id === id)) return erreur('etudiant-introuvable');
  return ok({ ...dossier, etudiants: dossier.etudiants.filter((e) => e.id !== id) });
}

export function deplacerEtudiant(dossier: Dossier, id: string, sens: Sens): Resultat<Dossier> {
  const etudiants = deplacer(dossier.etudiants, id, sens);
  return etudiants ? ok({ ...dossier, etudiants }) : erreur('etudiant-introuvable');
}

/** Vérifie la personne puis le critère, dans cet ordre. */
function verifier(dossier: Dossier, etudiantId: string, critereId: string): Resultat<null> {
  if (!dossier.etudiants.some((e) => e.id === etudiantId)) return erreur('etudiant-introuvable');
  if (!dossier.grille.criteres.some((c) => c.id === critereId)) {
    return erreur('critere-introuvable');
  }
  return ok(null);
}

/** Fixe le niveau (de 1 à N) d'un critère pour une personne ; `null` l'efface. */
export function evaluer(
  dossier: Dossier,
  etudiantId: string,
  critereId: string,
  niveau: number | null,
): Resultat<Dossier> {
  const verifie = verifier(dossier, etudiantId, critereId);
  if (!verifie.ok) return verifie;
  if (niveau !== null && !niveauValide(dossier, niveau)) return erreur('niveau-invalide');
  return modifierEtudiant(dossier, etudiantId, (e) => ({
    ...e,
    niveaux: niveau === null ? sans(e.niveaux, critereId) : { ...e.niveaux, [critereId]: niveau },
  }));
}

/** Texte gardé tel quel ; un texte vide efface le commentaire. */
export function commenter(
  dossier: Dossier,
  etudiantId: string,
  critereId: string,
  texte: string,
): Resultat<Dossier> {
  const verifie = verifier(dossier, etudiantId, critereId);
  if (!verifie.ok) return verifie;
  return modifierEtudiant(dossier, etudiantId, (e) => ({
    ...e,
    commentaires:
      texte === '' ? sans(e.commentaires, critereId) : { ...e.commentaires, [critereId]: texte },
  }));
}

export function commenterGeneral(
  dossier: Dossier,
  etudiantId: string,
  texte: string,
): Resultat<Dossier> {
  return modifierEtudiant(dossier, etudiantId, (e) => ({ ...e, commentaireGeneral: texte }));
}

/** Efface les niveaux et tous les commentaires d'une seule personne. */
export function reinitialiserEvaluation(dossier: Dossier, etudiantId: string): Resultat<Dossier> {
  return modifierEtudiant(dossier, etudiantId, (e) => ({
    ...e,
    niveaux: {},
    commentaires: {},
    commentaireGeneral: '',
  }));
}
