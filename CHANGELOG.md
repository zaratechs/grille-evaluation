# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Commits conventionnels.

## [Non publié]

### Ajouté

- Outillage : Node.js 22.12 minimum, Vite, React 19, TypeScript strict
  (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Tailwind 4, ESLint (dont
  jsx-a11y) et Prettier.
- Garde de neutralité (`npm run check:neutralite`) : bloque les noms d'établissements et
  toute adresse courriel dans les fichiers livrés.
- Couleurs centralisées dans `src/ui/tokens.css`, avec contrastes WCAG AA calculés par
  les tests et interdiction des couleurs en dur ailleurs.
- Coquille de l'application : en-tête, lien « Aller au contenu », pied de page (auteur,
  crédit à Paulo Mendonça, licence CC BY-NC-SA 4.0, version, lien Transparence), pages
  Accueil et Transparence provisoires, page introuvable, message clair si une page plante.
- Tests de bout en bout Playwright sur le site construit, avec scan axe sans violation.
- CI GitHub Actions alignée sur `npm run ci` (alignement vérifié par un test).
- Domaine (`src/domain/`) : types de données et retours d'erreur à codes stables ; sa
  couverture de 100 % est bloquante dans `npm run ci` et la CI ; un test garantit qu'il
  n'importe ni React ni le navigateur.
- Poids des critères en dixièmes entiers (16,7 % = 167) : saisie avec virgule ou point,
  égalisation dont la somme fait toujours exactement 100 % (fin des `100.00000000000001`).
- Format français des poids, pourcentages et points (« 16,7 % », « 17,50 », « 1 000,00 »),
  avec espaces insécables, identique à l'écran et dans les exports ; valeurs négatives
  prises en charge (écart de pondération).
- Dossier et grille partagée par tout le groupe : titre, total de points (de 0,01 à 1000),
  niveaux (de 3 à 10, ajoutés et retirés par le haut), critères (ajouter, renommer, poids,
  descripteurs, déplacer, retirer en cascade dans le groupe).
- Retirer un niveau efface les évaluations à ce niveau au lieu de produire une note
  supérieure à 100 % (bug de l'outil d'origine).
- Groupe : ajouter, renommer, retirer, réordonner les personnes étudiantes ; un nom déjà
  présent est refusé, sans tenir compte des majuscules, des accents ni des espaces.
- Évaluations : niveau par critère (de 1 à N), commentaire par critère, commentaire
  général, réinitialisation d'une personne.
- Calcul des notes exact sur des entiers, arrondi une seule fois (demi vers le haut) :
  pourcentage au dixième, points au centième, appréciation globale. Statuts « complète »,
  « incomplète » (critère pondéré non évalué), « pondération invalide » (total ≠ 100 %) et
  « vide ». Synthèse du groupe : moyenne et médiane des notes complètes.
- Les 25 modèles de grilles de Paulo Mendonça (5 critères, descripteurs des 5 niveaux),
  repris tels quels de l'outil d'origine. Appliquer un modèle remplace niveaux et critères,
  garde titre, total et commentaires généraux.
- Modèles personnels : enregistrer la grille courante, renommer, supprimer (nom unique).
- Format de données versionné (version 1) et chaîne de migrations : une version absente
  ou plus récente que l'application est refusée, et les données reçues ne sont jamais
  modifiées.
- Accès aux données (`src/data-access/`) : seul dossier autorisé à toucher au stockage et
  aux fichiers du navigateur (vérifié par un test), couvert à 100 % ; identifiants uniques
  avec repli quand `crypto.randomUUID` n'existe pas.
- Réparation d'une sauvegarde abîmée, partie grille : titre, total de points, niveaux et
  critères (identifiants, noms, poids, descripteurs) sont corrigés champ par champ, chaque
  correction comptée dans un bilan ; une sauvegarde intacte ressort identique.
- Réparation, partie groupe et modèles personnels : personnes et modèles sans nom écartés,
  noms en double suffixés « (2) », évaluations hors bornes ou d'un critère disparu
  écartées. Vérifié sur des données tirées au hasard : le résultat respecte toujours les
  règles du domaine, et réparer deux fois ne change plus rien.
- Noms de fichiers sûrs pour les exports (`grille-travail-de-session-2026-11-02.json`) :
  sans accents ni caractères interdits, titre coupé à 60 caractères, date locale (pas UTC,
  qui donne le lendemain le soir).
- Sauvegarde dans le navigateur : chargement migré et réparé, avec un avertissement pour
  chaque cas (réparée, illisible, version future, stockage inaccessible) ; la sauvegarde
  écartée ou réparée est gardée en copie de secours avant toute nouvelle écriture ;
  écriture sans exception (quota, navigation privée) ; remise à zéro limitée aux clés de
  l'application.
- Détection des modifications du dossier faites dans un autre onglet, pour que l'onglet
  resté ouvert cesse d'enregistrer au lieu d'effacer ce travail.
