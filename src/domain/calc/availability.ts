/**
 * Disponibilidade de peso — a pergunta central do aplicativo.
 *
 * Depende de dois dados: o peso básico da matrícula, que vem da ficha de
 * pesagem, e o peso máximo de decolagem, que vem do manual. Enquanto qualquer
 * um deles estiver pendente, devolve `pending` em vez de um número: o piloto vê
 * "—" e a razão, nunca uma estimativa.
 */

import type { AircraftProfile } from '../../data/aircraft/types.ts';
import { isPresent } from '../../data/pending.ts';
import type { LoadTotals } from './totals.ts';
import { pending, ready, type Outcome } from './outcome.ts';

const LABEL_BASIC_WEIGHT = 'Peso básico vazio';
const LABEL_MAX_TAKEOFF = 'Peso máximo de decolagem';
const LABEL_FUEL_CAPACITY = 'Capacidade utilizável de combustível';

export interface Availability {
  /** Peso básico + tudo que foi embarcado. */
  readonly totalWeightLb: number;
  /** Referência contra a qual o total é comparado: peso máximo de decolagem. */
  readonly maxWeightLb: number;
  /** Quanto ainda cabe. Negativo quando o limite foi ultrapassado. */
  readonly availableLb: number;
  /** Percentual do peso máximo já utilizado. */
  readonly usedPct: number;
  /** Percentual ainda livre. Negativo quando o limite foi ultrapassado. */
  readonly marginPct: number;
  readonly isExceeded: boolean;
  /** Quanto passou do limite. Zero quando dentro dos limites. */
  readonly exceededByLb: number;
}

/**
 * Peso total da aeronave: peso básico da matrícula somado ao carregamento.
 *
 * Isolado porque várias verificações de limite precisam do mesmo número, e
 * todas devem ficar pendentes pelo mesmo motivo se o peso básico faltar.
 */
export function computeTotalWeight(
  totals: LoadTotals,
  profile: AircraftProfile,
): Outcome<number> {
  const basic = profile.registration.basicEmptyWeightLb;
  if (!isPresent(basic)) {
    return pending([LABEL_BASIC_WEIGHT]);
  }
  return ready(basic + totals.payloadLb);
}

/** Calcula peso total, disponível, percentual utilizado e margem. */
export function computeAvailability(
  totals: LoadTotals,
  profile: AircraftProfile,
): Outcome<Availability> {
  const basic = profile.registration.basicEmptyWeightLb;
  const max = profile.model.limits.maxTakeoffWeightLb;

  const missing: string[] = [];
  if (!isPresent(basic)) missing.push(LABEL_BASIC_WEIGHT);
  /* Um limite zerado ou negativo é cadastro inválido, não limite real. */
  if (!isPresent(max) || max <= 0) missing.push(LABEL_MAX_TAKEOFF);
  if (!isPresent(basic) || !isPresent(max) || max <= 0) {
    return pending(missing);
  }

  const totalWeightLb = basic + totals.payloadLb;
  const availableLb = max - totalWeightLb;
  const usedPct = (totalWeightLb / max) * 100;

  return ready({
    totalWeightLb,
    maxWeightLb: max,
    availableLb,
    usedPct,
    marginPct: 100 - usedPct,
    isExceeded: availableLb < 0,
    exceededByLb: Math.max(0, -availableLb),
  });
}

/**
 * Quanto combustível ainda pode ser embarcado.
 *
 * Limitado por dois fatores ao mesmo tempo: a margem de peso restante e o
 * espaço que sobra nos tanques. O menor dos dois manda — o aplicativo nunca
 * sugere embarcar combustível que não caberia fisicamente.
 *
 * O combustível mínimo da perna não restringe este número: ele é um piso do que
 * deve permanecer a bordo, e acrescentar combustível jamais o viola.
 */
export function computeAdditionalFuel(
  totals: LoadTotals,
  profile: AircraftProfile,
): Outcome<number> {
  const availability = computeAvailability(totals, profile);
  const usable = profile.model.fuel.usableCapacityLb;

  const missing: string[] = [];
  if (availability.status === 'pending') missing.push(...availability.missing);
  if (!isPresent(usable)) missing.push(LABEL_FUEL_CAPACITY);

  if (availability.status === 'pending' || !isPresent(usable)) {
    return pending(missing);
  }

  const roomInTanksLb = usable - totals.fuelLb;
  return ready(
    Math.max(0, Math.min(availability.value.availableLb, roomInTanksLb)),
  );
}
