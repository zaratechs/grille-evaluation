import {
  MIGRATIONS,
  assainir,
  dossierVide,
  erreur,
  migrer,
  ok,
  type BilanReparation,
  type Dossier,
  type Migration,
  type Resultat,
} from '../domain';
import { nouvelId } from './id';

/**
 * Sauvegarde du dossier dans le navigateur. Voir la spec de la phase 3, section 5.
 * Aucune fonction ne lève : navigation privée, quota plein et données abîmées donnent un
 * code. Une sauvegarde écartée ou réparée est copiée AVANT toute nouvelle écriture.
 */

export const PREFIXE = 'grille-evaluation:';
export const CLE_DOSSIER = `${PREFIXE}dossier`;
export const CLE_COPIE = `${PREFIXE}copie-de-secours`;

export type Avertissement = 'repare' | 'illisible' | 'version-future' | 'lecture-impossible';

export type Chargement = {
  dossier: Dossier;
  source: 'defaut' | 'stockage' | 'migre' | 'repare';
  avertissement?: Avertissement;
  /** Ce qui a été corrigé, quand la sauvegarde a été réparée. */
  bilan?: BilanReparation;
  /** Texte d'origine écarté ou réparé, à proposer en téléchargement. */
  sauvegardeOrigine?: string;
};

/** Le stockage du navigateur ; y accéder peut lever (cookies bloqués). */
const stockage = (): Storage => globalThis.localStorage;

/** Garde le texte d'origine dans la copie de secours ; un échec n'empêche pas de continuer. */
function garderCopie(texte: string): void {
  try {
    stockage().setItem(CLE_COPIE, texte);
  } catch {
    // L'originale reste proposée en téléchargement (`sauvegardeOrigine`).
  }
}

/** Dossier vide, avec l'originale gardée de côté. */
function ecarter(texte: string, avertissement: Avertissement): Chargement {
  garderCopie(texte);
  return { dossier: dossierVide(), source: 'defaut', avertissement, sauvegardeOrigine: texte };
}

/** Lit, migre et répare la sauvegarde. `migrations` n'est changé que par les tests. */
export function charger(migrations: readonly Migration[] = MIGRATIONS): Chargement {
  let texte: string | null;
  try {
    texte = stockage().getItem(CLE_DOSSIER);
  } catch {
    return { dossier: dossierVide(), source: 'defaut', avertissement: 'lecture-impossible' };
  }
  if (texte === null) return { dossier: dossierVide(), source: 'defaut' };

  let donnees: unknown;
  try {
    donnees = JSON.parse(texte);
  } catch {
    return ecarter(texte, 'illisible');
  }
  const migre = migrer(donnees, migrations);
  if (!migre.ok) {
    return ecarter(texte, migre.erreur === 'version-future' ? 'version-future' : 'illisible');
  }
  const repare = assainir(migre.valeur, nouvelId);
  if (!repare.ok) return ecarter(texte, 'illisible');

  const { dossier, modifie, bilan } = repare.valeur;
  if (modifie) {
    garderCopie(texte);
    return { dossier, source: 'repare', avertissement: 'repare', bilan, sauvegardeOrigine: texte };
  }
  // `migrer` a réussi : la version lue est un entier valide.
  const versionLue = (donnees as { version: number }).version;
  return { dossier, source: versionLue < migrations.length + 1 ? 'migre' : 'stockage' };
}

/** Écrit le dossier ; à appeler à chaque modification (décision 2). */
export function enregistrer(dossier: Dossier): Resultat<null> {
  try {
    stockage().setItem(CLE_DOSSIER, JSON.stringify(dossier));
    return ok(null);
  } catch {
    return erreur('ecriture-impossible');
  }
}

/** Supprime toutes les clés de l'application (`grille-evaluation:*`), et seulement elles. */
export function reinitialiser(): Resultat<null> {
  try {
    const s = stockage();
    // Les clés d'un Storage sont ses propriétés énumérables (norme HTML).
    const cles = Object.keys(s).filter((cle) => cle.startsWith(PREFIXE));
    for (const cle of cles) s.removeItem(cle);
    return ok(null);
  } catch {
    return erreur('ecriture-impossible');
  }
}
