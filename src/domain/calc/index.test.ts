import { describe, expect, it } from 'vitest';

import {
  DEFAULT_AIRCRAFT_ID,
  getProfile,
} from '../../data/aircraft/index.ts';
import { crew, makePlan } from './__fixtures__/plan.ts';
import {
  pendingProfile,
  realProfile,
  TEST_BEW_LB,
} from './__fixtures__/profile.ts';
import { computePlanResult } from './index.ts';
import { kgToLb } from './units.ts';

/**
 * Cenário de referência: 155 kg de tripulação, 160 kg de passageiros,
 * 200 LB na zona 2 e 1.000 LB de combustível, sobre um peso básico de 5.000 LB.
 */
const referencePlan = makePlan({
  crew: [crew('c1', 80), crew('c2', 75)],
  passengerLoads: { s4: 160 },
  positionLoads: { 'zona-2': 200 },
  fuelLb: 1000,
});

describe('computePlanResult sem a ficha de pesagem', () => {
  const result = computePlanResult(referencePlan, pendingProfile());

  it('mesmo assim soma todo o carregamento', () => {
    expect(result.totals.crewKg).toBe(155);
    expect(result.totals.passengerKg).toBe(160);
    expect(result.totals.cargoLb).toBe(200);
    expect(result.totals.payloadLb).toBeCloseTo(1894.456, 2);
  });

  it('recusa-se a apresentar peso total e disponibilidade', () => {
    expect(result.availability.status).toBe('pending');
    expect(result.additionalFuel.status).toBe('pending');
  });

  it('declara a situação como indeterminada, não como aprovada', () => {
    expect(result.level).toBe('pending');
  });

  it('explica no veredito que faltam dados, informando o que já embarcou', () => {
    expect(result.verdict.headline).toBe('Aguardando dados oficiais do manual.');
    expect(result.verdict.detail).toContain('1.894 LB');
  });

  it('o que falta é o peso básico, não o manual', () => {
    expect(result.missingData).toEqual(['Peso básico vazio']);
  });
});

