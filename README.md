# Grille d'évaluation

Application web pour créer des grilles d'évaluation critériées, évaluer chaque personne
étudiante d'un groupe et exporter les résultats.

**État : phase 3 (persistance).** La coquille de l'application, le cœur métier (grille,
groupe, calcul des notes, 25 modèles) et la sauvegarde (navigateur, export et import JSON)
sont en place. Les écrans et les exports PDF, CSV et Word arrivent dans les phases
suivantes (voir `docs/superpowers/specs/`).

## Principes

- **Données locales.** Tout reste dans le navigateur (`localStorage`) ; rien n'est envoyé
  à un serveur. Site statique, sans backend.
- **Neutre.** Aucun nom d'établissement ni courriel dans les fichiers livrés, vérifié par
  `npm run check:neutralite`.
- **Sobre et accessible.** Couleurs centralisées dans `src/ui/tokens.css`, contrastes
  WCAG AA vérifiés par les tests, scan axe sans violation sur chaque page.
- **Fiable.** Le domaine est en TypeScript pur, couvert à 100 % par des tests écrits avant
  le code.

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
| `npm run test:coverage`    | Vitest avec couverture v8 (seuil 100 % sur `src/domain/**`)                    |
| `npm run test:e2e`         | Playwright (Chromium) sur le site construit, avec scan d'accessibilité axe     |
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
src/ui/         interface : tokens, coquille (layout), pages
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
