# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Commits conventionnels.

## [Non publié]

### Ajouté

- Outillage : Vite, React 19, TypeScript strict (`noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`), Tailwind 4, ESLint (dont jsx-a11y) et Prettier.
- Garde de neutralité (`npm run check:neutralite`) : bloque les noms d'établissements et
  toute adresse courriel dans les fichiers livrés.
- Couleurs centralisées dans `src/ui/tokens.css`, avec contrastes WCAG AA calculés par
  les tests et interdiction des couleurs en dur ailleurs.
- Coquille de l'application : en-tête, lien « Aller au contenu », pied de page (auteur,
  crédit à Paulo Mendonça, licence CC BY-NC-SA 4.0, version, lien Transparence), pages
  Accueil et Transparence provisoires, page introuvable, message clair si une page plante.
- Tests de bout en bout Playwright sur le site construit, avec scan axe sans violation.
- CI GitHub Actions alignée sur `npm run ci` (alignement vérifié par un test).
- README, CHANGELOG et LICENSE (CC BY-NC-SA 4.0).
