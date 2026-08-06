import { describe, expect, it } from 'vitest';

import {
  cabinSeatsFor,
  passengerStationsFor,
  positionsFor,
} from '../../data/aircraft/index.ts';
import type { AircraftProfile } from '../../data/aircraft/types.ts';
import type { MissionPlan } from '../models/plan.ts';
import { makePlan } from './__fixtures__/plan.ts';
import { pendingProfile, realProfile } from './__fixtures__/profile.ts';
import { evaluateLimits, type LimitCheck } from './limits.ts';
import { resolveSeats } from './seats.ts';
import { computeTotals } from './totals.ts';

function evaluate(plan: MissionPlan, profile: AircraftProfile) {
  const positions = positionsFor(profile);
  const seats = resolveSeats(cabinSeatsFor(profile), passengerStationsFor(profile));
  return evaluateLimits(
    plan,
    computeTotals(plan, positions, seats),
    profile,
    positions,
  );
}

function find(checks: readonly LimitCheck[], id: string): LimitCheck {
  const check = checks.find((item) => item.id === id);
  if (!check) throw new Error(`Verificação "${id}" não encontrada.`);
  return check;
}

describe('evaluateLimits sem a ficha de pesagem', () => {
  const profile = pendingProfile();

  it('deixa pendentes só as verificações que dependem do peso básico', () => {
    const report = evaluate(makePlan({ fuelLb: 900 }), profile);

    expect(find(report.checks, 'takeoff').status).toBe('pending');
    expect(find(report.checks, 'ramp').status).toBe('pending');
    expect(find(report.checks, 'takeoff').missing).toEqual([
      'Peso básico vazio',
    ]);
  });

  it('já verifica combustível e carga, que não dependem do peso básico', () => {
    const report = evaluate(
      makePlan({ fuelLb: 2500, positionLoads: { 'zona-2': 3500 } }),
      profile,
    );

    expect(find(report.checks, 'fuel-capacity').status).toBe('exceeded');
    expect(find(report.checks, 'cabin-cargo').status).toBe('exceeded');
    expect(report.hasExceeded).toBe(true);
  });
});

describe('evaluateLimits com peso básico cadastrado', () => {
  const profile = realProfile();

  it('aprova um carregamento dentro de todos os limites', () => {
    const plan = makePlan({
      fuelLb: 1000,
      positionLoads: { 'zona-2': 500, 'pod-a': 200 },
    });
    const report = evaluate(plan, profile);

    expect(report.hasExceeded).toBe(false);
    expect(find(report.checks, 'takeoff').status).toBe('ok');
    expect(find(report.checks, 'ramp').status).toBe('ok');
    expect(find(report.checks, 'fuel-capacity').status).toBe('ok');
    expect(find(report.checks, 'cabin-cargo').status).toBe('ok');
    expect(find(report.checks, 'pod-cargo').status).toBe('ok');
  });

  it('acusa peso máximo de decolagem excedido com o valor exato', () => {
    const plan = makePlan({
      positionLoads: { 'zona-2': 3100 },
      fuelLb: 2224,
    });
    const check = find(evaluate(plan, profile).checks, 'takeoff');

    expect(check.status).toBe('exceeded');
    expect(check.actualLb).toBe(10_324);
    expect(check.limitLb).toBe(8750);
    expect(check.exceededByLb).toBe(1574);
  });

  it('trata a rampa como 35 LB mais permissiva que a decolagem', () => {
    /* Total de 8.770 LB: passa da decolagem (8.750), dentro da rampa (8.785). */
    const plan = makePlan({ positionLoads: { 'zona-2': 3000 }, fuelLb: 770 });
    const checks = evaluate(plan, profile).checks;

    expect(find(checks, 'takeoff').status).toBe('exceeded');
    expect(find(checks, 'takeoff').exceededByLb).toBe(20);
    expect(find(checks, 'ramp').status).toBe('ok');
  });

  it('acusa capacidade de combustível excedida', () => {
    const check = find(
      evaluate(makePlan({ fuelLb: 2400 }), profile).checks,
      'fuel-capacity',
    );

    expect(check.status).toBe('exceeded');
    expect(check.limitLb).toBe(2224);
    expect(check.exceededByLb).toBe(176);
  });

  it('acusa a carga total da cabine acima de 3400 LB', () => {
    const plan = makePlan({
      positionLoads: { 'zona-1': 1780, 'zona-2': 1700, 'zona-3': 100 },
    });
    const check = find(evaluate(plan, profile).checks, 'cabin-cargo');

    expect(check.actualLb).toBe(3580);
    expect(check.status).toBe('exceeded');
    expect(check.exceededByLb).toBe(180);
  });

  it('aceita o cargo pod carregado exatamente no limite de 1090 LB', () => {
    const plan = makePlan({
      positionLoads: { 'pod-a': 230, 'pod-b': 310, 'pod-c': 270, 'pod-d': 280 },
    });
    const check = find(evaluate(plan, profile).checks, 'pod-cargo');

    expect(check.actualLb).toBe(1090);
    expect(check.status).toBe('ok');
  });

  describe('amarração da carga', () => {
    const carga = { 'zona-2': 900 };

    it('900 LB na zona 2 passa com a carga amarrada (máx. 3100)', () => {
      const report = evaluate(
        makePlan({ positionLoads: carga, cargoRestraint: 'amarrada' }),
        profile,
      );
      const check = find(report.checks, 'position:zona-2');

      expect(check.limitLb).toBe(3100);
      expect(check.status).toBe('ok');
    });

    it('os mesmos 900 LB excedem sem amarração (máx. 860)', () => {
      const report = evaluate(
        makePlan({ positionLoads: carga, cargoRestraint: 'sem-amarracao' }),
        profile,
      );
      const check = find(report.checks, 'position:zona-2');

      expect(check.limitLb).toBe(860);
      expect(check.status).toBe('exceeded');
      expect(check.exceededByLb).toBe(40);
    });

    it('o cargo pod tem o mesmo limite nos dois modos', () => {
      for (const restraint of ['amarrada', 'sem-amarracao'] as const) {
        const report = evaluate(
          makePlan({ positionLoads: { 'pod-b': 310 }, cargoRestraint: restraint }),
          profile,
        );
        expect(find(report.checks, 'position:pod-b').limitLb).toBe(310);
      }
    });
  });

  it('trata posição não preenchida como zero', () => {
    const check = find(evaluate(makePlan(), profile).checks, 'position:zona-1');
    expect(check.actualLb).toBe(0);
    expect(check.status).toBe('ok');
  });

  it('não verifica o peso de pouso, por decisão registrada', () => {
    const checks = evaluate(makePlan(), profile).checks;
    expect(checks.some((check) => check.id === 'landing')).toBe(false);
  });
});

describe('aeronave sem cargo pod', () => {
  const profile = realProfile({ hasCargoPod: false });

  it('não oferece nem verifica os compartimentos do pod', () => {
    const report = evaluate(makePlan(), profile);

    expect(positionsFor(profile)).toHaveLength(6);
    expect(report.checks.some((check) => check.id === 'pod-cargo')).toBe(false);
    expect(report.checks.some((check) => check.id === 'position:pod-a')).toBe(
      false,
    );
  });
});
