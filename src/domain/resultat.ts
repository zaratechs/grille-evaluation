import type { CodeErreur } from './types';

/** Retour d'une opération qui peut être refusée : jamais d'exception pour une erreur prévue. */
export type Resultat<T> = { ok: true; valeur: T } | { ok: false; erreur: CodeErreur };

export const ok = <T>(valeur: T): Resultat<T> => ({ ok: true, valeur });

export const erreur = <T = never>(code: CodeErreur): Resultat<T> => ({ ok: false, erreur: code });
