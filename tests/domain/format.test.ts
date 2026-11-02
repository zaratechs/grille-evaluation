import { describe, it, expect } from 'vitest';
import { formaterPoids, formaterPourcentage, formaterPoints } from '../../src/domain/format';

/** Espace insécable : « 87,5 % » ne se coupe jamais en fin de ligne. */
const NBSP = '\u00A0';

describe('formaterPoids (dixièmes de pour cent)', () => {
  it.each([
    [167, '16,7'],
    [250, '25,0'],
    [5, '0,5'],
    [0, '0,0'],
    [1000, '100,0'],
  ])('%i → « %s % »', (dixiemes, attendu) => {
    expect(formaterPoids(dixiemes)).toBe(`${attendu}${NBSP}%`);
  });
});

describe('valeurs négatives (écart de pondération)', () => {
  it.each([
    [-5, `-0,5${NBSP}%`],
    [-100, `-10,0${NBSP}%`],
    [-1000, `-100,0${NBSP}%`],
  ])('%i → « %s »', (dixiemes, attendu) => {
    expect(formaterPoids(dixiemes)).toBe(attendu);
  });

  it('formate aussi des points négatifs', () => {
    expect(formaterPoints(-5)).toBe('-0,05');
    expect(formaterPoints(-100000)).toBe(`-1${NBSP}000,00`);
  });
});

describe('formaterPourcentage (dixièmes de pour cent)', () => {
  it('affiche une décimale, une virgule et une espace insécable', () => {
    expect(formaterPourcentage(875)).toBe(`87,5${NBSP}%`);
    expect(formaterPourcentage(0)).toBe(`0,0${NBSP}%`);
    expect(formaterPourcentage(1000)).toBe(`100,0${NBSP}%`);
  });
});

describe('formaterPoints (centièmes de point)', () => {
  it.each([
    [1750, '17,50'],
    [2000, '20,00'],
    [5, '0,05'],
    [50, '0,50'],
    [0, '0,00'],
    [99999, `999,99`],
    [100000, `1${NBSP}000,00`],
  ])('%i → « %s »', (centiemes, attendu) => {
    expect(formaterPoints(centiemes)).toBe(attendu);
  });
});
