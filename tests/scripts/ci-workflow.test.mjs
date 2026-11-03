import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RACINE = resolve(import.meta.dirname, '../..');
const WORKFLOW = resolve(RACINE, '.github/workflows/ci.yml');
const pkg = JSON.parse(readFileSync(resolve(RACINE, 'package.json'), 'utf8'));

/** Scripts appelés par `npm run ci`, dans l'ordre. */
const etapesLocales = () => [...pkg.scripts.ci.matchAll(/npm run ([\w:]+)/g)].map((m) => m[1]);

/** Scripts appelés par les lignes `- run: npm run …` du workflow, dans l'ordre. */
const etapesWorkflow = (yml) =>
  [...yml.matchAll(/^\s*- run: npm run ([\w:]+)\s*$/gm)].map((m) => m[1]);

describe('workflow CI', () => {
  it('existe', () => {
    expect(existsSync(WORKFLOW)).toBe(true);
  });

  const yml = existsSync(WORKFLOW) ? readFileSync(WORKFLOW, 'utf8') : '';

  it('exécute les mêmes étapes que `npm run ci`, dans le même ordre', () => {
    expect(etapesLocales().length).toBeGreaterThanOrEqual(6);
    expect(etapesWorkflow(yml)).toEqual(etapesLocales());
  });

  it('audite les dépendances livrées (failles graves) avant les tests', () => {
    expect(pkg.scripts.audit).toBe('npm audit --omit=dev --audit-level=high');
    expect(etapesLocales()).toContain('audit');
    expect(etapesLocales().indexOf('audit')).toBeLessThan(etapesLocales().indexOf('test:coverage'));
  });

  it('n’utilise que des actions qui tournent sur Node 24 (Node 20 n’est plus pris en charge)', () => {
    // Première version majeure de chaque action sur Node 24.
    const minimum = { checkout: 5, 'setup-node': 5, cache: 5, 'upload-artifact': 6 };
    const actions = [...yml.matchAll(/uses: actions\/([\w-]+)@v(\d+)/g)];
    expect(actions.map((a) => a[1]).sort()).toEqual(Object.keys(minimum).sort());
    for (const [, nom, version] of actions) {
      expect(Number(version), nom).toBeGreaterThanOrEqual(minimum[nom]);
    }
  });

  it('se déclenche sur main et sur les pull requests', () => {
    expect(yml).toMatch(/push:\s*\n\s*branches:\s*\[main\]/);
    expect(yml).toMatch(/^\s*pull_request:/m);
  });

  it('installe avec npm ci (lockfile respecté)', () => {
    expect(yml).toMatch(/^\s*- run: npm ci\s*$/m);
  });

  it('installe Chromium pour Playwright avant les tests de bout en bout', () => {
    const install = yml.indexOf('playwright install --with-deps chromium');
    const e2e = yml.indexOf('npm run test:e2e');
    expect(install).toBeGreaterThan(-1);
    expect(install).toBeLessThan(e2e);
  });

  it('conserve le rapport Playwright en cas d’échec', () => {
    expect(yml).toMatch(/if: failure\(\)/);
    expect(yml).toMatch(/path: playwright-report\//);
  });
});
