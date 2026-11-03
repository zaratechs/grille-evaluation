# Phase 6 — Finition : design

Statut : **proposée, à valider par Réda** (section 12).

## 1. Contexte

Les phases 1 à 5 ont livré une application complète : grille, groupe, évaluation,
persistance réparée, exports PDF, Word, CSV et JSON. La feuille de route (spec de la
phase 1, section 1) réserve la phase 6 à la finition : **Transparence, accessibilité,
mobile, maintenance, déploiement**. Les specs des phases 4 et 5 y ont aussi renvoyé le
texte final de la page Transparence, l'aide et le polissage visuel.

La phase 6 n'ajoute aucune fonctionnalité nouvelle : elle rend l'outil prêt à être confié
à d'autres enseignants, et publie la version 1.0.0.

## 2. Objectif

À la fin de la phase :

- la page Transparence est complète et exacte ;
- une personne qui découvre l'outil sait par où commencer, sans documentation externe ;
- l'outil est utilisable au clavier, au lecteur d'écran, à 320 px, zoomé à 200 % et en
  mode contraste élevé de Windows ;
- les dépendances se mettent à jour de façon encadrée ;
- le site est déployé sur Vercel, avec des en-têtes de sécurité, en version 1.0.0.

## 3. Page Transparence

Même structure que les pages Transparence de la Trousse pédagogique et de MSI, sans
courriel affiché, avec des sections titrées (`h2`) dans des cartes sobres :

1. **Développement de cet outil** : outils d'IA utilisés pour concevoir et coder
   l'application (texte fourni par Réda, voir la question 1 de la section 12), dépôt
   GitHub, intégration continue à chaque changement (tests, accessibilité, neutralité).
2. **Vos données restent dans votre navigateur** : ce qui est gardé (`grille-evaluation:*`
   dans le `localStorage`), rien n'est envoyé à un serveur, aucun témoin ni mesure
   d'audience, les exports sont créés sur place. Ce qui efface les données (vider les
   données du site) et comment s'en prémunir (export JSON). Lien vers « Vos données ».
3. **Contenus** : modèles de grilles de Paulo Mendonça ; police Noto Sans des PDF et sa
   licence (déjà en place, phase 5).
4. **À propos de l'IA utilisée** : même formulation que les autres pages Transparence de
   Réda, si elle s'applique ici (question 1). « L'auteur conserve l'entière
   responsabilité du contenu final. »
5. **Signaler une erreur** : sans courriel. Proposition : un lien vers les signalements
   du dépôt GitHub, s'il est public (question 2) ; sinon, la section est omise.

## 4. Aide : « Pour commencer »

Proposition : **pas de page d'aide séparée**, mais un encadré « Pour commencer » sur la
vue Grille quand le dossier est vide (aucun critère, aucune personne), en trois étapes
liées aux vues : choisir un modèle ou créer les critères → ajouter les personnes
étudiantes → évaluer, puis exporter. L'encadré disparaît dès qu'il y a un critère. Une
section « Questions fréquentes » courte dans la page Transparence ? Non : la page reste
sur son sujet. Les textes d'aide déjà présents dans chaque vue restent la source
principale.

## 5. Accessibilité : vérification finale

Ce qui est déjà automatisé (phase 4) : axe sur 4 vues remplies, avec dialogue et avis,
et absence de défilement horizontal à 320 px. On ajoute :

- **axe sur toutes les routes**, y compris Transparence et Introuvable, en clair et à
  320 px ;
- **zoom 200 %** (fenêtre de 640 px à facteur 2) : aucun défilement horizontal, aucun
  contenu masqué ;
- **contraste élevé** (`forced-colors: active`, émulé par Playwright) : boutons, champs,
  boutons radio des niveaux et focus restent visibles ; test de capture des bordures et
  du contour de focus calculés ;
- **mouvement réduit** : aucune animation ni transition quand `prefers-reduced-motion`
  est demandé ;
- **ordre du focus** documenté par un test pour chaque vue (de l'en-tête au pied de page,
  sans piège) ;
- **vérification manuelle par Réda**, guidée par une liste courte dans le plan :
  parcours complet avec NVDA et Firefox, puis avec VoiceOver sur iPhone si possible. Les
  constats deviennent des tests avant d'être corrigés.

## 6. Mobile

- **Évaluation sur téléphone** : c'est la vue la plus utilisée en classe. Les niveaux
  passent en colonne sous 480 px, chaque choix garde une cible d'au moins 44 × 44 px
  (WCAG 2.5.5, au-delà du minimum 2.5.8), Précédente et Suivante restent atteignables
  sans défiler jusqu'en bas (barre collée en bas de l'écran, proposition à valider à
  l'œil).
- **Groupe** : le tableau des résultats devient une liste de cartes sous 480 px, plutôt
  qu'un tableau à faire défiler.
