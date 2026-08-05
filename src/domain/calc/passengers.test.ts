import { describe, expect, it } from 'vitest';

import { AVERAGE_PASSENGER_KG } from '../../data/operational.ts';
import { computePassengerCapacity } from './passengers.ts';
import { kgToLb } from './units.ts';

const averageLb = kgToLb(AVERAGE_PASSENGER_KG); // 90 kg ≈ 198,42 LB

/** Sem contagem a bordo: o peso é o único limite. */
const byWeightOnly = (availableLb: number) =>
  computePassengerCapacity({ availableLb, seats: 9, onBoard: null });

describe('capacidade por peso', () => {
  it('adota o peso médio cadastrado', () => {
    const capacity = byWeightOnly(0);
    expect(capacity.averageKg).toBe(90);
    expect(capacity.averageLb).toBeCloseTo(198.416, 3);
  });

  it('arredonda sempre para baixo', () => {
    /* 1.755,54 LB dão 8,85 passageiros — cabem 8, não 9. */
    expect(byWeightOnly(1755.544).count).toBe(8);
  });

  it('não conta um passageiro quando falta pouco para ele', () => {
    expect(byWeightOnly(averageLb - 0.01).count).toBe(0);
  });

  it('conta o passageiro no peso exato', () => {
    expect(byWeightOnly(averageLb).count).toBe(1);
    expect(byWeightOnly(averageLb * 3).count).toBe(3);
  });

  it('nunca devolve número negativo com o peso excedido', () => {
    expect(byWeightOnly(-1500).count).toBe(0);
  });

  it('sem contagem a bordo não fala de assentos livres', () => {
    const capacity = byWeightOnly(averageLb * 4);
    expect(capacity.freeSeats).toBeNull();
    expect(capacity.limitedBy).toBe('peso');
    expect(capacity.count).toBe(4);
  });

  it('nunca anuncia mais passageiros do que a aeronave tem assentos', () => {
    /* Aeronave vazia: o peso comporta 17, mas só há 9 lugares. */
    const capacity = byWeightOnly(averageLb * 17);
    expect(capacity.byWeight).toBe(17);
    expect(capacity.count).toBe(9);
    expect(capacity.limitedBy).toBe('assentos');
    expect(capacity.freeSeats).toBeNull();
  });
});

describe('capacidade limitada pelos assentos', () => {
  it('manda o menor entre peso e assentos livres', () => {
    /* Peso comporta 8, mas só há 2 assentos livres de 9. */
    const capacity = computePassengerCapacity({
      availableLb: 1755.544,
      seats: 9,
      onBoard: 7,
    });

    expect(capacity.byWeight).toBe(8);
    expect(capacity.freeSeats).toBe(2);
    expect(capacity.count).toBe(2);
    expect(capacity.limitedBy).toBe('assentos');
  });

  it('o peso continua mandando quando é o mais restritivo', () => {
    /* Peso comporta 1, e há 9 assentos livres. */
    const capacity = computePassengerCapacity({
      availableLb: averageLb,
      seats: 9,
      onBoard: 0,
    });

    expect(capacity.byWeight).toBe(1);
    expect(capacity.freeSeats).toBe(9);
    expect(capacity.count).toBe(1);
    expect(capacity.limitedBy).toBe('peso');
  });

  it('com todos os assentos ocupados não cabe mais ninguém', () => {
    const capacity = computePassengerCapacity({
      availableLb: 5000,
      seats: 9,
      onBoard: 9,
    });

    expect(capacity.freeSeats).toBe(0);
    expect(capacity.count).toBe(0);
    expect(capacity.limitedBy).toBe('assentos');
  });

  it('assentos livres nunca fica negativo com excesso de passageiros', () => {
    const capacity = computePassengerCapacity({
      availableLb: 5000,
      seats: 9,
      onBoard: 14,
    });

    expect(capacity.freeSeats).toBe(0);
    expect(capacity.count).toBe(0);
  });
});
