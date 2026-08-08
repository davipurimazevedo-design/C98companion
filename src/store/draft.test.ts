/**
 * Conversão na fronteira entre a tela e o cálculo.
 *
 * O que estes testes protegem: a unidade escolhida para digitar é preferência
 * de tela e não pode alterar a grandeza física que chega ao domínio. Um erro
 * aqui produziria um peso errado sem nenhum sinal na interface.
 */

import { describe, expect, it } from 'vitest';

import { C98 } from '../data/aircraft/index.ts';
import { kgToLb, lbToLitres, litresToLb } from '../data/conversion.ts';
import { MINIMUM_TAKEOFF_FUEL_LB } from '../data/operational.ts';
import {
  convertCargoLoads,
  convertFuelText,
  initialDraft,
  nextCrewRole,
  toMissionPlan,
  type PlanDraft,
} from './draft.ts';

const DENSITY = C98.fuel.referenceDensityLbPerGal ?? 0;

/**
 * Deriva aceitável ao converter entre unidades.
 *
 * O piloto digita números inteiros, e a conversão arredonda para inteiro na
 * unidade de destino. Uma ida e volta pode portanto deslocar até cerca de 1 LB
 * — 2.224 LB viram 1.257 L, que voltam como 2.225 LB.
 *
 * Um libra sobre 8.750 é irrelevante operacionalmente, mas o teste mede a
 * deriva explicitamente em vez de escondê-la numa tolerância vaga: se ela
 * crescer, é sinal de que algo mudou na conversão.
 */
const DERIVA_LB = 1;

function esperaProximo(atual: number, esperado: number, tolerancia: number) {
  expect(Math.abs(atual - esperado)).toBeLessThanOrEqual(tolerancia);
}

function draftWith(overrides: Partial<PlanDraft>): PlanDraft {
  return { ...initialDraft('fab-2720'), ...overrides };
}

describe('combustível digitado em litros', () => {
  it('converte para libras usando a densidade de referência', () => {
    const plan = toMissionPlan(
      draftWith({ fuel: '1270', fuelUnit: 'L' }),
      DENSITY,
    );
    /* 1.270 L é a capacidade total dos tanques: 2.248 LB. */
    expect(plan.fuelLb).toBeCloseTo(2248, 0);
  });

  it('digitar em litros ou em libras dá o mesmo peso', () => {
    const emLitros = toMissionPlan(
      draftWith({ fuel: '1257', fuelUnit: 'L' }),
      DENSITY,
    );
    const emLibras = toMissionPlan(
      draftWith({ fuel: '2224', fuelUnit: 'LB' }),
      DENSITY,
    );

    /* 1.257 L são os 332 galões utilizáveis; a diferença é só o arredondamento
       do próprio número digitado. */
    esperaProximo(emLitros.fuelLb, emLibras.fuelLb, DERIVA_LB);
  });

  it('sem densidade cadastrada a leitura em litros não vira peso', () => {
    const plan = toMissionPlan(draftWith({ fuel: '1270', fuelUnit: 'L' }), null);
    expect(plan.fuelLb).toBe(0);
  });

  it('em libras a densidade é irrelevante', () => {
    const plan = toMissionPlan(draftWith({ fuel: '2224', fuelUnit: 'LB' }), null);
    expect(plan.fuelLb).toBe(2224);
  });
});

describe('carga digitada em quilogramas', () => {
  it('converte cada posição para libras', () => {
    const plan = toMissionPlan(
      draftWith({
        cargoUnit: 'kg',
        positionLoads: { 'pod-a': '100', 'zona-2': '500' },
      }),
      DENSITY,
    );

    expect(plan.positionLoads['pod-a']).toBeCloseTo(kgToLb(100), 6);
    expect(plan.positionLoads['zona-2']).toBeCloseTo(kgToLb(500), 6);
  });

  it('aceita carga acima do teto de peso de uma pessoa', () => {
    /* 3.400 LB de carga de cabine são 1.542 kg — muito além dos 999 kg que
       bastam para um ocupante. O teto de carga é outro. */
    const plan = toMissionPlan(
      draftWith({ cargoUnit: 'kg', positionLoads: { 'zona-2': '1542' } }),
      DENSITY,
    );

    expect(plan.positionLoads['zona-2']).toBeCloseTo(3400, 0);
  });

  it('em libras o valor passa direto', () => {
    const plan = toMissionPlan(
      draftWith({ cargoUnit: 'LB', positionLoads: { 'pod-a': '230' } }),
      DENSITY,
    );
    expect(plan.positionLoads['pod-a']).toBe(230);
  });
});

