# Plan — Phase 4 : interface

Spec : `docs/superpowers/specs/2026-11-02-phase4-interface-design.md`

Règles pour toutes les tâches (comme aux phases 1 à 3) :

- TDD : le test est écrit et vu **en échec** avant le code qui le fait passer.
- À la fin de chaque tâche :
  - `npm run ci` **et** `TZ=UTC npm run ci`, puisque la CI tourne en UTC ;
  - revue du diff ;
  - README et CHANGELOG mis à jour si la tâche change ce qu'ils décrivent.
- Claude ne commite pas : il propose le message, Réda commite.
- Claude demande l'accord avant de passer à la tâche suivante.
- Tests d'écran : Testing Library et `user-event`, avec des requêtes par rôle et par nom
  accessible (`getByRole('button', { name: 'Ajouter un critère' })`). C'est ce que voit
  un lecteur d'écran, et cela vérifie l'accessibilité en même temps.
- L'application utilise le routage par fragment (phase 1) : les adresses réelles sont
  `/#/grille`, `/#/evaluation`, `/#/groupe` et `/#/donnees`.

---

## Tâche 1 — Messages et composants de base

1. **Rouge** :
   - `tests/ui/messages.test.ts` : un message non vide pour chaque `CodeErreur` et chaque
     `Avertissement` ; un bilan de réparation mis en phrases (« 2 poids corrigés », au
     singulier et au pluriel ; un bilan vide ne donne aucune phrase) ;
   - `tests/ui/composants/Dialogue.test.tsx` : s'ouvre en fenêtre modale, focus sur
     « Annuler », Échap annule, le focus revient sur le bouton d'ouverture, « Confirmer »
     appelle l'action ;
   - `tests/ui/composants/Champ.test.tsx` : étiquette liée ; une erreur est liée par
     `aria-describedby` et met `aria-invalid` ;
   - `tests/ui/composants/Avis.test.tsx` : `role="alert"` ou `role="status"` selon
     l'importance ; les actions sont des boutons ; « Fermer » retire l'avis ;
   - `tests/domain/architecture.test.ts` (ajout) : `src/ui` ne mentionne ni
     `localStorage`, ni `Blob`, ni `FileReader`, ni `createObjectURL`.
2. **Vert** : `src/ui/messages.ts`, `src/ui/composants/` (`Bouton`, `Champ`, `Dialogue`,
   `Avis`).

```
feat(interface): poser les messages et les composants de base accessibles
```

## Tâche 2 — État du dossier

1. **Rouge** : `tests/ui/etat/DossierProvider.test.tsx`
   - le chargement donne le dossier et un avis pour chaque source et chaque
     avertissement de `charger()` ;
   - `modifier()` réussi : nouveau dossier, enregistré aussitôt ;
   - `modifier()` refusé : dossier inchangé, rien d'écrit, code d'erreur rendu ;
   - écriture impossible : avis affiché, puis retiré au prochain enregistrement réussi ;
   - autre onglet : avis « Recharger », lecture seule, plus aucune écriture ;
   - l'écoute des autres onglets s'arrête quand le composant disparaît.
2. **Vert** : `src/ui/etat/` (`DossierProvider.tsx`, `useDossier.ts`, `avis.ts`).

```
feat(interface): charger, garder et enregistrer le dossier, avec ses avis
```

## Tâche 3 — Navigation et vues vides

1. **Rouge** :
   - `tests/ui/routes.test.tsx` (mise à jour) : `/` redirige vers `/grille` ; les quatre
     vues ont chacune leur `<h1>` et leur titre de document ; le lien courant porte
     `aria-current="page"` ; changer de vue met le focus sur le `<h1>` ; les avis
     s'affichent sur toutes les vues ; en lecture seule, les champs sont désactivés ;
   - `tests/e2e/coquille.spec.ts` (mise à jour) : routes et titres des quatre vues.
2. **Vert** : `app/routes.tsx`, la navigation dans `AppShell`, quatre pages vides et le
   fournisseur d'état autour de l'application. La page d'accueil provisoire est retirée.

```
feat(interface): naviguer entre les vues Grille, Évaluation, Groupe et Données
```

## Tâche 4 — Grille : paramètres et niveaux

1. **Rouge** : `tests/ui/pages/grille.test.tsx` (partie 1)
   - titre et total de points : saisie appliquée ; une valeur refusée reste en brouillon,
     avec son message ;
   - niveaux : renommer, ajouter (désactivé à 10, avec la raison), retirer (désactivé à
     3) ; une confirmation donne le nombre d'évaluations effacées, et il n'y en a pas
     quand aucune ne le serait.
2. **Vert** : `src/ui/pages/grille/` (paramètres, niveaux).

```
feat(interface): régler le titre, le total de points et les niveaux de la grille
```

## Tâche 5 — Grille : critères, poids et descripteurs