- **Grille** : l'édition des descripteurs reste possible à 320 px, un critère à la fois.
- Tests Playwright à 320 px et 390 px (iPhone courant) pour ces trois vues ; captures
  vérifiées par Réda.

## 7. Points laissés ouverts en phase 4

Signalés lors des tâches 8 à 10 de la phase 4, à trancher (question 4) :

| Point                                                                  | Proposition                                                       |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Pas de bouton pour retirer le niveau d'un seul critère dans Évaluation | Ajouter « Retirer le niveau » sous le critère, sans confirmation  |
| En lecture seule (autre onglet), la navigation Évaluation est bloquée  | La permettre : changer de personne ne modifie pas le dossier      |
| Poids ≠ 100 % : la synthèse dit « Aucune évaluation complète »         | Dire plutôt « Note impossible : les poids font 95,0 % »           |
| « Tout effacer » écrit un dossier vide plutôt que de supprimer la clé  | Garder ainsi (les autres onglets voient l'effacement), documenter |

## 8. Maintenance

- **Dependabot** (`.github/dependabot.yml`) : npm et GitHub Actions, une fois par mois,
  mises à jour mineures et correctifs groupés en une seule demande de fusion ; les
  versions majeures, une par une. La CI vérifie chaque demande ; Réda fusionne.
- **Audit** : `npm audit --omit=dev --audit-level=high` ajouté à `npm run ci` et à la CI,
  avec le test qui garde les deux identiques.
- **README** : section « Maintenance » : mettre à jour une dépendance, régénérer la
  police réduite (commande et plages Unicode exactes, l'outil restant hors du projet),
  publier une version.
- **Versions** : `package.json` passe à 1.0.0 ; le CHANGELOG ferme « Non publié » en
  « 1.0.0 — date » ; l'étiquette git `v1.0.0` est créée par Réda.

## 9. Déploiement

- **Vercel**, branché sur `main` par Réda (Vite détecté, `npm run build`, sortie `dist/`).
  Les aperçus des demandes de fusion restent activés.
- **`vercel.json`**, seulement pour les en-têtes de sécurité : `Content-Security-Policy`
  stricte (scripts et styles du site seulement, pas de `connect-src` externe, `img-src`
  `self data: blob:`, `frame-ancestors 'none'`), `X-Content-Type-Options`,
  `Referrer-Policy: no-referrer`, `Permissions-Policy` fermée. Risque à lever en premier
  dans le plan : jsPDF ou docx pourraient avoir besoin d'`eval` ou de `blob:` ; un test
  de bout en bout rejoue les trois exports sous la même politique avant de la livrer.
- Un test vérifie que `vercel.json` et la politique testée sont identiques.
- **Après déploiement**, vérification par Réda sur l'adresse Vercel : chargement,
  enregistrement, un export de chaque format, Transparence.

## 10. Exclus

- Nouvelles fonctionnalités (annuler/rétablir, impression directe, personnalisation des
  documents, comptes ou synchronisation entre ordinateurs).
- Traduction de l'interface en anglais.
- Mode sombre : à reconsidérer plus tard ; les jetons de `tokens.css` le permettraient.
- Nom de domaine personnalisé : à décider par Réda après la mise en ligne.

## 11. Critères d'acceptation

- `npm run ci` passe en local et en UTC ; la CI GitHub est verte.
- axe ne trouve aucune violation sur aucune route, à 1280 px, 320 px et en zoom 200 %.
- Contraste élevé et mouvement réduit vérifiés par des tests.
- Évaluation, Groupe et Grille sont utilisables à 320 px, vérifiés par tests et par Réda.
- La page Transparence est complète, validée mot à mot par Réda, sans courriel.
- Dependabot et l'audit sont en place ; README « Maintenance » écrit.
- Le site est en ligne sur Vercel avec ses en-têtes, et les trois exports y fonctionnent.
- Version 1.0.0 dans `package.json`, le CHANGELOG et le pied de page.

## 12. Questions pour Réda

1. **Transparence, développement et IA** : quels outils citer pour cette application
   (Claude Code ? les agents Ollama, comme dans la Trousse ?) ; le logo `valse-1.png`
   a-t-il été généré par une IA, et laquelle ? La phrase « conforme à la Loi 25 »
   s'applique-t-elle ici aussi ?
2. **Signaler une erreur** : le dépôt `zaratechs/grille-evaluation` sera-t-il public ?
   Si oui, lien vers ses signalements ; sinon, pas de section.
3. **Aide** : l'encadré « Pour commencer » sur la vue Grille vide vous convient-il, ou
   préférez-vous une page « Aide » dans la navigation ?
4. **Points de la section 7** : accepter les quatre propositions ?
5. **Mobile** : barre Précédente / Suivante collée en bas de l'écran dans Évaluation sur
   téléphone ?
6. **Sécurité** : d'accord pour la politique de sécurité stricte de la section 9, au prix
   d'un test de plus ?
