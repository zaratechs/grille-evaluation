# Grille d'évaluation — Phase 1 : fondations

- Date : 2026-11-02
- Statut : validée le 2026-11-02
- Auteur : Réda Hamza, Développeur technopédagogique

## 1. Vue d'ensemble du projet

Application web autonome pour créer des grilles d'évaluation critériées, noter chaque
personne étudiante d'un groupe et exporter les résultats. Elle est extraite de la page
« Grille d'évaluation » de la Trousse pédagogique et reconstruite de zéro, avec les mêmes
conventions que le projet « Soins infirmiers ».

Principes :

- **Frontend seul, site statique.** Données dans le `localStorage` du navigateur ; rien
  n'est envoyé à un serveur. Sauvegarde et import en JSON.
- **Générique et neutre.** Aucun nom d'établissement ni courriel dans les fichiers livrés.
- **Sobre.** Typographie et espacement plutôt que décoration ; pas d'icônes décoratives ni
  colorées. Une icône n'est admise que si elle porte une fonction (fermer, déplier), en
  monochrome.
- **Fiable.** TDD, chaîne qualité complète, couverture 100 % sur le domaine.

### Licence et attribution

L'outil d'origine et ses 25 modèles de grilles sont l'œuvre de **Paulo Mendonça**,
Conseiller pédagogique TIC, sous licence **CC BY-NC-SA 4.0**. L'application reprend ces
modèles ; elle est donc publiée sous la **même licence** (clause « partage dans les mêmes
conditions »).

- Paulo Mendonça est cité dans le pied de page, la page Transparence et le README, **sans
  nommer son établissement** (règle de neutralité).
- Pas de mention « Tous droits réservés ».
- Fichier `LICENSE` à la racine : avis CC BY-NC-SA 4.0, auteurs, lien vers le texte légal.

### Feuille de route

| Phase | Contenu                                                                     |
| ----- | --------------------------------------------------------------------------- |
| 1     | Fondations : outillage, CI, neutralité, coquille vide déployable (ce doc)   |
| 2     | Domaine : poids en dixièmes entiers, niveaux, calcul des notes, migrations  |
| 3     | Persistance : `localStorage`, réparation d'une sauvegarde abîmée, JSON      |
| 4     | Interface : édition de la grille, personnes étudiantes, modèles             |
| 5     | Exports : PDF, CSV, Word (.docx), par personne et pour tout le groupe       |
| 6     | Finition : Transparence, accessibilité, mobile, maintenance, déploiement    |

Chaque phase suit le même cycle : spec → plan → tests rouges → code → chaîne complète →
revue du diff → README et CHANGELOG. Réda fait les commits ; Claude fournit les messages.

## 2. Objectif de la phase 1

Obtenir un dépôt où `npm run ci` passe en local et sur GitHub Actions, avec une coquille
d'application vide mais propre, prête à être branchée sur Vercel. Aucune fonctionnalité
métier.

## 3. Périmètre

### Inclus

1. **Outillage** (versions alignées sur « Soins infirmiers »)
   - Vite 8, React 19, TypeScript 5 strict (`strict`, `noUncheckedIndexedAccess`,
     `exactOptionalPropertyTypes`).
   - Tailwind 4 via `@tailwindcss/vite` ; toutes les couleurs dans `src/ui/tokens.css`
     (aucun hex ailleurs dans `src/ui/`).
   - `react-router` 8 en `createHashRouter` (URL `#/…`, aucun réglage serveur requis).
   - ESLint 9 (typescript-eslint, react-hooks, react-refresh, jsx-a11y) + Prettier 3
     (`singleQuote`, `semi`, `trailingComma: all`, `printWidth: 100`).
   - Vitest 4, deux projets : `node` (domaine, scripts) et `jsdom` (UI) ; Testing Library.
   - Playwright (Chromium) + `@axe-core/playwright`.
   - `.nvmrc` (20), `engines.node >= 20`, `.gitattributes` (fins de ligne LF),
     `.gitignore`.
   - Version de l'application injectée au build (`__APP_VERSION__` depuis `package.json`).