1. **Rouge** : `tests/ui/pages/grille.test.tsx` (partie 2)
   - ajouter, renommer (nom vide refusé), monter et descendre (désactivés aux bouts),
     retirer (avec confirmation s'il y a des évaluations) ;
   - poids : « 16,7 » et « 16.7 » acceptés, texte refusé avec message ; total annoncé
     (« 100 % ✓ », « il manque 5 % ») ; « Égaliser » ;
   - descripteurs : un champ par niveau, étiqueté avec le libellé du niveau ;
   - vue vide : invitation à ajouter un critère ou à partir d'un modèle.
2. **Vert** : `src/ui/pages/grille/` (cartes de critère).

```
feat(interface): construire les critères, leurs poids et leurs descripteurs
```

## Tâche 6 — Modèles

1. **Rouge** : `tests/ui/pages/modeles.test.tsx`
   - la fenêtre liste les 25 modèles fournis et les modèles personnels ; la recherche
     filtre (accents ignorés) ; l'aperçu montre les critères et les poids ;
   - appliquer : directement si aucune évaluation n'existe, sinon après une confirmation
     qui dit combien seront effacées ;
   - enregistrer la grille comme modèle (nom refusé avec message), renommer, supprimer
     (avec confirmation).
2. **Vert** : `src/ui/pages/grille/Modeles.tsx`.

```
feat(interface): partir d'un modèle et gérer ses modèles personnels
```

## Tâche 7 — Groupe

1. **Rouge** : `tests/ui/pages/groupe.test.tsx`
   - ajouter (le champ se vide et garde le focus), nom refusé avec message lié, renommer,
     monter et descendre, retirer (avec confirmation s'il y a une évaluation ou un
     commentaire) ;
   - colonne « Évaluation » : un texte pour chaque statut ;
   - synthèse : nombre d'évaluations complètes, moyenne et médiane ; « aucune évaluation
     complète » quand il n'y en a pas ;
   - « Évaluer » ouvre l'évaluation de cette personne.
2. **Vert** : `src/ui/pages/groupe/`.

```
feat(interface): gérer le groupe et voir la synthèse des évaluations
```

## Tâche 8 — Évaluation

1. **Rouge** : `tests/ui/pages/evaluation.test.tsx`
   - un groupe de boutons radio par critère, avec tous les descripteurs ; les flèches du
     clavier changent de niveau ;
   - résultat en direct, avec `aria-live` : vide, incomplète, pondération invalide (avec
     un lien vers la Grille), complète ;
   - un critère de poids 0 est marqué « non noté » ;
   - personne choisie, « Précédente » et « Suivante » (désactivées aux bouts), position
     « 2 / 24 » ; la personne reste choisie après un passage par une autre vue ;
   - commentaires par critère et commentaire général ; « Effacer l'évaluation » avec
     confirmation ;
   - vues vides : sans personne, lien vers Groupe ; sans critère, lien vers Grille.
2. **Vert** : `src/ui/pages/evaluation/`.

```
feat(interface): évaluer chaque personne avec la note en direct
```

## Tâche 9 — Données

1. **Rouge** : `tests/ui/pages/donnees.test.tsx`
   - « Exporter tout » et « Exporter la grille seule » : nom du fichier donné par
     `nomFichier`, contenu complet, ou sans aucun nom de personne ;
   - import : confirmation qui résume ce qui change (grille seule ou dossier complet,
     modèles ajoutés), puis avis avec le bilan ; refus avec le message du code, sans rien
     changer ; « Annuler » ne change rien ;
   - copie de secours : le bouton n'apparaît que s'il y en a une, et télécharge le texte
     d'origine ;
   - « Tout effacer… » : confirmation, puis dossier vide.
2. **Vert** : `src/ui/pages/donnees/`. Si la vue a besoin de lire la copie de secours
   après le chargement, `lireCopie()` est ajoutée à `data-access` et testée à 100 %.

```
feat(interface): exporter, importer et effacer ses données
```

## Tâche 10 — Parcours, accessibilité, documentation et revue de phase

1. **Rouge** :
   - `tests/e2e/parcours.spec.ts` : au clavier seulement, partir d'un modèle, ajuster la
     grille, ajouter deux personnes, en évaluer une entièrement, recharger et tout
     retrouver ; puis exporter et réimporter ;
   - `tests/e2e/accessibilite.spec.ts` : scan axe sur les quatre vues, avec un dialogue
     ouvert et avec un avis affiché ; à 320 px de large, aucun défilement horizontal.
2. `vitest.config.ts` : seuil de 90 % sur `src/ui/**`. Les tests manquants sont ajoutés
   s'il le faut, sans tests artificiels.
3. README (état « phase 4 », les quatre vues, organisation de `src/ui/`) et CHANGELOG.
4. Revue du diff de toute la phase et vérification un à un des critères d'acceptation
   de la spec.

```
docs: décrire l'interface dans le README et le CHANGELOG
```

## Fin de phase

La CI est verte sur GitHub, puis vient la spec de la phase 5 (exports PDF, CSV et Word),
proposée avant tout code.
