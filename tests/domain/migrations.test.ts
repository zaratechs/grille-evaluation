import { describe, it, expect } from 'vitest';
import { dossierVide } from '../../src/domain/dossier';
import { MIGRATIONS, VERSION_COURANTE, migrer, type Migration } from '../../src/domain/migrations';
import { critere, dossierAvec, etudiant } from './outils/fabrique';

describe('format versionné', () => {
  it('la version courante suit la liste des migrations', () => {
    expect(VERSION_COURANTE).toBe(MIGRATIONS.length + 1);
    expect(dossierVide().version).toBe(VERSION_COURANTE);
  });

  it('un dossier à la version courante ressort identique', () => {
    const d = dossierAvec([critere('a', 1000)], [etudiant('e1', { a: 3 })]);
    expect(migrer(d)).toEqual({ ok: true, valeur: d });
  });

  it('renvoie une copie, jamais l’objet reçu', () => {
    const d = dossierVide();
    const r = migrer(d);
    expect(r.ok && r.valeur).not.toBe(d);
  });
});

describe('chaîne de migrations', () => {
  const appels: string[] = [];
  // Migrations de test : 1 → 2 renomme un champ, 2 → 3 en ajoute un.
  const migrations: Migration[] = [
    (d) => {
      appels.push('1→2');
      const { ancien, ...reste } = d;
      return { ...reste, nouveau: ancien };
    },
    (d) => {
      appels.push('2→3');
      return { ...d, ajoute: true };
    },
  ];

  it('applique chaque migration dans l’ordre et met la version à jour', () => {
    appels.length = 0;
    expect(migrer({ version: 1, ancien: 'x' }, migrations)).toEqual({
      ok: true,
      valeur: { version: 3, nouveau: 'x', ajoute: true },
    });
    expect(appels).toEqual(['1→2', '2→3']);
  });

  it('part de la version des données', () => {
    appels.length = 0;
    expect(migrer({ version: 2, nouveau: 'y' }, migrations)).toEqual({
      ok: true,
      valeur: { version: 3, nouveau: 'y', ajoute: true },
    });
    expect(appels).toEqual(['2→3']);
  });

  it('ne modifie jamais les données reçues, même si une migration les modifie', () => {
    const fautive: Migration[] = [
      (d) => {
        d['modifie'] = true;
        return d;
      },
    ];
    const donnees = { version: 1, champ: [1, 2] };
    const copie = structuredClone(donnees);
    migrer(donnees, fautive);
    expect(donnees).toEqual(copie);
  });
});

describe('données refusées', () => {
  it.each([
    ['absente', {}],
    ['texte', { version: '1' }],
    ['décimale', { version: 1.5 }],
    ['zéro', { version: 0 }],
    ['négative', { version: -1 }],
  ])('version %s : version-inconnue', (_, donnees) => {
    expect(migrer(donnees)).toEqual({ ok: false, erreur: 'version-inconnue' });
  });

  it.each([null, undefined, 'texte', 42, [1, 2]])('%s : version-inconnue', (donnees) => {
    expect(migrer(donnees)).toEqual({ ok: false, erreur: 'version-inconnue' });
  });

  it('version future : version-future, données intactes', () => {
    const donnees = { version: VERSION_COURANTE + 1, grille: {} };
    const copie = structuredClone(donnees);
    expect(migrer(donnees)).toEqual({ ok: false, erreur: 'version-future' });
    expect(donnees).toEqual(copie);
  });
});
