import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibilité des vues remplies : scan axe (WCAG 2.1 AA) avec des données, avec une
 * fenêtre ouverte et avec un avis ; et, à 320 px de large, aucun défilement horizontal.
 */

const CLE = 'grille-evaluation:dossier';
const niveaux = ['Insatisfaisant', 'Faible', 'Satisfaisant', 'Très bon', 'Excellent'];
const descripteurs = [
  'Absent.',
  'Fragile.',
  'Correct.',
  'Solide.',
  'Remarquable, sans aucune réserve.',
];

const DOSSIER = {
  version: 1,
  grille: {
    titre: 'Travail de session',
    totalPoints: 20,
    niveaux,
    criteres: [
      { id: 'c1', nom: 'Qualité de l’argumentation', poids: 600, descripteurs },
      { id: 'c2', nom: 'Langue', poids: 400, descripteurs },
    ],
  },
  etudiants: [
    {
      id: 'e1',
      nom: 'Élise Roy-Gagnon de la Vérendrye',
      niveaux: { c1: 4, c2: 5 },
      commentaires: { c1: 'Arguments solides.' },
      commentaireGeneral: 'Très bon travail.',
    },
    { id: 'e2', nom: 'Noé Tremblay', niveaux: { c1: 2 }, commentaires: {}, commentaireGeneral: '' },
  ],
  modelesPerso: [
    {
      id: 'm1',
      nom: 'Mon modèle',
      niveaux,
      criteres: [{ nom: 'Fond', poids: 1000, descripteurs }],
    },
  ],
};

const VUES = ['/#/grille', '/#/evaluation', '/#/groupe', '/#/donnees'];

/** Démarre avec `texte` comme sauvegarde, une seule fois (un rechargement garde l'état). */
async function demarrer(page: Page, route: string, texte = JSON.stringify(DOSSIER)) {
  await page.goto('/');
  await page.evaluate(([cle, t]) => localStorage.setItem(cle as string, t as string), [CLE, texte]);
  await page.goto(route);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function sansViolation(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(r.violations, r.violations.map((v) => `${v.id} — ${v.help}`).join('\n')).toEqual([]);
}

for (const route of VUES) {
  test(`axe avec des données : ${route}`, async ({ page }) => {
    await demarrer(page, route);
    await sansViolation(page);
  });

  test(`320 px de large, aucun défilement horizontal : ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await demarrer(page, route);
    const deborde = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(deborde).toBe(false);
  });
}

test('axe avec une fenêtre ouverte : choisir un modèle', async ({ page }) => {
  await demarrer(page, '/#/grille');
  await page.getByRole('button', { name: 'Partir d’un modèle…' }).click();
  await page
    .getByRole('dialog', { name: 'Choisir un modèle' })
    .getByRole('button', { name: 'Mon modèle' })
    .click();
  await sansViolation(page);
});

test('axe avec une confirmation ouverte : effacer une évaluation', async ({ page }) => {
  await demarrer(page, '/#/evaluation');
  await page.getByRole('button', { name: 'Effacer l’évaluation de cette personne' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await sansViolation(page);
});

test('axe avec un avis : sauvegarde réparée au chargement', async ({ page }) => {
  const abime = { ...DOSSIER, grille: { ...DOSSIER.grille, totalPoints: 'vingt' } };
  await demarrer(page, '/#/groupe', JSON.stringify(abime));
  await expect(page.getByRole('alert')).toBeVisible();
  await sansViolation(page);
});