describe('troca de unidade preserva o carregamento', () => {
  it('reescreve o combustível em vez de apagar', () => {
    expect(convertFuelText('2224', 'LB', 'L', DENSITY)).toBe('1257');
    /* A volta não recupera o número exato: 1.257 L são 2.224,83 LB. É a deriva
       de arredondar para inteiro nas duas pontas. */
    expect(convertFuelText('1257', 'L', 'LB', DENSITY)).toBe('2225');
  });

  it('reescreve todas as posições de carga de uma vez', () => {
    const emKg = convertCargoLoads(
      { 'pod-a': '230', 'pod-b': '310' },
      'LB',
      'kg',
    );
    expect(emKg).toEqual({ 'pod-a': '104', 'pod-b': '141' });

    const devolta = convertCargoLoads(emKg, 'kg', 'LB');
    expect(devolta).toEqual({ 'pod-a': '229', 'pod-b': '311' });
  });

  it('campo vazio continua vazio', () => {
    expect(convertFuelText('', 'LB', 'L', DENSITY)).toBe('');
    expect(convertCargoLoads({ 'pod-a': '' }, 'LB', 'kg')).toEqual({
      'pod-a': '',
    });
  });

  it('trocar para a mesma unidade não mexe no texto', () => {
    expect(convertFuelText('1257', 'L', 'L', DENSITY)).toBe('1257');
    expect(convertCargoLoads({ 'pod-a': '230' }, 'LB', 'LB')).toEqual({
      'pod-a': '230',
    });
  });

  it('sem densidade o combustível não é reescrito', () => {
    expect(convertFuelText('2224', 'LB', 'L', null)).toBe('2224');
  });

  it('encher os tanques em litros não estoura a capacidade', () => {
    /* O atalho "Tanques cheios" arredonda para baixo justamente para não cair
       1 LB acima do utilizável e disparar alerta por artefato de conversão. */
    const utilizavelLb = C98.fuel.usableCapacityLb ?? 0;
    const litrosCheios = Math.floor(lbToLitres(utilizavelLb, DENSITY));

    const plan = toMissionPlan(
      draftWith({ fuel: String(litrosCheios), fuelUnit: 'L' }),
      DENSITY,
    );

    expect(plan.fuelLb).toBeLessThanOrEqual(utilizavelLb);
    esperaProximo(plan.fuelLb, utilizavelLb, DERIVA_LB);
  });
});

describe('unidade de tela não contamina o cálculo', () => {
  it('o mesmo carregamento físico produz o mesmo plano', () => {
    const emLb = toMissionPlan(
      draftWith({
        fuel: '2224',
        fuelUnit: 'LB',
        cargoUnit: 'LB',
        positionLoads: { 'pod-a': '230' },
      }),
      DENSITY,
    );

    const emMetrico = toMissionPlan(
      draftWith({
        fuel: convertFuelText('2224', 'LB', 'L', DENSITY),
        fuelUnit: 'L',
        cargoUnit: 'kg',
        positionLoads: convertCargoLoads({ 'pod-a': '230' }, 'LB', 'kg'),
      }),
      DENSITY,
    );

    esperaProximo(emMetrico.fuelLb, emLb.fuelLb, DERIVA_LB);
    esperaProximo(
      emMetrico.positionLoads['pod-a'] ?? 0,
      emLb.positionLoads['pod-a'] ?? 0,
      DERIVA_LB,
    );
  });

  it('as pessoas continuam em quilogramas, sem seletor', () => {
    const plan = toMissionPlan(
      draftWith({
        cargoUnit: 'kg',
        crew: [{ id: 'p', role: 'Piloto', weight: '80' }],
        passengerLoads: { p45: '90' },
      }),
      DENSITY,
    );

    expect(plan.crew[0]?.weightKg).toBe(80);
    expect(plan.passengerLoads['p45']).toBe(90);
  });
});

