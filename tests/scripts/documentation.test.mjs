import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RACINE = resolve(import.meta.dirname, '../..');
const lire = (f) =>
  existsSync(resolve(RACINE, f)) ? readFileSync(resolve(RACINE, f), 'utf8') : '';
const pkg = JSON.parse(lire('package.json'));
const LEGALCODE = 'https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.fr';

describe('LICENSE', () => {
  const licence = lire('LICENSE');

  it('existe et déclare CC BY-NC-SA 4.0 avec le lien vers le texte légal', () => {
    expect(licence).toMatch(/CC BY-NC-SA 4\.0/);
    expect(licence).toContain(LEGALCODE);
  });

  it('nomme les deux auteurs et leur part', () => {
    expect(licence).toMatch(/Paulo Mendonça/);
    expect(licence).toMatch(/Réda Hamza/);
  });

  it('ne réserve aucun droit en plus de la licence', () => {
    expect(licence).not.toMatch(/tous droits réservés/i);
  });
});

describe('package.json', () => {
  it('déclare la licence au format SPDX', () => {
    expect(pkg.license).toBe('CC-BY-NC-SA-4.0');
  });
});

describe('README', () => {
  const readme = lire('README.md');

  it.each(Object.keys(pkg.scripts))('documente le script « %s »', (script) => {
    expect(readme).toContain(`npm run ${script}`);
  });

  it('documente la version minimale de Node déclarée dans package.json', () => {
    const minimum = /\d+/.exec(pkg.engines.node)?.[0];
    expect(minimum).toBeDefined();
    expect(readme).toMatch(new RegExp(`Node\\.js ${minimum}`));
  });

  it('mentionne la licence et crédite Paulo Mendonça', () => {
    expect(readme).toMatch(/CC BY-NC-SA 4\.0/);
    expect(readme).toMatch(/Paulo Mendonça/);
  });

  it('explique le déploiement sur Vercel', () => {
    expect(readme).toMatch(/Vercel/);
    expect(readme).toContain('dist');
  });
});

describe('CHANGELOG', () => {
  const changelog = lire('CHANGELOG.md');

  it('suit Keep a Changelog avec une section « Non publié »', () => {
    expect(changelog).toMatch(/Keep a Changelog/);
    expect(changelog).toMatch(/^## \[Non publié\]$/m);
    expect(changelog).toMatch(/^### Ajouté$/m);
  });
});
