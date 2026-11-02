# Grille d'évaluation — Phase 4 : interface

- Date : 2026-11-02
- Statut : validée le 2026-11-02
- Auteur : Réda Hamza, Développeur technopédagogique
- Phase précédente : `2026-11-02-phase3-persistance-design.md`

## 1. Objectif

Rendre l'application utilisable à l'écran, en branchant le domaine (phase 2) et la
persistance (phase 3) :

- **construire la grille** : titre, total de points, niveaux, critères, poids, descripteurs,
  modèles ;
- **évaluer** chaque personne étudiante, critère par critère, avec la note en direct ;
- **suivre le groupe** : liste des personnes, état de chaque évaluation, synthèse ;
- **gérer ses données** : avis de sauvegarde, export et import JSON, remise à zéro.

Toute la logique reste dans le domaine : l'interface n'appelle que ses fonctions et
affiche leurs résultats. Les exports PDF, CSV et Word arrivent en phase 5.

## 2. Ce que fait l'outil d'origine

L'outil de la Trousse tient sur **une seule longue page** : paramètres, groupe, libellés
des niveaux, total des poids, résultats, tableau des critères, commentaire général,
exports.

| Outil d'origine                                                         | Problème                                                                     | Dans la nouvelle application                                                     |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Construction et évaluation mêlées dans un même tableau                  | On modifie la grille par erreur en évaluant ; la page est très longue         | Quatre vues séparées : Grille, Évaluation, Groupe, Données (décision 1)          |
| Descripteur affiché seulement pour le niveau choisi                     | On choisit un niveau sans voir ce que disent les autres                       | Tous les descripteurs sont visibles au moment de choisir (décision 4)           |
| Liste déroulante pour le niveau                                         | Deux gestes par critère ; peu lisible                                         | Boutons radio, un geste, utilisables au clavier                                  |
| Total des poids différent de 100 % : simple texte rouge                 | Une note est quand même affichée                                              | Aucune note tant que les poids ne font pas 100 % (règle du domaine), avec l'écart |
| Fenêtre de confirmation maison                                          | Focus non géré, Échap inopérant                                              | `<dialog>` natif : focus piégé, Échap, retour du focus                           |
| Tableau de 5 colonnes                                                   | Illisible sur téléphone                                                       | Une carte par critère, lisible dès 320 px de large                               |

## 3. Les vues

Un en-tête commun porte la navigation, avec le lien de la page courante marqué
`aria-current="page"`. `/` redirige vers `/grille`. Les pages Transparence et
« Page introuvable » restent celles de la phase 1.

| Adresse        | Vue        | Contenu                                                                   |
| -------------- | ---------- | ------------------------------------------------------------------------- |
| `/grille`      | Grille     | Paramètres, niveaux, critères et descripteurs, modèles                    |
| `/evaluation`  | Évaluation | Une personne à la fois : niveau et commentaire par critère, note en direct |
| `/groupe`      | Groupe     | Ajouter, renommer, ordonner, retirer ; état de chaque évaluation ; synthèse |
| `/donnees`     | Données    | Export complet ou grille seule, import, copie de secours, remise à zéro   |

