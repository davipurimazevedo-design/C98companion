/**
 * Motor de performance, de ponta a ponta.
 *
 * O teste que importa é o Sample Problem do próprio manual: os dois problemas
 * resolvidos nas páginas 5-7 e 5-11 têm que sair do motor com exatamente os
 * mesmos números impressos, sem nenhum ajuste no caminho. É a prova de que a
 * transcrição, a política de leitura e o arredondamento das correções estão
 * todos certos ao mesmo tempo.
 */

import { describe, expect, it } from 'vitest';

import {
  computeLanding,
  computeTakeoff,
  describeFailure,
  type PerformanceQuery,
} from './index.ts';

/** Consulta com tudo preenchido; cada teste sobrescreve o que interessa. */
function query(overrides: Partial<PerformanceQuery> = {}): PerformanceQuery {
  return {
    weightLb: 8000,
    pressureAltitudeFt: 0,
    temperatureC: 20,
    windKt: 0,
    runwayFt: null,
    ...overrides,
  };
}

/** Atalho para os casos em que o resultado tem que existir. */
function takeoff(overrides: Partial<PerformanceQuery>) {
  const outcome = computeTakeoff(query(overrides));
  if (outcome.status !== 'ready') {
    throw new Error(`Resultado indisponível: ${JSON.stringify(outcome)}`);
  }
  return outcome.value;
}

describe('Sample Problem — decolagem (página 5-7)', () => {
  /* Peso de decolagem 8600 lb, 4000 ft de altitude-pressão, 20 °C e 12 nós
     de vento de proa. O manual lê a tabela de 8750 lb e resolve:
       corrida no solo         1875 pés
       distância para 50 pés   3295 pés
       redução por vento          11%
       corrida corrigida       1669 pés
       distância corrigida     2933 pés */
  const result = takeoff({
    weightLb: 8600,
    pressureAltitudeFt: 4000,
    temperatureC: 20,
    windKt: 12,
  });

  it('lê a tabela de 8750 lb, e não a de 8300', () => {
    expect(result.reading.weightLb).toBe(8750);
    expect(result.reading.pressureAltitudeFt).toBe(4000);
    expect(result.reading.temperatureC).toBe(20);
  });

  it('as distâncias de tabela: 1875 e 3295 pés', () => {
    expect(result.chart.groundRollFt).toBe(1875);
    expect(result.chart.totalFt).toBe(3295);
  });

  it('a correção de vento: 11%, 206 e 362 pés', () => {
    expect(result.wind.percent).toBe(-11);
    expect(result.wind.groundRollDeltaFt).toBe(-206);
    expect(result.wind.totalDeltaFt).toBe(-362);
  });

  it('as distâncias corrigidas: 1669 e 2933 pés', () => {
    expect(result.wind.groundRollFt).toBe(1669);
    expect(result.wind.totalFt).toBe(2933);
  });

  it('as velocidades do bloco lido: 70 e 83 KIAS', () => {
    expect(result.reading.liftOffKias).toBe(70);
    expect(result.reading.at50FtKias).toBe(83);
  });

  it('cita a figura e as páginas de onde os números vieram', () => {
    expect(result.table.figure).toBe('5-9');
    expect(result.table.pages).toEqual(['5-22', '5-23']);
  });
});

describe('Sample Problem — pouso (página 5-11)', () => {
  /* Peso de pouso 6975 lb, 2000 ft, 30 °C. O manual lê a tabela de 7000 lb:
       corrida no solo         850 pés
       distância para 50 pés  1650 pés */
  it('lê a tabela de 7000 lb e devolve 850 e 1650 pés', () => {
    const outcome = computeLanding(
      query({ weightLb: 6975, pressureAltitudeFt: 2000, temperatureC: 30 }),
    );

    expect(outcome.status).toBe('ready');
    if (outcome.status !== 'ready') return;

    expect(outcome.value.reading.weightLb).toBe(7000);
    expect(outcome.value.chart.groundRollFt).toBe(850);
    expect(outcome.value.chart.totalFt).toBe(1650);
    expect(outcome.value.reading.at50FtKias).toBe(71);
  });
});

