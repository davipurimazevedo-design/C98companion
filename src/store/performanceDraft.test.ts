/**
 * Conversão do rascunho de Performance no que o motor consome.
 *
 * É a única fronteira de unidade da tela: pista em metros vira pés, e a
 * intensidade do vento ganha sinal conforme a direção escolhida. Errar
 * qualquer uma das duas produz uma distância plausível e errada.
 */

import { describe, expect, it } from 'vitest';

import {
  initialPerformanceDraft,
  toPerformanceQuery,
  type ConditionsDraft,
} from './performanceDraft.ts';

function conditions(overrides: Partial<ConditionsDraft> = {}): ConditionsDraft {
  return { ...initialPerformanceDraft().takeoff, ...overrides };
}

describe('campos em branco', () => {
  it('o rascunho novo não produz nenhum número', () => {
    const query = toPerformanceQuery(conditions());

    expect(query.weightLb).toBeNull();
    expect(query.pressureAltitudeFt).toBeNull();
    expect(query.temperatureC).toBeNull();
    expect(query.runwayFt).toBeNull();
  });

  it('vento em branco é vento zero, que é a condição das tabelas', () => {
    expect(toPerformanceQuery(conditions()).windKt).toBe(0);
  });
});

describe('leitura dos campos', () => {
  it('aceita vírgula decimal e separador de milhar', () => {
    const query = toPerformanceQuery(
      conditions({ weight: '8.750', altitude: '4.000', temperature: '20,5' }),
    );

    expect(query.weightLb).toBe(8750);
    expect(query.pressureAltitudeFt).toBe(4000);
    expect(query.temperatureC).toBe(20.5);
  });

  it('temperatura negativa é valor legítimo, não erro', () => {
    expect(toPerformanceQuery(conditions({ temperature: '-15' })).temperatureC).toBe(-15);
  });

  it('altitude abaixo do nível do mar também', () => {
    expect(
      toPerformanceQuery(conditions({ altitude: '-200' })).pressureAltitudeFt,
    ).toBe(-200);
  });

  it('zero digitado é zero, e não campo vazio', () => {
    const query = toPerformanceQuery(
      conditions({ altitude: '0', temperature: '0' }),
    );

    expect(query.pressureAltitudeFt).toBe(0);
    expect(query.temperatureC).toBe(0);
  });

  it('texto sem sentido não vira número', () => {
    expect(toPerformanceQuery(conditions({ weight: 'oito mil' })).weightLb).toBeNull();
  });
});

describe('vento', () => {
  it('de proa é positivo', () => {
    expect(
      toPerformanceQuery(conditions({ wind: '12', windDirection: 'proa' })).windKt,
    ).toBe(12);
  });

  it('de cauda é negativo', () => {
    expect(
      toPerformanceQuery(conditions({ wind: '8', windDirection: 'cauda' })).windKt,
    ).toBe(-8);
  });
});

describe('pista', () => {
  it('metros digitados chegam ao motor em pés', () => {
    /* 1500 m são 4921,26 pés. */
    const query = toPerformanceQuery(conditions({ runway: '1500' }));

    expect(query.runwayFt).toBeCloseTo(4921.26, 2);
  });

  it('pista em branco não vira zero: o resultado sai sem margem', () => {
    expect(toPerformanceQuery(conditions({ runway: '' })).runwayFt).toBeNull();
  });
});