- Export JSON du dossier complet ou de la grille seule (sans les personnes étudiantes,
  pour partager sans données personnelles). Import validé : migré, réparé avec bilan,
  refusé sans rien modifier s'il dépasse 5 Mo ou n'est pas un dossier ; il remplace la
  grille et le groupe et fusionne les modèles personnels (sans doublon au réimport).
- Messages en français pour chaque code d'erreur et chaque avertissement, et bilan de
  réparation mis en phrases. Composants de base accessibles : bouton, champ (erreur liée
  au champ), avis annoncé aux lecteurs d'écran, fenêtre de confirmation (focus sur
  « Annuler », Échap, retour du focus).
- État du dossier pour l'interface : chargé au démarrage, enregistré à chaque modification
  réussie ; un refus du domaine ne change rien et rend son code. Avis pour une sauvegarde
  réparée ou illisible, un stockage refusé, une écriture impossible (retiré dès que
  l'écriture repasse) et une modification dans un autre onglet, qui met l'onglet en
  lecture seule.
- Navigation entre quatre vues (Grille, Évaluation, Groupe, Données), encore vides, avec la
  vue courante marquée ; `/` mène à la Grille. Chaque vue a son titre de document, et le
  focus va sur son titre après une navigation. Les avis s'affichent sous l'en-tête, avec
  leurs actions (télécharger l'originale, exporter, aller à Vos données, recharger) ; en
  lecture seule, les champs de la vue sont désactivés.
- Vue Grille, première partie : titre et total de points (virgule acceptée), libellés des
  niveaux, ajout (jusqu'à 10) et retrait du dernier niveau (jusqu'à 3), avec la raison
  affichée quand un bouton est désactivé. Retirer un niveau déjà utilisé demande une
  confirmation qui dit combien d'évaluations et de descripteurs seront effacés. Un texte
  refusé reste dans son champ, avec son message, sans être enregistré.
- Vue Grille, deuxième partie : une carte par critère (nom, poids en pourcentage avec la
  virgule ou le point, un descripteur par niveau), monter, descendre et retirer. Le total
  des poids est annoncé en direct (« 100,0 % ✓ », « il manque 5,0 % »). « Égaliser les
  poids » répartit 100 % entre les critères (`egaliserCriteres`, ajoutée au domaine).
  Retirer un critère déjà utilisé demande une confirmation qui dit combien d'évaluations,
  de commentaires et de descripteurs seront effacés.
- Modèles : « Partir d'un modèle… » ouvre une fenêtre avec les 25 modèles fournis (crédités)
  et les modèles personnels, une recherche qui ignore accents et majuscules, et un aperçu
  (niveaux, critères, poids). Appliquer un modèle à une grille déjà remplie demande une
  confirmation qui dit ce qui sera remplacé et effacé. « Enregistrer comme modèle… »,
  renommer et supprimer (avec confirmation) un modèle personnel. Fenêtre modale
  générique ; Échap dans une confirmation ouverte par-dessus ne ferme qu'elle.
- Vue Groupe : ajouter des personnes à la suite (Entrée valide, le champ se vide et garde
  le focus ; nom vide ou déjà pris refusé avec son message), renommer dans une fenêtre,
  monter, descendre, retirer (avec confirmation si la personne a une évaluation ou un
  commentaire). Tableau avec l'état de chaque évaluation (note, incomplète, pas encore
  évaluée, note impossible si les poids ne font pas 100 %), lien « Évaluer », et
  synthèse : évaluations complètes, moyenne et médiane.
- Vue Évaluation : une personne à la fois (liste déroulante, « Précédente » et
  « Suivante », position « 2 / 24 »), gardée quand on change de vue. Un groupe de
  boutons radio par critère, avec ses descripteurs ; les flèches du clavier changent de
  niveau. Résultat en direct, annoncé poliment, avec un lien vers la Grille si les poids
  ne font pas 100 % ; un critère de poids 0 est « non noté ». Commentaire par critère,
  commentaire général, et « Effacer l'évaluation de cette personne » avec confirmation.
  Sans personne ou sans critère, la vue mène au Groupe ou à la Grille.
- Vue Vos données : « Exporter tout » et « Exporter la grille seule » (sans aucun nom de
  personne étudiante) ; import d'un fichier .json avec une confirmation qui résume ce qui
  change (grille seule ou dossier complet, modèles ajoutés), puis un avis avec le bilan de
  réparation ; un fichier refusé affiche son message et ne change rien. Téléchargement de
  la copie de secours quand il y en a une. « Tout effacer… » avec confirmation.
  `lireCopie()` ajoutée à l'accès aux données.
- Tests de bout en bout : un parcours entièrement au clavier (partir d'un modèle, ajuster
  la grille, ajouter deux personnes, en évaluer une, recharger, exporter, tout effacer et
  réimporter) ; scan axe des quatre vues remplies, avec une fenêtre ouverte et avec un
  avis ; aucune barre de défilement horizontale à 320 px de large.
- Seuil de couverture de 90 % sur l'interface (`src/ui/**`).
- README : section « Utilisation » (les quatre vues) et organisation de `src/ui/`.
- Exports, étape 1 : contenu des documents d'une personne et du groupe
  (`src/export/contenu.ts`), déjà en texte et identique à l'écran : en-tête, date en
  lettres, résultat ou statut (aucune note si l'évaluation est incomplète), une ligne par
  critère (poids, niveau, descripteur du niveau, commentaire), commentaire général,
  synthèse du groupe. La synthèse de la vue Groupe utilise les mêmes phrases.
- Exports, étape 2 : CSV du groupe pour Excel en français (`src/export/csv.ts`), une ligne
  par personne : statut, points, total, pourcentage, appréciation, niveau et commentaire de
  chaque critère, commentaire général. Séparateur « ; », virgule décimale, UTF-8 avec BOM,
  CRLF, cellules entre guillemets ; aucune note pour une évaluation incomplète ; une
  cellule qui commencerait une formule (=, +, -, @) est précédée d'une apostrophe.
- Exports, étape 3 : document Word d'une personne et du groupe (`src/export/word.ts`,
  dépendance `docx` 9.7.1). Lettre US, marges de 2 cm, Calibri 11, titre de la grille en
  Titre 1 et chaque personne en Titre 2, titres de section soulignés d'un filet, tableau
  des critères avec en-tête répété et lignes insécables, pied de page « page X sur Y ».
  Groupe : synthèse et tableau des résultats, puis une personne par page. Couleurs des
  documents tirées des jetons (`src/export/couleurs.ts`), vérifiées par un test.
- Exports, étape 4 : PDF d'une personne et du groupe (`src/export/pdf.ts`, dépendances
  `jspdf` 4.2.1 et `jspdf-autotable` 5.0.9). Même hiérarchie que le Word, Lettre US, marges
  de 2 cm, tableau des critères à en-tête répété sans ligne coupée entre deux pages, pied
  de page « page X sur Y », titre et langue fr-CA dans les métadonnées. Police Noto Sans
  embarquée (licence SIL OFL, `src/export/polices/`), réduite aux caractères latins
  (environ 120 Ko par graisse) : « Nguyễn » et « Łukasz » s'affichent correctement.