describe('FAB 2720 com os dados reais cadastrados', () => {
  const profile = getProfile(DEFAULT_AIRCRAFT_ID);

  it('a matrícula está cadastrada conforme a ficha de pesagem', () => {
    expect(profile).toBeDefined();
    expect(profile?.registration.tail).toBe('FAB 2720');
    expect(profile?.registration.basicEmptyWeightLb).toBe(5123);
    expect(profile?.registration.basicMoment).toBe(982_577.4);
  });

  it('a aeronave vazia não anuncia mais gente do que cabe sentada', () => {
    /* 3.627 LB disponíveis dariam 18 passageiros de 90 kg, mas há 9 assentos. */
    const result = computePlanResult(makePlan(), profile!);

    expect(result.capacity.byWeight).toBe(18);
    expect(result.capacity.count).toBe(9);
    expect(result.verdict.notes[0]).toBe(
      'Cabem 9 passageiros — limite de 9 assentos da aeronave.',
    );
  });

  it('não há mais nada bloqueando o cálculo', () => {
    const result = computePlanResult(referencePlan, profile!);
    expect(result.missingData).toHaveLength(0);
    expect(result.availability.status).toBe('ready');
  });

  it('a aeronave vazia dispõe de 3.627 LB até o peso máximo', () => {
    const result = computePlanResult(makePlan(), profile!);

    expect(result.availability.status).toBe('ready');
    if (result.availability.status !== 'ready') return;
    expect(result.availability.value.totalWeightLb).toBe(5123);
    expect(result.availability.value.availableLb).toBe(3627);
  });

  it('resolve o cenário de referência com o peso básico real', () => {
    const result = computePlanResult(referencePlan, profile!);

    expect(result.availability.status).toBe('ready');
    if (result.availability.status !== 'ready') return;

    /* 5.123 + 342 + 353 + 200 + 1.000 = 7.017 LB */
    expect(result.availability.value.totalWeightLb).toBeCloseTo(7017.456, 2);
    expect(result.availability.value.availableLb).toBeCloseTo(1732.544, 2);
    expect(result.availability.value.usedPct).toBeCloseTo(80.199, 2);
    expect(result.level).toBe('ok');
    expect(result.verdict.headline).toBe('Ainda é possível embarcar 1.733 LB.');
  });

  it('estima quantos passageiros ainda cabem e onde chega o combustível', () => {
    const result = computePlanResult(referencePlan, profile!);

    /* 1.732,5 LB ÷ 198,4 LB por passageiro = 8,73 → 8 passageiros.
       1.000 LB a bordo + 1.224 LB adicionais = 2.224 LB. */
    expect(result.verdict.notes).toEqual([
      'Equivale a 8 passageiros de 90 kg.',
      'Somando 1.224 LB de combustível, o total a bordo fica em 2.224 LB.',
    ]);
  });

  it('usa o singular quando cabe apenas um passageiro', () => {
    /* 5.123 + 2.977 + 400 = 8.500 LB, sobram 250 LB: cabe 1 passageiro. */
    const plan = makePlan({ positionLoads: { 'zona-2': 2977 }, fuelLb: 400 });
    const notes = computePlanResult(plan, profile!).verdict.notes;

    expect(notes[0]).toBe('Equivale a 1 passageiro de 90 kg.');
  });

  it('avisa quando não cabe mais combustível nem passageiro', () => {
    /* 5.123 + 1.300 + 2.224 = 8.647 LB. Sobram 103 LB de peso e zero de tanque. */
    const plan = makePlan({ positionLoads: { 'zona-2': 1300 }, fuelLb: 2224 });
    const result = computePlanResult(plan, profile!);

    expect(result.limits.hasExceeded).toBe(false);
    expect(result.verdict.notes).toEqual([
      'Não cabe mais nenhum passageiro de 90 kg.',
      'Não cabe mais combustível.',
    ]);
  });

  it('conta os assentos livres quando a quantidade é informada', () => {
    const plan = makePlan({ ...referencePlan, passengerCount: 2 });
    const result = computePlanResult(plan, profile!);

    expect(result.capacity.freeSeats).toBe(7);
    expect(result.capacity.byWeight).toBe(8);
    expect(result.capacity.count).toBe(7);
    expect(result.verdict.notes[0]).toBe(
      'Cabem mais 7 passageiros — limitado pelos assentos livres.',
    );
  });

  it('acusa mais passageiros do que assentos instalados', () => {
    const plan = makePlan({ passengerLoads: { s4: 300 }, passengerCount: 11 });
    const result = computePlanResult(plan, profile!);

    expect(result.seatOverflow).toBe(2);
    expect(result.level).toBe('crit');
    const alert = result.alerts.find((item) => item.id === 'seats');
    expect(alert?.title).toBe('Passageiros acima dos assentos disponíveis');
    expect(alert?.detail).toBe(
      '2 passageiros sem assento. A aeronave tem 9 lugares de passageiro.',
    );
  });

  it('o veredito lidera pelo problema dos assentos, não pelo peso que sobra', () => {
    const plan = makePlan({ passengerLoads: { s4: 300 }, passengerCount: 11 });
    const verdict = computePlanResult(plan, profile!).verdict;

    expect(verdict.headline).toBe('Há 2 passageiros a mais que assentos.');
    expect(verdict.detail).toContain('O peso está dentro dos limites');
    expect(verdict.notes).toEqual([]);
  });

  it('excesso de assentos sobrepõe uma situação de peso aprovada', () => {
    /* Peso folgado, mas gente demais: continua sendo problema. */
    const plan = makePlan({ passengerLoads: { s4: 100 }, passengerCount: 12 });
    const result = computePlanResult(plan, profile!);

    expect(result.limits.hasExceeded).toBe(false);
    expect(result.level).toBe('crit');
  });

  it('o veredito de excesso não estima passageiros nem combustível', () => {
    const plan = makePlan({ positionLoads: { 'zona-2': 3100 }, fuelLb: 2224 });
    const verdict = computePlanResult(plan, profile!).verdict;

    expect(verdict.notes).toEqual([]);
  });

  it('a centragem está disponível com o momento básico cadastrado', () => {
    const result = computePlanResult(makePlan(), profile!);

    /* Aeronave vazia: 982.577,4 ÷ 5.123 = 191,797 pol, que a ficha imprime
       como 191,8. Bem dentro do limite dianteiro de 179,60 daquele peso. */
    expect(result.moment.status).toBe('ready');
    expect(result.cg).not.toBeNull();
    expect(result.cg?.armIn).toBeCloseTo(191.797, 3);
    expect(result.cg?.pctMac).toBeCloseTo(21.43, 2);
    expect(result.cg?.status).toBe('ok');
  });

  it('resolve a centragem do cenário de referência', () => {
    const result = computePlanResult(referencePlan, profile!);

    expect(result.cg?.status).toBe('ok');
    expect(result.cg?.armIn).toBeGreaterThan(result.cg?.forwardLimitIn ?? 0);
    expect(result.cg?.armIn).toBeLessThan(result.cg?.aftLimitIn ?? 0);
    /* Nenhum alerta de centragem quando ela está dentro dos limites. */
    expect(result.alerts.some((a) => a.id === 'cg')).toBe(false);
  });

  it('sinaliza a faixa de atenção com carga puxada para o fundo', () => {
    /* 320 LB na zona 6 (braço 344) e 150 na zona 5 (319,5) põem o CG em
       203,9 pol — dentro dos limites, mas na área hachurada do manual. */
    const plan = makePlan({
      positionLoads: { 'zona-6': 320, 'zona-5': 150 },
    });
    const result = computePlanResult(plan, profile!);

    expect(result.cg?.armIn).toBeCloseTo(203.9, 1);
    expect(result.cg?.status).toBe('aft-warning');
    const alerta = result.alerts.find((a) => a.id === 'cg');
    expect(alerta?.level).toBe('warn');
    expect(alerta?.title).toBe('Centragem na faixa de atenção traseira');
  });

  it('acusa centragem atrás do limite e manda deslocar carga', () => {
    /* 700 LB na zona 5 e 320 na zona 6: peso folgado, centragem estourada. */
    const plan = makePlan({
      positionLoads: { 'zona-5': 700, 'zona-6': 320 },
    });
    const result = computePlanResult(plan, profile!);

    expect(result.limits.hasExceeded).toBe(false);
    expect(result.cg?.armIn).toBeCloseTo(214.3, 1);
    expect(result.cg?.status).toBe('aft');
    expect(result.level).toBe('crit');

    const alerta = result.alerts.find((a) => a.id === 'cg');
    expect(alerta?.title).toBe('Centro de gravidade atrás do limite');
    expect(alerta?.detail).toContain('Desloque carga para a frente');
  });

  it('o combustível adicional respeita o espaço restante nos tanques', () => {
    const result = computePlanResult(referencePlan, profile!);

    /* Margem de peso 1.733 LB, espaço no tanque 2.224 − 1.000 = 1.224 LB. */
    expect(result.additionalFuel.status).toBe('ready');
    if (result.additionalFuel.status === 'ready') {
      expect(result.additionalFuel.value).toBe(1224);
    }
  });
});

