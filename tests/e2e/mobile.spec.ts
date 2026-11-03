import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * Téléphone : Évaluation, Groupe et Grille à 320 px (le plus étroit, WCAG 1.4.10) et à
 * 390 px (iPhone courant). Cibles d'au moins 44 × 44 px (WCAG 2.5.5), barre Précédente /
 * Suivante toujours à portée du pouce, aucun défilement horizontal.
 */

const CLE = 'grille-evaluation:dossier';
const niveaux = ['Insatisfaisant', 'Faible', 'Satisfaisant', 'Très bon', 'Excellent'];
const descripteurs = [
  'Absent ou hors sujet.',
  'Fragile, beaucoup d’imprécisions.',
  'Correct, quelques imprécisions.',
  'Solide et bien appuyé.',
  'Remarquable, sans aucune réserve.',
];
const DOSSIER = {
  version: 1,
  grille: {
    titre: 'Travail de session',
    totalPoints: 20,
    niveaux,
    criteres: [
      { id: 'c1', nom: 'Qualité de l’argumentation', poids: 400, descripteurs },
      { id: 'c2', nom: 'Structure', poids: 300, descripteurs },
      { id: 'c3', nom: 'Langue', poids: 300, descripteurs },
    ],
  },
  etudiants: [
    {
      id: 'e1',
      nom: 'Élise Roy-Gagnon de la Vérendrye',
      niveaux: { c1: 4 },
      commentaires: {},
      commentaireGeneral: '',
    },
    { id: 'e2', nom: 'Noé Tremblay', niveaux: {}, commentaires: {}, commentaireGeneral: '' },
    { id: 'e3', nom: 'Zoé Gagnon', niveaux: {}, commentaires: {}, commentaireGeneral: '' },
  ],
  modelesPerso: [],
};

const CIBLE = 44;

