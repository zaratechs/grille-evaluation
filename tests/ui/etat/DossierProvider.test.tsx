import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { CLE_DOSSIER } from '../../../src/data-access';
import { changerTitre, dossierVide, ok, type Dossier } from '../../../src/domain';
import { DossierProvider, useDossier } from '../../../src/ui/etat';

const monter = () => renderHook(() => useDossier(), { wrapper: DossierProvider });

const titre = (d: Dossier, t: string) => changerTitre(d, t);

const sauvegarde = (): Dossier | null => {
  const texte = localStorage.getItem(CLE_DOSSIER);
  return texte === null ? null : (JSON.parse(texte) as Dossier);
};

/** Simule l'événement envoyé quand un autre onglet modifie le stockage. */
const autreOnglet = () =>
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: CLE_DOSSIER }));
  });

afterEach(() => vi.restoreAllMocks());

describe('chargement', () => {
  it('sans sauvegarde : dossier vide, aucun avis, rien d’écrit', () => {
    const { result } = monter();
    expect(result.current.dossier).toEqual(dossierVide());
    expect(result.current.avis).toEqual([]);
    expect(result.current.lectureSeule).toBe(false);
    expect(localStorage.getItem(CLE_DOSSIER)).toBeNull();
  });

  it('reprend la sauvegarde', () => {
    const d = { ...dossierVide(), grille: { ...dossierVide().grille, titre: 'Session' } };
    localStorage.setItem(CLE_DOSSIER, JSON.stringify(d));
    expect(monter().result.current.dossier).toEqual(d);
  });

  it('sauvegarde réparée : avis avec le bilan et le téléchargement de l’originale', () => {
    const abime = { ...dossierVide(), grille: { ...dossierVide().grille, totalPoints: 'vingt' } };
    localStorage.setItem(CLE_DOSSIER, JSON.stringify(abime));
    const { result } = monter();
    expect(result.current.avis).toEqual([
      expect.objectContaining({
        cle: 'chargement',
        importance: 'alerte',
        texte: expect.stringMatching(/réparée/),
        details: ['1 paramètre corrigé'],
        actions: ['telecharger-originale'],
        fermable: true,
      }),
    ]);
    expect(result.current.sauvegardeOrigine).toBe(JSON.stringify(abime));
  });

  it.each([
    ['illisible', '{ abîmé', /n’a pas pu être lue/],
    ['version future', JSON.stringify({ ...dossierVide(), version: 99 }), /plus récente/],
  ])('sauvegarde %s : avis avec le téléchargement de l’originale', (_, texte, message) => {
    localStorage.setItem(CLE_DOSSIER, texte);
    const { result } = monter();
    expect(result.current.dossier).toEqual(dossierVide());
    expect(result.current.avis).toEqual([
      expect.objectContaining({
        texte: expect.stringMatching(message),
        actions: ['telecharger-originale'],
      }),
    ]);
    expect(result.current.sauvegardeOrigine).toBe(texte);
  });

  it('stockage inaccessible : avis permanent, et aucune tentative d’écriture', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('refusé', 'SecurityError');
    });
    const ecrire = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = monter();
    expect(result.current.avis).toEqual([
      expect.objectContaining({ actions: ['aller-donnees'], fermable: false }),
    ]);
    act(() => void result.current.modifier((d) => titre(d, 'Session')));
    expect(result.current.dossier.grille.titre).toBe('Session');
    expect(ecrire).not.toHaveBeenCalled();
    expect(result.current.avis).toHaveLength(1);
  });

  it('« Fermer » retire un avis fermable', () => {
    localStorage.setItem(CLE_DOSSIER, '{ abîmé');
    const { result } = monter();
    act(() => result.current.fermerAvis('chargement'));
    expect(result.current.avis).toEqual([]);
  });
});

