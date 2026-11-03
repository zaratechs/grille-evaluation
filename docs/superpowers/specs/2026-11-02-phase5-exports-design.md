# Grille d'évaluation — Phase 5 : exports PDF, CSV et Word

- Date : 2026-11-02
- Statut : validée le 2026-11-02
- Auteur : Réda Hamza, Développeur technopédagogique
- Phase précédente : `2026-11-02-phase4-interface-design.md`

## 1. Objectif

Remettre les résultats hors de l'application, dans des fichiers fiables :

- **PDF** d'une personne ou de tout le groupe, à remettre ou à archiver ;
- **Word (.docx)** d'une personne ou de tout le groupe, très soigné et modifiable ;
- **CSV** du groupe, à ouvrir dans un tableur ou à reporter dans un carnet de notes.

Les exports n'inventent rien : ils reprennent les notes et les textes du domaine et de
l'écran, au caractère près. Le format JSON (sauvegarde et import) reste celui de la
phase 3.

## 2. Ce que fait l'outil d'origine

| Outil d'origine                                                    | Problème                                                                  | Dans la nouvelle application                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| PDF et CSV de la seule personne affichée                           | Exporter un groupe de 30 demande 30 manipulations                         | Une personne **ou** tout le groupe, en un seul fichier (décision 2)              |
| PDF en A4                                                          | Format peu utilisé au Québec                                              | Lettre US, déjà décidé en phase 1                                                |
| Note calculée avec `toFixed`, à part de l'écran                     | La note du PDF peut différer de celle de l'écran                          | Les textes de l'écran sont réutilisés tels quels (section 4)                     |
| Note affichée même si l'évaluation est incomplète ou les poids faux | Une note trompeuse se retrouve sur papier                                 | Le statut est écrit à la place de la note (« Incomplète : 3 critères sur 5 évalués ») |
| Police Helvetica intégrée à jsPDF                                   | Certains noms s'affichent mal (« Nguyễn », « Łukasz »)                     | Police libre embarquée, chargée à la demande (décision 4)                        |
| CSV : une ligne par critère, nombres avec un point                  | Difficile à reporter ; Excel en français lit mal les nombres              | Une ligne par personne, virgule décimale (décision 3)                            |
| Pas d'export Word                                                   | Impossible d'ajuster le document avant de le remettre                     | Word soigné, sur le modèle de revisionProgramme (section 6)                      |
| Nom de fichier `grille_Nom.pdf`                                     | Pas de date ; caractères parfois refusés                                  | `nomFichier` de la phase 3 : `grille-travail-de-session-elise-roy-2026-11-02.pdf` |

## 3. Où sont les exports

| Vue        | Boutons                                                          |
| ---------- | ---------------------------------------------------------------- |
| Évaluation | « Exporter cette personne » : **PDF**, **Word**                  |
| Groupe     | « Exporter tout le groupe » : **PDF**, **Word**, **CSV**         |

- Un bouton est désactivé, avec la raison liée par `aria-describedby`, quand il n'y a rien
  à exporter : groupe vide, ou grille sans critère.
- Pendant la création (bibliothèque à charger, groupe nombreux), le bouton affiche
  « Préparation… » et ne peut pas être cliqué deux fois. Un échec affiche un avis, sans
  rien perdre.
- Les personnes dont l'évaluation est incomplète sont exportées avec leur statut, jamais
  avec une note inventée (décision 6).

Noms de fichiers, par `nomFichier` :

- une personne : `grille-<titre>-<personne>-<date>.pdf` ou `.docx` ;
- le groupe : `grille-<titre>-groupe-<date>.pdf`, `.docx` ou `.csv`.

## 4. Architecture

```
src/textes/       textes français partagés par l'écran et les exports (purs)
  resultats.ts    texteResultat, texteNote        (déplacé de src/ui/)
  accords.ts      accorder, phrasesPertes…        (déplacé de src/ui/)
src/export/       exports, sans React ni navigateur
  contenu.ts      dossier → RapportEvaluation (données à afficher, déjà en texte)
  csv.ts          RapportGroupe → texte CSV
  pdf.ts          RapportEvaluation → octets PDF   (jsPDF, chargé à la demande)
  word.ts         RapportEvaluation → octets .docx (docx, chargé à la demande)
  couleurs.ts     couleurs des documents, en RVB
  polices/        police embarquée pour le PDF
src/ui/           boutons d'export ; le téléchargement passe par data-access
```

- **Un seul contenu, trois rendus.** `contenu.ts` construit, pour chaque personne, tout ce
  qui sera écrit : titre, nom, résultat, une ligne par critère, commentaire général, et la
  synthèse du groupe. Les rendus ne font que la mise en forme. Tout le contenu se teste
  donc sans PDF ni Word, comme dans le projet Soins infirmiers.
- **Mêmes textes qu'à l'écran.** `resultats.ts` et `accords.ts` quittent `src/ui/` pour
  `src/textes/`, que l'écran et les exports importent tous deux.
- **Chargement à la demande.** jsPDF, jspdf-autotable, docx et la police ne sont chargés
  (`import()`) qu'au premier clic sur un export : le premier affichage du site n'est pas
  alourdi.
