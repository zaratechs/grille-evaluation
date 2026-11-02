import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { contraste, lire, lireTokens, listerFichiers, trouverHex } from './outils/couleurs';

const RACINE = resolve(__dirname, '../..');
const TOKENS = resolve(RACINE, 'src/ui/tokens.css');

describe('outils de couleur', () => {
  it('trouverHex détecte les hex et ignore les ancres et entités', () => {
    expect(trouverHex('color: #0c4a6e; background:#FFF; border: #abcd; x: #11223344')).toEqual([
      '#0c4a6e',
      '#FFF',
      '#abcd',
      '#11223344',
    ]);
    expect(trouverHex('<a href="#/transparence">')).toEqual([]);
    expect(trouverHex('<a href="#accueil">')).toEqual([]);
    expect(trouverHex('&#123; et #12345')).toEqual([]);
  });

  it('contraste suit la formule WCAG (noir/blanc = 21, identiques = 1)', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contraste('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contraste('#777777', '#777777')).toBeCloseTo(1, 5);
    expect(contraste('#767676', '#ffffff')).toBeGreaterThan(4.5); // gris AA de référence
  });

  it('contraste refuse une couleur qui n’est pas #rrggbb', () => {
    expect(() => contraste('red', '#ffffff')).toThrow();
  });

  it('lireTokens résout les var(--color-*)', () => {
    const t = lireTokens('--color-a: #112233; --color-b: var(--color-a);');
    expect(t).toEqual({ a: '#112233', b: '#112233' });
  });
});

describe('tokens.css', () => {
  it('existe', () => {
    expect(existsSync(TOKENS)).toBe(true);
  });

  const tokens = existsSync(TOKENS) ? lireTokens(lire(TOKENS)) : {};
  const t = (nom: string) => {
    const v = tokens[nom];
    if (!v) throw new Error(`token manquant : --color-${nom}`);
    return v;
  };

  it('déclare les tokens attendus', () => {
    for (const nom of [
      'marque-50',
      'marque-100',
      'marque-600',
      'marque-700',
      'marque-800',
      'surface',
      'surface-attenue',
      'texte',
      'texte-attenue',
      'bordure',
      'bordure-champ',
      'focus',
      'statut-info',
      'statut-info-fond',
      'statut-ok',
      'statut-ok-fond',
      'statut-avertissement',
      'statut-avertissement-fond',
      'statut-erreur',
      'statut-erreur-fond',
    ]) {
      expect(tokens, nom).toHaveProperty(nom);
    }
  });

  it.each([
    ['texte', 'surface'],
    ['texte', 'surface-attenue'],
    ['texte-attenue', 'surface'],
    ['texte-attenue', 'surface-attenue'],
    ['marque-700', 'surface'],
    ['marque-700', 'marque-50'],
    ['surface', 'marque-700'],
    ['statut-info', 'statut-info-fond'],
    ['statut-ok', 'statut-ok-fond'],
    ['statut-avertissement', 'statut-avertissement-fond'],
    ['statut-erreur', 'statut-erreur-fond'],
  ])('texte %s sur %s : contraste AA ≥ 4,5', (avant, fond) => {
    expect(contraste(t(avant), t(fond))).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['bordure-champ', 'surface'],
    ['focus', 'surface'],
    ['focus', 'surface-attenue'],
  ])('élément d’interface %s sur %s : contraste ≥ 3', (avant, fond) => {
    expect(contraste(t(avant), t(fond))).toBeGreaterThanOrEqual(3);
  });
});

describe('aucun hex hors de tokens.css', () => {
  it('src/ui et app ne contiennent aucune couleur en dur', () => {
    const fichiers = [
      ...listerFichiers(resolve(RACINE, 'src/ui'), ['.ts', '.tsx', '.css']),
      ...listerFichiers(resolve(RACINE, 'app'), ['.ts', '.tsx', '.css']),
    ].filter((f) => f !== TOKENS);
    const fautes = fichiers.flatMap((f) =>
      trouverHex(lire(f)).map((hex) => `${relative(RACINE, f)} : ${hex}`),
    );
    expect(fautes).toEqual([]);
  });
});
