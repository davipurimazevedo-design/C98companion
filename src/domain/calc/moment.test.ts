/**
 * Conferência do cálculo de momento contra o exemplo resolvido do manual.
 *
 * Fonte: Figura 6-16, Sample Loading Problem (Cargo Loading Shown), página 6-55.
 * É a validação mais forte que temos: um carregamento completo, com os valores
 * publicados linha a linha e o total declarado pela própria Cessna.
 *
 * O exemplo é um carregamento de carga, sem passageiros traseiros — o que o
 * torna reproduzível linha a linha.
 */

import { describe, expect, it } from 'vitest';

import { C98 } from '../../data/aircraft/index.ts';
import type { AircraftProfile } from '../../data/aircraft/types.ts';
import { kgToLb, lbToKg } from './units.ts';
import { computeMoment, fuelMoment1000 } from './moment.ts';
import { makePlan } from './__fixtures__/plan.ts';
import { C98_PASSENGER_STATIONS } from '../../data/aircraft/c98.seats.ts';

const STATIONS = C98_PASSENGER_STATIONS.escalonada;

/** A aeronave do exemplo: 4.575 LB de peso básico, momento 846.500 lb·pol. */
const SAMPLE_AIRCRAFT: AircraftProfile = {
  model: C98,
  registration: {
    id: 'exemplo',
    tail: 'EXEMPLO',
    basicEmptyWeightLb: 4575,
    basicMoment: 846_500,
    weighingDate: null,
    hasCargoPod: true,
    passengerSeats: 9,
    seatingArrangement: 'escalonada',
  },
};

/** O carregamento do exemplo, exatamente como publicado. */
const samplePlan = makePlan({
  fuelLb: 2224, // 332 gal, o máximo utilizável
  crew: [{ id: 'p', role: 'Piloto', weightKg: lbToKg(170) }],
  positionLoads: {
    'zona-1': 350,
    'zona-2': 616,
    'zona-3': 200,
    'zona-4': 200,
    'zona-5': 200,
    'zona-6': 50,
    'pod-a': 50,
    'pod-b': 50,
    'pod-c': 50,
    'pod-d': 50,
  },
});

describe('tabela de momento do combustível (página 6-49)', () => {
  const table = C98.fuelMoments;

  it('reproduz as linhas publicadas', () => {
    /* [peso em LB, momento/1000 publicado] */
    const rows: readonly (readonly [number, number])[] = [
      [33, 6.8],
      [670, 137.3],
      [1340, 274.0],
      [2224, 453.2],
    ];
    for (const [lb, moment] of rows) {
      expect(fuelMoment1000(lb, table)).toBeCloseTo(moment, 6);
    }
  });

  it('confirma que o braço varia com a quantidade', () => {
    const armAt = (lb: number) => (fuelMoment1000(lb, table) * 1000) / lb;
    /* Cerca de 206 pol com pouco combustível, 203,8 com os tanques cheios. */
    expect(armAt(33)).toBeCloseTo(206.1, 1);
    expect(armAt(2224)).toBeCloseTo(203.8, 1);
    expect(armAt(33)).toBeGreaterThan(armAt(2224));
  });

  it('interpola entre duas linhas publicadas', () => {
    /* 35 LB fica entre 33 (6,8) e 67 (13,7): o manual usa 7,2 no exemplo. */
    expect(fuelMoment1000(35, table)).toBeCloseTo(7.2, 1);
  });

  it('sem combustível não há momento', () => {
    expect(fuelMoment1000(0, table)).toBe(0);
    expect(fuelMoment1000(-100, table)).toBe(0);
  });
});

