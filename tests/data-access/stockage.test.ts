import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  CLE_COPIE,
  CLE_DOSSIER,
  charger,
  enregistrer,
  reinitialiser,
} from '../../src/data-access/stockage';
import { ajouterCritere, changerPoids } from '../../src/domain/criteres';
import { dossierVide } from '../../src/domain/dossier';
import { ajouterEtudiant } from '../../src/domain/groupe';
import type { Migration } from '../../src/domain/migrations';
import type { Dossier } from '../../src/domain/types';

const valide = (r: { ok: true; valeur: Dossier } | { ok: false }): Dossier => {
  if (!r.ok) throw new Error('échec inattendu');
  return r.valeur;
};

/** Un dossier réel : un critère à 100 %, une personne. */
function dossier(): Dossier {
  let d = valide(ajouterCritere(dossierVide(), 'c1'));
  d = valide(changerPoids(d, 'c1', 1000));
  return valide(ajouterEtudiant(d, 'e1', 'Élise Roy'));
}

const ecrire = (texte: string) => localStorage.setItem(CLE_DOSSIER, texte);

/** Fait lever `methode` du stockage du navigateur (navigation privée, quota, refus). */
const faireEchouer = (methode: 'getItem' | 'setItem' | 'removeItem' | 'key') =>
  vi.spyOn(Storage.prototype, methode).mockImplementation(() => {
    throw new DOMException('refusé', 'QuotaExceededError');
  });

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('charger', () => {
  it('rien d’enregistré : dossier vide, sans avertissement', () => {
    expect(charger()).toEqual({ dossier: dossierVide(), source: 'defaut' });
  });

  it('sauvegarde intacte : rendue telle quelle', () => {
    ecrire(JSON.stringify(dossier()));
    expect(charger()).toEqual({ dossier: dossier(), source: 'stockage' });
    expect(localStorage.getItem(CLE_COPIE)).toBeNull();
  });

  it('sauvegarde d’une version antérieure : migrée', () => {
    const versionSuivante: Migration[] = [(d) => d];
    ecrire(JSON.stringify(dossier()));
    expect(charger(versionSuivante)).toEqual({ dossier: dossier(), source: 'migre' });
  });

  it('sauvegarde abîmée : réparée, avec bilan, originale gardée en copie de secours', () => {
    const abime = { ...dossier(), grille: { ...dossier().grille, totalPoints: 'vingt' } };
    const texte = JSON.stringify(abime);
    ecrire(texte);
    const r = charger();
    expect(r).toMatchObject({
      source: 'repare',
      avertissement: 'repare',
      sauvegardeOrigine: texte,
      bilan: { parametresCorriges: 1 },
    });
    expect(r.dossier.grille.totalPoints).toBe(100);
    expect(localStorage.getItem(CLE_COPIE)).toBe(texte);
    expect(localStorage.getItem(CLE_DOSSIER)).toBe(texte);
  });

  it.each([
    ['JSON illisible', '{ "version": 1, '],
    ['pas un dossier', '{ "version": 1 }'],
    ['sans version', '{ "grille": {} }'],
    ['une liste', '[1, 2]'],
  ])('%s : dossier vide, avertissement « illisible », originale gardée', (_, texte) => {
    ecrire(texte);
    expect(charger()).toEqual({
      dossier: dossierVide(),
      source: 'defaut',
      avertissement: 'illisible',
      sauvegardeOrigine: texte,
    });
    expect(localStorage.getItem(CLE_COPIE)).toBe(texte);
  });

  it('version future : dossier vide, avertissement dédié, originale gardée', () => {
    const texte = JSON.stringify({ ...dossier(), version: 99 });
    ecrire(texte);
    expect(charger()).toEqual({
      dossier: dossierVide(),
      source: 'defaut',
      avertissement: 'version-future',
      sauvegardeOrigine: texte,
    });
    expect(localStorage.getItem(CLE_COPIE)).toBe(texte);
  });

  it('stockage inaccessible : dossier vide, avertissement « lecture-impossible »', () => {
    faireEchouer('getItem');
    expect(charger()).toEqual({
      dossier: dossierVide(),
      source: 'defaut',
      avertissement: 'lecture-impossible',
    });
  });

  it('stockage absent (localStorage lui-même refusé) : même résultat, sans lever', () => {
    const descripteur = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('refusé', 'SecurityError');
      },
    });
    try {
      expect(charger()).toMatchObject({ source: 'defaut', avertissement: 'lecture-impossible' });
      expect(enregistrer(dossier())).toEqual({ ok: false, erreur: 'ecriture-impossible' });
    } finally {
      // Sans propriété propre, `localStorage` vient du prototype de window : on l'y rend.
      if (descripteur) Object.defineProperty(globalThis, 'localStorage', descripteur);
      else delete (globalThis as { localStorage?: Storage }).localStorage;
    }
    expect(localStorage.getItem(CLE_DOSSIER)).toBeNull();
  });

  it('copie de secours impossible à écrire : l’originale est quand même rendue', () => {
    ecrire('illisible');
    faireEchouer('setItem');
    expect(charger()).toMatchObject({ avertissement: 'illisible', sauvegardeOrigine: 'illisible' });
  });

  it('une seule copie de secours : la suivante remplace la précédente', () => {
    ecrire('première');
    charger();
    ecrire('seconde');
    charger();
    expect(localStorage.getItem(CLE_COPIE)).toBe('seconde');
  });
});

describe('enregistrer', () => {
  it('écrit le dossier, que charger relit à l’identique', () => {
    expect(enregistrer(dossier())).toEqual({ ok: true, valeur: null });
    expect(charger()).toEqual({ dossier: dossier(), source: 'stockage' });
  });

  it('ne touche pas à la copie de secours', () => {
    ecrire('illisible');
    charger();
    enregistrer(dossier());
    expect(localStorage.getItem(CLE_COPIE)).toBe('illisible');
  });

  it('espace plein ou navigation privée : code d’erreur, sans lever', () => {
    faireEchouer('setItem');
    expect(enregistrer(dossier())).toEqual({ ok: false, erreur: 'ecriture-impossible' });
  });
});

describe('reinitialiser', () => {
  it('supprime les données de l’application, et seulement elles', () => {
    enregistrer(dossier());
    localStorage.setItem(CLE_COPIE, 'x');
    localStorage.setItem('grille-evaluation:autre', 'y');
    localStorage.setItem('autre-application:donnees', 'z');
    expect(reinitialiser()).toEqual({ ok: true, valeur: null });
    expect(Object.keys(localStorage)).toEqual(['autre-application:donnees']);
  });

  it('stockage qui refuse : code d’erreur, sans lever', () => {
    enregistrer(dossier());
    faireEchouer('removeItem');
    expect(reinitialiser()).toEqual({ ok: false, erreur: 'ecriture-impossible' });
  });
});
