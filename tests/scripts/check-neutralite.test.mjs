import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan, scanRepo, FORBIDDEN } from '../../scripts/check-neutralite.mjs';

// Ce fichier est lui-même scanné : les termes interdits sont donc assemblés à
// l'exécution pour ne jamais apparaître en clair dans le source.
const j = (...morceaux) => morceaux.join('');
const ETABLISSEMENTS = [
  j('Marie', '-Victorin'),
  j('Marie ', 'Victorin'),
  j('C', 'MV'),
  j('C', 'VM'),
  j('Collège de ', 'Maisonneuve'),
  j('André', '-Laurendeau'),
  j('cla', 'urendeau'),
];
const COURRIEL = j('quelqu.un', '@', 'exemple.qc.ca');

let racines = [];
function depotTemporaire(fichiers) {
  const racine = mkdtempSync(join(tmpdir(), 'neutralite-'));
  racines.push(racine);
  for (const [chemin, contenu] of Object.entries(fichiers)) {
    const complet = join(racine, chemin);
    mkdirSync(join(complet, '..'), { recursive: true });
    writeFileSync(complet, contenu);
  }
  return racine;
}
const fichiersTouches = (hits) => hits.map((h) => h.file.replace(/\\/g, '/')).sort();

afterEach(() => {
  for (const r of racines) rmSync(r, { recursive: true, force: true });
  racines = [];
});

describe('FORBIDDEN', () => {
  it('déclare des motifs avec un libellé et une expression', () => {
    expect(FORBIDDEN.length).toBeGreaterThanOrEqual(5);
    for (const motif of FORBIDDEN) {
      expect(typeof motif.label).toBe('string');
      expect(motif.re).toBeInstanceOf(RegExp);
      expect(motif.re.global).toBe(false); // un drapeau g rendrait test() imprévisible
    }
  });
});

describe('scan', () => {
  it.each(ETABLISSEMENTS)('détecte « %s »', (terme) => {
    const hits = scan(`Texte qui mentionne ${terme} au milieu.`, 'exemple.md');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]).toMatchObject({ file: 'exemple.md', line: 1, label: expect.any(String) });
  });

  it('détecte une adresse courriel et donne le bon numéro de ligne', () => {
    const hits = scan(`ligne 1\nligne 2\nÉcrire à ${COURRIEL}\n`, 'page.tsx');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ file: 'page.tsx', line: 3, label: 'Adresse courriel' });
  });

  it('détecte un lien mailto', () => {
    expect(scan(`<a href="mailto:${COURRIEL}">`, 'x.tsx').length).toBeGreaterThan(0);
  });

  it('laisse passer le crédit à Paulo Mendonça', () => {
    expect(scan('Modèles de grilles : Paulo Mendonça, Conseiller pédagogique TIC', 'x.md')).toEqual(
      [],
    );
  });

  it('laisse passer les noms de paquets npm et les versions', () => {
    expect(scan('"@axe-core/playwright": "^4.13.0"', 'package.json')).toEqual([]);
    expect(scan('installer react@19.2.8 puis vite@8.3.5', 'README.md')).toEqual([]);
  });

  it('laisse passer un texte neutre', () => {
    expect(scan('Outil proposé à tout cégep qui voudrait l’utiliser.', 'x.md')).toEqual([]);
  });

  it('tronque le texte rapporté à 120 caractères', () => {
    const hits = scan(`${'a'.repeat(200)} ${COURRIEL}`, 'x.md');
    expect(hits[0].text.length).toBeLessThanOrEqual(120);
  });
});

describe('scanRepo', () => {
  it('trouve un terme planté dans chaque zone livrée', () => {
    const terme = ETABLISSEMENTS[0];
    const racine = depotTemporaire({
      'src/ui/Page.tsx': terme,
      'app/main.tsx': terme,
      'scripts/outil.mjs': terme,
      'tests/ui/page.test.tsx': terme,
      '.github/workflows/ci.yml': terme,
      'public/maintenance.json': terme,
      'README.md': terme,
      'CHANGELOG.md': terme,
      LICENSE: terme,
      'index.html': terme,
    });
    expect(fichiersTouches(scanRepo(racine))).toEqual(
      [
        '.github/workflows/ci.yml',
        'CHANGELOG.md',
        'LICENSE',
        'README.md',
        'app/main.tsx',
        'index.html',
        'public/maintenance.json',
        'scripts/outil.mjs',
        'src/ui/Page.tsx',
        'tests/ui/page.test.tsx',
      ].sort(),
    );
  });

  it('ignore node_modules, docs/superpowers, le script lui-même et les extensions non textuelles', () => {
    const terme = ETABLISSEMENTS[0];
    const racine = depotTemporaire({
      'node_modules/paquet/index.js': terme,
      'src/node_modules/x.js': terme,
      'docs/superpowers/specs/spec.md': terme,
      'scripts/check-neutralite.mjs': terme,
      'src/ui/image.png': terme,
      'src/ui/propre.tsx': 'contenu neutre',
    });
    expect(scanRepo(racine)).toEqual([]);
  });

  it('tolère une zone absente', () => {
    const racine = depotTemporaire({ 'README.md': 'neutre' });
    expect(scanRepo(racine)).toEqual([]);
  });

  it('le dépôt livré est neutre', () => {
    expect(scanRepo()).toEqual([]);
  });
});