describe('campos em branco', () => {
  it('sem peso, sem altitude e sem temperatura, o resultado é incompleto', () => {
    const outcome = computeTakeoff(
      query({ weightLb: null, pressureAltitudeFt: null, temperatureC: null }),
    );

    expect(outcome).toEqual({
      status: 'incomplete',
      missing: ['Peso', 'Altitude-pressão', 'Temperatura'],
    });
  });

  it('temperatura zero é valor, não campo vazio', () => {
    const result = takeoff({ temperatureC: 0 });

    expect(result.reading.temperatureC).toBe(0);
  });

  it('altitude zero é o nível do mar, não campo vazio', () => {
    const result = takeoff({ pressureAltitudeFt: 0 });

    expect(result.reading.pressureAltitudeFt).toBe(0);
  });

  it('sem pista informada, as distâncias saem e a margem fica de fora', () => {
    const result = takeoff({ runwayFt: null });

    expect(result.margin).toBeNull();
    expect(result.wind.totalFt).toBeGreaterThan(0);
  });
});

describe('extremos de cada eixo', () => {
  it('peso mínimo tabelado', () => {
    expect(takeoff({ weightLb: 7300 }).reading.weightLb).toBe(7300);
  });

  it('peso máximo tabelado', () => {
    expect(takeoff({ weightLb: 8750 }).reading.weightLb).toBe(8750);
  });

  it('acima do peso máximo, não há resultado', () => {
    const outcome = computeTakeoff(query({ weightLb: 8751 }));

    expect(outcome.status).toBe('unavailable');
    if (outcome.status !== 'unavailable') return;
    expect(describeFailure(outcome.failure)).toContain('8.750 lb');
  });

  it('altitude mínima e máxima tabeladas', () => {
    expect(takeoff({ pressureAltitudeFt: 0 }).reading.pressureAltitudeFt).toBe(0);
    expect(
      takeoff({ pressureAltitudeFt: 12_000, temperatureC: -10 }).reading
        .pressureAltitudeFt,
    ).toBe(12_000);
  });

  it('acima da altitude máxima, não há resultado', () => {
    const outcome = computeTakeoff(query({ pressureAltitudeFt: 12_500 }));

    expect(outcome.status).toBe('unavailable');
    if (outcome.status !== 'unavailable') return;
    expect(describeFailure(outcome.failure)).toContain('12.000 ft');
  });

  it('temperatura mínima e máxima tabeladas', () => {
    expect(takeoff({ temperatureC: -10 }).reading.temperatureC).toBe(-10);
    expect(takeoff({ temperatureC: 40 }).reading.temperatureC).toBe(40);
  });

  it('abaixo da coluna mais fria, lê a coluna mais fria', () => {
    /* Ar mais quente exige mais pista: ler −10 °C num dia de −20 é o lado
       conservador, e é por isso que abaixo do eixo nunca há recusa. */
    expect(takeoff({ temperatureC: -20 }).reading.temperatureC).toBe(-10);
  });
});

describe('vento', () => {
  it('vento de proa encurta as duas distâncias', () => {
    const semVento = takeoff({ windKt: 0 });
    const comProa = takeoff({ windKt: 11 });

    expect(comProa.wind.percent).toBe(-10);
    expect(comProa.wind.totalFt).toBeLessThan(semVento.wind.totalFt);
  });

  it('vento de cauda alonga as duas distâncias', () => {
    const semVento = takeoff({ windKt: 0 });
    const comCauda = takeoff({ windKt: -4 });

    expect(comCauda.wind.percent).toBe(20);
    expect(comCauda.wind.totalFt).toBeGreaterThan(semVento.wind.totalFt);
  });

  it('10 nós de cauda ainda são cobertos pela nota', () => {
    expect(takeoff({ windKt: -10 }).wind.percent).toBe(50);
  });

  it('11 nós de cauda passam do que o manual cobre', () => {
    const outcome = computeTakeoff(query({ windKt: -11 }));

    expect(outcome.status).toBe('unavailable');
    if (outcome.status !== 'unavailable') return;
    expect(outcome.failure).toEqual({
      reason: 'vento-de-cauda-excessivo',
      maxKt: 10,
    });
    expect(describeFailure(outcome.failure)).toContain('10 nós');
  });

  it('a mesma recusa vale para o pouso', () => {
    const outcome = computeLanding(query({ weightLb: 7000, windKt: -11 }));

    expect(outcome.status).toBe('unavailable');
  });
});

