# Vérification manuelle de l'accessibilité

Les tests automatiques (axe, clavier, contraste élevé, mouvement réduit, 320 px) ne
remplacent pas une écoute réelle. Ce parcours prend environ 20 minutes. Chaque constat
devient un test avant d'être corrigé.

## Préparation

- **NVDA** (gratuit) et **Firefox**, sur Windows. Mode navigation : flèches ; mode
  formulaire : Entrée sur un champ, Échap pour en sortir.
- Partir d'un dossier vide : « Vos données » → « Tout effacer… ».
- Noter pour chaque étape : ce qui est annoncé, ce qui manque, ce qui surprend.

## Parcours avec NVDA et Firefox

1. **Arrivée.** Recharger la page. Première touche Tab : « Aller au contenu » est
   annoncé ; Entrée place la lecture sur le titre « Grille ».
2. **Pour commencer.** L'encadré est lu comme une région avec une liste de 3 éléments.
   Touche R (régions) et H (titres) : la structure est claire.
3. **Choisir un modèle.** « Partir d'un modèle… » : la fenêtre est annoncée avec son titre ;
   la recherche filtre la liste (à observer : le nombre de modèles trouvés n'est pas
   annoncé aujourd'hui ; est-ce gênant ?) ; Échap ferme et ramène sur le bouton.
4. **Critères.** Changer un poids : si le total n'est plus de 100 %, l'avertissement est
   lu. Ajouter puis retirer un niveau.
5. **Groupe.** Ajouter deux personnes au clavier : après Entrée, le champ se vide et garde
   le focus (à observer : l'ajout n'est pas annoncé aujourd'hui ; est-ce gênant ?).
   Touche T : le tableau est annoncé avec ses en-têtes ; Ctrl+Alt+flèches parcourent les
   cellules.
6. **Évaluation.** Choisir un niveau aux flèches : le niveau et son descripteur sont lus ;
   le résultat mis à jour est annoncé sans déplacer la lecture. « Retirer le niveau » :
   la lecture revient sur le premier niveau du critère. Précédente et Suivante : le focus
   reste sur le bouton (à observer : le nom de la nouvelle personne n'est pas annoncé,
   seulement le résultat s'il change ; est-ce gênant ?).
7. **Exports.** « PDF » dans Évaluation : « Préparation… », puis « Fichier prêt : … ».
   Ouvrir le PDF : le titre et la langue sont annoncés par le lecteur PDF.
8. **Vos données.** Exporter en JSON, puis l'importer : la confirmation est une fenêtre
   annoncée ; le message de retour est lu.
9. **Autre onglet.** Ouvrir le site dans un second onglet et y modifier la grille ;
   revenir au premier : l'avis de lecture seule est annoncé.
10. **Transparence.** Le lien vers GitHub annonce qu'il s'ouvre dans un nouvel onglet.

## Vérifications rapides sans lecteur d'écran

- **Zoom 200 %** (Ctrl +) : rien n'est coupé, pas de défilement horizontal.
- **Contraste élevé de Windows** (Paramètres → Accessibilité → Thèmes de contraste) :
  boutons, champs, niveaux et contour de focus restent visibles.
- **Clavier seul**, sans souris : toute l'application se parcourt, le focus est toujours
  visible et jamais caché sous la barre Précédente / Suivante (téléphone ou fenêtre
  étroite).

## Sur iPhone, avec VoiceOver (si possible)

- Évaluation : balayer d'un élément à l'autre ; la barre Précédente / Suivante est
  atteignable et fonctionne ; les niveaux se choisissent par double touche.
- Groupe : chaque personne est annoncée dans un tableau, ligne par ligne.
