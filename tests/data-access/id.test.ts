import { afterEach, describe, it, expect, vi } from 'vitest';
import { nouvelId } from '../../src/data-access/id';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('nouvelId', () => {
  it('utilise crypto.randomUUID quand il existe', () => {
    vi.stubGlobal('crypto', { randomUUID: () => '11111111-2222-4333-8444-555555555555' });
    expect(nouvelId()).toBe('11111111-2222-4333-8444-555555555555');
  });

  it('donne un UUID par défaut dans le navigateur', () => {
    expect(nouvelId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it.each([
    ['sans crypto', undefined],
    ['sans randomUUID (page non sécurisée, navigateur ancien)', {}],
  ])('se replie %s, avec des identifiants tous distincts', (_, crypto) => {
    vi.stubGlobal('crypto', crypto);
    const ids = Array.from({ length: 1000 }, () => nouvelId());
    expect(new Set(ids).size).toBe(1000);
    expect(ids.every((id) => /^id-[0-9a-z]+-[0-9a-z]+-[0-9a-z]+$/.test(id))).toBe(true);
  });
});
