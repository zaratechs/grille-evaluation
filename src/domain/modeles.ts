import { cleNom, lireNom, nomUnique } from './noms';
import { ok, erreur, type Resultat } from './resultat';
import type { Dossier, Modele } from './types';

/**
 * Applique un modèle (fourni ou personnel) : niveaux et critères remplacés, titre et total
 * de points gardés. Les niveaux et commentaires par critère du groupe sont effacés, puisque
 * les critères changent ; les commentaires généraux sont gardés.
 */
export function appliquerModele(dossier: Dossier, modele: Modele, nouvelId: () => string): Dossier {
  return {
    ...dossier,
    grille: {
      ...dossier.grille,
      niveaux: [...modele.niveaux],
      criteres: modele.criteres.map((c) => ({
        id: nouvelId(),
        nom: c.nom,
        poids: c.poids,
        descripteurs: [...c.descripteurs],
      })),
    },
    etudiants: dossier.etudiants.map((e) => ({ ...e, niveaux: {}, commentaires: {} })),
  };
}

/** Valide le nom et refuse celui d'un autre modèle personnel. */
function lireNomUnique(dossier: Dossier, nom: string, sauf?: string): Resultat<string> {
  const lu = lireNom(nom);
  if (!lu.ok) return lu;
  const cle = cleNom(lu.valeur);
  const pris = dossier.modelesPerso.some((m) => m.id !== sauf && cleNom(m.nom) === cle);
  return pris ? erreur('nom-en-double') : lu;
}

/** Enregistre la grille courante comme modèle personnel, sans les évaluations. */
export function enregistrerModele(dossier: Dossier, id: string, nom: string): Resultat<Dossier> {
  if (dossier.modelesPerso.some((m) => m.id === id)) return erreur('identifiant-en-double');
  const lu = lireNomUnique(dossier, nom);
  if (!lu.ok) return lu;
  const { niveaux, criteres } = dossier.grille;
  const modele: Modele = {
    id,
    nom: lu.valeur,
    niveaux: [...niveaux],
    criteres: criteres.map((c) => ({
      nom: c.nom,
      poids: c.poids,
      descripteurs: [...c.descripteurs],
    })),
  };
  return ok({ ...dossier, modelesPerso: [...dossier.modelesPerso, modele] });
}

export function renommerModele(dossier: Dossier, id: string, nom: string): Resultat<Dossier> {
  if (!dossier.modelesPerso.some((m) => m.id === id)) return erreur('modele-introuvable');
  const lu = lireNomUnique(dossier, nom, id);
  if (!lu.ok) return lu;
  return ok({
    ...dossier,
    modelesPerso: dossier.modelesPerso.map((m) => (m.id === id ? { ...m, nom: lu.valeur } : m)),
  });
}

export function supprimerModele(dossier: Dossier, id: string): Resultat<Dossier> {
  if (!dossier.modelesPerso.some((m) => m.id === id)) return erreur('modele-introuvable');
  return ok({ ...dossier, modelesPerso: dossier.modelesPerso.filter((m) => m.id !== id) });
}

/** Deux modèles sont identiques s'ils ont le même nom (au sens de `cleNom`) et le même contenu. */
const empreinte = (m: Modele): string => JSON.stringify([cleNom(m.nom), m.niveaux, m.criteres]);

/**
 * Ajoute à `existants` les modèles d'un fichier importé (décision 4 de la phase 3).
 * Un modèle identique à un modèle existant est ignoré (réimport de sa propre sauvegarde) ;
 * un nom déjà pris reçoit un suffixe ; un identifiant déjà pris est remplacé.
 */
export function fusionnerModeles(
  existants: readonly Modele[],
  ajoutes: readonly Modele[],
  nouvelId: () => string,
): { modeles: Modele[]; ajoutes: number } {
  const empreintes = new Set(existants.map(empreinte));
  const noms = new Set(existants.map((m) => cleNom(m.nom)));
  const ids = new Set(existants.map((m) => m.id));
  const modeles = [...existants];
  for (const m of ajoutes) {
    if (empreintes.has(empreinte(m))) continue;
    const id = ids.has(m.id) ? nouvelId() : m.id;
    ids.add(id);
    const nouveau = { ...m, id, nom: nomUnique(m.nom, noms) };
    empreintes.add(empreinte(nouveau));
    modeles.push(nouveau);
  }
  return { modeles, ajoutes: modeles.length - existants.length };
}
