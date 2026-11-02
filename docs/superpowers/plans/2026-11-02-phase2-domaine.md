# Plan — Phase 2 : domaine

Spec : `docs/superpowers/specs/2026-11-02-phase2-domaine-design.md`

Règles pour toutes les tâches (comme en phase 1) :

- TDD : le test est écrit et vu **en échec** avant le code qui le fait passer.
- À la fin de chaque tâche : `npm run ci`, revue du diff, README et CHANGELOG si la tâche
  change ce qu'ils décrivent.
- Claude ne commite pas : il propose le message, Réda commite.
- Claude demande l'accord avant de passer à la tâche suivante.
- Chaque test de fonction qui transforme un objet vérifie aussi que l'objet reçu n'a pas
  changé (`structuredClone` avant, `toEqual` après).

---

## Tâche 1 — Types, retours d'erreur et couverture bloquante

1. **Rouge** : `tests/domain/resultat.test.ts` (`ok()` et `erreur()` produisent les deux
   formes) et `tests/domain/architecture.test.ts` (aucun fichier de `src/domain/`
   n'importe `react`, `react-dom`, `src/ui` ni n'utilise `window`, `document` ou
   `localStorage`).
2. **Vert** : `src/domain/types.ts`, `src/domain/resultat.ts`.
3. `package.json` : `ci` appelle `test:coverage` au lieu de `test` ; même changement dans
   `.github/workflows/ci.yml` (le test d'alignement échoue d'abord si un seul des deux
   change). README : ligne `npm run ci` du tableau.
4. Ajouter `fast-check` en dépendance de développement.

```
feat(domaine): poser les types, les retours d'erreur et rendre la couverture bloquante
```

## Tâche 2 — Poids

1. **Rouge** : `tests/domain/poids.test.ts`
   - `lirePoids` : « 25 », « 16,7 », « 16.7 », « 0 », « 100 » acceptés ; « -1 »,
     « 100,1 », « 12,34 », « abc », « » refusés (`poids-invalide`) ;
   - `egaliserPoids(6)` = `[167, 167, 167, 167, 166, 166]` ; `egaliserPoids(0)` = `[]` ;
   - propriété : pour tout `n` de 1 à 50, la somme vaut 1000 et l'écart entre deux poids
     est au plus 1 ;
   - `totalPoids`, `ponderationValide`.
2. **Vert** : `src/domain/poids.ts`.

```
feat(domaine): gérer les poids en dixièmes entiers
```

## Tâche 3 — Format français

1. **Rouge** : `tests/domain/format.test.ts` : `formaterPoids(167)` → « 16,7 % »,
   `formaterPourcentage(875)` → « 87,5 % », `formaterPoints(1750)` → « 17,50 »,
   espace insécable (` `) avant « % », `0` → « 0,0 % ».
2. **Vert** : `src/domain/format.ts` (sans `Intl` pour un résultat identique sur tous les
   navigateurs).

```
feat(domaine): formater poids, pourcentages et points en français
```

## Tâche 4 — Dossier, niveaux et critères

1. **Rouge** : `tests/domain/niveaux.test.ts` et `tests/domain/criteres.test.ts`
   - `dossierVide()` : version 1, 5 niveaux par défaut, aucun critère, groupe vide ;
   - ajouter un niveau jusqu'à 10 puis refus (`niveaux-maximum`) ; retirer jusqu'à 3 puis
     refus (`niveaux-minimum`) ; descripteurs toujours alignés ;
   - **bug d'origine** : une personne évaluée au niveau 5, on retire le niveau 5 → son
     évaluation est effacée, le compte renvoyé vaut 1, aucune note ne dépasse 100 % ;
   - critères : ajouter, renommer (vide refusé), changer le poids, modifier un descripteur
     (niveau hors bornes refusé), déplacer (premier vers le haut et dernier vers le bas :
     sans effet), retirer en cascade dans le groupe, identifiant inconnu refusé.
2. **Vert** : `src/domain/dossier.ts`, `src/domain/niveaux.ts`, `src/domain/criteres.ts`.

