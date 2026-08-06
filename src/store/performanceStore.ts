/**
 * Estado da tela de Performance.
 *
 * Guarda apenas o rascunho digitado, como o store de peso e balanceamento:
 * nenhum resultado é armazenado, e tudo é recalculado a partir do texto dos
 * campos. Assim é impossível a tela exibir uma distância desatualizada em
 * relação ao que está escrito nos campos.
 */

import { create } from 'zustand';

import type { TakeoffFlaps } from '../data/performance/index.ts';
import {
  loadPerformanceDraft,
  savePerformanceDraft,
} from '../services/performanceStorage.ts';
import {
  initialPerformanceDraft,
  type ConditionsField,
  type ConditionsKey,
  type PerformanceDraft,
  type WindDirectionChoice,
} from './performanceDraft.ts';

interface PerformanceStore {
  readonly draft: PerformanceDraft;

  setField: (
    key: ConditionsKey,
    field: ConditionsField,
    value: string,
  ) => void;
  setWindDirection: (
    key: ConditionsKey,
    direction: WindDirectionChoice,
  ) => void;
  setTakeoffFlaps: (flaps: TakeoffFlaps) => void;
  reset: () => void;
}

export const usePerformanceStore = create<PerformanceStore>()((set) => ({
  draft: loadPerformanceDraft(),

  setField: (key, field, value) =>
    set((state) => ({
      draft: {
        ...state.draft,
        [key]: { ...state.draft[key], [field]: value },
      },
    })),

  setWindDirection: (key, direction) =>
    set((state) => ({
      draft: {
        ...state.draft,
        [key]: { ...state.draft[key], windDirection: direction },
      },
    })),

  setTakeoffFlaps: (flaps) =>
    set((state) => ({ draft: { ...state.draft, takeoffFlaps: flaps } })),

  reset: () => set({ draft: initialPerformanceDraft() }),
}));

/* Autosave: qualquer alteração no rascunho é gravada no aparelho. */
usePerformanceStore.subscribe((state) => savePerformanceDraft(state.draft));
