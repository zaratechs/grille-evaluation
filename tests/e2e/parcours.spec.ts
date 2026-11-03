import { readFile } from 'node:fs/promises';
import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * Parcours complet, au clavier : aucun clic de souris. Seul le choix du fichier à importer
 * passe par `setInputFiles`, la fenêtre du système n'étant pas pilotable.
 */

const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
const vue = async (page: Page, lien: string, titre: string) => {
  await page
    .getByRole('navigation', { name: 'Vues' })
    .getByRole('link', { name: lien })
    .press('Enter');
  await expect(h1(page)).toHaveText(titre);
};
/** Remplace le texte d'un champ en tapant au clavier. */
const saisir = async (page: Page, champ: Locator, texte: string) => {
  await champ.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(texte);
};
const resultat = (page: Page) => page.getByRole('region', { name: 'Résultat' });

test('construire, évaluer, recharger, exporter puis réimporter', async ({ page }) => {
  await page.goto('/#/grille');

  // 1. Partir d'un modèle fourni.
  await page.getByRole('button', { name: 'Partir d’un modèle…' }).press('Enter');
  const fenetre = page.getByRole('dialog', { name: 'Choisir un modèle' });
  await expect(fenetre.getByRole('searchbox', { name: 'Rechercher un modèle' })).toBeFocused();
  await page.keyboard.type('travail ecrit');
  await fenetre.getByRole('button', { name: 'Travail écrit', exact: true }).press('Enter');
  await fenetre.getByRole('button', { name: 'Appliquer ce modèle' }).press('Enter');
  await expect(fenetre).toBeHidden();
  const criteres = page.getByRole('group', { name: /^Critère \d/ });
  const nombre = await criteres.count();
  expect(nombre).toBeGreaterThan(1);

  // 2. Ajuster la grille : titre, total, nom du premier critère.
  await saisir(page, page.getByRole('textbox', { name: 'Titre de la grille' }), 'Essai final');
  await saisir(page, page.getByRole('textbox', { name: 'Total de points' }), '20');
  await saisir(page, criteres.first().getByRole('textbox', { name: 'Nom' }), 'Argumentation');
  await expect(page.getByRole('status', { name: 'Total des poids' })).toContainText('100,0');

  // 3. Ajouter deux personnes à la suite.
  await vue(page, 'Groupe', 'Groupe');
  const nom = page.getByRole('textbox', { name: 'Nom de la personne étudiante' });
  await nom.focus();
  await page.keyboard.type('Élise Roy');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Noé Tremblay');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('row')).toHaveCount(3);

  // 4. Évaluer Élise entièrement : Espace coche « Faible », puis les flèches montent.
  await page
    .getByRole('row', { name: /^Élise Roy/ })
    .getByRole('link', { name: 'Évaluer' })
    .press('Enter');
  await expect(h1(page)).toHaveText('Évaluation');
  await expect(page.getByRole('combobox', { name: 'Personne' })).toHaveValue(/.+/);
  for (let i = 0; i < nombre; i++) {
    // Les critères : chaque groupe est intitulé « Nom · 20,0 % ».
    const groupe = page.getByRole('group', { name: / · / }).nth(i);
    await groupe.getByRole('radio', { name: '2 Faible' }).focus();
    // Après chaque touche, on attend que la page ait suivi avant la suivante.
    await page.keyboard.press('Space');
    await expect(groupe.getByRole('radio', { name: '2 Faible' })).toBeChecked();
    await page.keyboard.press('ArrowDown');
    await expect(groupe.getByRole('radio', { name: '3 Satisfaisant' })).toBeChecked();
    await page.keyboard.press('ArrowDown');
    await expect(groupe.getByRole('radio', { name: '4 Très bon' })).toBeChecked();
  }
  await page.getByRole('textbox', { name: 'Commentaire général' }).focus();
  await page.keyboard.type('Bon travail.');
  await expect(resultat(page)).toContainText('16,00 / 20 points · 80,0 % · Très bon');

  // 5. Recharger : tout est retrouvé, y compris la personne choisie.
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Personne' })).toHaveText(/Élise Roy/);
  await expect(resultat(page)).toContainText('16,00 / 20 points');
  await expect(page.getByRole('textbox', { name: 'Commentaire général' })).toHaveValue(
    'Bon travail.',
  );

  // 6. Exporter tout.
  await vue(page, 'Données', 'Vos données');
  const telechargement = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter tout' }).press('Enter');
  const fichier = await telechargement;
  expect(fichier.suggestedFilename()).toMatch(/^grille-essai-final-\d{4}-\d{2}-\d{2}\.json$/);
  const chemin = await fichier.path();
  expect(await readFile(chemin, 'utf8')).toContain('Élise Roy');

  // 7. Tout effacer, puis réimporter le fichier exporté.
  await page.getByRole('button', { name: 'Tout effacer…' }).press('Enter');
  await page
    .getByRole('dialog', { name: 'Tout effacer ?' })
    .getByRole('button', { name: 'Tout effacer' })
    .press('Enter');
  await expect(page.getByRole('status')).toContainText('Toutes les données ont été effacées.');

  await page.getByLabel('Choisir un fichier .json').setInputFiles(chemin);
  const confirmation = page.getByRole('dialog', { name: /^Importer/ });
  await expect(confirmation).toContainText('Le fichier contient 2 personnes étudiantes.');
  await confirmation.getByRole('button', { name: 'Importer' }).press('Enter');
  await expect(page.getByRole('status')).toContainText('Import terminé.');

  await vue(page, 'Groupe', 'Groupe');
  await expect(page.getByRole('row', { name: /^Élise Roy/ })).toContainText(
    '16,00 / 20 points · 80,0 % · Très bon',
  );
  await expect(page.getByRole('row', { name: /^Noé Tremblay/ })).toContainText(
    'Pas encore évaluée',
  );
});
