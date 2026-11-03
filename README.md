# Grille d'évaluation

Application web pour créer des grilles d'évaluation critériées, évaluer chaque personne
étudiante d'un groupe et exporter les résultats.

**État : phase 4 (interface).** L'application est utilisable : construire une grille,
gérer un groupe, évaluer chaque personne et sauvegarder ses données. Les exports PDF, CSV
et Word arrivent à la phase 5 (voir `docs/superpowers/specs/`).

## Principes

- **Données locales.** Tout reste dans le navigateur (`localStorage`) ; rien n'est envoyé
  à un serveur. Site statique, sans backend.
- **Neutre.** Aucun nom d'établissement ni courriel dans les fichiers livrés, vérifié par
  `npm run check:neutralite`.
- **Sobre et accessible.** Couleurs centralisées dans `src/ui/tokens.css`, contrastes
  WCAG AA vérifiés par les tests, scan axe sans violation sur chaque page.
- **Fiable.** Le domaine est en TypeScript pur, couvert à 100 % par des tests écrits avant
  le code.

## Utilisation

L'application a quatre vues, chacune à sa propre adresse (`#/grille`, `#/evaluation`,
`#/groupe`, `#/donnees`).

- **Grille.** Titre et total de points ; partir d'un des 25 modèles fournis ou d'un de vos
  modèles, et enregistrer la grille comme modèle. Niveaux (de 3 à 10), puis une carte par
  critère : nom, poids, un descripteur par niveau. Le total des poids est affiché ;
  « Égaliser les poids » le ramène à 100 %.
- **Groupe.** Ajouter des personnes à la suite (Entrée valide et garde le curseur dans le
  champ), renommer, réordonner, retirer. Le tableau donne l'état de chaque évaluation, et
  une synthèse donne la moyenne et la médiane des évaluations complètes.
- **Évaluation.** Une personne à la fois, avec « Précédente » et « Suivante ». Un groupe
  de boutons radio par critère, avec tous les descripteurs (les flèches du clavier
  changent de niveau), un commentaire par critère et un commentaire général. La note se
  met à jour en direct ; aucune note n'est donnée si les poids ne font pas 100 %.
- **Vos données.** Exporter tout ou la grille seule (sans aucun nom), importer un fichier
  .json, télécharger la copie de secours, tout effacer.

Toute action qui effacerait des données saisies demande d'abord une confirmation. Tout se
fait au clavier, et chaque vue s'affiche sans défilement horizontal dès 320 px de large.

## Le domaine en bref

- **Une seule grille pour tout le groupe** : chaque personne étudiante n'a que ses niveaux
  et ses commentaires.
- **Poids en dixièmes entiers** : 16,7 % est stocké `167`, 100 % vaut `1000`. Aucune erreur
  d'arrondi ; « égaliser » donne toujours exactement 100 %.
- **Note exacte** : Σ (niveau × poids) / (nombre de niveaux × Σ poids), calculée sur des
  entiers et arrondie une seule fois, demi vers le haut (pourcentage au dixième, points au
  centième).
- **Pas de note trompeuse** : une évaluation est « incomplète » tant qu'un critère pondéré
  n'est pas évalué, et aucune note n'est donnée si les poids ne totalisent pas 100 %.
- **Opérations sûres** : chaque fonction renvoie un nouveau dossier sans modifier celui
  reçu ; un refus renvoie un code d'erreur stable (`nom-en-double`, `poids-invalide`…).
- **Format versionné** : chaque sauvegarde porte un numéro de version ; `migrer()` met à
  jour les données anciennes et refuse celles d'une version future.

## Vos données

- **Où.** Le dossier (grille, groupe, modèles personnels) est enregistré dans le navigateur,
  à chaque modification, sous la clé `grille-evaluation:dossier`. Rien n'est envoyé à un
  serveur. Vider les données du site dans le navigateur efface le dossier : pensez à
  l'exporter.
- **Sauvegarde abîmée.** Au chargement, elle est réparée champ par champ, et un bilan dit
  ce qui a été corrigé. L'originale est toujours gardée en copie de secours
  (`grille-evaluation:copie-de-secours`) avant toute nouvelle écriture, et peut être
  téléchargée.