describe('exemplo resolvido do manual, página 6-55', () => {
  const outcome = computeMoment(samplePlan, SAMPLE_AIRCRAFT, C98.positions, STATIONS);

  it('o cálculo está disponível', () => {
    expect(outcome.status).toBe('ready');
  });

  it('reproduz o momento de cada item publicado', () => {
    if (outcome.status !== 'ready') return;
    const find = (label: string) =>
      outcome.value.lines.find((l) => l.label === label)?.moment1000;

    /* Valores da coluna "SAMPLE AIRPLANE", momento/1000. */
    expect(find('Peso básico vazio')).toBeCloseTo(846.5, 6);
    expect(find('Combustível utilizável')).toBeCloseTo(453.2, 6);
    expect(find('Piloto')).toBeCloseTo(23.0, 1);
    expect(find('Zona 1')).toBeCloseTo(60.2, 1);
    expect(find('Zona 2')).toBeCloseTo(134.2, 1);
    expect(find('Zona 3')).toBeCloseTo(52.9, 1);
    expect(find('Zona 4')).toBeCloseTo(58.9, 1);
    expect(find('Zona 5')).toBeCloseTo(63.9, 1);
    expect(find('Zona 6')).toBeCloseTo(17.2, 1);
    expect(find('Pod A')).toBeCloseTo(6.6, 1);
    expect(find('Pod B')).toBeCloseTo(9.1, 1);
    expect(find('Pod C')).toBeCloseTo(11.7, 1);
    expect(find('Pod D')).toBeCloseTo(14.4, 1);
  });

  it('reproduz o peso e o momento de rampa: 8.785 LB e 1.751,7', () => {
    if (outcome.status !== 'ready') return;
    expect(outcome.value.rampWeightLb).toBeCloseTo(8785, 0);
    expect(outcome.value.rampMoment1000).toBeCloseTo(1751.7, 0);
  });

  it('desconta o combustível de táxi: −35 LB e −7,2', () => {
    if (outcome.status !== 'ready') return;
    expect(outcome.value.taxiWeightLb).toBe(-35);
    expect(outcome.value.taxiMoment1000).toBeCloseTo(-7.2, 1);
  });

  it('reproduz o peso e o momento de decolagem: 8.750 LB e 1.744,5', () => {
    if (outcome.status !== 'ready') return;
    expect(outcome.value.takeoffWeightLb).toBeCloseTo(8750, 0);
    expect(outcome.value.takeoffMoment1000).toBeCloseTo(1744.5, 0);
  });

  it('nada ficou sem momento neste carregamento', () => {
    if (outcome.status !== 'ready') return;
    expect(outcome.value.unaccounted).toEqual([]);
  });
});

describe('momento dos passageiros por estação', () => {
  it('usa o braço da estação em que cada grupo está sentado', () => {
    /* 90 kg no assento 3 (braço 189,9) e 90 kg no assento 11 (braço 261,9). */
    const plan = makePlan({ passengerLoads: { p3: 90, p11: 90 } });
    const outcome = computeMoment(plan, SAMPLE_AIRCRAFT, C98.positions, STATIONS);

    expect(outcome.status).toBe('ready');
    if (outcome.status !== 'ready') return;

    const lb = kgToLb(90);
    const frente = outcome.value.lines.find((l) => l.label === 'Assento 3');
    const fundo = outcome.value.lines.find((l) => l.label === 'Assento 11');

    expect(frente?.armIn).toBe(189.9);
    expect(frente?.moment1000).toBeCloseTo((lb * 189.9) / 1000, 6);
    expect(fundo?.armIn).toBe(261.9);
    expect(fundo?.moment1000).toBeCloseTo((lb * 261.9) / 1000, 6);
  });

  it('o mesmo peso à frente ou atrás muda o momento', () => {
    const frente = computeMoment(
      makePlan({ passengerLoads: { p45: 180 } }),
      SAMPLE_AIRCRAFT,
      C98.positions,
      STATIONS,
    );
    const fundo = computeMoment(
      makePlan({ passengerLoads: { p11: 180 } }),
      SAMPLE_AIRCRAFT,
      C98.positions,
      STATIONS,
    );

    expect(frente.status).toBe('ready');
    expect(fundo.status).toBe('ready');
    if (frente.status !== 'ready' || fundo.status !== 'ready') return;

    expect(frente.value.rampWeightLb).toBeCloseTo(fundo.value.rampWeightLb, 6);
    expect(fundo.value.rampMoment1000).toBeGreaterThan(
      frente.value.rampMoment1000,
    );
  });

  it('nenhum item fica sem momento apurável', () => {
    const plan = makePlan({ passengerLoads: { p6: 200 }, fuelLb: 500 });
    const outcome = computeMoment(plan, SAMPLE_AIRCRAFT, C98.positions, STATIONS);

    expect(outcome.status).toBe('ready');
    if (outcome.status !== 'ready') return;
    expect(outcome.value.unaccounted).toEqual([]);
  });

  it('sem momento básico cadastrado não há cálculo', () => {
    const semFicha: AircraftProfile = {
      model: C98,
      registration: { ...SAMPLE_AIRCRAFT.registration, basicMoment: null },
    };
    const outcome = computeMoment(samplePlan, semFicha, C98.positions, STATIONS);

    expect(outcome.status).toBe('pending');
    if (outcome.status === 'pending') {
      expect(outcome.missing).toEqual(['Momento básico']);
    }
  });
});
