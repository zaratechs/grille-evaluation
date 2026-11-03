# Plan — Phase 5 : exports PDF, CSV et Word

Spec : `docs/superpowers/specs/2026-11-02-phase5-exports-design.md`

Règles pour toutes les tâches (comme aux phases 1 à 4) :

- TDD : le test est écrit et vu **en échec** avant le code qui le fait passer.
- À la fin de chaque tâche :
  - `npm run ci` **et** `TZ=UTC npm run ci`, puisque la CI tourne en UTC ;
  - revue du diff ;
  - README et CHANGELOG mis à jour si la tâche change ce qu'ils décrivent.
- Claude ne commite pas : il propose le message, Réda commite.
- Claude demande l'accord avant de passer à la tâche suivante.
- Les exports ne calculent rien eux-mêmes : notes et textes viennent du domaine et de
  `src/textes/`. Un même jeu d'essai sert aux tests du contenu, du CSV, du Word et du PDF
  (`tests/export/jeu.ts`), pour vérifier que les quatre disent la même chose.
- Une dépendance n'est ajoutée qu'à la tâche qui en a besoin, avec sa version exacte.

---

## Tâche 1 — Textes partagés

1. **Rouge** :
   - `tests/textes/resultats.test.ts` : `texteResultat` pour chacun des quatre statuts
     (dont « Pas encore évaluée » et « Aucun critère dans la grille »), `texteNote` ;
   - `tests/textes/accords.test.ts` : `accorder` au singulier et au pluriel,
     `phrasesPertes`, `pertesEtudiant` ;
   - `tests/textes/dates.test.ts` : `dateEnLettres` donne « 2 novembre 2026 », à l'heure
     locale (le soir au Québec reste le même jour), et « 1er novembre 2026 » ;
   - `tests/domain/architecture.test.ts` (ajout) : `src/textes` et `src/export` n'importent
     ni React ni `src/ui`, et n'utilisent ni le stockage ni `Blob`.
2. **Vert** :
   - `src/ui/resultats.ts` et `src/ui/accords.ts` déplacés (`git mv`) dans `src/textes/` ;
     les imports de l'interface suivent ; aucun changement de texte ;
   - `src/textes/dates.ts` ;
   - `vitest.config.ts` : projet `node` étendu à `tests/{textes,export}/`, seuil de 100 %
     sur `src/textes/**`.

```
refactor(textes): partager les textes du résultat entre l'écran et les exports
```

## Tâche 2 — Contenu des documents

1. **Rouge** : `tests/export/contenu.test.ts`, avec le jeu d'essai `tests/export/jeu.ts`
   (trois critères dont un de poids 0, des personnes complète, incomplète, pas encore
   évaluée, et un nom en « Nguyễn ») :
   - `rapportPersonne(dossier, id, date)` : titre, nom, date en lettres, texte du résultat
     identique à l'écran ; une ligne par critère avec poids (« non noté » pour 0), niveau
     (« 5 Excellent », ou « — »), descripteur du niveau choisi, commentaire ;
     commentaire général absent quand il est vide ;
   - poids différents de 100 % : « Note impossible : … », aucune note ;
   - `rapportGroupe(dossier, date)` : synthèse (complètes sur total, moyenne, médiane, ou
     « Aucune évaluation complète »), une ligne par personne dans l'ordre du groupe, puis
     le rapport de chaque personne ;
   - personne inconnue : erreur `etudiant-introuvable`.
2. **Vert** : `src/export/contenu.ts` (types `RapportPersonne`, `RapportGroupe`) ; seuil
   de 100 % sur ce fichier.

```
feat(exports): préparer le contenu des documents d'une personne et du groupe
```

## Tâche 3 — CSV du groupe

1. **Rouge** : `tests/export/csv.test.ts`
   - en-têtes : personne, statut, points, sur, pourcentage, appréciation, une colonne de
     niveau puis une de commentaire par critère, commentaire général ;
   - BOM UTF-8, séparateur `;`, fins de ligne CRLF, chaque cellule entre guillemets, les
     guillemets doublés ;
   - virgule décimale (« 16,80 », « 84,0 ») ; cellules vides pour une évaluation
     incomplète, sans zéro ;
   - retours à la ligne d'un commentaire gardés entre guillemets ;
   - une cellule commençant par `=`, `+`, `-`, `@`, une tabulation ou un retour chariot
     est précédée d'une apostrophe ; « -5 » dans un nom aussi, mais pas les nombres
     produits par l'application ;
   - mêmes notes que `contenu.test.ts` sur le jeu d'essai commun.