- **Autre onglet.** Si le dossier est modifié dans un autre onglet, celui-ci cesse
  d'enregistrer jusqu'au rechargement, pour ne pas effacer ce travail.
- **Export et import JSON**, dans la vue « Vos données ». L'export complet sert à changer d'ordinateur ou à garder
  plusieurs groupes ; l'export « grille seule » partage une grille sans aucune donnée
  personnelle. Un import remplace la grille et le groupe, et ajoute ses modèles personnels
  aux vôtres. Tout fichier importé est vérifié et réparé ; un fichier de plus de 5 Mo, ou
  qui n'est pas un dossier, est refusé sans rien modifier.
- **Remise à zéro.** « Tout effacer… », après confirmation, ne supprime que les clés
  `grille-evaluation:*`.

## Prérequis

- Node.js 22.12 ou plus récent (`.nvmrc` : 22, la version utilisée par la CI).

## Installation

```
npm install
npx playwright install chromium   # une seule fois, pour les tests de bout en bout
```

## Scripts

| Commande                   | Rôle                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`              | Serveur de développement Vite                                                  |
| `npm run build`            | `tsc --noEmit` puis `vite build` (site statique dans `dist/`)                  |
| `npm run preview`          | Sert le `dist/` construit                                                      |
| `npm run typecheck`        | Vérification des types TypeScript (`tsc --noEmit`)                             |
| `npm run lint`             | ESLint puis Prettier `--check`                                                 |
| `npm run format`           | Formate tout le dépôt avec Prettier                                            |
| `npm run check:neutralite` | Échoue si un nom d'établissement ou un courriel apparaît dans un fichier livré |
| `npm run test`             | Vitest : projets `node` (scripts, domaine) et `jsdom` (interface)              |
| `npm run test:watch`       | Vitest en mode surveillance                                                    |
| `npm run test:coverage`    | Vitest avec couverture v8 (100 % domaine et data-access, 90 % interface)       |
| `npm run test:e2e`         | Playwright sur le site construit : parcours au clavier, axe, largeur 320 px    |
| `npm run ci`               | lint → typecheck → check:neutralite → test:coverage → build → test:e2e         |

`npm run ci` exécute exactement les mêmes étapes que la CI GitHub Actions
(`.github/workflows/ci.yml`) ; un test vérifie que les deux restent alignés.

## Organisation

```
app/            point d'entrée et table des routes (#/…)
src/domain/     cœur métier en TypeScript pur (sans React ni navigateur), API dans index.ts
src/data/       les 25 modèles de grilles de Paulo Mendonça
src/data-access/  seul accès au navigateur : sauvegarde, autres onglets, export et import
                  JSON, fichiers, identifiants
src/ui/         interface React
  tokens.css      couleurs et formes (seul fichier avec des couleurs en dur)
  etat/           le dossier (chargé, enregistré à chaque modification), avis, personne choisie
  composants/     Bouton, Champ, Dialogue, Fenetre, Avis… (HTML natif, sans bibliothèque)
  layout/         coquille : en-tête, navigation, bande d'avis, cadre de chaque vue
  pages/          grille/, groupe/, evaluation/, donnees/, transparence/, introuvable/
  messages.ts     un texte en français pour chaque code d'erreur du domaine
scripts/        outils (garde de neutralité)
tests/          tests Vitest (domain, data, scripts, data-access, ui) et Playwright (e2e)
docs/superpowers/  specs et plans de chaque phase
```

## Déploiement sur Vercel

1. Dans Vercel, importer le dépôt `zaratechs/grille-evaluation`.
2. Préréglage : **Vite** (détecté automatiquement). Commande de build : `npm run build`.
   Dossier de sortie : `dist`.
3. Chaque push sur `main` redéploie le site.

Le routage par hash (`#/transparence`) évite toute règle de réécriture côté serveur : le
`dist/` peut aussi être servi par n'importe quel hébergement statique.

## Licence et crédits

Licence **CC BY-NC-SA 4.0** (voir `LICENSE`).

- Outil d'origine et modèles de grilles : **Paulo Mendonça**, Conseiller pédagogique TIC.
- Conception et développement de cette application : **Réda Hamza**, Développeur
  technopédagogique.