2. **Garde de neutralité** : `scripts/check-neutralite.mjs`, repris de « Soins
   infirmiers » et étendu.
   - Périmètre : `src`, `app`, `scripts`, `tests`, `.github`, `README.md`,
     `CHANGELOG.md`, `LICENSE`, `index.html`. Exclus : `node_modules`, `docs/superpowers`
     (les specs nomment ce qu'elles interdisent), le script lui-même.
   - Interdits : noms d'établissements connus (liste dans le script) et **toute adresse
     courriel** (motif `x@y.z`).
   - Le nom de Paulo Mendonça est autorisé ; son établissement ne l'est pas.

3. **Intégration continue** : `.github/workflows/ci.yml` sur `push` vers `main` et sur les
   pull requests. Étapes : `npm ci` → lint → typecheck → neutralité → tests → build →
   e2e. Rapport Playwright téléversé en cas d'échec.

4. **Coquille d'application**
   - `AppShell` : en-tête avec le nom de l'application, zone de contenu, pied de page.
   - Pied de page : « © 2026-2027 — Réda Hamza, Développeur technopédagogique —
     Modèles de grilles : Paulo Mendonça — Licence CC BY-NC-SA 4.0 — Version x.y.z ·
     Transparence ». Le lien de licence ouvre le texte officiel dans un nouvel onglet.
   - Routes : `/` (accueil provisoire : titre et une phrase), `/transparence` (provisoire,
     contenu final en phase 6), `*` (page « introuvable » avec lien vers l'accueil).
   - `RouteBoundary` : une erreur de rendu affiche un message clair au lieu d'une page
     blanche.
   - `index.html` : `lang="fr"`, titre « Grille d'évaluation », favicon sobre.

5. **Documentation** : `README.md` (but, prérequis, scripts, déploiement Vercel,
   licence, crédits), `CHANGELOG.md` (Keep a Changelog, section « Non publié »),
   `LICENSE`.

### Exclus (phases suivantes)

Tout le métier : grilles, notes, personnes étudiantes, stockage, exports, contenu final
de Transparence, mode maintenance, menu mobile.

## 4. Choix et justifications

| Choix                        | Raison                                                                      |
| ---------------------------- | --------------------------------------------------------------------------- |
| Hash router                  | Site 100 % statique ; un rechargement sur `#/transparence` fonctionne partout |
| TypeScript strict            | Attrape à la compilation les bugs du type `onCancel` reçu comme texte       |
| Neutralité étendue aux courriels | Consigne : aucun courriel affiché                                       |
| Tokens de couleur centralisés | Visuel sobre et cohérent ; le contraste AA se vérifie à un seul endroit    |
| Pas de `vercel.json`         | Vercel détecte Vite ; à ajouter seulement si un besoin apparaît             |

## 5. Référence pour la phase 5 (exports Word)

Le style des fichiers Word de revisionProgramme (`generatePlanCadres.js`) est la
référence : Calibri, titres de section en majuscules soulignés d'un filet bleu, en-têtes
de tableau sur fond plein répétés à chaque page, lignes « Libellé : valeur », marges
généreuses. Améliorations prévues : vrais styles Word (Titre 1, Titre 2) pour le volet de
navigation, numéros de page, lignes de tableau insécables, une section par personne
étudiante. Le détail sera fixé dans la spec de la phase 5.

## 6. Tests (écrits avant le code)

| Fichier                                | Vérifie                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `tests/scripts/check-neutralite.test.mjs` | Chaque motif interdit est détecté (dont un courriel) ; Paulo Mendonça passe ; un fichier propre ne remonte rien ; les dossiers exclus sont ignorés |
| `tests/ui/layout/Footer.test.tsx`      | Nom, intitulé « Développeur technopédagogique », crédit à Paulo Mendonça, lien de licence (`target`, `rel`), version, lien Transparence ; aucun « Tous droits réservés » |
| `tests/ui/layout/AppShell.test.tsx`    | En-tête, contenu enfant, pied de page présents ; repères `banner`, `main`, `contentinfo` |
| `tests/ui/layout/RouteBoundary.test.tsx` | Une erreur de rendu affiche le message et un lien vers l'accueil      |
| `tests/ui/routes.test.tsx`             | `/`, `/transparence` et une route inconnue rendent la bonne page        |
| `tests/e2e/coquille.spec.ts`           | Le build se charge, la navigation vers Transparence et retour fonctionne, aucune violation axe |

## 7. Critères d'acceptation

- `npm run ci` passe en local, sans avertissement ESLint.
- Le workflow GitHub Actions passe sur `main`.
- `npm run check:neutralite` échoue si on ajoute un courriel ou un nom d'établissement
  dans `src/`.
- `npm run build` produit un `dist/` statique qui s'ouvre avec `npm run preview`.
- README et CHANGELOG décrivent l'état réel du dépôt.

## 8. Décisions

Validées par Réda le 2026-11-02 :

1. **Format de papier des exports (PDF et Word, phase 5)** : Lettre US (8,5 × 11 po),
   l'usage au Québec.
2. **Nom affiché de l'application** : « Grille d'évaluation ».
