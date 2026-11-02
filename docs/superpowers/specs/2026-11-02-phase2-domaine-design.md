# Grille d'évaluation — Phase 2 : domaine

- Date : 2026-11-02
- Statut : validée le 2026-11-02
- Auteur : Réda Hamza, Développeur technopédagogique
- Phase précédente : `2026-11-02-phase1-fondations-design.md`

## 1. Objectif

Écrire le cœur métier en TypeScript pur (`src/domain/`) : la grille, les niveaux, les
poids, le groupe, les évaluations, le calcul des notes, les 25 modèles et le format de
données versionné. **Aucune interface, aucun stockage** : ce code ne connaît ni React ni
le `localStorage`. Il est couvert à 100 % par des tests écrits avant lui.

À la fin de la phase, l'application affichée n'a pas changé ; seule la fondation métier
existe, prête à être branchée sur le stockage (phase 3) puis sur l'interface (phase 4).

## 2. Ce que fait l'outil d'origine, et ce qu'on corrige

Lecture de `GrilleEvaluation.jsx` et `grilleModeles.js` dans la Trousse pédagogique
(référence seulement, rien n'y est modifié).

| Outil d'origine                                                                 | Problème                                                                                   | Dans la nouvelle application                                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Chaque personne étudiante a sa **propre copie** de la grille                    | Modifier un critère pour l'une ne change pas les autres : le groupe n'est plus évalué sur la même grille | **Une seule grille** pour tout le groupe ; chaque personne n'a que ses niveaux et commentaires |
| Poids en nombres à virgule (`16.7`)                                             | Erreurs d'arrondi : 6 critères égalisés donnent `100.00000000000001`                       | Poids en **dixièmes entiers** (`167` = 16,7 %) ; total exact de `1000`            |
| Retirer un niveau laisse les évaluations au niveau retiré                        | Note supérieure à 100 %                                                                     | Les évaluations au niveau retiré sont effacées, et leur nombre est signalé       |
| Critère non évalué compté comme 0                                               | Une note partielle ressemble à une note finale                                              | Note **incomplète** tant qu'un critère pondéré n'est pas évalué (voir décision 2) |
| Total des poids ≠ 100 % : simple avertissement, la note est calculée quand même | Note trompeuse                                                                              | Pondération invalide : pas de note (voir décision 3)                             |
| Arrondis faits avec `toFixed` à plusieurs endroits                              | Résultats différents selon l'écran ou l'export                                              | **Une seule fonction d'arrondi**, utilisée partout (écran, PDF, CSV, Word)       |
| Identifiants `Math.random`                                                      | Non testable                                                                                | Identifiants fournis par l'appelant : le domaine reste pur et déterministe       |

Les données de la Trousse (`trousse_grille_eval_v1`) **ne sont pas reprises** : la nouvelle
application est servie depuis une autre adresse, et le navigateur ne lui donne pas accès au
`localStorage` de la Trousse. L'outil d'origine n'avait pas d'export JSON.

## 3. Modèle de données

```ts
type Dossier = {
  version: 1; // format de données, voir section 6
  grille: Grille;
  etudiants: Etudiant[]; // le groupe, dans l'ordre d'affichage
  modelesPerso: Modele[]; // modèles enregistrés par l'enseignant·e
};

type Grille = {
  titre: string;
  totalPoints: number; // note sur X : de 0,01 à 1000, au plus 2 décimales
  niveaux: string[]; // libellés ; index 0 = niveau 1 (le plus faible)
  criteres: Critere[];
};

type Critere = {
  id: string;
  nom: string;
  poids: number; // dixièmes de pour cent, entier de 0 à 1000
  descripteurs: string[]; // un par niveau, même longueur que grille.niveaux
};

type Etudiant = {
  id: string;
  nom: string;
  niveaux: Record<string, number>; // id du critère → niveau de 1 à N (absent = non évalué)
  commentaires: Record<string, string>; // id du critère → commentaire
  commentaireGeneral: string;
};

type Modele = {
  id: string;
  nom: string;
  niveaux: string[];
  criteres: { nom: string; poids: number; descripteurs: string[] }[];
};
```

Invariants garantis par toutes les fonctions du domaine :

- `descripteurs.length === niveaux.length` pour chaque critère.
- Un niveau enregistré est toujours entre 1 et le nombre de niveaux.
- `niveaux` et `commentaires` ne référencent que des critères existants.
- Les identifiants de critères et de personnes sont uniques.

## 4. Règles métier

### 4.1 Poids

- Stockés en **dixièmes entiers** : `250` = 25 %. Affichés avec une virgule : « 25,0 % ».
- `lirePoids("16,7")` et `lirePoids("16.7")` donnent `167`. Une saisie négative, au-delà
  de 100, non numérique ou avec plus d'une décimale est refusée avec un code d'erreur.
- `egaliserPoids(n)` répartit `1000` en `n` entiers : chacun reçoit le quotient, et le
  reste va aux premiers critères. 6 critères donnent 16,7 % ×4 et 16,6 % ×2, soit 100,0 %
  exactement.
- Un poids de 0 est permis (critère formatif, sans effet sur la note).
- La pondération est **valide** quand la somme vaut exactement `1000`.

### 4.2 Niveaux

- Entre **3 et 10 niveaux**. Par défaut, les 5 libellés de l'outil d'origine :
  Insatisfaisant, Faible, Satisfaisant, Très bon, Excellent.
- Ajouter un niveau l'ajoute **en haut** (nouveau maximum, libellé « Niveau N ») et ajoute
  un descripteur vide à chaque critère.
- Retirer un niveau retire **le plus haut** et son descripteur. Les évaluations à ce niveau
  sont effacées ; la fonction renvoie aussi leur nombre, pour que l'interface puisse
  prévenir avant de confirmer (phase 4).
- Changer le nombre de niveaux change le sens des évaluations existantes (4 sur 5 devient
  4 sur 6) : le domaine le permet, l'interface préviendra.

### 4.3 Critères

Ajouter (nom par défaut « Nouveau critère », poids 0, descripteurs vides), renommer,
changer le poids, modifier un descripteur, déplacer vers le haut ou le bas, retirer.
Retirer un critère efface aussi ses niveaux et commentaires chez toutes les personnes.

### 4.4 Groupe

- Ajouter, renommer, retirer, réordonner les personnes étudiantes.
- Nom : espaces de début et de fin retirés, de 1 à 100 caractères (voir décision 4 pour
  les doublons).
- Le groupe peut être vide (l'outil d'origine imposait une personne fictive).
- Évaluer : fixer ou effacer le niveau d'un critère, écrire un commentaire par critère et
  un commentaire général, réinitialiser l'évaluation d'une personne.

### 4.5 Calcul de la note

Pour une personne, avec `N` niveaux :

```
fraction = Σ (niveau × poids)  /  (N × Σ poids)
```

- Calcul **exact sur des entiers** (numérateur et dénominateur), arrondi une seule fois à
  la fin, demi vers le haut : pourcentage au dixième (« 87,5 % »), points au centième
  (« 17,50 / 20 »).
- Le niveau 1 vaut `1/N` du poids, pas 0 (comme l'outil d'origine).
- `calculerResultat` renvoie un **statut** :

| Statut                 | Quand                                              | Note renvoyée                     |
| ---------------------- | -------------------------------------------------- | --------------------------------- |
| `complete`             | Pondération valide, tous les critères pondérés évalués | Pourcentage, points, appréciation |
| `incomplete`           | Au moins un critère pondéré non évalué             | Aucune ; progression « 3 sur 5 »  |
| `ponderation-invalide` | Somme des poids ≠ 100 %                            | Aucune ; écart à corriger         |
| `vide`                 | Aucun critère                                      | Aucune                            |

- **Appréciation globale** : le libellé du niveau le plus proche de `fraction × N`, égalité
  vers le haut, au minimum le niveau 1 (règle de l'outil d'origine).
- **Synthèse du groupe** : nombre de personnes complètes, incomplètes, moyenne et médiane
  des notes complètes. Elle servira à l'export « tout le groupe » (phase 5).

### 4.6 Modèles

- Les **25 modèles** de Paulo Mendonça sont repris tels quels (noms, 5 critères chacun,
  descripteurs des 5 niveaux), dans `src/data/modeles.ts`, avec la mention de l'auteur et
  de la licence.
- Appliquer un modèle remplace les niveaux et les critères de la grille (poids égalisés
  pour les modèles fournis), garde le titre et le total de points, et efface les niveaux et
  commentaires par critère de tout le groupe. Les commentaires généraux sont gardés.
- Enregistrer la grille courante comme **modèle personnel** (nom de 1 à 100 caractères),
  le renommer, le supprimer. Un modèle personnel s'applique comme un modèle fourni, avec
  ses propres poids.

### 4.7 Arrondi et format français

`src/domain/format.ts` : `formaterPourcentage(875)` → « 87,5 % », `formaterPoints(1750)` →
« 17,50 », espace insécable avant « % ». Même résultat sur l'écran et dans les exports.

## 5. Erreurs

Les fonctions qui peuvent refuser une opération renvoient
`{ ok: true, valeur } | { ok: false, erreur: CodeErreur }`. Les codes sont des chaînes
stables (`poids-invalide`, `niveaux-minimum`, `niveaux-maximum`, `nom-vide`,
`nom-trop-long`, `nom-en-double`, `critere-introuvable`, `etudiant-introuvable`…). Les
messages en français seront rédigés dans l'interface (phase 4). Aucune exception n'est
lancée pour une erreur prévue.

## 6. Format versionné et migrations

- Chaque `Dossier` porte `version: 1`.
- `migrer(donnees)` prend un objet déjà lu et renvoie un `Dossier` à la version courante,
  en appliquant les migrations une à une (`1 → 2 → …`). La phase 2 ne contient que la
  version 1, mais la chaîne est en place et testée, avec une fausse migration de test.
- Une version future (supérieure à la courante) ou absente est refusée avec un code
  d'erreur, sans rien modifier.
- La **validation complète** d'un fichier inconnu et la **réparation** d'une sauvegarde
  abîmée relèvent de la phase 3.

## 7. Organisation

```
src/domain/
  types.ts        Dossier, Grille, Critere, Etudiant, Modele, Resultat, CodeErreur
  resultat.ts     ok(), erreur() : le type des retours
  poids.ts        lirePoids, egaliserPoids, totalPoids, ponderationValide
  niveaux.ts      niveauxParDefaut, ajouterNiveau, retirerNiveau, renommerNiveau
  criteres.ts     ajouter, renommer, changerPoids, modifierDescripteur, deplacer, retirer
  groupe.ts       ajouter, renommer, retirer, deplacer ; evaluer, commenter, reinitialiser
  notes.ts        calculerResultat, appreciation, synthese
  format.ts       formaterPoids, formaterPourcentage, formaterPoints
  modeles.ts      appliquerModele, enregistrerModele, renommerModele, supprimerModele
  dossier.ts      dossierVide
  migrations.ts   VERSION_COURANTE, migrer
  index.ts        exports publics
src/data/modeles.ts   les 25 modèles (données, hors couverture)
tests/domain/   un fichier de test par module
tests/data/     intégrité des 25 modèles
```

Règles : fonctions pures et immuables (on ne modifie jamais l'objet reçu) ; identifiants
passés en paramètre ; aucun import de React, du DOM ou de `src/ui/` (vérifié par un test).

## 8. Tests (écrits avant le code)

| Fichier                         | Vérifie                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `tests/domain/poids.test.ts`    | Lecture virgule et point, refus (négatif, > 100, deux décimales, texte), égalisation de 1 à 12 critères toujours égale à 1000 |
| `tests/domain/niveaux.test.ts`  | Bornes 3 et 10, descripteurs alignés, effacement et comptage des évaluations au niveau retiré |
| `tests/domain/criteres.test.ts` | Chaque opération ; retrait en cascade dans le groupe ; déplacement aux extrémités ; objet d'entrée inchangé |
| `tests/domain/groupe.test.ts`   | Noms (espaces, longueur, doublons), évaluation hors bornes refusée, réinitialisation      |
| `tests/domain/notes.test.ts`    | Les 4 statuts, calcul exact (6 critères égalisés, tout au maximum = 100,0 %), arrondi demi vers le haut, appréciation et égalité, synthèse (moyenne, médiane, groupe vide) |
| `tests/domain/format.test.ts`   | Virgule, espace insécable, zéros (« 17,50 »)                                              |
| `tests/domain/modeles.test.ts`  | Application d'un modèle fourni et personnel, nettoyage du groupe, cycle des modèles personnels |
| `tests/domain/migrations.test.ts` | Version 1 inchangée, chaîne appliquée dans l'ordre, version future et absente refusées |
| `tests/domain/architecture.test.ts` | Aucun fichier de `src/domain/` n'importe React, le DOM ou `src/ui/`                   |
| `tests/data/modeles.test.ts`    | 25 modèles, identifiants uniques, 5 critères et 5 descripteurs non vides chacun, aucun nom d'établissement |

Des tests par propriétés (valeurs générées au hasard, bibliothèque `fast-check`) vérifient
deux règles qui doivent tenir pour toutes les entrées : la somme égalisée vaut toujours
1000, et la note complète reste toujours entre 0 et 100 %.

## 9. Changements d'outillage

- `npm run ci` exécute `test:coverage` au lieu de `test` : le seuil de 100 % sur
  `src/domain/` devient bloquant en local et dans GitHub Actions (le test d'alignement de
  la CI le vérifie déjà).
- Ajout de `fast-check` en dépendance de développement.

## 10. Exclus (phases suivantes)

Stockage et réparation (phase 3) ; tout écran, toute confirmation et tout message
(phase 4) ; exports (phase 5). Une seule grille et un seul groupe à la fois : on garde
plusieurs dossiers grâce à l'export JSON (phase 3).

## 11. Critères d'acceptation

- `npm run ci` passe, couverture de 100 % sur `src/domain/` incluse.
- Les 25 modèles sont présents et identiques à ceux de l'outil d'origine.
- Aucun des bugs de la section 2 n'est reproductible : un test le prouve pour chacun.
- README (état du projet, organisation) et CHANGELOG à jour.

## 12. Décisions

Validées par Réda le 2026-11-02. L'outil d'origine fait autrement pour 1, 2 et 3.

1. **Une seule grille partagée par tout le groupe** (au lieu d'une copie par personne).
   Toute modification de critère s'applique à tout le monde, ce qui garantit une
   évaluation équitable.
2. **Note incomplète tant qu'un critère pondéré n'est pas évalué**, au lieu de compter 0.
   L'écran montrera la progression (« 3 critères sur 5 ») plutôt qu'une note partielle.
3. **Pas de note si le total des poids n'est pas 100 %**, au lieu de recalculer en
   silence sur le total présent.
4. **Doublons de noms refusés** dans le groupe (comparaison sans tenir compte des
   majuscules, des accents ni des espaces multiples). Deux personnes du même nom se
   distinguent par une initiale. (Option écartée : permettre les doublons avec un simple
   avertissement.)
5. **Appliquer un modèle remplace aussi les niveaux** par ceux du modèle (5 pour les
   modèles fournis), puisque ses descripteurs sont écrits pour ces niveaux.
6. **Total de points de 0,01 à 1000, au plus 2 décimales** (une note sur 12,5 reste
   possible).