async function demarrer(page: Page, route: string, largeur: number) {
  await page.setViewportSize({ width: largeur, height: 700 });
  await page.goto('/');
  await page.evaluate(
    ([cle, t]) => localStorage.setItem(cle as string, t as string),
    [CLE, JSON.stringify(DOSSIER)],
  );
  await page.goto(route);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function boite(l: Locator) {
  const b = await l.boundingBox();
  if (!b) throw new Error('élément invisible');
  return b;
}

const sansDefilementHorizontal = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const barre = (page: Page) => page.getByRole('group', { name: 'Changer de personne' });

for (const largeur of [320, 390]) {
  test.describe(`${largeur} px`, () => {
    test('Évaluation : niveaux en colonne, chaque choix d’au moins 44 × 44 px', async ({
      page,
    }) => {
      await demarrer(page, '/#/evaluation', largeur);
      expect(await sansDefilementHorizontal(page)).toBe(true);
      const critere = page.getByRole('group', { name: /^Qualité de l’argumentation/ });
      const choix = critere.locator('label').filter({ has: page.getByRole('radio') });
      await expect(choix).toHaveCount(5);
      const xs = new Set<number>();
      for (const c of await choix.all()) {
        const b = await boite(c);
        expect(b.height).toBeGreaterThanOrEqual(CIBLE);
        expect(b.width).toBeGreaterThanOrEqual(CIBLE);
        xs.add(Math.round(b.x));
      }
      expect(xs.size).toBe(1); // tous alignés : une colonne
    });

    test('Évaluation : la barre Précédente / Suivante reste en bas de l’écran', async ({
      page,
    }) => {
      await demarrer(page, '/#/evaluation', largeur);
      const hauteur = page.viewportSize()!.height;
      for (const nom of ['Précédente', 'Suivante']) {
        const b = await boite(barre(page).getByRole('button', { name: nom }));
        expect(b.height).toBeGreaterThanOrEqual(CIBLE);
      }
      // Au milieu de la page, collée au bas de l'écran (à la marge intérieure près).
      await page.getByRole('group', { name: /^Structure/ }).scrollIntoViewIfNeeded();
      let b = await boite(barre(page));
      expect(hauteur - (b.y + b.height)).toBeGreaterThanOrEqual(0);
      expect(hauteur - (b.y + b.height)).toBeLessThanOrEqual(12);
      // Tout en bas : posée après le contenu, elle ne masque ni le dernier bouton ni le pied.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      b = await boite(barre(page));
      const effacer = await boite(
        page.getByRole('button', { name: 'Effacer l’évaluation de cette personne' }),
      );
      expect(effacer.y + effacer.height).toBeLessThanOrEqual(b.y);
      const pied = await boite(page.getByRole('contentinfo'));
      expect(b.y + b.height).toBeLessThanOrEqual(pied.y);
      // Et elle fonctionne.
      await barre(page).getByRole('button', { name: 'Suivante' }).click();
      await expect(page.getByRole('combobox', { name: 'Personne' })).toHaveValue('e2');
    });

    test('Évaluation : un champ qui reçoit le focus n’est pas caché par la barre', async ({
      page,
    }) => {
      await demarrer(page, '/#/evaluation', largeur);
      const champ = page.getByRole('textbox', { name: 'Commentaire' }).nth(1);
      await champ.focus();
      const c = await boite(champ);
      const b = await boite(barre(page));
      expect(c.y + c.height <= b.y || c.y >= b.y + b.height).toBe(true);
    });

    test('Groupe : une carte par personne, boutons d’au moins 44 px de haut', async ({ page }) => {
      await demarrer(page, '/#/groupe', largeur);
      expect(await sansDefilementHorizontal(page)).toBe(true);
      // Le tableau garde sa structure pour les lecteurs d'écran.
      const tableau = page.getByRole('table');
      await expect(tableau.getByRole('row')).toHaveCount(4);
      await expect(tableau.getByRole('rowheader', { name: 'Noé Tremblay' })).toBeVisible();
      await expect(tableau.getByRole('columnheader', { name: 'Évaluation' })).toBeAttached();
      const ligne = tableau.getByRole('row').filter({ hasText: 'Noé Tremblay' });
      const nom = await boite(ligne.getByRole('rowheader'));
      const etat = await boite(ligne.getByRole('cell').first());
      expect(etat.y).toBeGreaterThanOrEqual(nom.y + nom.height - 1); // empilés
      for (const action of await ligne.getByRole('button').all()) {
        expect((await boite(action)).height).toBeGreaterThanOrEqual(CIBLE);
      }
      expect(
        (await boite(ligne.getByRole('link', { name: 'Évaluer' }))).height,
      ).toBeGreaterThanOrEqual(CIBLE);
    });

    test('Grille : un critère se modifie de bout en bout', async ({ page }) => {
      await demarrer(page, '/#/grille', largeur);
      const critere = page.getByRole('group', { name: /^Critère 2 :/ });
      await critere.getByRole('textbox', { name: 'Nom' }).fill('Organisation du texte');
      await critere.getByRole('textbox', { name: 'Poids (%)' }).fill('30');
      const d = critere.getByRole('textbox', { name: /^Descripteur du niveau 5/ });
      await d.fill('Plan limpide.');
      expect(await sansDefilementHorizontal(page)).toBe(true);
      for (const champ of [critere.getByRole('textbox', { name: 'Nom' }), d]) {
        const b = await boite(champ);
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(largeur);
      }
      await page.reload();
      await expect(
        page
          .getByRole('group', { name: 'Critère 2 : Organisation du texte' })
          .getByRole('textbox', {
            name: /^Descripteur du niveau 5/,
          }),
      ).toHaveValue('Plan limpide.');
    });
  });
}

test('1280 px : la barre n’est pas collée, le tableau du groupe est un tableau', async ({
  page,
}) => {
  await demarrer(page, '/#/evaluation', 1280);
  expect(await barre(page).evaluate((e) => getComputedStyle(e).position)).toBe('static');
  await page.goto('/#/groupe');
  expect(await page.getByRole('table').evaluate((e) => getComputedStyle(e).display)).toBe('table');
});
