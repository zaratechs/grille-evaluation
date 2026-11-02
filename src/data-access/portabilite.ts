import {
  assainir,
  erreur,
  fusionnerModeles,
  migrer,
  ok,
  type BilanReparation,
  type Dossier,
  type Resultat,
} from '../domain';
import { nouvelId } from './id';

/**
 * Export et import JSON du dossier. Voir la spec de la phase 3, section 7.
 * Un fichier « grille seule » se reconnaît à l'absence du champ `etudiants` : un dossier
 * complet dont le groupe est vide, lui, vide le groupe courant.
 */

/** Décision 7 : 5 Mo. Un groupe de 40 personnes très commentées reste sous 500 Ko. */
export const TAILLE_MAX_IMPORT = 5 * 1024 * 1024;

export type Import = {
  dossier: Dossier;
  /** Le fichier a été réparé : le bilan dit ce qui a changé. */
  modifie: boolean;
  bilan: BilanReparation;
  grilleSeule: boolean;
  modelesAjoutes: number;
};

/** Décision 5 : `grilleSeule` retire les personnes étudiantes, pour partager sans données personnelles. */
export function exporterJSON(dossier: Dossier, options: { grilleSeule?: boolean } = {}): string {
  const { version, grille, etudiants, modelesPerso } = dossier;
  const contenu = options.grilleSeule
    ? { version, grille, modelesPerso }
    : { version, grille, etudiants, modelesPerso };
  return JSON.stringify(contenu, null, 2);
}

/**
 * Lit un fichier exporté : taille → JSON → migration → réparation. Décision 4 : le dossier
 * importé remplace la grille et le groupe ; les modèles personnels sont fusionnés. Un
 * fichier « grille seule » garde le groupe courant, sans ses évaluations. En cas de refus,
 * rien n'est modifié.
 */
export function importerJSON(
  texte: string,
  courant: Dossier,
  genererId: () => string = nouvelId,
): Resultat<Import> {
  if (new TextEncoder().encode(texte).byteLength > TAILLE_MAX_IMPORT) {
    return erreur('fichier-trop-gros');
  }
  let donnees: unknown;
  try {
    donnees = JSON.parse(texte);
  } catch {
    return erreur('json-invalide');
  }
  const migre = migrer(donnees);
  if (!migre.ok) return erreur(migre.erreur);

  const lu: Record<string, unknown> = migre.valeur;
  const grilleSeule = !('etudiants' in lu);
  const repare = assainir(grilleSeule ? { ...lu, etudiants: [] } : lu, genererId);
  if (!repare.ok) return erreur(repare.erreur);

  const { dossier: importe, modifie, bilan } = repare.valeur;
  const fusion = fusionnerModeles(courant.modelesPerso, importe.modelesPerso, genererId);
  const etudiants = grilleSeule
    ? courant.etudiants.map((e) => ({ ...e, niveaux: {}, commentaires: {} }))
    : importe.etudiants;
  return ok({
    dossier: { ...importe, etudiants, modelesPerso: fusion.modeles },
    modifie,
    bilan,
    grilleSeule,
    modelesAjoutes: fusion.ajoutes,
  });
}
