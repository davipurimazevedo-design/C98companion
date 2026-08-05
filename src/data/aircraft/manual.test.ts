/**
 * Conferência do cadastro contra o manual.
 *
 * Cada asserção repete o valor publicado e a página de onde saiu. Serve como
 * registro auditável: se alguém alterar um limite no código sem que uma revisão
 * do manual justifique, este teste acusa.
 *
 * Fonte: Cessna Model 208B (675 SHP), POH Section 6, Revision 23.
 */

import { describe, expect, it } from 'vitest';

import { C98 } from './index.ts';
import { limitOf } from '../../domain/calc/index.ts';

describe('pesos estruturais máximos (página 6-15)', () => {
  it('MAX RAMP 8785 LBS', () => {
    expect(C98.limits.maxRampWeightLb).toBe(8785);
  });

  it('MAX TAKEOFF 8750 LBS', () => {
    expect(C98.limits.maxTakeoffWeightLb).toBe(8750);
  });

  it('MAX LANDING 8500 LBS', () => {
    expect(C98.limits.maxLandingWeightLb).toBe(8500);
  });

  it('rampa é mais permissiva que decolagem pela diferença do táxi', () => {
    const ramp = C98.limits.maxRampWeightLb ?? 0;
    const takeoff = C98.limits.maxTakeoffWeightLb ?? 0;
    expect(ramp - takeoff).toBe(C98.fuel.taxiFuelLb);
  });
});

describe('carga (páginas 6-11 e 6-22)', () => {
  it('carga máxima da cabine 3400 LB', () => {
    expect(C98.limits.maxCabinCargoLb).toBe(3400);
  });

  it('carga máxima do cargo pod 1090 LB', () => {
    expect(C98.limits.maxCargoPodLb).toBe(1090);
  });

  it('a soma dos compartimentos do pod é exatamente o limite do pod', () => {
    const pod = C98.positions.filter((position) => position.group === 'pod');
    const soma = pod.reduce((total, p) => total + (p.maxSecuredLb ?? 0), 0);
    expect(soma).toBe(C98.limits.maxCargoPodLb);
  });
});

describe('limites por zona (tabela da página 6-22)', () => {
  /* [id, amarrada, sem amarração] exatamente como publicados. */
  const TABELA = [
    ['zona-1', 1780, 415],
    ['zona-2', 3100, 860],
    ['zona-3', 1900, 495],
    ['zona-4', 1380, 340],
    ['zona-5', 1270, 315],
    ['zona-6', 320, 245],
    ['pod-a', 230, 230],
    ['pod-b', 310, 310],
    ['pod-c', 270, 270],
    ['pod-d', 280, 280],
  ] as const;

  it('cadastra as dez posições do manual', () => {
    expect(C98.positions).toHaveLength(TABELA.length);
  });

  it.each(TABELA)('%s: %i LB amarrada, %i LB sem amarração', (id, seguro, solto) => {
    const position = C98.positions.find((p) => p.id === id);
    expect(position).toBeDefined();
    expect(position?.maxSecuredLb).toBe(seguro);
    expect(position?.maxUnsecuredLb).toBe(solto);
    expect(limitOf(position!, 'amarrada')).toBe(seguro);
    expect(limitOf(position!, 'sem-amarracao')).toBe(solto);
  });
});

describe('combustível (página 6-9)', () => {
  it('332 galões utilizáveis a 6,7 lb/gal e 60 °F', () => {
    expect(C98.fuel.usableCapacityGal).toBe(332);
    expect(C98.fuel.referenceDensityLbPerGal).toBe(6.7);
    expect(C98.fuel.referenceTemperatureF).toBe(60);
  });

  it('capacidade utilizável de 2224 LB confere com galões × densidade', () => {
    const gal = C98.fuel.usableCapacityGal ?? 0;
    const densidade = C98.fuel.referenceDensityLbPerGal ?? 0;
    expect(C98.fuel.usableCapacityLb).toBe(2224);
    expect(Math.round(gal * densidade)).toBe(C98.fuel.usableCapacityLb);
  });

  it('combustível de táxi de 35 LB (página 6-13)', () => {
    expect(C98.fuel.taxiFuelLb).toBe(35);
  });
});

describe('decisão operacional', () => {
  it('limiar de atenção em 97% do peso máximo de decolagem', () => {
    expect(C98.limits.warningThresholdPct).toBe(97);
  });
});
