# Plan — Phase 1 : fondations

Spec : `docs/superpowers/specs/2026-11-02-phase1-fondations-design.md`

Règles pour toutes les tâches :

- TDD : le test est écrit et vu **en échec** avant le code qui le fait passer.
- À la fin de chaque tâche : chaîne disponible à ce stade, puis revue du diff, puis README
  et CHANGELOG si la tâche change ce qu'ils décrivent.
- Claude ne commite pas : il propose le message, Réda commite.
- Claude demande l'accord avant de passer à la tâche suivante.

---

## Tâche 1 — Squelette et outillage

Pas de test possible avant l'outillage de test lui-même : cette tâche ne contient que de la
configuration, sans code applicatif.

Fichiers : `package.json`, `package-lock.json`, `.nvmrc`, `.gitattributes`, `.gitignore`,
`.prettierrc.json`, `.prettierignore`, `tsconfig.json`, `vite.config.ts`,
`vitest.config.ts`, `eslint.config.js`, `app/vite-env.d.ts`.

Étapes :

1. Créer `package.json` (nom `grille-evaluation`, version `0.1.0`, `type: module`,
   `engines.node >= 20`) avec les scripts : `dev`, `build` (`tsc --noEmit && vite build`),
   `preview`, `typecheck`, `lint` (`eslint . && prettier --check .`), `format`, `test`,
   `test:watch`, `test:coverage`, `test:e2e`, `check:neutralite`, `ci`.
2. `npm install` des dépendances (versions de « Soins infirmiers »).
3. Configurer TypeScript strict, Vite (React, Tailwind, `__APP_VERSION__`), Vitest
   (projets `node` et `jsdom`), ESLint (TS, hooks, refresh, jsx-a11y, prettier).
4. Vérifier : `npm run typecheck` et `npm run lint` passent sur le dépôt vide ;
   `npm run test` signale qu'aucun test n'existe.

Commit proposé :

```
chore: initialiser l'outillage (Vite, React, TypeScript strict, Vitest, ESLint, Prettier)
```

## Tâche 2 — Garde de neutralité

1. **Rouge** : `tests/scripts/check-neutralite.test.mjs`
   - `scan()` détecte chaque nom d'établissement interdit ;
   - `scan()` détecte une adresse courriel ;
   - `scan()` laisse passer « Paulo Mendonça » et un texte propre ;
   - `scanRepo()` ignore `node_modules`, `docs/superpowers` et le script lui-même.
2. **Vert** : `scripts/check-neutralite.mjs` (exporte `FORBIDDEN`, `scan`, `scanRepo`).
3. Vérifier : `npm run test` et `npm run check:neutralite`.

Commit proposé :

```
feat: ajouter la garde de neutralité (établissements et courriels interdits)
```

## Tâche 3 — Tokens et styles de base

1. `src/ui/tokens.css` : palette sobre (un bleu de marque, neutres, statuts), contrastes AA
   notés en commentaire ; `src/ui/tailwind.css` qui importe Tailwind et les tokens.
2. Règle ESLint ou test qui interdit un hex hors de `tokens.css` dans `src/ui/`.
   - **Rouge** : `tests/ui/tokens.test.ts` échoue sur un fichier de test contenant un hex.
   - **Vert** : le test parcourt `src/ui/**/*.{ts,tsx,css}` hors `tokens.css`.

Commit proposé :

```
feat: définir les tokens de couleur et interdire les hex hors tokens.css
```

## Tâche 4 — Pied de page

1. **Rouge** : `tests/ui/layout/Footer.test.tsx` (voir spec § 6).
2. **Vert** : `src/ui/layout/Footer.tsx`.

Commit proposé :

```
feat: ajouter le pied de page (auteur, crédit Paulo Mendonça, licence CC BY-NC-SA 4.0)
```

## Tâche 5 — Coquille, routes et gestion d'erreur

1. **Rouge** : `AppShell.test.tsx`, `RouteBoundary.test.tsx`, `routes.test.tsx`.
2. **Vert** : `src/ui/layout/AppShell.tsx`, `RouteBoundary.tsx`, `index.ts` ;
   pages provisoires `src/ui/pages/accueil/AccueilPage.tsx`,
   `src/ui/pages/transparence/TransparencePage.tsx`,
   `src/ui/pages/introuvable/IntrouvablePage.tsx` ; `app/routes.tsx`, `app/main.tsx`,
   `index.html` (`lang="fr"`).
3. Vérifier : `npm run dev`, navigation manuelle, `npm run build`.

Commit proposé :

```
feat: créer la coquille de l'application (en-tête, routes, page introuvable, erreurs)
```

## Tâche 6 — Test de bout en bout et accessibilité

1. **Rouge** : `tests/e2e/coquille.spec.ts` (chargement, aller-retour Transparence, scan
   axe sans violation).
2. **Vert** : `playwright.config.ts` (build + preview automatiques) ; corriger ce que axe
   signale.

Commit proposé :

```
test: ajouter le parcours de bout en bout et le scan d'accessibilité axe
```

## Tâche 7 — Intégration continue

1. `.github/workflows/ci.yml` : Node 22, `npm ci`, lint, typecheck, neutralité, tests,
   build, Playwright (avec cache des navigateurs), rapport en cas d'échec.
2. Vérifier : `npm run ci` complet en local. Le passage sur GitHub se vérifie après le
   push de Réda.

Commit proposé :

```
ci: exécuter la chaîne complète sur GitHub Actions
```

## Tâche 8 — Documentation et licence

1. `README.md` : but, principes (local, neutre, sobre), prérequis, installation, tableau
   des scripts, déploiement Vercel (import du dépôt, préréglage Vite, sortie `dist`),
   licence et crédits.
2. `CHANGELOG.md` : section « Non publié » listant les ajouts de la phase.
3. `LICENSE` : avis CC BY-NC-SA 4.0, auteurs (Paulo Mendonça pour les modèles, Réda Hamza
   pour l'application), lien vers le texte légal officiel.
4. Vérifier : `npm run ci` (la neutralité couvre aussi ces trois fichiers).
5. Revue finale du diff de toute la phase.

Commit proposé :

```
docs: rédiger le README, le CHANGELOG et la licence CC BY-NC-SA 4.0
```

---

## Fin de phase

- `npm run ci` vert en local ; workflow vert sur GitHub après le push.
- Branchement Vercel fait par Réda (import du dépôt `zaratechs/grille-evaluation`).
- Ensuite : spec de la phase 2 (domaine), soumise pour validation avant tout code.
