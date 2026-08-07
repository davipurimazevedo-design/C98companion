/**
 * Consulta às tabelas de performance.
 *
 * O que estes testes protegem: a política de leitura conservadora. Um eixo
 * resolvido para o valor de baixo em vez do de cima devolve uma distância
 * MENOR que a publicada para aquelas condições — erro que não aparece na
 * tela como erro, e sim como uma pista que parece suficiente.
 */

import { describe, expect, it } from 'vitest';

import {
  C98_LANDING,
  C98_TAKEOFF_FLAPS_20,
} from '../../data/performance/index.ts';
import { describeReadFailure, nextAtOrAbove, readTable } from './lookup.ts';

/** Atalho para os casos em que a leitura tem que existir. */
function read(
  table: typeof C98_TAKEOFF_FLAPS_20,
  weightLb: number,
  pressureAltitudeFt: number,
  temperatureC: number,
) {
  const reading = readTable(table, {
    weightLb,
    pressureAltitudeFt,
    temperatureC,
  });
  if (reading.status !== 'ready') {
    throw new Error(`Leitura indisponível: ${JSON.stringify(reading.failure)}`);
  }
  return reading.value;
}

describe('nextAtOrAbove', () => {
  const values = [7300, 7800, 8300, 8750];

  it('devolve o próprio valor quando ele está publicado', () => {
    expect(nextAtOrAbove(values, 7800)).toBe(1);
  });

  it('sobe para o próximo publicado quando está entre dois', () => {
    expect(nextAtOrAbove(values, 7801)).toBe(2);
  });

  it('abaixo do primeiro, devolve o primeiro', () => {
    expect(nextAtOrAbove(values, 5000)).toBe(0);
  });

  it('acima do último, não há resposta conservadora', () => {
    expect(nextAtOrAbove(values, 8751)).toBeNull();
  });

  it('lista vazia não tem resposta', () => {
    expect(nextAtOrAbove([], 100)).toBeNull();
  });
});

describe('leitura conservadora dos três eixos', () => {
  it('o peso sobe para o bloco seguinte', () => {
    /* O caso do Sample Problem: 8600 lb são lidos na tabela de 8750. */
    const value = read(C98_TAKEOFF_FLAPS_20, 8600, 4000, 20);

    expect(value.weightLb).toBe(8750);
    expect(value.groundRollFt).toBe(1875);
    expect(value.totalFt).toBe(3295);
  });

  it('a altitude sobe para a linha seguinte', () => {
    const value = read(C98_TAKEOFF_FLAPS_20, 8750, 3200, 20);

    expect(value.pressureAltitudeFt).toBe(4000);
    expect(value.groundRollFt).toBe(1875);
  });

  it('a temperatura sobe para a coluna seguinte', () => {
    const value = read(C98_TAKEOFF_FLAPS_20, 8750, 4000, 11);

    expect(value.temperatureC).toBe(20);
    expect(value.groundRollFt).toBe(1875);
  });

  it('os três sobem juntos', () => {
    const value = read(C98_TAKEOFF_FLAPS_20, 8301, 3999, 19);

    expect(value.weightLb).toBe(8750);
    expect(value.pressureAltitudeFt).toBe(4000);
    expect(value.temperatureC).toBe(20);
  });

  it('devolve as velocidades publicadas para o bloco lido', () => {
    const value = read(C98_TAKEOFF_FLAPS_20, 8600, 0, 0);

    expect(value.liftOffKias).toBe(70);
    expect(value.at50FtKias).toBe(83);
  });

  it('no pouso não há velocidade de rotação', () => {
    const value = read(C98_LANDING, 6975, 2000, 30);

    expect(value.liftOffKias).toBeNull();
    expect(value.at50FtKias).toBe(71);
  });
});

describe('abaixo do início de cada eixo, lê o primeiro valor', () => {
  it('peso menor que o menor bloco lê o bloco mais leve', () => {
    /* Ler 7300 lb para uma aeronave de 6000 lb é conservador: a tabela
       devolve uma distância maior que a real. Melhor que não responder. */
    const value = read(C98_TAKEOFF_FLAPS_20, 6000, 0, 20);

    expect(value.weightLb).toBe(7300);
  });

  it('altitude abaixo do nível do mar lê o nível do mar', () => {
    const value = read(C98_TAKEOFF_FLAPS_20, 8750, -300, 20);

    expect(value.pressureAltitudeFt).toBe(0);
  });

  it('temperatura abaixo da coluna mais fria lê a coluna mais fria', () => {
    const value = read(C98_TAKEOFF_FLAPS_20, 8750, 0, -30);

    expect(value.temperatureC).toBe(-10);
  });
});

