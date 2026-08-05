/**
 * Tabela de conferência.
 *
 * O que estes testes protegem: esta é a tabela que o piloto usa para bater o
 * planejamento contra o papel antes de assinar o manifesto. Uma linha faltando
 * ou uma coluna que não fecha quando somada à mão destrói a razão de ela
 * existir.
 */

import { describe, expect, it } from 'vitest';

import { C98 } from '../../data/aircraft/index.ts';
import { lbToKg } from '../../data/conversion.ts';
import { computePlanResult } from '../../domain/calc/index.ts';
import { makePlan } from '../../domain/calc/__fixtures__/plan.ts';
import {
  realProfile,
  TEST_BEW_LB,
} from '../../domain/calc/__fixtures__/profile.ts';
import {
  buildManifestRows,
  manifestTotalKg,
  type ManifestUnits,
} from './ManifestTable.tsx';

const EM_LIBRAS: ManifestUnits = {
  cargo: 'LB',
  fuel: 'LB',
  fuelDensityLbPerGal: C98.fuel.referenceDensityLbPerGal,
};

const profile = realProfile();

/** Um carregamento com um item de cada tipo. */
const plan = makePlan({
  fuelLb: 1000,
  crew: [
    { id: 'p', role: 'Piloto', weightKg: 85 },
    { id: 'c', role: 'Copiloto', weightKg: 78 },
  ],
  passengerLoads: { s4: 90, s11: 72 },
  positionLoads: { 'pod-a': 200, 'zona-2': 450 },
});

function rowsOf(units: ManifestUnits = EM_LIBRAS) {
  const result = computePlanResult(plan, profile);
  return buildManifestRows(result, plan, TEST_BEW_LB, units);
}

describe('linhas da conferência', () => {
  it('traz peso básico, tripulação, assentos, carga e combustível', () => {
    const labels = rowsOf().map((row) => row.label);

    expect(labels).toEqual([
      'Peso básico vazio',
      'Piloto',
      'Copiloto',
      'Assento 4',
      'Assento 11',
      'Zona 2',
      'Pod A',
      'Combustível',
    ]);
  });

  it('a carga aparece qualquer que seja a unidade de digitação', () => {
    /* Era o caso que faltava: em libras, a linha de carga ficava sem o peso na
       coluna de conferência. */
    for (const cargo of ['LB', 'kg'] as const) {
      const rows = rowsOf({ ...EM_LIBRAS, cargo });
      const pod = rows.find((row) => row.label === 'Pod A');

      expect(pod?.lb, cargo).toBe(200);
      expect(pod?.kg, cargo).toBe(Math.round(lbToKg(200)));
    }
  });

  it('nenhuma linha fica sem quilograma', () => {
    for (const row of rowsOf()) {
      expect(row.kg, row.label).not.toBeNull();
    }
  });

  it('o combustível também é convertido', () => {
    const fuel = rowsOf().find((row) => row.label.startsWith('Combustível'));
    expect(fuel?.lb).toBe(1000);
    expect(fuel?.kg).toBe(Math.round(lbToKg(1000)));
  });

  it('as pessoas mantêm o quilograma digitado, sem ida e volta', () => {
    const rows = rowsOf();
    expect(rows.find((row) => row.label === 'Piloto')?.kg).toBe(85);
    expect(rows.find((row) => row.label === 'Assento 4')?.kg).toBe(90);
  });

  it('sem peso básico cadastrado a linha fica em branco, não em zero', () => {
    const result = computePlanResult(plan, profile);
    const rows = buildManifestRows(result, plan, null, EM_LIBRAS);
    const basico = rows[0];

    expect(basico?.label).toBe('Peso básico vazio');
    expect(basico?.kg).toBeNull();
    expect(basico?.lb).toBeNull();
  });
});

describe('volume do combustível', () => {
  it('em litros, o volume vai no rótulo da linha', () => {
    const rows = rowsOf({ ...EM_LIBRAS, fuel: 'L' });
    const fuel = rows.find((row) => row.label.startsWith('Combustível'));

    /* 1.000 LB a 6,7 lb/gal são 565 litros. */
    expect(fuel?.label).toBe('Combustível (565 L)');
    expect(fuel?.lb).toBe(1000);
  });

  it('em libras, o rótulo não carrega volume nenhum', () => {
    const fuel = rowsOf().find((row) => row.label.startsWith('Combustível'));
    expect(fuel?.label).toBe('Combustível');
  });
});

describe('total em quilogramas', () => {
  it('é exatamente a soma da coluna exibida', () => {
    /* A regra que sustenta a tabela: quem somar a coluna no papel tem de
       chegar ao mesmo número do rodapé. */
    const rows = rowsOf();
    const somaManual = rows.reduce((sum, row) => sum + (row.kg ?? 0), 0);

    expect(manifestTotalKg(rows)).toBe(somaManual);
  });

  it('fica a poucos quilos da conversão direta do total em libras', () => {
    const rows = rowsOf();
    const result = computePlanResult(plan, profile);
    const totalLb =
      result.availability.status === 'ready'
        ? result.availability.value.totalWeightLb
        : 0;

    /* As duas formas divergem pelo arredondamento de cada linha. A diferença
       precisa ser desprezível — se crescer, é sinal de que alguma linha entrou
       na coluna sem entrar no total. */
    const diferenca = Math.abs(manifestTotalKg(rows) - lbToKg(totalLb));
    expect(diferenca).toBeLessThanOrEqual(rows.length / 2);
  });

  it('ignora linha sem peso cadastrado em vez de somar zero indevidamente', () => {
    const result = computePlanResult(plan, profile);
    const comBasico = manifestTotalKg(
      buildManifestRows(result, plan, TEST_BEW_LB, EM_LIBRAS),
    );
    const semBasico = manifestTotalKg(
      buildManifestRows(result, plan, null, EM_LIBRAS),
    );

    expect(comBasico - semBasico).toBe(Math.round(lbToKg(TEST_BEW_LB)));
  });
});