2. **Vert** : `src/export/csv.ts`, sans dépendance ; seuil de 100 %.

```
feat(exports): exporter le groupe en CSV pour Excel en français
```

## Tâche 4 — Word

1. **Rouge** : `tests/export/word.test.ts` ; le .docx produit est ouvert avec `jszip` et
   son XML est lu :
   - textes présents : titre, nom, date, résultat, critères, descripteurs, commentaires ;
   - page Lettre US (12 240 × 15 840 twips), marges de 2 cm ;
   - styles Titre 1 (titre de la grille) et Titre 2 (chaque personne), police Calibri ;
   - en-tête de tableau répété (`tblHeader`), lignes insécables (`cantSplit`) ;
   - export du groupe : synthèse, puis un saut de page avant chaque personne ;
   - pied de page « Grille d'évaluation · page X sur Y » (champs `PAGE` et `NUMPAGES`) ;
   - `tests/export/couleurs.test.ts` : chaque couleur RVB de `couleurs.ts` égale son
     jeton dans `tokens.css`.
2. **Vert** :
   - dépendance `docx` ; dépendance de test `jszip` ;
   - `src/export/couleurs.ts`, `src/export/word.ts` (rend un `RapportPersonne` ou un
     `RapportGroupe` en octets) ;
   - seuil de 90 % sur `src/export/word.ts`.

```
feat(exports): produire le document Word d'une personne et du groupe
```

## Tâche 5 — PDF

1. **Rouge** : `tests/export/pdf.test.ts` ; le PDF produit est relu avec `pdfjs-dist` :
   - format Lettre (612 × 792 points), une page par personne au moins, synthèse en
     première page pour le groupe ;
   - textes présents, dont « Nguyễn » et « Łukasz », date et résultat identiques au
     contenu ;
   - « page X sur Y » sur chaque page ;
   - aucun texte hors des marges ;
   - 40 personnes avec de longs commentaires : aucune ligne de critère coupée entre deux
     pages, en-tête du tableau répété ;
   - métadonnées : titre du document, langue `fr-CA`.
2. **Vert** :
   - dépendances `jspdf` et `jspdf-autotable` ; dépendance de test `pdfjs-dist` ;
   - police libre (licence SIL OFL), normal et gras, réduite au latin étendu, dans
     `src/export/polices/` avec sa licence ;
   - `src/export/pdf.ts` ; seuil de 90 %.

```
feat(exports): produire le PDF d'une personne et du groupe
```

## Tâche 6 — Boutons d'export

1. **Rouge** :
   - `tests/ui/pages/evaluation.test.tsx` (ajout) : « Exporter cette personne » en PDF et
     en Word ; nom du fichier par `nomFichier` (titre et personne), bon type ;
     « Préparation… » pendant la création, sans double clic possible ; un échec affiche
     un avis et ne change rien ;
   - `tests/ui/pages/groupe.test.tsx` (ajout) : « Exporter tout le groupe » en PDF, Word
     et CSV ; boutons désactivés avec leur raison (groupe vide, grille sans critère).
   Les modules de rendu sont remplacés par des imitations : ces tests vérifient les
   boutons, pas les fichiers.
2. **Vert** :
   - `src/ui/composants/BoutonsExport.tsx` : charge le rendu par `import()` au clic, puis
     passe les octets à `telecharger` de `data-access` ;
   - boutons ajoutés aux vues Évaluation et Groupe.

```
feat(interface): exporter une personne ou tout le groupe en PDF, Word et CSV
```

## Tâche 7 — Parcours, documentation et revue de phase

1. **Rouge** : `tests/e2e/exports.spec.ts`, sur le site construit :
   - chaque export se télécharge avec le bon nom ; le contenu commence par `%PDF`, est une
     archive .docx valide, ou commence par le BOM du CSV ;
   - au premier affichage, aucun fichier de jsPDF, de docx ni de la police n'est chargé ;
     ils le sont au premier clic ;
   - axe sans violation avec les boutons d'export et pendant « Préparation… ».
2. README (section « Exports », police et sa licence dans les crédits), page Transparence
   (mention de la police), CHANGELOG.
3. Revue du diff de toute la phase et vérification un à un des critères d'acceptation de
   la spec, dont l'ouverture réelle d'un CSV dans Excel et d'un .docx dans Word, faite
   par Réda (Claude fournit les fichiers d'essai).

```
docs: décrire les exports dans le README et le CHANGELOG
```

## Fin de phase

La CI est verte sur GitHub, puis vient la spec de la phase 6 (finition), proposée avant
tout code.
