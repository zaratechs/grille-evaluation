import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Exports sur le site construit : chaque fichier se télécharge, avec le bon nom et un
 * contenu valide ; jsPDF, docx et la police ne sont chargés qu'au premier clic.
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

const DATE = String.raw`\d{4}-\d{2}-\d{2}`;
/** Fichiers des rendus, tels que Vite les nomme dans `dist/assets/`. */
const RENDUS = /\/assets\/(pdf|word|csv)-[\w-]+\.js$/;

async function demarrer(page: Page, route: string) {
  await page.goto('/');
  await page.evaluate(
    ([cle, t]) => localStorage.setItem(cle as string, t as string),
    [CLE, JSON.stringify(DOSSIER)],
  );
  await page.goto(route);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Clique un bouton d'export et rend le nom et les octets du fichier téléchargé. */
async function telecharger(page: Page, groupe: string, bouton: string) {
  const attente = page.waitForEvent('download');
  await page.getByRole('group', { name: groupe }).getByRole('button', { name: bouton }).click();
  const fichier = await attente;
  return { nom: fichier.suggestedFilename(), octets: await readFile(await fichier.path()) };
}

test('les rendus ne sont chargés qu’au premier clic', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (r) => scripts.push(r.url()));
  await demarrer(page, '/#/evaluation');
  expect(scripts.filter((u) => RENDUS.test(u))).toEqual([]);

  await telecharger(page, 'Exporter cette personne', 'PDF');
  expect(scripts.some((u) => /\/assets\/pdf-/.test(u))).toBe(true);
  expect(scripts.some((u) => /\/assets\/word-/.test(u))).toBe(false);
});

test('une personne : PDF et Word', async ({ page }) => {
  await demarrer(page, '/#/evaluation');
  const pdf = await telecharger(page, 'Exporter cette personne', 'PDF');
  expect(pdf.nom).toMatch(new RegExp(`^grille-travail-de-session-elise-roy-${DATE}\\.pdf$`));
  expect(pdf.octets.subarray(0, 5).toString('latin1')).toBe('%PDF-');

  const word = await telecharger(page, 'Exporter cette personne', 'Word');
  expect(word.nom).toMatch(new RegExp(`^grille-travail-de-session-elise-roy-${DATE}\\.docx$`));
  expect(word.octets.subarray(0, 2).toString('latin1')).toBe('PK');
  await expect(page.getByText(/^Fichier prêt :/)).toContainText(word.nom);
});

test('tout le groupe : PDF, Word et CSV', async ({ page }) => {
  await demarrer(page, '/#/groupe');
  const groupe = 'Exporter tout le groupe';
  const pdf = await telecharger(page, groupe, 'PDF');
  expect(pdf.nom).toMatch(new RegExp(`^grille-travail-de-session-groupe-${DATE}\\.pdf$`));
  expect(pdf.octets.subarray(0, 5).toString('latin1')).toBe('%PDF-');

  const word = await telecharger(page, groupe, 'Word');
  expect(word.nom).toMatch(/-groupe-.+\.docx$/);
  expect(word.octets.subarray(0, 2).toString('latin1')).toBe('PK');

  const csv = await telecharger(page, groupe, 'CSV');
  expect(csv.nom).toMatch(/-groupe-.+\.csv$/);
  expect([...csv.octets.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  const texte = csv.octets.toString('utf8');
  expect(texte).toContain('"Élise Roy";"Complète";"16,80";"20";"84,0";"Très bon"');
  expect(texte).toContain('"Nguyễn Văn An";"Pas encore évaluée"');
});

test('axe : aucune violation pendant « Préparation… »', async ({ page }) => {
  // Le rendu PDF est retenu un instant, le temps d'analyser la page pendant la création.
  let liberer: () => void = () => {};
  const retenu = new Promise<void>((r) => (liberer = r));
  await page.route(/\/assets\/pdf-[\w-]+\.js$/, async (route) => {
    await retenu;
    await route.continue();
  });
  await demarrer(page, '/#/evaluation');
  const attente = page.waitForEvent('download');
  await page
    .getByRole('group', { name: 'Exporter cette personne' })
    .getByRole('button', { name: 'PDF' })
    .click();
  await expect(page.getByRole('button', { name: 'Préparation…' })).toBeVisible();
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(r.violations, r.violations.map((v) => `${v.id} — ${v.help}`).join('\n')).toEqual([]);
  liberer();
  await attente;
  await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible();
});
