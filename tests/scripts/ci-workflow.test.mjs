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
