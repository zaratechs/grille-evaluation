# Grille d'évaluation — Phase 3 : persistance

- Date : 2026-11-02
- Statut : validée le 2026-11-02
- Auteur : Réda Hamza, Développeur technopédagogique
- Phase précédente : `2026-11-02-phase2-domaine-design.md`

## 1. Objectif

Conserver le dossier (grille, groupe, modèles personnels) entre deux visites et permettre
de l'emporter ailleurs :

- **sauvegarde automatique** dans le navigateur (`localStorage`) ;
- **réparation** d'une sauvegarde abîmée, sans jamais perdre l'originale ;
- **export et import JSON**, avec une validation complète de tout fichier importé.

Comme en phase 2, **aucun écran** : les fonctions sont prêtes à être branchées sur
l'interface (phase 4). Les messages affichés à l'utilisateur sont rédigés en phase 4 ;
cette phase renvoie des codes et des bilans chiffrés.

## 2. Ce que fait l'outil d'origine

| Outil d'origine                                                  | Problème                                                          | Dans la nouvelle application                                                     |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Sauvegarde illisible : `catch {}` silencieux, repart à zéro       | Les données sont écrasées à la modification suivante, sans prévenir | L'originale est mise de côté et proposée en téléchargement (décision 1)          |
| Réparation partielle (personne fictive, niveaux par défaut)       | Une note à 6 sur 5 ou un poids en texte passent tels quels         | Chaque champ est vérifié ; ce qui est corrigé est compté dans un bilan           |
| Écriture sans `try` : quota plein ou navigation privée = plantage | Page blanche                                                      | L'échec est signalé par un code ; l'application continue                          |
| Deux onglets ouverts : le dernier qui écrit gagne                 | Perte silencieuse                                                  | L'autre onglet est prévenu et cesse d'écrire (décision 3)                         |
| Pas d'export ni d'import JSON                                     | Impossible de changer d'ordinateur ou de garder plusieurs groupes | Export complet ou « grille seule », import validé                                |

## 3. Organisation

```
src/domain/
  assainissement.ts  assainir(donnees) : répare un dossier migré, renvoie le bilan (pur)
  nomFichier.ts      nomFichier(titre, date, extension) : nom sûr, date locale
src/data-access/      le SEUL dossier qui touche au navigateur (localStorage, fichiers)
  id.ts              nouvelId() : crypto.randomUUID, avec repli
  stockage.ts        charger, enregistrer, reinitialiser, copie de secours
  onglets.ts         surveiller les modifications faites dans un autre onglet
  portabilite.ts     exporterJSON, importerJSON
  fichiers.ts        telecharger(nom, contenu, type), lireFichier(fichier)
  index.ts           API publique
```

- La **réparation est dans le domaine** : c'est de la logique pure, couverte à 100 %.
- `src/data-access/` est aussi couvert à **100 %** (tests jsdom, seuil ajouté).
- Deux règles vérifiées par test : le domaine n'importe pas `data-access` ; seul
  `data-access` mentionne `localStorage`, `Blob` ou `FileReader`.

## 4. Réparation (`assainir`)

Entrée : un objet déjà passé par `migrer()` (phase 2). Sortie :
`{ dossier, modifie, bilan }`. Une sauvegarde intacte ressort identique avec
`modifie: false`. **Rien n'est jamais levé.**

Refus (code `pas-un-dossier`) seulement si la donnée n'est pas un objet ou si `grille`
n'est pas un objet : il n'y a alors rien à récupérer. Tout le reste se répare :

| Champ                         | Si invalide                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `titre`                       | Pas du texte → `''` ; plus de 200 caractères → tronqué                                     |
| `totalPoints`                 | Hors de 0,01 à 1000 ou plus de 2 décimales → `100`                                          |
| `niveaux`                     | Pas une liste de 3 à 10 textes → les 5 niveaux par défaut ; libellé vide → « Niveau N »    |
| critère                       | Pas un objet → écarté ; identifiant absent ou en double → nouvel identifiant               |
| critère : `nom`               | Vide ou pas du texte → « Nouveau critère » ; trop long → tronqué                           |
| critère : `poids`             | Pas un entier de 0 à 1000 → `0` (la pondération devient invalide, donc visible)            |
| critère : `descripteurs`      | Réalignés sur le nombre de niveaux (complétés par `''` ou coupés) ; non-texte → `''`        |
| personne                      | Pas un objet ou sans nom utilisable → écartée ; identifiant absent ou en double → nouveau |
| personne : `nom`              | Tronqué à 100 ; doublon → suffixe « (2) », « (3) »…                                         |
| personne : `niveaux`          | Gardés seulement pour un critère existant et un entier de 1 à N                             |
| personne : `commentaires`     | Gardés seulement pour un critère existant et du texte                                       |
| personne : `commentaireGeneral` | Pas du texte → `''`                                                                       |
| modèle personnel              | Mêmes règles que la grille ; modèle sans nom utilisable → écarté ; nom en double → suffixe |
| champ inconnu                 | Ignoré (non compté)                                                                          |

