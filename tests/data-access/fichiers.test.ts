import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { lireFichier, telecharger } from '../../src/data-access/fichiers';
import { TAILLE_MAX_IMPORT } from '../../src/data-access/portabilite';

describe('telecharger', () => {
  // jsdom ne fournit pas URL.createObjectURL ; on l'imite et on intercepte le clic.
  let creer: ReturnType<typeof vi.fn>;
  let liberer: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers();
    creer = vi.fn(() => 'blob:fichier');
    liberer = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL: creer, revokeObjectURL: liberer });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('crée le fichier, le propose au téléchargement, puis le libère', async () => {
    const clics: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clics.push(this);
    });

    telecharger('grille-session-2026-11-02.json', '{"version":1}', 'application/json');

    const blob = creer.mock.calls[0]?.[0] as Blob;
    expect(blob.type).toBe('application/json');
    expect(await blob.text()).toBe('{"version":1}');
    expect(clics).toHaveLength(1);
    expect(clics[0]?.download).toBe('grille-session-2026-11-02.json');
    expect(clics[0]?.href).toBe('blob:fichier');
    expect(document.querySelector('a')).toBeNull();

    expect(liberer).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(liberer).toHaveBeenCalledWith('blob:fichier');
  });
});

describe('lireFichier', () => {
  it('renvoie le texte du fichier', async () => {
    const fichier = new File(['{"version":1}'], 'dossier.json', { type: 'application/json' });
    expect(await lireFichier(fichier)).toEqual({ ok: true, valeur: '{"version":1}' });
  });

  it('refuse un fichier de plus de 5 Mo sans le lire', async () => {
    const fichier = new File(['x'], 'gros.json');
    Object.defineProperty(fichier, 'size', { value: TAILLE_MAX_IMPORT + 1 });
    const lecture = vi.spyOn(fichier, 'text');
    expect(await lireFichier(fichier)).toEqual({ ok: false, erreur: 'fichier-trop-gros' });
    expect(lecture).not.toHaveBeenCalled();
  });

  it('signale un fichier illisible, sans lever', async () => {
    const fichier = new File(['x'], 'abime.json');
    vi.spyOn(fichier, 'text').mockRejectedValue(new DOMException('illisible', 'NotReadableError'));
    expect(await lireFichier(fichier)).toEqual({ ok: false, erreur: 'fichier-illisible' });
  });
});
