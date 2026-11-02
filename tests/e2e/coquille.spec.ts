import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  '/#/grille',
  '/#/evaluation',
  '/#/groupe',
  '/#/donnees',
  '/#/transparence',
  '/#/adresse-inconnue',
];

/** Collecte les erreurs de console et les exceptions non interceptées de la page. */
function surveillerErreurs(page: Page): string[] {
  const erreurs: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') erreurs.push(m.text());
  });
  page.on('pageerror', (e) => erreurs.push(e.message));
  return erreurs;
}

test('le site se charge sans erreur dans la console', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/#/');
  await expect(page).toHaveURL(/#\/grille$/);
  await expect(page).toHaveTitle('Grille — Grille d’évaluation');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grille');
  expect(erreurs).toEqual([]);
});

test('aller-retour Grille → Transparence → Grille', async ({ page }) => {
  await page.goto('/#/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Transparence' }).click();
  await expect(page).toHaveURL(/#\/transparence$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Transparence');

  await page.getByRole('banner').getByRole('link', { name: 'Grille d’évaluation' }).click();
  await expect(page).toHaveURL(/#\/grille$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grille');
});

test('un rechargement sur #/transparence garde la page', async ({ page }) => {
  await page.goto('/#/transparence');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Transparence');
});

test('une adresse inconnue affiche la page introuvable', async ({ page }) => {
  await page.goto('/#/adresse-inconnue');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page introuvable');
  await page.getByRole('main').getByRole('link', { name: 'Revenir à l’accueil' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grille');
});

test('le lien « Aller au contenu » est le premier arrêt clavier et mène au contenu', async ({
  page,
}) => {
  await page.goto('/#/');
  await page.keyboard.press('Tab');
  const evitement = page.getByRole('link', { name: 'Aller au contenu' });
  await expect(evitement).toBeFocused();
  await expect(evitement).toBeVisible(); // visible une fois focalisé
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('la navigation mène à chaque vue et y place le focus', async ({ page }) => {
  await page.goto('/#/grille');
  const nav = page.getByRole('navigation', { name: 'Vues' });
  const etapes: [string, string][] = [
    ['Évaluation', 'Évaluation'],
    ['Groupe', 'Groupe'],
    ['Données', 'Vos données'],
    ['Grille', 'Grille'],
  ];
  for (const [lien, titre] of etapes) {
    await nav.getByRole('link', { name: lien }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titre);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(nav.getByRole('link', { name: lien })).toHaveAttribute('aria-current', 'page');
  }
});

for (const route of ROUTES) {
  test(`axe : aucune violation WCAG 2.1 AA sur ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const resultats = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      resultats.violations,
      resultats.violations.map((v) => `${v.id} (${v.impact}) — ${v.help}`).join('\n'),
    ).toEqual([]);
  });
}
