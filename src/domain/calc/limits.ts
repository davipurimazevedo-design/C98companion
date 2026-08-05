/**
 * Verificação dos limites operacionais.
 *
 * Cada limite vira uma verificação independente, com três desfechos possíveis:
 * dentro do limite, excedido, ou pendente por falta de cadastro.
 *
 * O peso máximo de pouso está cadastrado mas NÃO é verificado aqui: avaliá-lo
 * exigiria saber quanto combustível será queimado até o pouso, o que não se
 * deduz do planejamento. Decisão registrada em `c98.limits.ts`.
 */

import type {
  AircraftProfile,
  LoadPosition,
} from '../../data/aircraft/types.ts';
import { isPresent } from '../../data/pending.ts';
import type { MissionPlan } from '../models/plan.ts';
import { computeTotalWeight } from './availability.ts';
import type { LoadTotals } from './totals.ts';

export type LimitCheckStatus = 'ok' | 'exceeded' | 'pending';

export interface LimitCheck {
  readonly id: string;
  readonly label: string;
  readonly status: LimitCheckStatus;
  /** Valor apurado. `null` quando não foi possível apurar. */
  readonly actualLb: number | null;
  /** Limite cadastrado. `null` quando pendente. */
  readonly limitLb: number | null;
  /** Quanto passou do limite. Zero quando dentro ou não avaliado. */
  readonly exceededByLb: number;
  /** Dados que faltam para avaliar. */
  readonly missing: readonly string[];
}

export interface LimitReport {
  readonly checks: readonly LimitCheck[];
  /** Somente as verificações ultrapassadas, para alerta imediato. */
  readonly exceeded: readonly LimitCheck[];
  readonly hasExceeded: boolean;
}

/** Monta uma verificação comparando um valor apurado com um limite cadastrado. */
function compare(
  id: string,
  label: string,
  actual: number | null,
  limit: number | null,
  missing: readonly string[],
): LimitCheck {
  if (actual === null || limit === null) {
    return {
      id,
      label,
      status: 'pending',
      actualLb: actual,
      limitLb: limit,
      exceededByLb: 0,
      missing,
    };
  }

  const excess = actual - limit;
  return {
    id,
    label,
    status: excess > 0 ? 'exceeded' : 'ok',
    actualLb: actual,
    limitLb: limit,
    exceededByLb: Math.max(0, excess),
    missing: [],
  };
}

/** Limite da posição conforme a carga esteja amarrada ou não. */
export function limitOf(
  position: LoadPosition,
  restraint: MissionPlan['cargoRestraint'],
): number | null {
  return restraint === 'amarrada'
    ? position.maxSecuredLb
    : position.maxUnsecuredLb;
}

/** Avalia todos os limites aplicáveis ao planejamento. */
export function evaluateLimits(
  plan: MissionPlan,
  totals: LoadTotals,
  profile: AircraftProfile,
  positions: readonly LoadPosition[],
): LimitReport {
  const { limits } = profile.model;
  const { fuel } = profile.model;
  const checks: LimitCheck[] = [];

  const totalWeight = computeTotalWeight(totals, profile);
  const totalLb = totalWeight.status === 'ready' ? totalWeight.value : null;
  const totalMissing =
    totalWeight.status === 'pending' ? totalWeight.missing : [];

  /* ---- Peso máximo de decolagem: a referência principal ---- */
  checks.push(
    compare(
      'takeoff',
      'Peso máximo de decolagem',
      totalLb,
      limits.maxTakeoffWeightLb,
      [
        ...totalMissing,
        ...(isPresent(limits.maxTakeoffWeightLb)
          ? []
          : ['Peso máximo de decolagem']),
      ],
    ),
  );

  /* ---- Peso máximo de rampa ---- */
  checks.push(
    compare('ramp', 'Peso máximo de rampa', totalLb, limits.maxRampWeightLb, [
      ...totalMissing,
      ...(isPresent(limits.maxRampWeightLb) ? [] : ['Peso máximo de rampa']),
    ]),
  );

  /* ---- Capacidade utilizável de combustível ---- */
  checks.push(
    compare(
      'fuel-capacity',
      'Capacidade de combustível',
      totals.fuelLb,
      fuel.usableCapacityLb,
      isPresent(fuel.usableCapacityLb)
        ? []
        : ['Capacidade utilizável de combustível'],
    ),
  );

  /* ---- Carga total da cabine ---- */
  checks.push(
    compare(
      'cabin-cargo',
      'Carga máxima da cabine',
      totals.cabinCargoLb,
      limits.maxCabinCargoLb,
      isPresent(limits.maxCabinCargoLb) ? [] : ['Carga máxima da cabine'],
    ),
  );

  /* ---- Carga total do cargo pod, se a aeronave o tiver ---- */
  if (profile.registration.hasCargoPod) {
    checks.push(
      compare(
        'pod-cargo',
        'Carga máxima do cargo pod',
        totals.podCargoLb,
        limits.maxCargoPodLb,
        isPresent(limits.maxCargoPodLb) ? [] : ['Carga máxima do cargo pod'],
      ),
    );
  }

  /* ---- Limite de cada zona e compartimento ---- */
  for (const position of positions) {
    const loaded = plan.positionLoads[position.id] ?? 0;
    const limit = limitOf(position, plan.cargoRestraint);
    checks.push(
      compare(
        `position:${position.id}`,
        position.label,
        loaded,
        limit,
        limit === null ? [`Limite de ${position.label}`] : [],
      ),
    );
  }

  const exceeded = checks.filter((check) => check.status === 'exceeded');

  return { checks, exceeded, hasExceeded: exceeded.length > 0 };
}