Le **bilan** compte chaque catégorie (critères écartés, poids corrigés, niveaux
d'évaluation écartés, personnes écartées, noms renommés…), pour que l'interface puisse
dire précisément ce qui a été corrigé.

## 5. Sauvegarde dans le navigateur (`stockage.ts`)

- Une seule clé : `grille-evaluation:dossier`. Toutes les clés de l'application commencent
  par `grille-evaluation:` ; `reinitialiser()` ne supprime que celles-là.
- `charger()` renvoie `{ dossier, source, avertissement?, sauvegardeOrigine? }` :

| Situation                                   | `source`   | Avertissement          | Originale gardée |
| ------------------------------------------- | ---------- | ---------------------- | ---------------- |
| Rien d'enregistré                           | `defaut`   | —                      | —                |
| Sauvegarde intacte                          | `stockage` | —                      | —                |
| Sauvegarde d'une version antérieure         | `migre`    | —                      | —                |
| Sauvegarde réparée                          | `repare`   | `repare` + bilan       | oui              |
| JSON illisible ou `pas-un-dossier`          | `defaut`   | `illisible`            | oui              |
| Version future                              | `defaut`   | `version-future`       | oui              |
| `localStorage` inaccessible                 | `defaut`   | `lecture-impossible`   | —                |

- **Originale gardée** (décision 1) : le texte d'origine est copié sous
  `grille-evaluation:copie-de-secours` **avant** toute nouvelle écriture, et renvoyé dans
  `sauvegardeOrigine` pour que l'interface propose de le télécharger. Une seule copie : la
  suivante remplace la précédente.
- `enregistrer(dossier)` écrit **à chaque modification**, sans délai (décision 2). Un
  dossier fait quelques dizaines de Ko ; écrire tout de suite évite de perdre la dernière
  saisie si l'onglet se ferme. En cas d'échec (quota, navigation privée), la fonction
  renvoie le code `ecriture-impossible`, sans exception.

## 6. Plusieurs onglets (`onglets.ts`)

`surveillerAutresOnglets(rappel)` écoute l'événement `storage` du navigateur : quand un
autre onglet enregistre le dossier, le rappel est appelé et la fonction d'arrêt est
renvoyée. Règle (décision 3) : l'onglet prévenu **cesse d'enregistrer** jusqu'à ce que
l'utilisateur recharge la page ; l'interface affichera un avis avec un bouton
« Recharger » (phase 4).

## 7. Export et import JSON (`portabilite.ts`)

### Export

- `exporterJSON(dossier, { grilleSeule })` renvoie un texte JSON indenté, au format du
  dossier (avec `version`).
- **Grille seule** (décision 5) : grille et modèles personnels, **sans les personnes
  étudiantes**. Sert à partager une grille avec une ou un collègue sans données
  personnelles.
- Nom du fichier : `nomFichier()` du domaine, par exemple
  `grille-travail-de-session-2026-11-02.json` (sans accents ni espaces, 60 caractères au
  plus pour le titre, « grille » si le titre est vide). La date est la **date locale** :
  l'outil Scrum de la Trousse utilisait la date UTC, qui donne le lendemain le soir.

### Import

`importerJSON(texte, dossierCourant)` : taille → `JSON.parse` → `migrer` → `assainir`.

- Refus, sans rien modifier : `fichier-trop-gros` (plus de 5 Mo, décision 7),
  `json-invalide`, `version-inconnue`, `version-future`, `pas-un-dossier`.
- Succès : `{ dossier, bilan, modelesAjoutes }`. Le dossier importé **remplace** la grille
  et le groupe courants (décision 4 ; l'interface demandera confirmation et proposera
  d'exporter d'abord). Les **modèles personnels sont fusionnés** : ceux du dossier courant
  sont gardés, ceux du fichier sont ajoutés, un nom déjà pris reçoit un suffixe.
- Un fichier « grille seule » s'importe de la même façon ; le groupe courant est alors
  **gardé** et ses évaluations sont nettoyées comme lors de l'application d'un modèle.

### Fichiers (`fichiers.ts`)

`telecharger(nom, contenu, type)` crée le fichier et le libère ensuite ;
`lireFichier(fichier)` renvoie le texte, ou `fichier-trop-gros` avant toute lecture.

## 8. Tests (écrits avant le code)

| Fichier                                    | Vérifie                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `tests/domain/assainissement.test.ts`      | Dossier intact inchangé (`modifie: false`) ; chaque ligne du tableau de la section 4 ; bilan exact ; propriété : pour toute donnée générée au hasard, le résultat respecte tous les invariants de la phase 2 et ne lève jamais |
| `tests/domain/nomFichier.test.ts`          | Accents, espaces, caractères interdits, titre vide, longueur ; date locale à 23 h 30      |
| `tests/data-access/stockage.test.ts`       | Chaque ligne du tableau de la section 5 ; copie de secours écrite avant l'écrasement ; `localStorage` qui lève (lecture, écriture, quota) ; `reinitialiser` ne touche qu'aux clés de l'application |
| `tests/data-access/onglets.test.ts`        | Rappel appelé pour notre clé seulement, pas pour une autre ; arrêt de l'écoute            |
| `tests/data-access/portabilite.test.ts`    | Aller-retour export → import identique ; grille seule sans personnes ; chaque refus ; fusion des modèles ; fichier abîmé réparé avec bilan |
| `tests/data-access/fichiers.test.ts`       | Lien créé puis libéré ; lecture d'un fichier ; refus d'un fichier trop gros               |
| `tests/data-access/id.test.ts`             | `randomUUID` utilisé s'il existe ; repli sinon ; identifiants distincts                   |
| `tests/domain/architecture.test.ts` (ajout) | Le domaine n'importe pas `data-access` ; seul `data-access` touche au navigateur         |

## 9. Changements d'outillage

- `vitest.config.ts` : `tests/data-access/**` dans le projet `jsdom` ; seuil de 100 % sur
  `src/data-access/**`.
- `eslint.config.js` : globaux du navigateur pour `src/data-access/**`.
- Aucune nouvelle dépendance.

## 10. Exclus (phases suivantes)

Tout écran, avis, confirmation et message (phase 4) ; exports PDF, CSV et Word (phase 5) ;
texte de la page Transparence sur les données gardées dans le navigateur (phase 6).

## 11. Critères d'acceptation

- `npm run ci` passe, avec 100 % de couverture sur `src/domain/` et `src/data-access/`.
- Aucune donnée, même abîmée, ne fait lever d'exception au chargement ou à l'import.
- Aucune sauvegarde n'est écrasée sans qu'une copie de l'originale ait été gardée.
- Un aller-retour export → import redonne exactement le même dossier.
- README (organisation, données et sauvegarde) et CHANGELOG à jour.

## 12. Décisions

Validées par Réda le 2026-11-02.

1. **Garder la sauvegarde écartée** dans une copie de secours et la proposer en
   téléchargement, au lieu de la perdre à la première modification.
2. **Enregistrer à chaque modification**, sans délai.
3. **Autre onglet : prévenir et cesser d'enregistrer** jusqu'au rechargement. (Option
   écartée : simple avertissement, le dernier qui écrit gagne.)
4. **L'import remplace la grille et le groupe** (après confirmation), et **fusionne les
   modèles personnels**, pour ne pas perdre ses modèles en ouvrant le fichier d'une ou d'un
   collègue.
5. **Proposer un export « grille seule »**, sans les personnes étudiantes, pour partager
   une grille sans données personnelles.
6. **Réparer plutôt que refuser** : un fichier n'est refusé que s'il n'est pas du tout un
   dossier ; sinon il est réparé et le bilan dit ce qui a changé.
7. **Taille maximale d'un import : 5 Mo** (un dossier de 40 personnes très commentées
   reste sous 500 Ko ; la limite du `localStorage` est d'environ 5 Mo).
