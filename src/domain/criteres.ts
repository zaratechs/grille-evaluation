import { deplacer, sans, type Sens } from './listes';
import { niveauValide } from './niveaux';
import { lireNom } from './noms';
import { POIDS_TOTAL } from './poids';
import { ok, erreur, type Resultat } from './resultat';
import type { Critere, Dossier } from './types';

export const NOM_CRITERE_PAR_DEFAUT = 'Nouveau critère';

const avecCriteres = (dossier: Dossier, criteres: Critere[]): Dossier => ({
  ...dossier,
  grille: { ...dossier.grille, criteres },
});

/** Applique `modifier` au critère `id`, ou refuse s'il n'existe pas. */
function modifierCritere(
  dossier: Dossier,
  id: string,
  modifier: (c: Critere) => Critere,
): Resultat<Dossier> {
  const { criteres } = dossier.grille;
  if (!criteres.some((c) => c.id === id)) return erreur('critere-introuvable');
  return ok(
    avecCriteres(
      dossier,
      criteres.map((c) => (c.id === id ? modifier(c) : c)),
    ),
  );
}

/** Ajoute à la fin un critère sans poids, avec un descripteur vide par niveau. */
export function ajouterCritere(dossier: Dossier, id: string): Resultat<Dossier> {
  const { criteres, niveaux } = dossier.grille;
  if (criteres.some((c) => c.id === id)) return erreur('identifiant-en-double');
  const nouveau: Critere = {
    id,
    nom: NOM_CRITERE_PAR_DEFAUT,
    poids: 0,
    descripteurs: niveaux.map(() => ''),
  };
  return ok(avecCriteres(dossier, [...criteres, nouveau]));
}

export function renommerCritere(dossier: Dossier, id: string, nom: string): Resultat<Dossier> {
  const lu = lireNom(nom);
  if (!lu.ok) return lu;
  return modifierCritere(dossier, id, (c) => ({ ...c, nom: lu.valeur }));
}

/** Poids en dixièmes entiers, de 0 à 1000 (la saisie passe par `lirePoids`). */
export function changerPoids(dossier: Dossier, id: string, poids: number): Resultat<Dossier> {
  if (!Number.isInteger(poids) || poids < 0 || poids > POIDS_TOTAL) return erreur('poids-invalide');
  return modifierCritere(dossier, id, (c) => ({ ...c, poids }));
}

/** Le texte est gardé tel quel : un descripteur peut tenir sur plusieurs lignes. */
export function modifierDescripteur(
  dossier: Dossier,
  id: string,
  niveau: number,
  texte: string,
): Resultat<Dossier> {
  if (!niveauValide(dossier, niveau)) return erreur('niveau-invalide');
  return modifierCritere(dossier, id, (c) => ({
    ...c,
    descripteurs: c.descripteurs.map((d, i) => (i === niveau - 1 ? texte : d)),
  }));
}

/** Échange le critère avec son voisin ; sans effet aux extrémités. */
export function deplacerCritere(dossier: Dossier, id: string, sens: Sens): Resultat<Dossier> {
  const criteres = deplacer(dossier.grille.criteres, id, sens);
  return criteres ? ok(avecCriteres(dossier, criteres)) : erreur('critere-introuvable');
}

/** Retire le critère, ainsi que ses niveaux et commentaires chez toutes les personnes. */
export function retirerCritere(dossier: Dossier, id: string): Resultat<Dossier> {
  const { criteres } = dossier.grille;
  if (!criteres.some((c) => c.id === id)) return erreur('critere-introuvable');
  return ok({
    ...avecCriteres(
      dossier,
      criteres.filter((c) => c.id !== id),
    ),
    etudiants: dossier.etudiants.map((e) => ({
      ...e,
      niveaux: sans(e.niveaux, id),
      commentaires: sans(e.commentaires, id),
    })),
  });
}
