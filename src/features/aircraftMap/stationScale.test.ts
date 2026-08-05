/**
 * A régua dos desenhos.
 *
 * O que estes testes protegem: as duas vistas da aeronave têm de concordar
 * sobre onde fica cada estação. Se a de cima e a de lado divergirem, a Zona 3
 * do piso aparece deslocada do Pod C, e o desenho passa a contar uma história
 * que a aeronave não conta.
 */

import { describe, expect, it } from 'vitest';

import { C98_POSITIONS } from '../../data/aircraft/c98.positions.ts';
import { C98_PASSENGER_STATIONS } from '../../data/aircraft/c98.seats.ts';
import {
  STATION_RANGE,
  fractionBetween,
  fractionOfStation,
  percentOfStation,
} from './stationScale.ts';

describe('extremos da faixa desenhada', () => {
  it('a primeira estação cotada cai no início', () => {
    expect(fractionOfStation(STATION_RANGE.fromIn)).toBe(0);
  });

  it('a última cai no fim', () => {
    expect(fractionOfStation(STATION_RANGE.toIn)).toBe(1);
  });

  it('a faixa é a cotada na página 6-15', () => {
    expect(STATION_RANGE.fromIn).toBe(100);
    expect(STATION_RANGE.toIn).toBe(356);
  });
});

describe('comportamento da régua', () => {
  it('é monotônica: estação maior, posição mais atrás', () => {
    let anterior = -1;
    for (let station = 100; station <= 356; station += 8) {
      const atual = fractionOfStation(station);
      expect(atual).toBeGreaterThan(anterior);
      anterior = atual;
    }
  });

  it('é linear: metade da faixa cai na metade do desenho', () => {
    const meio = (STATION_RANGE.fromIn + STATION_RANGE.toIn) / 2;
    expect(fractionOfStation(meio)).toBeCloseTo(0.5, 6);
  });

  it('prende ao extremo o que cai fora da faixa', () => {
    /* Melhor encostado na borda do que desenhado fora do contorno. */
    expect(fractionOfStation(0)).toBe(0);
    expect(fractionOfStation(500)).toBe(1);
  });

  it('a largura de um trecho é a diferença entre as pontas', () => {
    expect(fractionBetween(100, 356)).toBeCloseTo(1, 6);
    expect(fractionBetween(228, 356)).toBeCloseTo(0.5, 6);
  });

  it('a porcentagem é a mesma fração, pronta para estilo', () => {
    expect(percentOfStation(STATION_RANGE.fromIn)).toBe('0.000%');
    expect(percentOfStation(STATION_RANGE.toIn)).toBe('100.000%');
  });
});

describe('tudo que é desenhado cabe na faixa', () => {
  it('nenhuma zona ou compartimento fica preso na borda', () => {
    /* Se uma posição fosse presa, o desenho a mostraria com largura errada. */
    for (const position of C98_POSITIONS) {
      const { fromIn, toIn } = position;
      if (fromIn === null || toIn === null) continue;

      expect(fromIn, position.label).toBeGreaterThanOrEqual(
        STATION_RANGE.fromIn,
      );
      expect(toIn, position.label).toBeLessThanOrEqual(STATION_RANGE.toIn);
      expect(fractionBetween(fromIn, toIn), position.label).toBeGreaterThan(0);
    }
  });

  it('nenhum assento fica preso na borda', () => {
    for (const arrangement of Object.values(C98_PASSENGER_STATIONS)) {
      for (const station of arrangement) {
        expect(station.armIn, station.label).toBeGreaterThan(
          STATION_RANGE.fromIn,
        );
        expect(station.armIn, station.label).toBeLessThan(STATION_RANGE.toIn);
      }
    }
  });
});
