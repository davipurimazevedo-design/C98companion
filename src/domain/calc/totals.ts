/**
 * Somatórios do carregamento.
 *
 * Esta é a camada que NÃO depende dos limites do manual: soma o que o piloto
 * digitou e converte quilogramas em libras. Funciona integralmente mesmo com o
 * peso básico da aeronave pendente, e por isso o aplicativo já é útil antes do
 * cadastro completo — mostra quanto foi embarcado, ainda que não saiba dizer se
 * cabe.
 *
 * Recebe a lista de posições apenas para saber quais pertencem à cabine e quais
 * ao cargo pod, já que cada grupo tem limite próprio.
 */

import type { LoadPosition } from '../../data/aircraft/types.ts';
import type { MissionPlan } from '../models/plan.ts';
import { kgToLb, sumKgToLb, sumLb } from './units.ts';

export interface LoadTotals {
  readonly crewCount: number;
  readonly crewKg: number;
  readonly crewLb: number;

  readonly passengerKg: number;
  readonly passengerLb: number;

  /** Soma das zonas 1 a 6 da cabine. */
  readonly cabinCargoLb: number;
  /** Soma dos compartimentos A a D do cargo pod. */
  readonly podCargoLb: number;
  /** Carga total: cabine + pod. */
  readonly cargoLb: number;

  readonly fuelLb: number;

  /** Tudo que embarca, sem combustível: tripulação + passageiros + carga. */
  readonly zeroFuelPayloadLb: number;
  /** Tudo que embarca, com combustível. */
  readonly payloadLb: number;
}

/** Soma o carregamento do planejamento. */
export function computeTotals(
  plan: MissionPlan,
  positions: readonly LoadPosition[],
): LoadTotals {
  const crewKg = plan.crew.reduce((total, member) => total + member.weightKg, 0);
  const crewLb = sumKgToLb(plan.crew.map((member) => member.weightKg));

  const loadOf = (position: LoadPosition) =>
    plan.positionLoads[position.id] ?? 0;

  const cabinCargoLb = sumLb(
    positions.filter((p) => p.group === 'cabine').map(loadOf),
  );
  const podCargoLb = sumLb(
    positions.filter((p) => p.group === 'pod').map(loadOf),
  );

  const passengerKg = Object.values(plan.passengerLoads).reduce(
    (total, weight) => total + weight,
    0,
  );
  const passengerLb = kgToLb(passengerKg);
  const cargoLb = cabinCargoLb + podCargoLb;
  const zeroFuelPayloadLb = crewLb + passengerLb + cargoLb;

  return {
    crewCount: plan.crew.length,
    crewKg,
    crewLb,

    passengerKg,
    passengerLb,

    cabinCargoLb,
    podCargoLb,
    cargoLb,

    fuelLb: plan.fuelLb,

    zeroFuelPayloadLb,
    payloadLb: zeroFuelPayloadLb + plan.fuelLb,
  };
}

/** Converte um peso de pessoa para libras. Reexportado por conveniência. */
export { kgToLb };