describe('nota 6: acima de 40 °C na tabela de decolagem', () => {
  it('multiplica a coluna de 40 °C por 1,2 antes do vento', () => {
    const result = takeoff({ weightLb: 8750, pressureAltitudeFt: 0, temperatureC: 45 });

    /* Coluna de 40 °C: 1625 e 2870 pés. */
    expect(result.reading.temperatureC).toBe(40);
    expect(result.chart.groundRollFt).toBe(1950);
    expect(result.chart.totalFt).toBe(3444);
    expect(result.reading.aboveTopTemperature).not.toBeNull();
  });

  it('a nota entra antes da correção de vento, não depois', () => {
    const result = takeoff({
      weightLb: 8750,
      pressureAltitudeFt: 0,
      temperatureC: 45,
      windKt: 11,
    });

    /* 3444 pés menos 10% dão 344 pés de redução. Se o vento viesse antes, a
       base seria 2870 e a redução, 287. */
    expect(result.wind.totalDeltaFt).toBe(-344);
    expect(result.wind.totalFt).toBe(3100);
  });

  it('no pouso não existe nota equivalente: 41 °C é fora da tabela', () => {
    const outcome = computeLanding(
      query({ weightLb: 7000, temperatureC: 41 }),
    );

    expect(outcome.status).toBe('unavailable');
  });
});

describe('margem de pista', () => {
  /* 8750 lb, nível do mar, 20 °C: corrida no solo 1445 pés, e 2570 pés para
     transpor os 50 pés. */
  const base = { weightLb: 8750, pressureAltitudeFt: 0, temperatureC: 20 };

  it('a conta é contra a CORRIDA NO SOLO, não contra a distância para 50 pés', () => {
    /* Decisão de emprego da unidade. Comparar contra os 2570 pés daria uma
       exigência quase o dobro, e é o que o cartão fazia antes. */
    const result = takeoff({ ...base, runwayFt: 6000 });

    expect(result.margin?.requiredFt).toBe(1445);
    expect(result.wind.totalFt).toBe(2570);
  });

  it('pista folgada é suficiente', () => {
    const margin = takeoff({ ...base, runwayFt: 6000 }).margin;

    expect(margin?.marginFt).toBe(4555);
    expect(margin?.verdict).toBe('suficiente');
  });

  it('acima de 80% da pista consumida, a margem é crítica', () => {
    const margin = takeoff({ ...base, runwayFt: 1700 }).margin;

    expect(margin?.usedPct).toBeCloseTo(85.0, 1);
    expect(margin?.verdict).toBe('critica');
  });

  it('exatamente 80% ainda é suficiente', () => {
    const margin = takeoff({ ...base, runwayFt: 1445 / 0.8 }).margin;

    expect(margin?.verdict).toBe('suficiente');
  });

  it('pista menor que a corrida exigida é insuficiente', () => {
    const margin = takeoff({ ...base, runwayFt: 1200 }).margin;

    expect(margin?.marginFt).toBe(-245);
    expect(margin?.verdict).toBe('insuficiente');
  });

  it('a margem é medida pela corrida CORRIGIDA, não pela de tabela', () => {
    const semVento = takeoff({ ...base, runwayFt: 1500 }).margin;
    const comProa = takeoff({ ...base, runwayFt: 1500, windKt: 11 }).margin;

    /* Sem vento a pista de 1500 pés mal cobre os 1445 exigidos; com 11 nós
       de proa a exigência cai para 1301 e sobra margem de verdade. */
    expect(semVento?.requiredFt).toBe(1445);
    expect(comProa?.requiredFt).toBe(1301);
    expect(comProa?.marginFt).toBeGreaterThan(semVento?.marginFt ?? 0);
  });

  it('o vento de cauda pode transformar uma pista boa em insuficiente', () => {
    const semVento = takeoff({ ...base, runwayFt: 1900 }).margin;
    const comCauda = takeoff({ ...base, runwayFt: 1900, windKt: -8 }).margin;

    /* 8 nós de cauda somam 40% aos 1445 pés de corrida: 2023 pés exigidos
       contra 1900 de pista. */
    expect(semVento?.verdict).toBe('suficiente');
    expect(comCauda?.requiredFt).toBe(2023);
    expect(comCauda?.verdict).toBe('insuficiente');
  });
});
