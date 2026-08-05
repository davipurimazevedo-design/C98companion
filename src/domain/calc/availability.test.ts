import { describe, expect, it } from 'vitest';

import { C98 } from '../../data/aircraft/index.ts';
import { crew, makePlan } from './__fixtures__/plan.ts';
import { pendingProfile, realProfile } from './__fixtures__/profile.ts';
import {
  computeAdditionalFuel,
  computeAvailability,
  computeTotalWeight,
} from './availability.ts';
import { computeTotals } from './totals.ts';

const totalsOf = (plan: Parameters<typeof computeTotals>[0]) =>
  computeTotals(plan, C98.positions);

describe('disponibilidade sem a ficha de pesagem', () => {
  const profile = pendingProfile();
  const totals = totalsOf(makePlan({ fuelLb: 900 }));

  it('não devolve peso total sem o peso básico', () => {
    const result = computeTotalWeight(totals, profile);
    expect(result.status).toBe('pending');
    if (result.status === 'pending') {
      expect(result.missing).toEqual(['Peso básico vazio']);
    }
  });

  it('não devolve disponibilidade, e o que falta é só o peso básico', () => {
    /* O peso máximo já está cadastrado a partir do manual. */
    const result = computeAvailability(totals, profile);
    expect(result.status).toBe('pending');
    if (result.status === 'pending') {
      expect(result.missing).toEqual(['Peso básico vazio']);
    }
  });

  it('não devolve combustível adicional', () => {
    expect(computeAdditionalFuel(totals, profile).status).toBe('pending');
  });
});

describe('disponibilidade com peso básico de 5.000 LB', () => {
  const profile = realProfile();

  it('calcula peso total, disponível, percentual e margem', () => {
    /* 80 + 75 kg de tripulação, 160 kg de passageiros,
       200 LB na zona 2, 1000 LB de combustível. */
    const totals = totalsOf(
      makePlan({
        crew: [crew('1', 80), crew('2', 75)],
        passengerLoads: { p45: 160 },
        positionLoads: { 'zona-2': 200 },
        fuelLb: 1000,
      }),
    );

    const result = computeAvailability(totals, profile);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;

    expect(result.value.totalWeightLb).toBeCloseTo(6894.456, 2);
    expect(result.value.maxWeightLb).toBe(8750);
    expect(result.value.availableLb).toBeCloseTo(1855.544, 2);
    expect(result.value.usedPct).toBeCloseTo(78.794, 2);
    expect(result.value.marginPct).toBeCloseTo(21.206, 2);
    expect(result.value.isExceeded).toBe(false);
  });

  it('acusa excesso quando o peso ultrapassa o máximo de decolagem', () => {
    const totals = totalsOf(
      makePlan({ positionLoads: { 'zona-2': 3100 }, fuelLb: 2224 }),
    );

    const result = computeAvailability(totals, profile);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;

    expect(result.value.totalWeightLb).toBe(10_324);
    expect(result.value.availableLb).toBe(-1574);
    expect(result.value.isExceeded).toBe(true);
    expect(result.value.exceededByLb).toBe(1574);
  });

  describe('combustível adicional', () => {
    it('é limitado pelo espaço nos tanques quando sobra muito peso', () => {
      const totals = totalsOf(makePlan({ fuelLb: 1000 }));
      const result = computeAdditionalFuel(totals, profile);

      /* Margem de peso: 3750 LB. Espaço no tanque: 2224 − 1000 = 1224 LB. */
      expect(result.status).toBe('ready');
      if (result.status === 'ready') expect(result.value).toBe(1224);
    });

    it('é limitado pela margem de peso quando os tanques comportam mais', () => {
      const totals = totalsOf(makePlan({ positionLoads: { 'zona-2': 3100 } }));
      const result = computeAdditionalFuel(totals, profile);

      /* Margem de peso: 8750 − 8100 = 650 LB. Espaço no tanque: 2224 LB. */
      expect(result.status).toBe('ready');
      if (result.status === 'ready') expect(result.value).toBe(650);
    });

    it('nunca é negativo quando o peso já foi excedido', () => {
      const totals = totalsOf(
        makePlan({ positionLoads: { 'zona-2': 3100 }, fuelLb: 2224 }),
      );
      const result = computeAdditionalFuel(totals, profile);

      expect(result.status).toBe('ready');
      if (result.status === 'ready') expect(result.value).toBe(0);
    });

    it('nunca é negativo quando os tanques já estão cheios', () => {
      const totals = totalsOf(makePlan({ fuelLb: 2224 }));
      const result = computeAdditionalFuel(totals, profile);

      expect(result.status).toBe('ready');
      if (result.status === 'ready') expect(result.value).toBe(0);
    });
  });
});
