import { ok, erreur, type Resultat } from './resultat';
import type { Dossier } from './types';

/** Données à une version donnée, avant validation. */
export type Donnees = Record<string, unknown>;

/** Fait passer des données de la version n à la version n + 1 (le champ `version` est géré par `migrer`). */
export type Migration = (donnees: Donnees) => Donnees;

/**
 * MIGRATIONS[0] migre de la version 1 vers la 2, MIGRATIONS[1] de la 2 vers la 3, etc.
 * Pour changer le format : ajouter une migration ici, passer `VERSION_COURANTE` et le type
 * `Dossier['version']` à la valeur suivante (un test vérifie qu'ils restent alignés).
 */
export const MIGRATIONS: readonly Migration[] = [];

export const VERSION_COURANTE = 1;

export const estObjet = (v: unknown): v is Donnees =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Amène des données déjà lues (JSON, stockage) à la version courante, une migration à la
 * fois. Refuse une version absente ou invalide (`version-inconnue`) et une version plus
 * récente que l'application (`version-future`). Les données reçues ne sont jamais
 * modifiées. La validation complète de la structure relève de la phase 3.
 */
export function migrer(
  donnees: unknown,
  migrations: readonly Migration[] = MIGRATIONS,
): Resultat<Dossier> {
  if (!estObjet(donnees)) return erreur('version-inconnue');
  const { version } = donnees;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return erreur('version-inconnue');
  }
  const courante = migrations.length + 1;
  if (version > courante) return erreur('version-future');

  let resultat: Donnees = structuredClone(donnees);
  for (let v = version; v < courante; v++) {
    const migration = migrations[v - 1] as Migration;
    resultat = { ...migration(resultat), version: v + 1 };
  }
  return ok(resultat as Dossier);
}
