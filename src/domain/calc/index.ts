/**
 * Ponto único de cálculo.
 *
 * A interface chama `computePlanResult` e recebe tudo pronto. Nenhum componente
 * precisa saber a ordem das etapas nem quais dados sustentam qual resultado.
 *
 * A função é pura: mesmas entradas, mesmo resultado, sem efeito colateral. É o
 * que permite recalcular a cada tecla digitada sem risco e testar cada regra
 * isoladamente.
 */

import {
  cabinSeatsFor,
  describeMissingData,
  passengerStationsFor,
  positionsFor,
} from '../../data/aircraft/index.ts';
import { computeCg, type CgResult } from './cg.ts';
import { computeMoment, type MomentReport } from './moment.ts';
import type {
  AircraftProfile,
  LoadPosition,
} from '../../data/aircraft/types.ts';
import type { MissionPlan } from '../models/plan.ts';
import { buildAlerts, type Alert } from './alerts.ts';
import {
  computeAdditionalFuel,
  computeAvailability,
  type Availability,
} from './availability.ts';
import { evaluateLimits, type LimitReport } from './limits.ts';
import { isReady, type Outcome } from './outcome.ts';
import {
  computePassengerCapacity,
  type PassengerCapacity,
} from './passengers.ts';
import { resolveSeats, type SeatSlot } from './seats.ts';
import { deriveSituation, type SituationLevel } from './status.ts';
import { computeTotals, type LoadTotals } from './totals.ts';
import { buildVerdict, type Verdict } from './verdict.ts';

export interface PlanResult {
  /** Posições realmente disponíveis nesta aeronave. */
  readonly positions: readonly LoadPosition[];
  /** Assentos de passageiro desta aeronave, com braço e lado resolvidos. */
  readonly seats: readonly SeatSlot[];
  /** Somatórios do carregamento. Sempre disponíveis. */
  readonly totals: LoadTotals;
  /** Peso total, disponível, percentual e margem. */
  readonly availability: Outcome<Availability>;
  /** Combustível que ainda cabe. */
  readonly additionalFuel: Outcome<number>;
  /** Quantos passageiros ainda cabem, por peso e por assento. */
  readonly capacity: PassengerCapacity;
  /** Momentos item a item. Pendente sem o momento básico da matrícula. */
  readonly moment: Outcome<MomentReport>;
  /** Centro de gravidade na decolagem. `null` enquanto o momento é pendente. */
  readonly cg: CgResult | null;
  /** Passageiros além dos assentos instalados. Zero quando não há excesso. */
  readonly seatOverflow: number;
  readonly limits: LimitReport;
  readonly level: SituationLevel;
  readonly verdict: Verdict;
  readonly alerts: readonly Alert[];
  /** Campos ainda não cadastrados para esta aeronave. */
  readonly missingData: readonly string[];
}

/** Calcula o resultado completo de um planejamento. */
export function computePlanResult(
  plan: MissionPlan,
  profile: AircraftProfile,
): PlanResult {
  const positions = positionsFor(profile);
  const seatSlots = resolveSeats(
    cabinSeatsFor(profile),
    passengerStationsFor(profile),
  );
  const totals = computeTotals(plan, positions);
  const availability = computeAvailability(totals, profile);
  const additionalFuel = computeAdditionalFuel(totals, profile);
  const limits = evaluateLimits(plan, totals, profile, positions);
  const missingData = describeMissingData(profile);

  const seats = profile.registration.passengerSeats;
  const capacity = computePassengerCapacity({
    availableLb: isReady(availability) ? availability.value.availableLb : 0,
    seats,
    onBoard: plan.passengerCount,
  });

  const seatOverflow =
    plan.passengerCount === null
      ? 0
      : Math.max(0, plan.passengerCount - seats);

  /* Centragem: só existe quando o momento básico da matrícula está cadastrado. */
  const moment = computeMoment(plan, profile, positions, seatSlots);
  const cg = isReady(moment)
    ? computeCg(moment.value.takeoffWeightLb, moment.value.takeoffMoment1000)
    : null;
  const cgOutOfLimits = cg?.status === 'forward' || cg?.status === 'aft';

  /* Centragem fora dos limites e gente demais são problemas imediatos, ainda
     que o peso caiba. Sobrepõem a situação derivada dos limites de peso. */
  const level: SituationLevel =
    seatOverflow > 0 || cgOutOfLimits
      ? 'crit'
      : deriveSituation(availability, limits, profile);

  return {
    positions,
    seats: seatSlots,
    totals,
    availability,
    additionalFuel,
    capacity,
    seatOverflow,
    moment,
    cg,
    limits,
    level,
    verdict: buildVerdict({
      availability,
      additionalFuel,
      capacity,
      level,
      payloadLb: totals.payloadLb,
      fuelOnBoardLb: totals.fuelLb,
      seatOverflow,
    }),
    alerts: buildAlerts({
      availability,
      limits,
      missingData,
      seatOverflow,
      seats,
      cg,
    }),
    missingData,
  };
}

export { limitOf } from './limits.ts';
export { computePassengerCapacity, distributeBySeats } from './passengers.ts';
export { resolveSeats, stationLoadKg } from './seats.ts';
export type { SeatSlot } from './seats.ts';
export { computeMoment, fuelMoment1000 } from './moment.ts';
export {
  computeCg,
  envelopePolygon,
  forwardLimitAt,
  toPctMac,
  ENVELOPE_WEIGHT_RANGE,
} from './cg.ts';
export type { MomentReport } from './moment.ts';
export type { CgResult, CgStatus, EnvelopePoint } from './cg.ts';
export type { PassengerCapacity } from './passengers.ts';
export type { Availability } from './availability.ts';
export type { LimitCheck, LimitReport } from './limits.ts';
export type { LoadTotals } from './totals.ts';
export type { SituationLevel } from './status.ts';
export type { Verdict } from './verdict.ts';
export type { Alert, AlertLevel } from './alerts.ts';
export { isReady, valueOrNull, type Outcome } from './outcome.ts';