- Boutons d'export : « Exporter cette personne » (PDF, Word) dans la vue Évaluation,
  « Exporter tout le groupe » (PDF, Word, CSV) dans la vue Groupe, désactivés avec leur
  raison quand il n'y a rien à exporter. Les rendus sont chargés au premier clic ;
  « Préparation… » s'affiche pendant la création, sans double clic possible ; un échec
  affiche un avis. Fichiers nommés par titre et personne (`grille-<titre>-<personne>-<date>`).
- Exports, tests de bout en bout sur le site construit : chaque fichier se télécharge avec
  son nom et un contenu valide (PDF, Word, CSV avec BOM), aucun rendu n'est chargé avant
  le clic, aucune violation axe pendant « Préparation… ». README : section « Exports » et
  crédit de la police ; page Transparence : mention de la police et de sa licence.
- Build : le seuil d'avertissement de taille est relevé à 800 Ko, le rendu PDF (police
  comprise, environ 755 Ko) n'étant chargé qu'au premier export.
- En-têtes de sécurité dans `vercel.json` : politique de sécurité stricte (fichiers du
  site seulement, sans script en ligne ni `eval`, sans intégration dans un autre site),
  `nosniff`, aucun référent, caméra, micro et géolocalisation fermés. Testés sur toutes
  les vues, les exports PDF, Word et CSV, l'import JSON et la copie de secours.
- README, CHANGELOG et LICENSE (CC BY-NC-SA 4.0).

### Modifié

- Textes du résultat et accords déplacés de `src/ui/` vers `src/textes/`, pour que l'écran
  et les exports (phase 5) disent exactement la même chose ; ajout de la date en lettres
  (« 1er novembre 2026 »). Couverture de 100 % sur `src/textes/`.
- Icône de l'onglet : `valse-1.png` remplace `favicon.svg`.
- Évaluation : « Retirer le niveau » sous chaque critère évalué (le commentaire reste, le
  focus revient sur le premier niveau). En lecture seule, changer de personne reste
  possible ; seules les modifications sont désactivées (`Vue` reçoit des `outils` placés
  hors des champs désactivés).
- Synthèse du groupe (écran, PDF, Word) : « Note impossible : les poids font … » quand
  les poids ne font pas 100 %, au lieu de « Aucune évaluation complète ».
- Page Transparence complète, en quatre sections : développement avec l'assistance de
  Claude Code (codage, TDD, intégration continue, revue de code) et logo ; données gardées
  dans le navigateur ; contenus (modèles de Paulo Mendonça, police Noto Sans) ; lien vers
  les signalements GitHub. Aucun courriel.
- Tests des boutons d'export : ils attendent la fin de la création du fichier, et non
  plus seulement le clic (échec en CI : le rendu CSV, chargé par `import()`, n'était pas
  encore prêt sur une machine plus lente).

### Retiré

- La page d'accueil provisoire, remplacée par la vue Grille.