describe('computePlanResult com peso básico cadastrado', () => {
  const profile = realProfile();

  it('reproduz o cenário de referência número a número', () => {
    const result = computePlanResult(referencePlan, profile);

    expect(result.availability.status).toBe('ready');
    if (result.availability.status !== 'ready') return;

    expect(result.availability.value.totalWeightLb).toBeCloseTo(6894.456, 2);
    expect(result.availability.value.availableLb).toBeCloseTo(1855.544, 2);
    expect(result.availability.value.usedPct).toBeCloseTo(78.794, 2);
    expect(result.additionalFuel.status).toBe('ready');
    if (result.additionalFuel.status === 'ready') {
      expect(result.additionalFuel.value).toBe(1224);
    }
    expect(result.level).toBe('ok');
    expect(result.missingData).toHaveLength(0);
  });

  it('redige o veredito exigido pela especificação', () => {
    const result = computePlanResult(referencePlan, profile);

    expect(result.verdict.headline).toBe('Ainda é possível embarcar 1.856 LB.');
    expect(result.verdict.detail).toBe('79% do peso máximo utilizado.');
  });

  it('redige o veredito de excesso com o valor exato', () => {
    const plan = makePlan({
      positionLoads: { 'zona-2': 3100 },
      fuelLb: 2224,
    });
    const result = computePlanResult(plan, profile);

    expect(result.level).toBe('crit');
    expect(result.verdict.headline).toBe('O limite foi excedido em 1.574 LB.');
  });

  it('passa para atenção ao cruzar 97% sem exceder nenhum limite', () => {
    /* 5.000 + 1.376 de carga + 2.224 de combustível = 8.600 LB → 98,3%. */
    const plan = makePlan({
      positionLoads: { 'zona-2': 1376 },
      fuelLb: 2224,
    });
    const result = computePlanResult(plan, profile);

    expect(result.limits.hasExceeded).toBe(false);
    expect(result.level).toBe('warn');
  });

  it('permanece verde logo abaixo do limiar', () => {
    /* 5.000 + 1.200 + 2.224 = 8.424 LB → 96,3%. */
    const plan = makePlan({ positionLoads: { 'zona-2': 1200 }, fuelLb: 2224 });
    expect(computePlanResult(plan, profile).level).toBe('ok');
  });

  it('um limite excedido sobrepõe qualquer outra situação', () => {
    const plan = makePlan({ positionLoads: { 'zona-6': 400 } }); // máx. 320
    const result = computePlanResult(plan, profile);

    expect(result.level).toBe('crit');
    expect(result.alerts[0]?.title).toBe('Zona 6 acima do limite');
    expect(result.alerts[0]?.detail).toContain('Excesso de 80 LB');
  });

  it('acusa capacidade de combustível excedida', () => {
    const result = computePlanResult(makePlan({ fuelLb: 2400 }), profile);

    expect(result.level).toBe('crit');
    const alert = result.alerts.find((item) => item.id === 'fuel-capacity');
    expect(alert?.title).toBe('Capacidade de combustível excedida');
    expect(alert?.detail).toContain('capacidade utilizável de 2.224 LB');
  });

  it('redige os alertas de grupo com a concordância correta', () => {
    const plan = makePlan({
      positionLoads: { 'zona-1': 1780, 'zona-2': 1700, 'zona-3': 100 },
    });
    const alert = computePlanResult(plan, profile).alerts.find(
      (item) => item.id === 'cabin-cargo',
    );

    expect(alert?.title).toBe('Carga da cabine acima do limite');
    expect(alert?.detail).toBe(
      '3.580 LB no total, máximo de 3.400 LB. Excesso de 180 LB.',
    );
  });

  it('o peso máximo de decolagem excedido gera alerta próprio', () => {
    const plan = makePlan({ positionLoads: { 'zona-2': 3100 }, fuelLb: 2224 });
    const alert = computePlanResult(plan, profile).alerts.find(
      (item) => item.id === 'takeoff',
    );

    expect(alert?.title).toBe('Limite excedido: peso máximo de decolagem');
    expect(alert?.detail).toContain('Excesso de 1.574 LB');
  });

  it('confirma a situação quando tudo está dentro dos limites', () => {
    const result = computePlanResult(referencePlan, profile);

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]?.level).toBe('ok');
    expect(result.alerts[0]?.title).toBe('Dentro dos limites');
  });

  it('é uma função pura: não altera o planejamento recebido', () => {
    const snapshot = JSON.stringify(referencePlan);
    computePlanResult(referencePlan, profile);
    expect(JSON.stringify(referencePlan)).toBe(snapshot);
  });
});

