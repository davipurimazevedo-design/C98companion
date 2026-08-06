/**
 * Correções das notas do manual.
 *
 * O caso que amarra tudo é o do Sample Problem: 12 nós de proa sobre 1875 e
 * 3295 pés têm que dar exatamente 1669 e 2933. Só fecha se o percentual for
 * arredondado para inteiro ANTES de ser aplicado, e é isso que estes testes
 * travam — calculando com a fração exata, sairia 1670.
 */

import { describe, expect, it } from 'vitest';

import {
  applyTemperatureFactor,
  applyWind,
  MAX_TAILWIND_KT,
  windPercent,
} from './corrections.ts';

describe('percentual do vento (nota 2)', () => {
  it('vento zero não corrige nada', () => {
    expect(windPercent(0)).toBe(0);
  });

  it('11 nós de proa são exatamente 10% de redução', () => {
    expect(windPercent(11)).toBe(-10);
  });

  it('22 nós de proa são 20% de redução', () => {
    expect(windPercent(22)).toBe(-20);
  });

  it('12 nós de proa arredondam para 11%, como o manual', () => {
    expect(windPercent(12)).toBe(-11);
  });

  it('2 nós de cauda são 10% de aumento', () => {
    expect(windPercent(-2)).toBe(10);
  });

  it('10 nós de cauda são 50% de aumento', () => {
    expect(windPercent(-MAX_TAILWIND_KT)).toBe(50);
  });

  it('o vento de cauda pesa muito mais que o de proa', () => {
    /* 2 nós de cauda valem o mesmo que 11 de proa, com o sinal trocado. */
    expect(windPercent(-2)).toBe(-windPercent(11));
  });
});

describe('aplicação às distâncias', () => {
  const chart = { groundRollFt: 1875, totalFt: 3295 };

  it('o cálculo do Sample Problem, pé a pé (página 5-7)', () => {
    const effect = applyWind(chart, 12);

    expect(effect.direction).toBe('proa');
    expect(effect.knots).toBe(12);
    expect(effect.percent).toBe(-11);
    expect(effect.groundRollDeltaFt).toBe(-206);
    expect(effect.totalDeltaFt).toBe(-362);
    expect(effect.groundRollFt).toBe(1669);
    expect(effect.totalFt).toBe(2933);
  });

  it('vento zero devolve as distâncias intactas', () => {
    const effect = applyWind(chart, 0);

    expect(effect.direction).toBe('nenhum');
    expect(effect.percent).toBe(0);
    expect(effect.groundRollFt).toBe(1875);
    expect(effect.totalFt).toBe(3295);
  });

  it('vento de cauda aumenta as distâncias', () => {
    const effect = applyWind(chart, -4);

    expect(effect.direction).toBe('cauda');
    expect(effect.knots).toBe(4);
    expect(effect.percent).toBe(20);
    expect(effect.groundRollFt).toBe(1875 + 375);
    expect(effect.totalFt).toBe(3295 + 659);
  });

  it('10 nós de cauda somam metade da distância', () => {
    const effect = applyWind(chart, -10);

    expect(effect.percent).toBe(50);
    expect(effect.groundRollFt).toBe(1875 + 938);
  });
});

describe('fator de temperatura alta (nota 6 da Figura 5-9)', () => {
  it('multiplica as duas distâncias da coluna mais quente', () => {
    const corrected = applyTemperatureFactor(
      { groundRollFt: 1625, totalFt: 2870 },
      1.2,
    );

    expect(corrected).toEqual({ groundRollFt: 1950, totalFt: 3444 });
  });

  it('arredonda em pé inteiro', () => {
    const corrected = applyTemperatureFactor(
      { groundRollFt: 1535, totalFt: 2721 },
      1.2,
    );

    expect(Number.isInteger(corrected.groundRollFt)).toBe(true);
    expect(Number.isInteger(corrected.totalFt)).toBe(true);
  });
});
