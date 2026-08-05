/**
 * Estado do planejamento.
 *
 * Guarda apenas o rascunho digitado. Nenhum resultado é armazenado: tudo é
 * recalculado a partir do rascunho, o que torna impossível a tela exibir um
 * número desatualizado em relação aos campos.
 */

import { create } from 'zustand';

import {
  DEFAULT_AIRCRAFT_ID,
  findAircraft,
  getProfile,
} from '../data/aircraft/index.ts';
import type { CargoRestraint } from '../domain/models/plan.ts';
import { loadDraft, saveDraft } from '../services/storage.ts';
import {
  convertCargoLoads,
  convertFuelText,
  EXTRA_CREW_ROLES,
  initialDraft,
  type CargoUnit,
  type FuelUnit,
  type PlanDraft,
} from './draft.ts';

interface PlanStore {
  readonly draft: PlanDraft;

  selectAircraft: (id: string) => void;
  setFuel: (text: string) => void;
  setFuelUnit: (unit: FuelUnit) => void;
  setCargoUnit: (unit: CargoUnit) => void;
  setPassengerLoad: (stationId: string, text: string) => void;
  setPassengerLoads: (loads: Readonly<Record<string, string>>) => void;
  setPassengerCount: (text: string) => void;

  setCrewWeight: (id: string, text: string) => void;
  addCrewMember: () => void;
  removeCrewMember: (id: string) => void;

  setPositionLoad: (positionId: string, text: string) => void;
  setCargoRestraint: (restraint: CargoRestraint) => void;
  setCabinCargoOpen: (open: boolean) => void;

  reset: () => void;
}

/** Identificador único e estável para linhas criadas em tempo de execução. */
let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence}`;
}

/**
 * Rascunho inicial: o salvo no aparelho, se ainda apontar para uma matrícula
 * cadastrada. Uma aeronave removida da frota invalida o rascunho.
 */
function startingDraft(): PlanDraft {
  const saved = loadDraft();
  if (saved && findAircraft(saved.aircraftId)) return saved;
  return initialDraft(DEFAULT_AIRCRAFT_ID);
}

export const usePlanStore = create<PlanStore>()((set) => ({
  draft: startingDraft(),

  selectAircraft: (id) =>
    set((state) => ({ draft: { ...state.draft, aircraftId: id } })),

  setFuel: (text) => set((state) => ({ draft: { ...state.draft, fuel: text } })),

  /* Trocar a unidade converte o que já foi lançado. Limpar seria mais simples
     de programar e perderia o trabalho do piloto — em carga, até dez campos. */
  setFuelUnit: (unit) =>
    set((state) => {
      if (state.draft.fuelUnit === unit) return state;
      const density =
        getProfile(state.draft.aircraftId)?.model.fuel
          .referenceDensityLbPerGal ?? null;
      return {
        draft: {
          ...state.draft,
          fuelUnit: unit,
          fuel: convertFuelText(
            state.draft.fuel,
            state.draft.fuelUnit,
            unit,
            density,
          ),
        },
      };
    }),

  setCargoUnit: (unit) =>
    set((state) => {
      if (state.draft.cargoUnit === unit) return state;
      return {
        draft: {
          ...state.draft,
          cargoUnit: unit,
          positionLoads: convertCargoLoads(
            state.draft.positionLoads,
            state.draft.cargoUnit,
            unit,
          ),
        },
      };
    }),

  setPassengerLoad: (stationId, text) =>
    set((state) => ({
      draft: {
        ...state.draft,
        passengerLoads: { ...state.draft.passengerLoads, [stationId]: text },
      },
    })),

  setPassengerLoads: (loads) =>
    set((state) => ({ draft: { ...state.draft, passengerLoads: loads } })),

  setPassengerCount: (text) =>
    set((state) => ({ draft: { ...state.draft, passengerCount: text } })),

  setCrewWeight: (id, text) =>
    set((state) => ({
      draft: {
        ...state.draft,
        crew: state.draft.crew.map((member) =>
          member.id === id ? { ...member, weight: text } : member,
        ),
      },
    })),

  addCrewMember: () =>
    set((state) => {
      const extras = state.draft.crew.length - 2;
      const role =
        EXTRA_CREW_ROLES[extras] ?? `Tripulante ${state.draft.crew.length + 1}`;
      return {
        draft: {
          ...state.draft,
          crew: [...state.draft.crew, { id: nextId('trip'), role, weight: '' }],
        },
      };
    }),

  removeCrewMember: (id) =>
    set((state) => ({
      draft: {
        ...state.draft,
        crew: state.draft.crew.filter((member) => member.id !== id),
      },
    })),

  setPositionLoad: (positionId, text) =>
    set((state) => ({
      draft: {
        ...state.draft,
        positionLoads: { ...state.draft.positionLoads, [positionId]: text },
      },
    })),

  setCargoRestraint: (restraint) =>
    set((state) => ({ draft: { ...state.draft, cargoRestraint: restraint } })),

  setCabinCargoOpen: (open) =>
    set((state) => ({ draft: { ...state.draft, cabinCargoOpen: open } })),

  reset: () => set((state) => ({ draft: initialDraft(state.draft.aircraftId) })),
}));

/* Autosave: qualquer alteração no rascunho é gravada no aparelho. */
usePlanStore.subscribe((state) => saveDraft(state.draft));