describe('mecânico ocupando assento da cabine', () => {
  const profile = realProfile();

  const comMecanico = makePlan({
    crew: [crew('p', 85), crew('c', 80), { id: 'm', role: 'Mecânico', weightKg: 90 }],
  });

  it('a aeronave passa a ter 8 assentos disponíveis, não 9', () => {
    const result = computePlanResult(comMecanico, profile);

    expect(result.crewSeatPlan.passengerSeats).toHaveLength(8);
    expect(result.crewSeatPlan.assignments).toHaveLength(1);
    expect(result.crewSeatPlan.assignments[0]?.seat.id).toBe('s4');
    expect(result.capacity.seats).toBe(8);
  });

  it('a estimativa de quantos passageiros cabem usa os 8 assentos', () => {
    const result = computePlanResult(comMecanico, profile);

    /* Aeronave quase vazia: 8 assentos é quem sobrou, não 9. */
    expect(result.capacity.count).toBe(8);
    expect(result.verdict.notes[0]).toBe(
      'Cabem 8 passageiros — limite de 8 assentos da aeronave.',
    );
  });

  it('o peso do mecânico entra no total, sem duplicar', () => {
    const result = computePlanResult(comMecanico, profile);

    expect(result.availability.status).toBe('ready');
    if (result.availability.status !== 'ready') return;

    /* Peso básico de teste (5.000 LB) + 85 + 80 + 90 kg de tripulação, sem
       combustível nem carga. Se o mecânico entrasse duas vezes — uma como
       tripulação, outra como um passageiro fantasma no assento 4 — o total
       ficaria 90 kg (≈ 198 LB) acima disto. */
    const crewLb = kgToLb(85 + 80 + 90);
    expect(result.availability.value.totalWeightLb).toBeCloseTo(
      TEST_BEW_LB + crewLb,
      2,
    );
  });

  it('o momento do mecânico usa o braço do assento 4', () => {
    const result = computePlanResult(comMecanico, profile);

    expect(result.moment.status).toBe('ready');
    if (result.moment.status !== 'ready') return;

    const linha = result.moment.value.lines.find(
      (l) => l.label === 'Mecânico',
    );
    expect(linha?.armIn).toBeCloseTo(173.9, 6);
  });

  it('nono passageiro com o mecânico a bordo excede os assentos', () => {
    /* 9 passageiros contra só 8 assentos disponíveis: o mecânico ocupou um. */
    const plan = makePlan({ ...comMecanico, passengerCount: 9 });
    const result = computePlanResult(plan, profile);

    expect(result.seatOverflow).toBe(1);
    expect(result.level).toBe('crit');
    const alert = result.alerts.find((item) => item.id === 'seats');
    expect(alert?.detail).toContain('A aeronave tem 8 lugares de passageiro.');
  });
});