Chaque vue a un `<h1>` et un titre de document propre (« Grille — Grille d'évaluation »).
Changer de vue place le focus sur le `<h1>`, pour qu'un lecteur d'écran annonce la page.

### Grille (`/grille`)

```
┌─ Grille d'évaluation ──────────── Grille · Évaluation · Groupe · Données ┐
│ Grille                                                                   │
│                                                                          │
│ Titre            [Travail de session — Hiver                         ]   │
│ Total de points  [ 20 ]                [Partir d'un modèle…] [Enregistrer│
│                                                          comme modèle…]  │
│ ── Niveaux (4) ─────────────────────────────────────────────────────────│
│  1 [Insuffisant   ] ✕   2 [Passable ] ✕   3 [Bien ] ✕   4 [Très bien] ✕  │
│  [+ Ajouter un niveau]                                                   │
│ ── Critères ─────────────────── Total des poids : 100 % ✓ [Égaliser]   │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ 1. [Qualité de l'argumentation           ]  Poids [ 40 ] %           │ │
│ │    [↑] [↓] [Retirer]                                                 │ │
│ │    1 Insuffisant  [Arguments absents ou hors sujet.               ]  │ │
│ │    2 Passable     [Arguments présents mais peu développés.        ]  │ │
│ │    3 Bien         [                                               ]  │ │
│ │    4 Très bien    [                                               ]  │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ ┌ 2. … ────────────────────────────────────────────────────────────────┐ │
│ [+ Ajouter un critère]                                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Poids** saisis en pourcentage, au dixième (« 16,7 » ou « 16.7 »), lus par `lirePoids`.
  Le total s'affiche en direct : « 100 % ✓ », ou « 95 % — il manque 5 % » en
  avertissement. Le statut est dit par du texte, jamais par la seule couleur.
- **Niveaux** : de 3 à 10. Le bouton « Ajouter » est désactivé à 10, et « ✕ » à 3, avec
  la raison affichée en texte.
- **Partir d'un modèle…** ouvre une fenêtre avec les 25 modèles fournis et les modèles
  personnels. Elle offre un champ de recherche, un aperçu (critères et poids) et l'action
  « Appliquer ». Les modèles personnels s'y renomment et s'y suppriment.

### Évaluation (`/evaluation`)

```
┌─ Évaluation ─────────────────────────────────────────────────────────────┐
│ Personne  [Élise Roy           ▾]   [← Précédente] [Suivante →]  2 / 24  │
│ ┌─ Résultat ───────────────────────────────────────────────────────────┐ │
│ │ 15,25 / 20 points · 76,3 % · Bien                                    │ │
│ │ (ou : « Incomplète : 3 critères sur 5 évalués »)                     │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ ┌ Qualité de l'argumentation · 40 % ───────────────────────────────────┐ │
│ │ ( ) 1 Insuffisant — Arguments absents ou hors sujet.                 │ │
│ │ ( ) 2 Passable — Arguments présents mais peu développés.             │ │
│ │ (•) 3 Bien                                                           │ │
│ │ ( ) 4 Très bien                                                      │ │
│ │ Commentaire [                                                     ]  │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ …                                                                        │
│ Commentaire général [                                               ]   │
│ [Effacer l'évaluation de cette personne]                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

- Chaque critère forme un groupe de boutons radio (`fieldset` et `legend`) : les flèches
  du clavier changent de niveau, comme partout ailleurs.
- Le résultat se met à jour à chaque choix et est annoncé poliment (`aria-live="polite"`).
  Les quatre statuts du domaine ont chacun leur texte :
  - vide : « Pas encore évaluée » ;
  - incomplète : « 3 critères sur 5 évalués » ;
  - pondération invalide : « Note impossible : les poids font 95 % », avec un lien vers
    la Grille ;
  - complète : la note, en points et en pourcentage, et l'appréciation.
- Un critère de poids 0 est affiché comme « non noté », et n'empêche pas d'obtenir une
  note complète.
- Sans personne, ou sans critère, la vue dit quoi faire et mène à la vue qui manque.
- La personne choisie reste choisie quand on change de vue, le temps de la visite.

### Groupe (`/groupe`)

```
┌─ Groupe ─────────────────────────────────────────────────────────────────┐
│ [Nom de la personne étudiante            ] [Ajouter]                     │
│                                                                          │
│ Synthèse : 18 évaluations complètes sur 24 · moyenne 74,1 % · médiane    │
│ 75,0 %                                                                   │
│ ┌──────────────┬──────────────────────┬────────────────────────────────┐ │
│ │ Nom          │ Évaluation           │                                │ │
│ ├──────────────┼──────────────────────┼────────────────────────────────┤ │
│ │ Élise Roy    │ 15,25 / 20 · 76,3 %  │ [Évaluer] [Renommer] [↑][↓] [✕]│ │
│ │ Noé Tremblay │ Incomplète (3 sur 5) │ [Évaluer] [Renommer] [↑][↓] [✕]│ │
│ └──────────────┴──────────────────────┴────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

- C'est un vrai tableau (`<table>`, `<th scope>`). Sur téléphone, il se replie en une
  carte par personne.
- « Évaluer » ouvre `/evaluation` sur cette personne.
- Le nom est validé par le domaine : un nom vide, trop long ou déjà pris (accents et
  majuscules ignorés) affiche le message sous le champ, relié à celui-ci par
  `aria-describedby`.

### Données (`/donnees`)

```
┌─ Vos données ────────────────────────────────────────────────────────────┐
│ Tout reste dans ce navigateur. Exportez régulièrement.                   │
│ ── Exporter ────────────────────────────────────────────────────────────│
│ [Exporter tout (grille, groupe, modèles)]  [Exporter la grille seule]    │
│   La grille seule ne contient aucun nom de personne étudiante.           │
│ ── Importer ────────────────────────────────────────────────────────────│
│ [Choisir un fichier .json…]                                              │
│ ── Copie de secours ── (seulement s'il y en a une) ─────────────────────│
│ [Télécharger la sauvegarde d'origine]                                    │
│ ── Remise à zéro ───────────────────────────────────────────────────────│
│ [Tout effacer…]                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

- Les fichiers sont nommés par `nomFichier` (phase 3), par exemple
  `grille-travail-de-session-2026-11-02.json`.
- **Import** : le fichier est lu, puis une confirmation résume ce qui va changer : la
  grille et le groupe seront remplacés, et N modèles personnels ajoutés. Pour un fichier
  « grille seule », la confirmation précise que le groupe est gardé et ses évaluations
  effacées. Après l'import, un avis donne le bilan, y compris s'il y a eu réparation. Un
  refus affiche le message du code (trop gros, pas un dossier, version future…) et ne
  change rien.

## 4. État de l'application

```
src/ui/
  etat/
    DossierProvider.tsx  charge au démarrage, garde le dossier, enregistre à chaque changement
    useDossier.ts        lire le dossier ; modifier(operation) ; état de la sauvegarde
    avis.ts              avis à afficher (réparée, illisible, écriture impossible, autre onglet…)
  messages.ts            un texte en français pour chaque CodeErreur et chaque Avertissement
  composants/            Bouton, Champ, Dialogue, Avis, ChoixNiveau… (sobres, accessibles)
  pages/grille/ evaluation/ groupe/ donnees/
```

- **Une seule source de vérité** : un contexte React qui garde le `Dossier`. Toute
  modification passe par `modifier(d => operationDuDomaine(d, …))` :
  - si l'opération réussit, le nouveau dossier est gardé et enregistré aussitôt
    (décision 2 de la phase 3) ;
  - si elle échoue, le dossier ne change pas, et le code d'erreur revient au composant,
    qui affiche son message.
- **Saisie libre** (titre, noms, descripteurs, commentaires) : chaque frappe est
  appliquée. Une valeur refusée, par exemple un nom de critère vide ou un poids illisible,
  reste dans le champ en brouillon, avec son message. Le dossier garde alors la dernière
  valeur valide.
- **Identifiants** : `nouvelId()` de `data-access`, passé au domaine.
- **`messages.ts`** est typé `Record<CodeErreur, string>` : TypeScript refuse un code
  sans message, et un test le vérifie aussi.
- L'architecture reste vérifiée par test : `src/ui` passe par `src/data-access` pour le
  navigateur, et ne touche jamais `localStorage` directement.

## 5. Avis

Un avis est une bande sous l'en-tête, visible sur toutes les vues. Les avis importants
sont annoncés par `role="alert"`, les autres par `role="status"`.

| Situation                              | Avis                                                                                                   | Actions                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Sauvegarde réparée                     | « Votre sauvegarde était abîmée ; elle a été réparée. » et le bilan, en phrases (« 2 poids corrigés ») | Télécharger l'originale · Fermer                |
| Sauvegarde illisible ou version future | « Votre sauvegarde n'a pas pu être lue. Une copie est gardée. »                                        | Télécharger l'originale · Fermer                |
| Stockage inaccessible                  | « Ce navigateur refuse l'enregistrement : vos modifications seront perdues en fermant la page. »       | Aller à Données (exporter)                      |
| Écriture impossible (quota)            | « La dernière modification n'a pas pu être enregistrée. Exportez votre dossier. »                      | Exporter maintenant                             |
| Autre onglet                           | « Ce dossier a été modifié dans un autre onglet. Cet onglet n'enregistre plus. »                       | Recharger                                       |

- **Autre onglet** : la page passe en lecture seule (champs désactivés) jusqu'au
  rechargement, pour qu'aucune saisie ne soit perdue sans le savoir (décision 5).
- Un avis d'écriture impossible disparaît dès qu'un enregistrement réussit.

## 6. Confirmations

Le `<dialog>` natif est utilisé, avec `showModal()` : le focus est piégé et Échap annule.
Le focus revient ensuite sur le bouton qui a ouvert la fenêtre. L'action par défaut est
toujours « Annuler ». Une confirmation est demandée **seulement quand des données saisies
seraient perdues** (décision 3) :

- retirer un critère ou un niveau qui a des évaluations, en disant combien seront
  effacées (« 12 évaluations seront effacées ») ;
- appliquer un modèle alors que le groupe a des évaluations ;
- retirer une personne qui a une évaluation ou un commentaire ;
- effacer l'évaluation d'une personne ;
- importer un fichier ;
- tout effacer.

Ajouter, renommer, déplacer, ou retirer un élément encore vide se fait sans confirmation.

## 7. Accessibilité et affichage

- Clavier : tout est utilisable au clavier, dans un ordre logique, avec un contour de focus
  visible (le jeton `--color-focus`). Le lien d'évitement de la phase 1 est gardé.
- Formulaires : chaque champ a une étiquette visible. Les erreurs sont liées au champ par
  `aria-describedby` et `aria-invalid`.
- Annonces : le résultat d'une évaluation et le total des poids utilisent `aria-live`.
- Contrastes WCAG AA, avec uniquement les jetons de `tokens.css` (règle de la phase 1).
- Mise en page : de 320 px à grand écran, sans défilement horizontal, avec des cibles de
  24 px au moins.
- Impression : hors du périmètre. Les exports PDF de la phase 5 s'en chargent.

## 8. Tests (écrits avant le code)

| Fichier                                   | Vérifie                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `tests/ui/etat/DossierProvider.test.tsx`  | Chargement (chaque source et chaque avertissement) ; enregistrement à chaque modification ; échec du domaine sans changement ; écriture impossible ; autre onglet → lecture seule |
| `tests/ui/messages.test.ts`               | Un message non vide pour chaque code et chaque avertissement ; bilan mis en phrases                  |
| `tests/ui/pages/grille.test.tsx`          | Titre, total, niveaux (limites 3 et 10), critères, poids (virgule, total, égaliser), descripteurs, déplacer, retirer avec confirmation |
| `tests/ui/pages/modeles.test.tsx`         | Recherche, aperçu, appliquer (avec confirmation si évaluations), enregistrer, renommer, supprimer      |
| `tests/ui/pages/evaluation.test.tsx`      | Choix au clavier ; note pour chaque statut ; précédente et suivante ; commentaires ; vues vides       |
| `tests/ui/pages/groupe.test.tsx`          | Ajouter, nom refusé avec message lié, renommer, ordonner, retirer ; synthèse ; lien « Évaluer »      |
| `tests/ui/pages/donnees.test.tsx`         | Export complet et grille seule (nom du fichier, contenu) ; import accepté, réparé, refusé ; copie de secours ; tout effacer |
| `tests/ui/composants/*.test.tsx`          | Dialogue (focus, Échap, retour du focus), Avis, Champ (erreur liée)                                  |
| `tests/e2e/parcours.spec.ts`              | Parcours complet au clavier : modèle → grille → 2 personnes → évaluer → recharger → tout est là ; export puis import |
| `tests/e2e/accessibilite.spec.ts`         | Scan axe sans violation sur chaque vue, avec un dialogue ouvert et avec chaque avis ; à 320 px, aucun défilement horizontal |
| `tests/domain/architecture.test.ts` (ajout) | `src/ui` n'utilise ni `localStorage` ni `Blob` ; il passe par `data-access`                       |

Couverture : un seuil de **90 % sur `src/ui/**`** est ajouté (décision 6). Le domaine et
`data-access` restent à 100 %.

## 9. Changements d'outillage

- `vitest.config.ts` : seuil de 90 % sur `src/ui/**`.
- `@testing-library/user-event`, déjà installée, sert à simuler le clavier comme une vraie
  personne.
- Aucune nouvelle dépendance livrée aux utilisateurs : pas de bibliothèque d'icônes ni de
  composants (décision 7).

## 10. Exclus (phases suivantes)

- Exports PDF, CSV et Word, et impression (phase 5).
- Texte de la page Transparence sur les données gardées dans le navigateur, polissage
  visuel, page d'aide (phase 6).
- Annuler et rétablir : non prévus pour l'instant. Les confirmations de la section 6
  protègent les actions qui effacent des données.

## 11. Critères d'acceptation

- `npm run ci` passe, en UTC comme en local ; la couverture reste à 100 % sur le domaine et
  `data-access`, et atteint 90 % au moins sur `src/ui`.
- Le parcours de bout en bout se fait entièrement au clavier, et le dossier survit à un
  rechargement.
- Le scan axe ne trouve aucune violation sur chacune des quatre vues, ni avec un dialogue
  ouvert, ni avec un avis affiché.
- Aucune action qui efface des données saisies ne se fait sans confirmation.
- Aucune note n'est affichée quand les poids ne font pas 100 %.
- README (vues, utilisation) et CHANGELOG à jour.

## 12. Décisions

Validées par Réda le 2026-11-02.

1. **Quatre vues séparées** (Grille, Évaluation, Groupe, Données), chacune à sa propre
   adresse, au lieu d'une seule longue page comme dans la Trousse. Les adresses gardent le
   bouton Précédent du navigateur et permettent un lien direct.
2. **Une carte par critère** dans la Grille, avec les descripteurs en liste, plutôt qu'un
   tableau critères × niveaux : la carte reste lisible avec 10 niveaux et sur téléphone.
3. **Confirmer seulement quand des données saisies seraient perdues**, sans
   annuler/rétablir dans cette phase.
4. **Évaluation par boutons radio montrant tous les descripteurs**, une personne à la
   fois, avec Précédente et Suivante.
5. **Autre onglet : lecture seule** jusqu'au rechargement, et non un simple avis.
6. **Seuil de couverture de 90 % sur `src/ui`** : les écrans sont testés, sans exiger 100 %
   (certaines branches d'affichage n'apportent rien à tester).
7. **Aucune bibliothèque d'icônes ni de composants** : des boutons en texte et des
   éléments HTML natifs (`dialog`, `fieldset`, `table`), conformes à l'identité sobre.