- **Règles d'architecture** (test existant, étendu) : `src/export` et `src/textes`
  n'importent ni React ni `src/ui`, et ne touchent ni au stockage ni à `Blob`. Le fichier
  est remis par `telecharger` de `data-access`, qui accepte déjà des octets.
- **Couleurs.** Les documents utilisent les couleurs de l'application (marque, texte,
  filets), écrites en RVB dans `couleurs.ts` ; un test vérifie qu'elles correspondent aux
  jetons de `tokens.css`. La règle « aucune couleur hexadécimale hors de `tokens.css` »
  reste vraie.

## 5. Contenu d'une personne (PDF et Word)

```
┌───────────────────────────────────────────────────────────────────────┐
│ TRAVAIL DE SESSION                                                    │
│ ───────────────────────────────────────────────────────────────────── │
│ Personne étudiante : Élise Roy                                        │
│ Date : 2 novembre 2026                                                │
│ Résultat : 16,80 / 20 points · 84,0 % · Très bon                      │
│                                                                       │
│ ┌─────────┬──────────┬───────────────┬──────────────┬─────────────┐   │
│ │ Critère │ Poids    │ Niveau        │ Descripteur  │ Commentaire │   │
│ ├─────────┼──────────┼───────────────┼──────────────┼─────────────┤   │
│ │ Fond    │ 60,0 %   │ 5 Excellent   │ Remarquable. │ Clair.      │   │
│ │ Forme   │ 40,0 %   │ 3 Satisfaisant│ Correct.     │             │   │
│ │ Bonus   │ non noté │ —             │              │             │   │
│ └─────────┴──────────┴───────────────┴──────────────┴─────────────┘   │
│ COMMENTAIRE GÉNÉRAL                                                   │
│ Très bon travail, bien structuré.                                     │
│                                                    Page 1 sur 1       │
└───────────────────────────────────────────────────────────────────────┘
```

- Le résultat est le texte de l'écran (`texteResultat`) : note complète, « Incomplète :
  … », « Pas encore évaluée » ou « Note impossible : les poids font 95,0 % ».
- Un tableau compact, une ligne par critère (décision 1) : critère, poids (« non noté »
  pour un poids 0), niveau obtenu (« — » s'il n'est pas évalué), descripteur de ce
  niveau, commentaire. Il reste lisible avec 10 niveaux, en Lettre portrait.
- La section « Commentaire général » n'apparaît que s'il y en a un.
- Date en toutes lettres, à l'heure locale (« 2 novembre 2026 »).

**Export du groupe** (décision 2) : une première page de synthèse, puis une personne par
page (saut de page avant chacune).

```
SYNTHÈSE DU GROUPE — TRAVAIL DE SESSION
18 évaluations complètes sur 24 · Moyenne : 14,82 / 20 points (74,1 %) · Médiane : …
┌───────────────────────┬────────────────────────────────────────────┐
│ Personne étudiante    │ Résultat                                   │
│ Élise Roy             │ 16,80 / 20 points · 84,0 % · Très bon      │
│ Noé Tremblay          │ Incomplète : 1 critère sur 2 évalué        │
└───────────────────────┴────────────────────────────────────────────┘
```

## 6. Mise en page

**Commun au PDF et au Word**

- Lettre US portrait (8,5 × 11 po), marges de 2 cm.
- Pied de page : « Grille d'évaluation · page X sur Y ». Aucun nom d'établissement ni
  courriel (garde de neutralité inchangée).
- En-tête du tableau répété à chaque page ; une ligne de critère n'est jamais coupée
  entre deux pages.
- Textes longs : renvoi à la ligne, jamais de texte tronqué ni débordant.

**Word**, sur le modèle de revisionProgramme (phase 1, section 5), avec ses améliorations :

