/**
 * Modèle de données du domaine. Voir la spec de la phase 2, section 3.
 * Une seule grille est partagée par tout le groupe ; chaque personne n'a que ses
 * niveaux et ses commentaires.
 */

export type Dossier = {
  /** Version du format de données (voir migrations.ts). */
  version: 1;
  grille: Grille;
  /** Le groupe, dans l'ordre d'affichage. */
  etudiants: Etudiant[];
  /** Modèles enregistrés par l'enseignant·e. */
  modelesPerso: Modele[];
};

export type Grille = {
  titre: string;
  /** Note sur X : de 0,01 à 1000, au plus 2 décimales. */
  totalPoints: number;
  /** Libellés des niveaux ; index 0 = niveau 1 (le plus faible). */
  niveaux: string[];
  criteres: Critere[];
};

export type Critere = {
  id: string;
  nom: string;
  /** Dixièmes de pour cent : entier de 0 à 1000 (250 = 25 %). */
  poids: number;
  /** Un descripteur par niveau, même longueur que `Grille.niveaux`. */
  descripteurs: string[];
};

export type Etudiant = {
  id: string;
  nom: string;
  /** Id du critère → niveau de 1 à N. Absent = non évalué. */
  niveaux: Record<string, number>;
  /** Id du critère → commentaire. */
  commentaires: Record<string, string>;
  commentaireGeneral: string;
};

export type CritereModele = Omit<Critere, 'id'>;

export type Modele = {
  id: string;
  nom: string;
  niveaux: string[];
  criteres: CritereModele[];
};

/** Codes d'erreur stables ; les messages en français sont rédigés dans l'interface. */
export type CodeErreur =
  | 'poids-invalide'
  | 'total-points-invalide'
  | 'niveaux-minimum'
  | 'niveaux-maximum'
  | 'niveau-invalide'
  | 'nom-vide'
  | 'nom-trop-long'
  | 'nom-en-double'
  | 'critere-introuvable'
  | 'etudiant-introuvable'
  | 'identifiant-en-double'
  | 'modele-introuvable'
  | 'version-inconnue'
  | 'version-future';
