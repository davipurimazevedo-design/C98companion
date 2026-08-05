import { describe, expect, it } from 'vitest';

import { KG_TO_LB } from '../../data/conversion.ts';
import { kgToLb, lbToKg, sumKgToLb, sumLb } from './units.ts';

describe('conversão de unidades', () => {
  it('converte quilogramas em libras', () => {
    expect(kgToLb(1)).toBeCloseTo(KG_TO_LB, 9);
    expect(kgToLb(100)).toBeCloseTo(220.462_262_185, 6);
  });

  it('converte zero sem alterar', () => {
    expect(kgToLb(0)).toBe(0);
    expect(lbToKg(0)).toBe(0);
  });

  it('ida e volta preserva o valor', () => {
    expect(lbToKg(kgToLb(83.4))).toBeCloseTo(83.4, 9);
  });

  it('soma de pesos em quilogramas equivale à soma convertida', () => {
    expect(sumKgToLb([80, 75, 68])).toBeCloseTo(kgToLb(223), 9);
  });

  it('soma de lista vazia é zero', () => {
    expect(sumKgToLb([])).toBe(0);
    expect(sumLb([])).toBe(0);
  });

  it('soma pesos já em libras sem converter', () => {
    expect(sumLb([200, 300.5, 0])).toBe(500.5);
  });
});
