# Plan — Phase 3 : persistance

Spec : `docs/superpowers/specs/2026-11-02-phase3-persistance-design.md`

Règles pour toutes les tâches (comme aux phases 1 et 2) :

- TDD : le test est écrit et vu **en échec** avant le code qui le fait passer.
- À la fin de chaque tâche : `npm run ci`, revue du diff, README et CHANGELOG si la tâche
  change ce qu'ils décrivent.
- Claude ne commite pas : il propose le message, Réda commite.
- Claude demande l'accord avant de passer à la tâche suivante.
- Tests du navigateur : un faux `localStorage` est installé par test quand il doit lever
  (lecture, écriture, quota) ; le vrai (jsdom) est vidé avant chaque test.

---

## Tâche 1 — Outillage, frontières et identifiants

1. **Rouge** :
   - `tests/domain/architecture.test.ts` : le domaine n'importe pas `data-access` ;
     aucun fichier de `src/` hors de `src/data-access/` ne mentionne `localStorage`,
     `sessionStorage`, `Blob`, `FileReader` ni `URL.createObjectURL` ;
   - `tests/data-access/id.test.ts` : `crypto.randomUUID` utilisé s'il existe, repli
     sinon, 1000 identifiants distincts.
2. **Vert** : `src/data-access/id.ts`, `src/data-access/index.ts`.
3. `vitest.config.ts` (projet `jsdom` et seuil de 100 % pour `src/data-access/**`) ;
   `eslint.config.js` (globaux du navigateur).

```
feat(persistance): poser la frontière data-access et les identifiants
```

## Tâche 2 — Réparation de la grille

1. **Rouge** : `tests/domain/assainissement.test.ts`, partie grille
   - dossier intact : `modifie: false`, contenu identique ;
   - refus `pas-un-dossier` : `null`, liste, texte, `grille` absente ou non-objet ;
   - titre, total de points, niveaux, critères (écartés, identifiants, nom, poids,
     descripteurs réalignés) : chaque ligne du tableau de la spec, avec le bilan.
2. **Vert** : `src/domain/assainissement.ts` (partie grille), export dans `index.ts`.

```
feat(persistance): réparer la grille d'une sauvegarde abîmée
```

## Tâche 3 — Réparation du groupe et des modèles personnels

1. **Rouge** : suite de `assainissement.test.ts`
   - personnes : écartées, identifiants, noms tronqués et doublons suffixés, niveaux hors
     bornes ou de critères disparus écartés, commentaires non textuels écartés ;
   - modèles personnels : mêmes règles ;
   - propriété (`fast-check`) : pour toute valeur générée au hasard, `assainir` ne lève
     jamais et le résultat respecte tous les invariants de la phase 2 (descripteurs
     alignés, niveaux de 1 à N, références vers des critères existants, identifiants
     uniques).
2. **Vert** : suite de `src/domain/assainissement.ts`.

```
feat(persistance): réparer le groupe et les modèles personnels
```

## Tâche 4 — Nom de fichier

1. **Rouge** : `tests/domain/nomFichier.test.ts` : « Travail de session — Hiver ! » →
   `grille-travail-de-session-hiver-2026-11-02.json` ; titre vide → `grille-…` ; titre de
   200 caractères coupé à 60 sans tiret final ; date du 2 novembre à 23 h 30 (heure
   locale) → `2026-11-02`.
2. **Vert** : `src/domain/nomFichier.ts`.

```
feat(persistance): construire des noms de fichiers sûrs, à la date locale
```

## Tâche 5 — Sauvegarde dans le navigateur

1. **Rouge** : `tests/data-access/stockage.test.ts`
   - chaque ligne du tableau `charger()` de la spec ;
   - copie de secours écrite **avant** l'écrasement, et une seule à la fois ;
   - `enregistrer` : succès, quota dépassé, `localStorage` qui lève → `ecriture-impossible` ;
   - `reinitialiser` supprime les clés `grille-evaluation:*` et rien d'autre.
2. **Vert** : `src/data-access/stockage.ts`.

```
feat(persistance): sauvegarder automatiquement dans le navigateur, avec copie de secours
```

## Tâche 6 — Plusieurs onglets

1. **Rouge** : `tests/data-access/onglets.test.ts` : un événement `storage` sur notre clé
   appelle le rappel ; une autre clé, non ; après arrêt, plus aucun appel.
2. **Vert** : `src/data-access/onglets.ts`.

```
feat(persistance): détecter les modifications faites dans un autre onglet
```

## Tâche 7 — Export et import JSON

1. **Rouge** : `tests/data-access/portabilite.test.ts` et `tests/data-access/fichiers.test.ts`
   - aller-retour export → import identique ; « grille seule » sans personnes ;
   - import « grille seule » : groupe courant gardé, évaluations nettoyées ;
   - refus : trop gros, JSON invalide, version inconnue ou future, pas un dossier ; le
     dossier courant n'est jamais modifié ;
   - fusion des modèles personnels, nom en double suffixé ;
   - fichier abîmé importé et réparé, avec bilan ;
   - `telecharger` crée puis libère le lien ; `lireFichier` lit un fichier, refuse au-delà
     de 5 Mo sans le lire.
2. **Vert** : `src/data-access/portabilite.ts`, `src/data-access/fichiers.ts`.

```
feat(persistance): exporter et importer le dossier en JSON, complet ou grille seule
```

## Tâche 8 — Documentation et revue de phase

1. README : état « phase 3 », section « Vos données » (où elles sont, copie de secours,
   export et import), organisation (`src/data-access/`).
2. CHANGELOG : ajouts de la phase.
3. `npm run ci` complet ; revue du diff de toute la phase ; vérifier chaque critère
   d'acceptation de la spec.

```
docs: décrire la persistance dans le README et le CHANGELOG
```

---

## Fin de phase

- `npm run ci` vert en local et sur GitHub.
- Ensuite : spec de la phase 4 (interface), soumise pour validation avant tout code.
