import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

/**
 * Politique de sécurité : le site construit est servi avec les en-têtes de `vercel.json`
 * (le serveur de prévisualisation de Vite ne les envoie pas : Playwright les ajoute à
 * chaque réponse). Toutes les vues et tous les fichiers produits doivent fonctionner sans
 * une seule violation.
 */

type Regle = { source: string; headers: { key: string; value: string }[] };
const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
  headers: Regle[];
};
const EN_TETES = Object.fromEntries(
  config.headers.find((r) => r.source === '/(.*)')!.headers.map((h) => [h.key, h.value]),
);

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
      { id: 'c1', nom: 'Fond', poids: 600, descripteurs },
      { id: 'c2', nom: 'Forme', poids: 400, descripteurs },
    ],
  },
  etudiants: [
    {
      id: 'e1',
      nom: 'Élise Roy',
      niveaux: { c1: 5, c2: 3 },
      commentaires: { c1: 'Clair.' },
      commentaireGeneral: 'Très bon travail.',
    },
    { id: 'e2', nom: 'Nguyễn Văn An', niveaux: {}, commentaires: {}, commentaireGeneral: '' },
  ],
  modelesPerso: [],
};

/** Ajoute les en-têtes de `vercel.json` à chaque réponse, et note toute violation. */
async function servirAvecPolitique(page: Page) {
  await page.route('**/*', async (route) => {
    const reponse = await route.fetch();
    await route.fulfill({ response: reponse, headers: { ...reponse.headers(), ...EN_TETES } });
  });
  await page.addInitScript(() => {
    const w = window as unknown as { violations: string[] };
    w.violations = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      w.violations.push(`${e.effectiveDirective} : ${e.blockedURI || 'en ligne'}`),
    );
  });
}

const violations = (page: Page) =>
  page.evaluate(() => (window as unknown as { violations: string[] }).violations);

async function demarrer(page: Page, route: string, texte = JSON.stringify(DOSSIER)) {
  await servirAvecPolitique(page);
  await page.goto('/');
  await page.evaluate(([cle, t]) => localStorage.setItem(cle as string, t as string), [CLE, texte]);
  await page.goto(route);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function telecharger(page: Page, groupe: string, bouton: string) {
  const attente = page.waitForEvent('download');
  await page.getByRole('group', { name: groupe }).getByRole('button', { name: bouton }).click();
  return (await attente).suggestedFilename();
}

test('la politique est bien appliquée à la page', async ({ page }) => {
  await servirAvecPolitique(page);
  const reponse = await page.goto('/');
  expect(reponse!.headers()['content-security-policy']).toBe(EN_TETES['Content-Security-Policy']);
  // Preuve que la politique agit : un script en ligne est bloqué et signalé.
  await page.evaluate(() => {
    const s = document.createElement('script');
    s.textContent = 'window.execute = true';
    document.body.append(s);
  });
  await expect.poll(() => violations(page)).toContainEqual('script-src-elem : inline');
  expect(await page.evaluate(() => 'execute' in window)).toBe(false);
});

for (const route of ['/#/grille', '/#/evaluation', '/#/groupe', '/#/donnees', '/#/transparence']) {
  test(`aucune violation : ${route}`, async ({ page }) => {
    await demarrer(page, route);
    expect(await violations(page)).toEqual([]);
  });
}

test('exports d’une personne et du groupe, sans violation', async ({ page }) => {
  await demarrer(page, '/#/evaluation');
  expect(await telecharger(page, 'Exporter cette personne', 'PDF')).toMatch(/\.pdf$/);
  expect(await telecharger(page, 'Exporter cette personne', 'Word')).toMatch(/\.docx$/);
  await page.goto('/#/groupe');
  for (const [bouton, ext] of [
    ['PDF', 'pdf'],
    ['Word', 'docx'],
    ['CSV', 'csv'],
  ] as const) {
    expect(await telecharger(page, 'Exporter tout le groupe', bouton)).toMatch(
      new RegExp(`\\.${ext}$`),
    );
  }
  expect(await violations(page)).toEqual([]);
});

test('export, import JSON et copie de secours, sans violation', async ({ page }) => {
  const abime = { ...DOSSIER, grille: { ...DOSSIER.grille, totalPoints: 'vingt' } };
  await demarrer(page, '/#/donnees', JSON.stringify(abime));

  const attente = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger la copie de secours' }).click();
  expect((await attente).suggestedFilename()).toMatch(/copie-de-secours.*\.json$/);

  await page.getByLabel('Choisir un fichier .json').setInputFiles({
    name: 'dossier.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(DOSSIER)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Importer' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await violations(page)).toEqual([]);
});