- Calibri 11, interligne aéré.
- Vrais styles Word : le titre de la grille en Titre 1, chaque personne en Titre 2 (volet
  de navigation de Word utilisable dans l'export du groupe).
- Titres de section en majuscules, soulignés d'un filet de la couleur de marque.
- Lignes « Libellé : valeur » (personne, date, résultat), libellé en gras.
- En-têtes de tableau sur fond plein de la couleur de marque, texte blanc.
- Une section par personne dans l'export du groupe, avec saut de page.

**PDF**

- Même hiérarchie que le Word, police libre embarquée (décision 4) en normal et gras.
- Texte réel et sélectionnable, métadonnées de titre et de langue (`fr-CA`).

## 7. CSV du groupe

Une ligne par personne (décision 3), dans l'ordre du groupe :

```
Personne étudiante;Statut;Points;Sur;Pourcentage;Appréciation;Fond (niveau);Forme (niveau);Fond (commentaire);Forme (commentaire);Commentaire général
"Élise Roy";"Complète";"16,80";"20";"84,0";"Très bon";"5";"3";"Clair.";"";"Très bon travail."
"Noé Tremblay";"Incomplète";"";"20";"";"";"4";"";"";"";""
```

- Format d'Excel en français : séparateur `;`, virgule décimale, UTF-8 avec BOM, fins de
  ligne CRLF, toutes les cellules entre guillemets.
- Points, pourcentage et appréciation sont **vides** quand l'évaluation n'est pas
  complète : aucun zéro trompeur dans un tableur.
- Les retours à la ligne des commentaires sont gardés, entre guillemets (norme RFC 4180).
- **Protection contre l'injection de formules** : une cellule qui commence par `=`, `+`,
  `-`, `@`, une tabulation ou un retour chariot est précédée d'une apostrophe.

## 8. Tests (écrits avant le code)

| Fichier                                    | Vérifie                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `tests/export/contenu.test.ts`             | Pour chaque statut : le texte du résultat ; poids 0 « non noté » ; critère non évalué « — » ; descripteur du niveau choisi ; commentaire général absent ; synthèse ; ordre du groupe |
| `tests/export/csv.test.ts`                 | En-têtes ; BOM, `;`, CRLF, guillemets doublés ; virgule décimale ; cellules vides si incomplète ; retours à la ligne gardés ; injection de formules neutralisée |
| `tests/export/word.test.ts`                | Le .docx est ouvert (jszip) : textes présents ; Lettre US ; styles Titre 1 et Titre 2 ; en-tête de tableau répété ; lignes insécables ; un saut de page par personne ; pied de page avec numéro |
| `tests/export/pdf.test.ts`                 | Le PDF est relu (pdfjs-dist) : nombre de pages, format Lettre, textes présents dont « Nguyễn » et « Łukasz », numéros de page ; aucun texte hors des marges |
| `tests/export/couleurs.test.ts`            | Chaque couleur des documents correspond à son jeton de `tokens.css`                                  |
| `tests/domain/architecture.test.ts` (ajout)| `src/export` et `src/textes` n'importent ni React ni `src/ui`, sans stockage ni `Blob`               |
| `tests/ui/pages/evaluation.test.tsx` (ajout) | « Exporter cette personne » : nom du fichier, type, « Préparation… », échec affiché               |
| `tests/ui/pages/groupe.test.tsx` (ajout)   | « Exporter tout le groupe » : trois formats ; boutons désactivés avec leur raison                    |
| `tests/e2e/exports.spec.ts`                | Sur le site construit : chaque export se télécharge, avec le bon nom et un contenu valide (`%PDF`, archive .docx, BOM du CSV) ; la bibliothèque n'est chargée qu'au clic |

Couverture : 100 % sur `src/export/contenu.ts`, `csv.ts` et `src/textes/` ; 90 % sur
les rendus PDF et Word.

## 9. Changements d'outillage

- Dépendances livrées, chargées à la demande : `jspdf`, `jspdf-autotable`, `docx`.
- Police libre (licence SIL OFL), couvrant le latin étendu, en normal et gras, dans
  `src/export/polices/`, avec sa licence. Elle est mentionnée dans la page Transparence
  et le README.
- Dépendances de test seulement : `jszip` (ouvrir le .docx), `pdfjs-dist` (relire le
  PDF).
- Projet Vitest `node` étendu à `tests/export/`.

## 10. Exclus

- Impression directe depuis le navigateur : le PDF en tient lieu.
- Export Excel (.xlsx) : le CSV s'ouvre dans Excel.
- Personnaliser les documents (logo, couleurs, colonnes) : non prévu. Le Word se modifie
  après coup.
- Polissage visuel, aide, page Transparence complétée : phase 6.

## 11. Critères d'acceptation

- `npm run ci` passe, en UTC comme en local, avec les seuils de couverture de la
  section 8.
- La note et le statut de chaque personne sont identiques à l'écran, dans le PDF, dans le
  Word et dans le CSV.
- Aucune note n'apparaît dans un export pour une évaluation incomplète ou des poids
  différents de 100 %.
- Un groupe de 40 personnes très commentées s'exporte en PDF et en Word sans texte coupé
  ni ligne de critère scindée entre deux pages.
- Le CSV s'ouvre correctement dans Excel en français (accents, nombres, colonnes).
- Le premier affichage du site ne charge ni jsPDF, ni docx, ni la police.
- README (exports) et CHANGELOG à jour.

## 12. Décisions

Validées par Réda le 2026-11-02.

1. **Tableau compact par personne** (critère, poids, niveau, descripteur du niveau,
   commentaire), plutôt que la grille complète avec le niveau coché : lisible avec 10
   niveaux en format portrait.
2. **Export du groupe en un seul fichier** : synthèse en première page, puis une personne
   par page.
3. **CSV : une ligne par personne**, une colonne de niveau et une de commentaire par
   critère, au format d'Excel en français.
4. **Police libre embarquée dans le PDF**, chargée à la demande, plutôt que l'Helvetica de
   jsPDF qui n'affiche pas tous les noms.
5. **jsPDF (avec jspdf-autotable) et docx**, chargés seulement au clic.
6. **Évaluations incomplètes exportées avec leur statut**, sans note.
7. **Textes partagés déplacés dans `src/textes/`**, pour garantir les mêmes phrases à
   l'écran et dans les fichiers.
