# Grille d'évaluation

Application web pour créer des grilles d'évaluation critériées, évaluer chaque personne
étudiante d'un groupe et exporter les résultats.

**État : phase 1 (fondations).** La coquille de l'application est en place ; les
fonctionnalités d'évaluation arrivent dans les phases suivantes (voir
`docs/superpowers/specs/`).

## Principes

- **Données locales.** Tout reste dans le navigateur (`localStorage`) ; rien n'est envoyé
  à un serveur. Site statique, sans backend.
- **Neutre.** Aucun nom d'établissement ni courriel dans les fichiers livrés, vérifié par
  `npm run check:neutralite`.
- **Sobre et accessible.** Couleurs centralisées dans `src/ui/tokens.css`, contrastes
  WCAG AA vérifiés par les tests, scan axe sans violation sur chaque page.

## Prérequis

- Node.js 20 ou plus récent (`.nvmrc`). La CI utilise Node.js 22.

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
| `npm run ci`               | lint → typecheck → check:neutralite → test → build → test:e2e                  |

`npm run ci` exécute exactement les mêmes étapes que la CI GitHub Actions
(`.github/workflows/ci.yml`) ; un test vérifie que les deux restent alignés.

## Organisation

```
app/            point d'entrée et table des routes (#/…)
src/ui/         interface : tokens, coquille (layout), pages
scripts/        outils (garde de neutralité)
tests/          tests Vitest (scripts, ui) et Playwright (e2e)
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