describe('coerência da tabela de combustível', () => {
  it('a capacidade total confere entre libras e litros', () => {
    const lb = C98.fuel.totalCapacityLb ?? 0;
    const litros = C98.fuel.totalCapacityL ?? 0;
    expect(Math.round(litresToLb(litros, DENSITY))).toBe(lb);
  });

  it('o total supera o utilizável pelo combustível não utilizável', () => {
    const total = C98.fuel.totalCapacityLb ?? 0;
    const utilizavel = C98.fuel.usableCapacityLb ?? 0;
    expect(total).toBeGreaterThan(utilizavel);
    /* Os ~24 LB de diferença já estão no peso básico da aeronave, e por isso o
       limite do cálculo continua sendo o utilizável. */
    expect(total - utilizavel).toBeCloseTo(24, 0);
  });
});

describe('funções sugeridas ao acrescentar tripulante', () => {
  /* Piloto, copiloto e mecânico já vêm no rascunho inicial — toda missão leva
     os três, e o mecânico está travado ao assento 4 desde a primeira tela. */
  const BORDO = ['Piloto', 'Copiloto', 'Mecânico'];

  it('depois dos três fixos, sugere o segundo mecânico', () => {
    expect(nextCrewRole(BORDO)).toBe('Segundo Mecânico');
  });

  it('depois disso numera contando a tripulação inteira', () => {
    /* "Tripulante 5" porque ele é o quinto a bordo — piloto, copiloto e
       mecânico também são tripulantes, ainda que tenham nome próprio. */
    const completa = [...BORDO, 'Segundo Mecânico'];
    expect(nextCrewRole(completa)).toBe('Tripulante 5');
    expect(nextCrewRole([...completa, 'Tripulante 5'])).toBe('Tripulante 6');
  });

  it('não sugere mais mestre de carga', () => {
    const sequencia: string[] = [];
    let bordo = [...BORDO];
    for (let i = 0; i < 5; i += 1) {
      const role = nextCrewRole(bordo);
      sequencia.push(role);
      bordo = [...bordo, role];
    }

    expect(sequencia).not.toContain('Mestre de Carga');
    expect(sequencia).toEqual([
      'Segundo Mecânico',
      'Tripulante 5',
      'Tripulante 6',
      'Tripulante 7',
      'Tripulante 8',
    ]);
  });

  /**
   * Regressão: acrescentar depois de remover alguém do meio da lista.
   *
   * A versão anterior contava a tripulação e devolvia "Tripulante 6" para uma
   * tripulação que já tinha um Tripulante 6 — duas linhas com o mesmo nome numa
   * lista de pesos, convidando a lançar o peso na errada.
   */
  it('nunca repete um nome que já está a bordo', () => {
    const bordo = [...BORDO, 'Segundo Mecânico', 'Tripulante 6', 'Tripulante 7'];
    expect(nextCrewRole(bordo)).toBe('Tripulante 8');
  });

  it('devolve a função que vagou, em vez de um número', () => {
    /* Tirar o Segundo Mecânico e acrescentar de novo traz ele de volta. */
    const semSegundo = [...BORDO, 'Tripulante 6'];
    expect(nextCrewRole(semSegundo)).toBe('Segundo Mecânico');
  });

  it('a tripulação inicial já traz piloto, copiloto e mecânico', () => {
    const crew = initialDraft('fab-2720').crew;
    expect(crew.map((member) => member.role)).toEqual(BORDO);
  });

  it('o combustível inicial é o mínimo de decolagem da unidade', () => {
    /* Começar com o tanque em branco anunciaria uma disponibilidade de peso
       que não existe: este combustível embarca de qualquer forma. */
    const draft = initialDraft('fab-2720');

    expect(draft.fuelUnit).toBe('LB');
    expect(draft.fuel).toBe(String(MINIMUM_TAKEOFF_FUEL_LB));
    expect(toMissionPlan(draft, null).fuelLb).toBe(MINIMUM_TAKEOFF_FUEL_LB);
  });
});
