import { afterEach, describe, it, expect, vi } from 'vitest';
import { surveillerAutresOnglets } from '../../src/data-access/onglets';
import { CLE_COPIE, CLE_DOSSIER } from '../../src/data-access/stockage';

/** Simule l'événement que le navigateur envoie quand un autre onglet modifie le stockage. */
const autreOnglet = (key: string | null) =>
  window.dispatchEvent(new StorageEvent('storage', { key }));

let arreter: (() => void) | undefined;
afterEach(() => arreter?.());

describe('surveillerAutresOnglets', () => {
  it('prévient quand un autre onglet enregistre le dossier', () => {
    const rappel = vi.fn();
    arreter = surveillerAutresOnglets(rappel);
    autreOnglet(CLE_DOSSIER);
    expect(rappel).toHaveBeenCalledTimes(1);
  });

  it('prévient quand un autre onglet vide tout le stockage', () => {
    const rappel = vi.fn();
    arreter = surveillerAutresOnglets(rappel);
    autreOnglet(null);
    expect(rappel).toHaveBeenCalledTimes(1);
  });

  it('ignore les autres clés, y compris la copie de secours', () => {
    const rappel = vi.fn();
    arreter = surveillerAutresOnglets(rappel);
    autreOnglet(CLE_COPIE);
    autreOnglet('autre-application:donnees');
    expect(rappel).not.toHaveBeenCalled();
  });

  it('ne prévient plus après l’arrêt', () => {
    const rappel = vi.fn();
    surveillerAutresOnglets(rappel)();
    autreOnglet(CLE_DOSSIER);
    expect(rappel).not.toHaveBeenCalled();
  });
});
