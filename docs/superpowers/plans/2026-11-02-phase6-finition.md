# Plan — Phase 6 : finition

Spec : `docs/superpowers/specs/2026-11-02-phase6-finition-design.md`

Règles pour toutes les tâches (comme aux phases 1 à 5) :

- TDD : le test est écrit et vu **en échec** avant le code qui le fait passer.
- À la fin de chaque tâche :
  - `npm run ci` **et** `TZ=UTC npm run ci`, puisque la CI tourne en UTC ;
  - revue du diff ;
  - README et CHANGELOG mis à jour si la tâche change ce qu'ils décrivent.
- Claude ne commite pas : il propose le message, Réda commite.
- Claude demande l'accord avant de passer à la tâche suivante.
- Aucune dépendance livrée aux utilisateurs n'est ajoutée pendant cette phase.
- Les textes publics (Transparence, Pour commencer) sont relus mot à mot par Réda avant
  le commit de leur tâche.

---

## Tâche 1 — Politique de sécurité (risque levé en premier)

La politique stricte pourrait gêner jsPDF, docx ou Vite : on la teste avant tout le reste.

1. **Rouge** :
   - `tests/scripts/vercel.test.mjs` : `vercel.json` existe ; il applique à toutes les
     routes `Content-Security-Policy` (`default-src 'self'`, `script-src 'self'`,
     `style-src 'self'`, `img-src 'self' data: blob:`, `font-src 'self'`,
     `connect-src 'self'`, `object-src 'none'`, `base-uri 'none'`,
     `form-action 'none'`, `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`,
     `Referrer-Policy: no-referrer`, `Permissions-Policy` fermée (caméra, micro,
     géolocalisation) ; aucune directive ne contient `unsafe-eval` ni `unsafe-inline` ;
   - `tests/e2e/securite.spec.ts` : chaque page du site construit est servie avec les
     en-têtes **lus dans `vercel.json`** (interception Playwright) ; aucune violation de
     politique dans la console (`securitypolicyviolation` écouté sur la page) ; les trois
     exports du groupe et les deux d'une personne se téléchargent ; import JSON et
     téléchargement de la copie de secours fonctionnent.
2. **Vert** : `vercel.json` (en-têtes seulement). Si une bibliothèque exige `eval` ou du
   style en ligne : on le documente, on cherche l'option qui l'évite ; à défaut, Réda
   tranche avant d'assouplir la politique.
3. **Docs** : README « Déploiement sur Vercel » (en-têtes et pourquoi) ; CHANGELOG.

```
feat(securite): servir le site avec une politique de sécurité stricte
```

## Tâche 2 — Points laissés ouverts en phase 4

1. **Rouge** :
   - `tests/ui/pages/evaluation.test.tsx` :
     - « Retirer le niveau » sous un critère évalué : le niveau disparaît, le
       commentaire reste, le résultat est annoncé ; absent d'un critère sans niveau ; le
       focus revient sur le premier choix du critère ;
     - en lecture seule : Précédente, Suivante et le choix de la personne fonctionnent ;
       niveaux, commentaires et effacement restent désactivés ;
   - `tests/textes/resultats.test.ts` et `tests/ui/pages/groupe.test.tsx` : poids
     différents de 100 % → la synthèse dit « Note impossible : les poids font 95,0 % »
     (même texte à l'écran, dans le PDF, le Word, d'où `tests/export/contenu.test.ts`).
2. **Vert** : action de domaine `retirerNiveau` (si elle n'existe pas déjà, avec son test
   dans `tests/domain/`), bouton dans `CritereEvalue` ; garde de lecture seule déplacée
   des boutons de navigation vers les seules modifications ; `phrasesSynthese`.
3. **Docs** : README « Tout effacer » (dossier vide écrit, pour que les autres onglets le
   voient) ; CHANGELOG.

```
feat(evaluation): retirer un niveau, naviguer en lecture seule, synthèse sans note claire
```

## Tâche 3 — Page Transparence complète

1. **Rouge** : `tests/ui/pages/transparence.test.tsx` :
   - un `h1` et cinq sections titrées : « Développement de cet outil », « Vos données
     restent dans votre navigateur », « Contenus », « À propos de l'IA utilisée »,
     « Signaler une erreur » ;
   - phrases clés : Claude Code ; logo généré avec Nano Banana 2 de Gemini ; clé
     `grille-evaluation:*` ; rien n'est envoyé à un serveur ; aucun témoin ni mesure
     d'audience ; Loi 25 ; « l'auteur conserve l'entière responsabilité du contenu
     final » ; Paulo Mendonça ; Noto Sans et SIL Open Font License 1.1 ;
   - lien « Vos données » vers `/donnees` ; lien des signalements vers
     `https://github.com/zaratechs/grille-evaluation/issues`, nouvel onglet annoncé ;
   - aucun `mailto:` ni adresse courriel dans la page (garde aussi dans
     `check-neutralite` si elle ne la couvre pas déjà).
2. **Vert** : `TransparencePage.tsx` en cartes sobres, sans icône ; le commentaire
   « Page provisoire » disparaît.
3. **Relecture** par Réda du texte exact, avant commit.

```
feat(transparence): compléter la page Transparence
```

## Tâche 4 — Encadré « Pour commencer »

1. **Rouge** : `tests/ui/pages/grille.test.tsx` :
   - dossier vide : région « Pour commencer » avec trois étapes, liens vers « Choisir un
     modèle » (ouvre la fenêtre), la vue Groupe et la vue Évaluation ;
   - disparaît dès qu'il y a un critère, et ne revient pas tant qu'il en reste un ;
   - en lecture seule : il reste affiché, ses actions de modification sont désactivées
     avec leur raison.
2. **Vert** : `src/ui/pages/grille/PourCommencer.tsx`.
3. **Relecture** du texte par Réda ; README « Utilisation » ; CHANGELOG.

```
feat(grille): guider la première utilisation avec « Pour commencer »
```

## Tâche 5 — Mobile

1. **Rouge** :
   - `tests/e2e/mobile.spec.ts`, à 320 et 390 px :
     - Évaluation : les niveaux sont en colonne ; chaque choix fait au moins 44 × 44 px ;
       la barre Précédente / Suivante reste visible en bas de l'écran pendant le
       défilement, sans masquer le dernier champ (marge basse égale à sa hauteur) ;
     - Groupe : les résultats s'affichent en cartes, sans tableau ni défilement
       horizontal ;
     - Grille : un critère se modifie de bout en bout (nom, poids, descripteurs) ;
     - à 1280 px : la barre n'est pas collée, le tableau de Groupe est là ;
   - `tests/ui` : la liste en cartes et le tableau ont le même contenu accessible.
2. **Vert** : classes Tailwind sous `max-[480px]` seulement ; aucune nouvelle couleur.
3. **Captures** à 390 px des trois vues, pour vérification par Réda.

```
feat(mobile): rendre Évaluation, Groupe et Grille confortables au téléphone
```

## Tâche 6 — Accessibilité, vérification finale

1. **Rouge** (`tests/e2e/accessibilite.spec.ts`, étendu) :
   - axe sur **toutes** les routes, dont Transparence et Introuvable, à 1280 px, 320 px
     et en zoom 200 % (fenêtre 640 px, facteur 2) ; aucun défilement horizontal ;
   - `forcedColors: 'active'` : boutons, champs, choix de niveau et contour de focus ont
     une bordure ou un contour visibles (styles calculés) ;
   - `reducedMotion: 'reduce'` : aucune durée de transition ou d'animation non nulle
     (la règle de `tailwind.css` existe déjà ; le test la garde) ;
   - ordre du focus au clavier, vue par vue : du lien d'évitement au pied de page, sans
     piège, dans l'ordre visuel.
2. **Vert** : corrections éventuelles.
3. **Vérification manuelle par Réda**, liste fournie : NVDA + Firefox sur le parcours
   complet (choisir un modèle, ajouter deux personnes, évaluer, exporter, importer) ;
   VoiceOver sur iPhone si possible. Chaque constat devient un test avant sa correction.

```
test(accessibilite): vérifier toutes les vues au zoom, en contraste élevé et au clavier
```

## Tâche 7 — Maintenance

1. **Rouge** :
   - `tests/scripts/dependabot.test.mjs` : `.github/dependabot.yml` couvre `npm` et
     `github-actions`, une fois par mois ; mineures et correctifs groupés ;
   - `tests/scripts/ci-workflow.test.mjs` (étendu) : `npm audit --omit=dev
     --audit-level=high` est dans `npm run ci` et dans la CI, au même rang ;
   - `tests/scripts/documentation.test.mjs` (étendu) : README a une section
     « Maintenance » qui cite la régénération de la police (plages Unicode exactes).
2. **Vert** : `dependabot.yml`, script `audit`, CI ; README « Maintenance » (mettre à
   jour une dépendance, régénérer la police réduite, publier une version).

```
chore(maintenance): mises à jour encadrées et audit des dépendances
```

## Tâche 8 — Version 1.0.0 et mise en ligne

1. **Rouge** : `tests/ui/layout/Footer.test.tsx` affiche « Version 1.0.0 » ;
   `tests/scripts/changelog.test.mjs` : une section `## [1.0.0] — 2026-…`, et
   « Non publié » vide au-dessus.
2. **Vert** : `package.json` en 1.0.0 ; CHANGELOG fermé ; README « Déploiement ».
3. **Revue de la phase** : critères d'acceptation de la spec, un par un.
4. **Réda** : commit, `git tag v1.0.0`, branchement du dépôt sur Vercel, passage du dépôt
   en public. Puis, sur l'adresse Vercel, la vérification de la spec (section 9) :
   chargement, enregistrement, un export de chaque format, Transparence, en-têtes
   présents (outil de développement du navigateur, onglet Réseau).

```
chore(version): publier la version 1.0.0
```

---

La CI est verte sur GitHub et le site est en ligne : la Grille d'évaluation est terminée.
Vient ensuite l'extraction de Scrum cours, sur le même modèle.