describe('modifier', () => {
  it('opération réussie : nouveau dossier, enregistré aussitôt, résultat rendu', () => {
    const { result } = monter();
    let r: ReturnType<typeof result.current.modifier> | undefined;
    act(() => {
      r = result.current.modifier((d) => titre(d, 'Session'));
    });
    expect(r).toMatchObject({ ok: true });
    expect(result.current.dossier.grille.titre).toBe('Session');
    expect(sauvegarde()?.grille.titre).toBe('Session');
  });

  it('enchaîne deux modifications dans le même geste sans en perdre', () => {
    const { result } = monter();
    act(() => {
      result.current.modifier((d) => titre(d, 'A'));
      result.current.modifier((d) => titre(d, `${d.grille.titre}B`));
    });
    expect(result.current.dossier.grille.titre).toBe('AB');
    expect(sauvegarde()?.grille.titre).toBe('AB');
  });

  it('opération refusée : dossier inchangé, rien d’écrit, code d’erreur rendu', () => {
    const { result } = monter();
    let r: ReturnType<typeof result.current.modifier> | undefined;
    act(() => {
      r = result.current.modifier((d) => changerTitre(d, 'x'.repeat(201)));
    });
    expect(r).toEqual({ ok: false, erreur: 'nom-trop-long' });
    expect(result.current.dossier).toEqual(dossierVide());
    expect(localStorage.getItem(CLE_DOSSIER)).toBeNull();
  });

  it('écriture impossible : avis « exporter », retiré au prochain enregistrement réussi', () => {
    const { result } = monter();
    const ecrire = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('plein', 'QuotaExceededError');
    });
    act(() => void result.current.modifier((d) => titre(d, 'A')));
    expect(result.current.dossier.grille.titre).toBe('A');
    expect(result.current.avis).toEqual([
      expect.objectContaining({ cle: 'ecriture', actions: ['exporter'], fermable: false }),
    ]);

    ecrire.mockRestore();
    act(() => void result.current.modifier((d) => titre(d, 'B')));
    expect(result.current.avis).toEqual([]);
    expect(sauvegarde()?.grille.titre).toBe('B');
  });

  it('remplacer le dossier entier (import, remise à zéro) passe aussi par modifier', () => {
    const { result } = monter();
    const nouveau = { ...dossierVide(), grille: { ...dossierVide().grille, titre: 'Importé' } };
    act(() => void result.current.modifier(() => ok(nouveau)));
    expect(sauvegarde()).toEqual(nouveau);
  });
});

describe('autre onglet', () => {
  it('avis « Recharger », lecture seule, et plus aucune écriture', () => {
    const { result } = monter();
    act(() => void result.current.modifier((d) => titre(d, 'Ici')));
    autreOnglet();
    expect(result.current.lectureSeule).toBe(true);
    expect(result.current.avis).toEqual([
      expect.objectContaining({ cle: 'autre-onglet', actions: ['recharger'], fermable: false }),
    ]);

    localStorage.setItem(CLE_DOSSIER, '"travail de l’autre onglet"');
    let r: ReturnType<typeof result.current.modifier> | undefined;
    act(() => {
      r = result.current.modifier((d) => titre(d, 'Écrasé'));
    });
    expect(r).toEqual({ ok: false, erreur: 'ecriture-impossible' });
    expect(result.current.dossier.grille.titre).toBe('Ici');
    expect(localStorage.getItem(CLE_DOSSIER)).toBe('"travail de l’autre onglet"');
  });

  it('un seul avis, même si l’autre onglet écrit plusieurs fois', () => {
    const { result } = monter();
    autreOnglet();
    autreOnglet();
    expect(result.current.avis).toHaveLength(1);
  });

  it('l’écoute s’arrête quand l’application disparaît', () => {
    const retirer = vi.spyOn(window, 'removeEventListener');
    monter().unmount();
    expect(retirer).toHaveBeenCalledWith('storage', expect.any(Function));
  });
});

describe('useDossier', () => {
  it('lève une erreur claire hors du fournisseur', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useDossier())).toThrow(/DossierProvider/);
  });
});
