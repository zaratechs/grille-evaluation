import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

describe('Version de Node', () => {
  const minimum = Number(/\d+/.exec(pkg.engines.node)?.[0]);

  it('exige au moins Node 22 (Node 20 n’est plus maintenu)', () => {
    expect(minimum).toBeGreaterThanOrEqual(22);
  });

  it('.nvmrc correspond au minimum de package.json', () => {
    expect(lire('.nvmrc').trim()).toBe(String(minimum));
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

  it.each(readdirSync(resolve(RACINE, 'src')))('décrit le dossier src/%s/', (dossier) => {
    expect(readme).toContain(`src/${dossier}/`);
  });

  it('explique où sont les données, avec le préfixe de clé réellement utilisé', () => {
    const prefixe = /PREFIXE = '([^']+)'/.exec(lire('src/data-access/stockage.ts'))?.[1];
    expect(prefixe).toBeDefined();
    expect(readme).toMatch(/^## Vos données$/m);
    expect(readme).toContain(`\`${prefixe}`);
    expect(readme).toMatch(/copie de secours/);
  });

  it('a une section « Maintenance » : dépendances, police et version', () => {
    expect(readme).toMatch(/^## Maintenance$/m);
    const section = readme.split(/^## Maintenance$/m)[1].split(/^## /m)[0];
    expect(section).toMatch(/Dependabot/);
    expect(section).toContain('npm run audit');
    expect(section).toMatch(/CHANGELOG/);
    // Les plages de la police réduite : les mêmes que dans l'en-tête de notoSans.ts.
    const plages = lire('src/export/polices/notoSans.ts').match(/U\+[0-9A-F]{4}(?:-[0-9A-F]{4})?/g);
    expect(plages.length).toBeGreaterThanOrEqual(7);
    for (const p of plages) expect(section).toContain(p);
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
