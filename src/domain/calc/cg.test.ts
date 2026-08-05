/**
 * Conferência dos limites de centragem.
 *
 * Fonte dos limites: POH Section 2, página 2-13.
 * Fonte do caso de validação: Sample Loading Problem, página 6-55, cujo ponto
 * de decolagem o próprio manual declara dentro do envelope.
 */

import { describe, expect, it } from 'vitest';

import { C98_CG } from '../../data/aircraft/c98.cg.ts';
import {
  computeCg,
  envelopePolygon,
  forwardLimitAt,
  toPctMac,
} from './cg.ts';

describe('limites publicados na página 2-13', () => {
  it('o limite dianteiro tem os três pontos declarados', () => {
    expect(forwardLimitAt(5500)).toBeCloseTo(179.6, 2);
    expect(forwardLimitAt(8000)).toBeCloseTo(193.37, 2);
    expect(forwardLimitAt(8750)).toBeCloseTo(199.15, 2);
  });

  it('abaixo de 5.500 LB o limite dianteiro é constante', () => {
    expect(forwardLimitAt(4000)).toBeCloseTo(179.6, 2);
    expect(forwardLimitAt(1)).toBeCloseTo(179.6, 2);
  });

  it('interpola em linha reta entre os pontos', () => {
    /* Meio do trecho 5500→8000: 6750 LB. */
    expect(forwardLimitAt(6750)).toBeCloseTo((179.6 + 193.37) / 2, 2);
  });

  it('o limite traseiro é constante em 204,35 polegadas', () => {
    expect(C98_CG.aftLimitIn).toBe(204.35);
  });

  it('os percentuais de MAC conferem com os publicados', () => {
    /* O manual imprime o % MAC ao lado de cada limite. Se a MAC estiver
       cadastrada errada, estes números divergem. */
    expect(toPctMac(179.6)).toBeCloseTo(3.06, 1);
    expect(toPctMac(193.37)).toBeCloseTo(23.8, 1);
    expect(toPctMac(199.15)).toBeCloseTo(32.5, 1);
    expect(toPctMac(204.35)).toBeCloseTo(40.33, 1);
  });
});

describe('exemplo resolvido do manual, página 6-55', () => {
  /* Decolagem: 8.750 LB com momento/1000 de 1.744,5. */
  const cg = computeCg(8750, 1744.5);

  it('situa o CG em 199,4 polegadas', () => {
    expect(cg).not.toBeNull();
    expect(cg?.armIn).toBeCloseTo(199.37, 2);
  });

  it('confirma que o carregamento está dentro do envelope', () => {
    /* O manual afirma: "since this point falls within the envelope, the
       loading is acceptable". */
    expect(cg?.status).toBe('ok');
    expect(cg?.exceededByIn).toBe(0);
  });

  it('fica logo atrás do limite dianteiro daquele peso', () => {
    expect(cg?.forwardLimitIn).toBeCloseTo(199.15, 2);
    expect((cg?.armIn ?? 0) - (cg?.forwardLimitIn ?? 0)).toBeCloseTo(0.22, 2);
  });

  it('corresponde a 32,8% da corda média', () => {
    expect(cg?.pctMac).toBeCloseTo(32.83, 1);
  });
});

describe('polígono do envelope, para o gráfico', () => {
  const polygon = envelopePolygon();

  it('sobe pelo limite dianteiro e volta pelo traseiro', () => {
    /* 4000 e 5500 no limite dianteiro constante, depois 8000 e 8750,
       e a volta em 8750 e 4000 no limite traseiro. */
    expect(polygon).toHaveLength(6);
    expect(polygon[0]?.weightLb).toBe(4000);
    expect(polygon[0]?.armIn).toBeCloseTo(179.6, 2);
    expect(polygon[3]?.weightLb).toBe(8750);
    expect(polygon[3]?.armIn).toBeCloseTo(199.15, 2);
    expect(polygon[4]?.armIn).toBeCloseTo(204.35, 2);
    expect(polygon[5]?.armIn).toBeCloseTo(204.35, 2);
  });

  it('cada vértice traz o percentual de MAC já calculado', () => {
    for (const point of polygon) {
      expect(point.pctMac).toBeCloseTo(toPctMac(point.armIn), 6);
    }
  });

  it('o desenho e a verificação usam o mesmo limite dianteiro', () => {
    /* Se divergirem, o gráfico mostraria o ponto dentro enquanto o alerta
       diria fora. Este teste amarra os dois. */
    for (const point of polygon.slice(0, 4)) {
      expect(point.armIn).toBeCloseTo(forwardLimitAt(point.weightLb), 6);
    }
  });

  it('o ponto do exemplo do manual cai dentro do polígono desenhado', () => {
    const cg = computeCg(8750, 1744.5);
    const dianteiro = polygon[3];
    expect(cg?.armIn).toBeGreaterThan(dianteiro?.armIn ?? 0);
    expect(cg?.armIn).toBeLessThan(C98_CG.aftLimitIn);
  });
});

describe('classificação do CG', () => {
  it('acusa CG à frente do limite', () => {
    /* 8.750 LB com CG em 195 pol: limite dianteiro é 199,15. */
    const cg = computeCg(8750, (8750 * 195) / 1000);
    expect(cg?.status).toBe('forward');
    expect(cg?.exceededByIn).toBeCloseTo(4.15, 2);
  });

  it('acusa CG atrás do limite', () => {
    const cg = computeCg(7000, (7000 * 206) / 1000);
    expect(cg?.status).toBe('aft');
    expect(cg?.exceededByIn).toBeCloseTo(1.65, 2);
  });

  it('sinaliza a faixa de advertência traseira do manual', () => {
    /* 38,33% MAC = 177,57 + 0,3833 × 66,40 ≈ 203,02 polegadas. */
    const armIn = 203.5;
    const cg = computeCg(7000, (7000 * armIn) / 1000);
    expect(cg?.status).toBe('aft-warning');
    expect(cg?.exceededByIn).toBe(0);
    expect(cg?.pctMac).toBeGreaterThanOrEqual(38.33);
  });

  it('logo abaixo da faixa de advertência ainda é situação normal', () => {
    const cg = computeCg(7000, (7000 * 202.5) / 1000);
    expect(cg?.status).toBe('ok');
  });

  it('sem peso não há centro de gravidade', () => {
    expect(computeCg(0, 0)).toBeNull();
    expect(computeCg(-10, 5)).toBeNull();
  });
});
