import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RACINE = resolve(import.meta.dirname, '../..');
const FICHIER = resolve(RACINE, 'vercel.json');

/** Les en-têtes appliqués à toutes les routes, en objet { nom: valeur }. */
function enTetes() {
  const config = JSON.parse(readFileSync(FICHIER, 'utf8'));
  const regle = config.headers.find((r) => r.source === '/(.*)');
  return Object.fromEntries(regle.headers.map((h) => [h.key, h.value]));
}

/** `default-src 'self'; img-src …` → { 'default-src': ["'self'"], … }. */
function directives(csp) {
  return Object.fromEntries(
    csp
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((d) => d[0] !== '')
      .map(([nom, ...valeurs]) => [nom, valeurs]),
  );
}

describe('vercel.json : en-têtes de sécurité', () => {
  it('existe et ne contient que des en-têtes', () => {
    expect(existsSync(FICHIER)).toBe(true);
    const config = JSON.parse(readFileSync(FICHIER, 'utf8'));
    expect(Object.keys(config).filter((k) => k !== '$schema')).toEqual(['headers']);
  });

  it('politique de sécurité stricte, pour toutes les routes', () => {
    expect(directives(enTetes()['Content-Security-Policy'])).toEqual({
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'none'"],
      'form-action': ["'none'"],
      'frame-ancestors': ["'none'"],
    });
  });

  it('jamais unsafe-eval ni unsafe-inline', () => {
    expect(enTetes()['Content-Security-Policy']).not.toMatch(/unsafe-/);
  });

  it('autres en-têtes', () => {
    const h = enTetes();
    expect(h['X-Content-Type-Options']).toBe('nosniff');
    expect(h['Referrer-Policy']).toBe('no-referrer');
    expect(h['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
  });
});