describe('fora da tabela', () => {
  it('peso acima do máximo publicado', () => {
    const reading = readTable(C98_TAKEOFF_FLAPS_20, {
      weightLb: 8751,
      pressureAltitudeFt: 0,
      temperatureC: 20,
    });

    expect(reading).toEqual({
      status: 'unavailable',
      failure: { reason: 'fora-da-tabela', axis: 'peso', publishedMax: 8750 },
    });
  });

  it('o pouso para em 8500 lb, não em 8750', () => {
    const reading = readTable(C98_LANDING, {
      weightLb: 8600,
      pressureAltitudeFt: 0,
      temperatureC: 20,
    });

    expect(reading.status).toBe('unavailable');
    if (reading.status !== 'unavailable') return;
    expect(reading.failure).toEqual({
      reason: 'fora-da-tabela',
      axis: 'peso',
      publishedMax: 8500,
    });
  });

  it('altitude acima de 12000 ft', () => {
    const reading = readTable(C98_TAKEOFF_FLAPS_20, {
      weightLb: 8000,
      pressureAltitudeFt: 12_001,
      temperatureC: 0,
    });

    expect(reading.status).toBe('unavailable');
    if (reading.status !== 'unavailable') return;
    expect(reading.failure).toEqual({
      reason: 'fora-da-tabela',
      axis: 'altitude',
      publishedMax: 12_000,
    });
  });

  it('temperatura acima de 40 °C no pouso, que não tem a nota da decolagem', () => {
    const reading = readTable(C98_LANDING, {
      weightLb: 7000,
      pressureAltitudeFt: 0,
      temperatureC: 41,
    });

    expect(reading.status).toBe('unavailable');
    if (reading.status !== 'unavailable') return;
    expect(reading.failure).toEqual({
      reason: 'fora-da-tabela',
      axis: 'temperatura',
      publishedMax: 40,
    });
  });

  it('célula com traço no manual', () => {
    /* 8750 lb, 12000 ft, 30 °C está impresso como traço. */
    const reading = readTable(C98_TAKEOFF_FLAPS_20, {
      weightLb: 8750,
      pressureAltitudeFt: 12_000,
      temperatureC: 30,
    });

    expect(reading).toEqual({
      status: 'unavailable',
      failure: { reason: 'limite-de-temperatura' },
    });
  });
});

describe('acima da coluna mais quente, com a nota 6 da Figura 5-9', () => {
  it('lê a coluna de 40 °C e sinaliza a nota, sem aplicá-la', () => {
    const value = read(C98_TAKEOFF_FLAPS_20, 8750, 0, 45);

    expect(value.temperatureC).toBe(40);
    expect(value.groundRollFt).toBe(1625);
    expect(value.totalFt).toBe(2870);
    expect(value.aboveTopTemperature?.factor).toBe(1.2);
  });

  it('dentro do eixo, não há nota a sinalizar', () => {
    const value = read(C98_TAKEOFF_FLAPS_20, 8750, 0, 40);

    expect(value.aboveTopTemperature).toBeNull();
  });

  it('a nota não salva uma célula que é traço', () => {
    /* 8750 lb a 12000 ft não tem coluna de 40 °C publicada: a nota manda
       multiplicar um valor que não existe. */
    const reading = readTable(C98_TAKEOFF_FLAPS_20, {
      weightLb: 8750,
      pressureAltitudeFt: 12_000,
      temperatureC: 45,
    });

    expect(reading.status).toBe('unavailable');
  });
});

describe('mensagens', () => {
  it('cada motivo tem texto próprio, com o limite publicado', () => {
    expect(
      describeReadFailure({ reason: 'fora-da-tabela', axis: 'peso', publishedMax: 8750 }),
    ).toContain('8.750 lb');
    expect(
      describeReadFailure({ reason: 'fora-da-tabela', axis: 'altitude', publishedMax: 12_000 }),
    ).toContain('12.000 ft');
    expect(
      describeReadFailure({ reason: 'fora-da-tabela', axis: 'temperatura', publishedMax: 40 }),
    ).toContain('40 °C');
    expect(describeReadFailure({ reason: 'limite-de-temperatura' })).toContain(
      'temperatura',
    );
  });
});
