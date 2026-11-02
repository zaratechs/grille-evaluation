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
- README, CHANGELOG et LICENSE (CC BY-NC-SA 4.0).
