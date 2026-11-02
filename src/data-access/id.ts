let compteur = 0;

/**
 * Identifiant opaque pour les critères, personnes et modèles : seule source d'identifiants
 * de l'application (interface, stockage, import).
 *
 * `crypto.randomUUID()` n'existe que sur une page sécurisée (https, localhost) et dans les
 * navigateurs récents ; sinon, le repli combine l'heure, un compteur et du hasard, ce qui
 * suffit pour des clés locales non cryptographiques.
 */
export function nouvelId(): string {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  compteur += 1;
  const hasard = Math.random().toString(36).slice(2, 10);
  return `id-${Date.now().toString(36)}-${compteur.toString(36)}-${hasard}`;
}
