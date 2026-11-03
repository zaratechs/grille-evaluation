import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Vérification finale (phase 6) : toutes les vues, à trois tailles d'écran, en contraste
 * élevé de Windows, avec mouvement réduit, et l'ordre du focus au clavier.
 */

const CLE = 'grille-evaluation:dossier';
const niveaux = ['Insatisfaisant', 'Faible', 'Satisfaisant', 'Très bon', 'Excellent'];
const descripteurs = ['Absent.', 'Fragile.', 'Correct.', 'Solide.', 'Remarquable.'];
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
  modelesPerso: [],
};

const ROUTES = [
  '/#/grille',
  '/#/evaluation',
  '/#/groupe',
  '/#/donnees',
  '/#/transparence',
  '/#/adresse-inconnue',
];

/** 1280 px ; 320 px (WCAG 1.4.10) ; zoom 200 % d'un écran de 1280 px, soit 640 px CSS. */
const TAILLES = [
  { nom: '1280 px', width: 1280, height: 800 },
  { nom: '320 px', width: 320, height: 640 },
  { nom: 'zoom 200 %', width: 640, height: 400 },
];

async function demarrer(page: Page, route: string, vide = false) {
  await page.goto('/');
  await page.evaluate(
    ([cle, t]) => localStorage.setItem(cle as string, t as string),
    [CLE, JSON.stringify(vide ? { ...DOSSIER, etudiants: [] } : DOSSIER)],
  );
  await page.goto(route);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

for (const taille of TAILLES) {
  for (const route of ROUTES) {
    test(`axe et sans défilement horizontal, ${taille.nom} : ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: taille.width, height: taille.height });
      await demarrer(page, route);
      const r = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(r.violations, r.violations.map((v) => `${v.id} — ${v.help}`).join('\n')).toEqual([]);
      const deborde = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(deborde).toBe(false);
    });
  }
}

test.describe('contraste élevé (forced-colors)', () => {
  test.use({ colorScheme: 'light' });

  for (const route of ['/#/grille', '/#/evaluation', '/#/groupe', '/#/donnees']) {
    test(`contrôles délimités et focus visible : ${route}`, async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' });
      await demarrer(page, route);
      // Chaque contrôle garde un contour : en contraste élevé, les fonds disparaissent.
      const sansBord = await page.evaluate(() =>
        [...document.querySelectorAll('main button, main input, main select, main textarea')]
          .filter((e) => (e as HTMLElement).offsetParent !== null)
          .filter(
            (e) =>
              (e as HTMLInputElement).type !== 'radio' && (e as HTMLInputElement).type !== 'file',
          )
          .filter((e) => {
            const s = getComputedStyle(e);
            return s.borderStyle === 'none' || parseFloat(s.borderWidth) === 0;
          })
          .map((e) => e.outerHTML.slice(0, 80)),
      );
      expect(sansBord).toEqual([]);
      // Le contour de focus reste dessiné, sur chaque arrêt du clavier de la page.
      const premier = await page.evaluate(() => document.activeElement?.outerHTML ?? '');
      for (let i = 0; i < 200; i++) {
        await page.keyboard.press('Tab');
        const contour = await page.evaluate(() => {
          const e = document.activeElement!;
          const s = getComputedStyle(e);
          return {
            html: e.outerHTML.slice(0, 80),
            style: s.outlineStyle,
            largeur: parseFloat(s.outlineWidth),
          };
        });
        // Fin du parcours : retour au début, ou sortie de la page (focus sur <body>).
        if ((i > 0 && contour.html === premier) || contour.html.startsWith('<body')) break;
        expect(contour.style, contour.html).not.toBe('none');
        expect(contour.largeur, contour.html).toBeGreaterThanOrEqual(2);
      }
    });
  }
});

test('mouvement réduit : aucune animation ni transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/#/grille', '/#/evaluation', '/#/groupe', '/#/donnees']) {
    await demarrer(page, route);
    const animes = await page.evaluate(() => {
      const secondes = (v: string) =>
        Math.max(
          ...v
            .split(',')
            .map((d) => (d.trim().endsWith('ms') ? parseFloat(d) / 1000 : parseFloat(d))),
        );
      return [...document.querySelectorAll('*')]
        .filter((e) => {
          const s = getComputedStyle(e);
          return secondes(s.transitionDuration) > 0.001 || secondes(s.animationDuration) > 0.001;
        })
        .map((e) => e.outerHTML.slice(0, 80));
    });
    expect(animes, route).toEqual([]);
  }
});

/** Parcourt la page à la touche Tab jusqu'à revenir au début ; rend chaque arrêt. */
async function arretsClavier(page: Page) {
  const arrets: { nom: string; x: number; y: number; hauteur: number }[] = [];
  for (let i = 0; i < 200; i++) {
    await page.keyboard.press('Tab');
    const a = await page.evaluate(() => {
      const e = document.activeElement as HTMLElement | null;
      if (!e || e === document.body) return null;
      const r = e.getBoundingClientRect();
      const nom = (e.getAttribute('aria-label') ?? e.textContent ?? '').trim().slice(0, 40);
      return {
        nom: `${e.tagName.toLowerCase()} « ${nom || (e as HTMLInputElement).name || e.id} »`,
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        hauteur: r.height,
      };
    });
    if (a === null || (arrets.length > 0 && a.nom === arrets[0]!.nom && a.y === arrets[0]!.y))
      break;
    arrets.push(a);
  }
  return arrets;
}

for (const route of ROUTES) {
  test(`ordre du focus, du lien d’évitement au pied de page : ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await demarrer(page, route);
    // Après un rechargement, le parcours au clavier part du début du document.
    const arrets = await arretsClavier(page);
    expect(arrets.length).toBeGreaterThan(3);
    expect(arrets.length, 'piège au clavier ?').toBeLessThan(200);
    expect(arrets[0]!.nom).toContain('Aller au contenu');
    expect(arrets.at(-1)!.nom).toContain('Transparence');
    // Dans l'ordre visuel : de haut en bas ; sur une même ligne, de gauche à droite.
    for (let i = 1; i < arrets.length; i++) {
      const [a, b] = [arrets[i - 1]!, arrets[i]!];
      const memeLigne = Math.abs(a.y - b.y) < Math.max(a.hauteur, b.hauteur) / 2;
      const ok = memeLigne ? b.x >= a.x - 1 : b.y > a.y;
      expect(ok, `${a.nom} → ${b.nom}`).toBe(true);
    }
  });
}