```
feat(domaine): éditer les niveaux et les critères d'une grille partagée
```

## Tâche 5 — Groupe et évaluations

1. **Rouge** : `tests/domain/groupe.test.ts`
   - noms : espaces retirés, vide et plus de 100 caractères refusés, doublon refusé selon
     la décision 4 de la spec (« Élise  Roy » = « elise roy ») ;
   - ajouter, renommer, retirer, déplacer ; identifiant inconnu refusé ;
   - évaluer : niveau 1 à N accepté, 0 et N+1 refusés, critère inconnu refusé, effacer un
     niveau ; commentaires ; réinitialiser une personne sans toucher aux autres.
2. **Vert** : `src/domain/groupe.ts`.

```
feat(domaine): gérer le groupe et les évaluations par personne
```

## Tâche 6 — Calcul des notes

1. **Rouge** : `tests/domain/notes.test.ts`
   - les 4 statuts : `vide`, `ponderation-invalide` (avec l'écart), `incomplete` (avec la
     progression), `complete` ;
   - un critère de poids 0 non évalué n'empêche pas la note complète ;
   - exactitude : 6 critères égalisés tous au maximum → 100,0 % et 20,00 / 20 ;
   - niveau 1 partout sur 5 niveaux → 20,0 % ;
   - arrondi demi vers le haut : un cas qui tombe sur 0,05 et un sur 0,005 point ;
   - appréciation : niveau le plus proche, égalité vers le haut ;
   - synthèse : groupe vide, moyenne, médiane paire et impaire, personnes incomplètes
     exclues et comptées ;
   - propriété : pour toute grille valide et toute évaluation complète, la note est entre
     0 et 100 %.
2. **Vert** : `src/domain/notes.ts`.

```
feat(domaine): calculer les notes de façon exacte, avec statut et synthèse du groupe
```

## Tâche 7 — Les 25 modèles

1. **Rouge** : `tests/data/modeles.test.ts` (25 modèles, noms et ordre de l'outil
   d'origine, identifiants uniques, 5 critères, 5 descripteurs non vides, poids de 200,
   mention de Paulo Mendonça et de la licence, aucun nom d'établissement via `scan()`)
   et `tests/domain/modeles.test.ts` (appliquer un modèle fourni et un modèle personnel :
   niveaux et critères remplacés, titre et total gardés, niveaux et commentaires par
   critère effacés dans le groupe, commentaires généraux gardés ; enregistrer, renommer,
   supprimer un modèle personnel ; nom vide refusé).
2. **Vert** : `src/data/modeles.ts`, converti une fois depuis `grilleModeles.js` de la
   Trousse (lecture seule ; le script de conversion reste hors du dépôt), puis
   `src/domain/modeles.ts`.

```
feat(domaine): reprendre les 25 modèles de Paulo Mendonça et gérer les modèles personnels
```

## Tâche 8 — Format versionné et migrations

1. **Rouge** : `tests/domain/migrations.test.ts`
   - un dossier version 1 ressort identique ;
   - avec une liste de migrations de test (`1 → 2 → 3`), elles s'appliquent dans l'ordre ;
   - version absente, non entière ou future refusée (`version-inconnue`,
     `version-future`), entrée inchangée.
2. **Vert** : `src/domain/migrations.ts` (`VERSION_COURANTE`, `migrer`, la liste des
   migrations injectable pour les tests), `src/domain/index.ts`.

```
feat(domaine): versionner le format de données et chaîner les migrations
```

## Tâche 9 — Documentation et revue de phase

1. README : état « phase 2 (domaine) », organisation (`src/domain/`, `src/data/`), règle
   des poids en dixièmes en une phrase.
2. CHANGELOG : ajouts de la phase dans « Non publié ».
3. `npm run ci` complet ; revue du diff de toute la phase ; vérifier chaque critère
   d'acceptation de la spec.

```
docs: décrire le domaine dans le README et le CHANGELOG
```

---

## Fin de phase

- `npm run ci` vert en local et sur GitHub, couverture de 100 % sur `src/domain/`.
- Ensuite : spec de la phase 3 (persistance), soumise pour validation avant tout code.
