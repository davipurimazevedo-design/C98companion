/** Construtor de planejamentos para teste. */

import type { MissionPlan } from '../../models/plan.ts';

export function makePlan(overrides: Partial<MissionPlan> = {}): MissionPlan {
  return {
    aircraftId: 'teste',
    fuelLb: 0,
    crew: [],
    passengerLoads: {},
    passengerCount: null,
    positionLoads: {},
    cargoRestraint: 'amarrada',
    ...overrides,
  };
}

/** Tripulante com peso em quilogramas. */
export function crew(id: string, weightKg: number) {
  return { id, role: 'Piloto', weightKg };
}
