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
- README, CHANGELOG et LICENSE (CC BY-NC-SA 4.0).

### Retiré

- La page d'accueil provisoire, remplacée par la vue Grille.
