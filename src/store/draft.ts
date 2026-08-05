/**
 * Rascunho do planejamento.
 *
 * Guarda o TEXTO que o piloto digitou, e não números já convertidos. É uma
 * decisão deliberada: um campo com "78," continua exibindo "78," enquanto ele
 * digita, e um campo com erro preserva o que foi escrito para que ele possa
 * corrigir em vez de redigitar.
 *
 * A conversão para números acontece em `toMissionPlan`, na fronteira com o
 * cálculo.
 */

import {
  MAX_INPUT_CARGO_KG,
  MAX_INPUT_KG,
  MAX_INPUT_L,
  MAX_INPUT_LB,
} from '../config/input.ts';
import { kgToLb, lbToKg, lbToLitres, litresToLb } from '../data/conversion.ts';
import type { CargoRestraint, MissionPlan } from '../domain/models/plan.ts';
import { parseWeight } from '../domain/validation/parseWeight.ts';

export interface CrewDraft {
  readonly id: string;
  readonly role: string;
  readonly weight: string;
}

/** Unidade em que o piloto digita o combustível. */
export type FuelUnit = 'LB' | 'L';

/** Unidade em que o piloto digita a carga. */
export type CargoUnit = 'LB' | 'kg';

export interface PlanDraft {
  readonly aircraftId: string;
  /**
   * Combustível mínimo da perna, na unidade de `fuelUnit`.
   *
   * O texto é guardado como digitado, na unidade escolhida — a conversão para
   * libras acontece só em `toMissionPlan`.
   */
  readonly fuel: string;
  readonly fuelUnit: FuelUnit;
  readonly crew: readonly CrewDraft[];
  /**
   * Peso de cada passageiro, em quilogramas, indexado pelo ASSENTO.
   *
   * Por assento, e não por estação, porque é assim que o mapa da cabine é
   * tocado. O braço continua vindo da estação — assentos que a compartilham
   * têm o mesmo braço, e a soma dá o mesmo momento.
   */
  readonly passengerLoads: Readonly<Record<string, string>>;
  /** Quantidade de passageiros. Opcional: em branco desliga o controle de assentos. */
  readonly passengerCount: string;
  /** Peso lançado em cada posição de carga, na unidade de `cargoUnit`. */
  readonly positionLoads: Readonly<Record<string, string>>;
  readonly cargoUnit: CargoUnit;
  readonly cargoRestraint: CargoRestraint;
  /**
   * Se as zonas de carga da cabine estão abertas na tela.
   *
   * Recolhidas por padrão: no uso corrente a carga vai no cargo pod, e a cabine
   * só entra em voo com os bancos removidos. É preferência de exibição, não
   * dado de cálculo — o peso lançado nas zonas conta sempre, aberto ou não.
   */
  readonly cabinCargoOpen: boolean;
}

/** Teto de digitação da quantidade de passageiros. Trava contra erro de digitação. */
const MAX_PASSENGER_COUNT = 99;

/** Interpreta a quantidade digitada. Em branco ou inválida devolve `null`. */
export function parsePassengerCount(text: string): number | null {
  const { value, issue } = parseWeight(text, MAX_PASSENGER_COUNT);
  if (issue !== null) return null;
  return Math.round(value);
}

/**
 * Tripulação inicial.
 *
 * Piloto e copiloto já aparecem porque estão presentes em praticamente toda
 * missão — poupa dois toques no caso mais comum.
 */
export function initialDraft(aircraftId: string): PlanDraft {
  return {
    aircraftId,
    fuel: '',
    fuelUnit: 'LB',
    crew: [
      { id: 'piloto', role: 'Piloto', weight: '' },
      { id: 'copiloto', role: 'Copiloto', weight: '' },
    ],
    passengerLoads: {},
    passengerCount: '',
    positionLoads: {},
    cargoUnit: 'LB',
    cargoRestraint: 'amarrada',
    cabinCargoOpen: false,
  };
}

/**
 * Funções sugeridas ao acrescentar tripulantes, na ordem de uso.
 *
 * Vale para os que entram DEPOIS de piloto e copiloto, que já vêm no rascunho
 * inicial. Esgotada a lista, a numeração continua genérica.
 */
export const EXTRA_CREW_ROLES = ['Mecânico', 'Segundo Mecânico'] as const;

/**
 * Função sugerida para o próximo tripulante.
 *
 * @param currentRoles Funções já a bordo, incluindo piloto e copiloto.
 *
 * Duas regras, nesta ordem:
 *
 * 1. A primeira função da lista que ainda não está a bordo. Assim, remover o
 *    Mecânico e acrescentar de novo devolve "Mecânico", e não um número.
 * 2. Esgotada a lista, numeração contando a tripulação INTEIRA — o quinto a
 *    bordo é "Tripulante 5", não "Tripulante 3". É como o piloto lê a lista:
 *    piloto e copiloto também são tripulantes, ainda que tenham nome próprio.
 *
 * Nenhum nome se repete. Repetir seria pior do que numerar feio: duas linhas
 * "Tripulante 6" numa lista de pesos convidam a lançar o peso na errada.
 */
export function nextCrewRole(currentRoles: readonly string[]): string {
  const taken = new Set(currentRoles);

  const suggested = EXTRA_CREW_ROLES.find((role) => !taken.has(role));
  if (suggested !== undefined) return suggested;

  let position = currentRoles.length + 1;
  while (taken.has(`Tripulante ${position}`)) position += 1;
  return `Tripulante ${position}`;
}

/**
 * Reescreve um texto digitado noutra unidade, preservando a grandeza física.
 *
 * Trocar a unidade não pode apagar o que o piloto lançou — em carga isso
 * significaria perder até dez campos de uma vez. O valor é convertido e
 * arredondado para inteiro, que é a precisão com que ele foi digitado e a que
 * a tela exibe.
 *
 * Campo vazio continua vazio: converter zero produziria um "0" que o piloto não
 * escreveu.
 */
function rewrite(text: string, max: number, convert: (v: number) => number): string {
  const { value, issue } = parseWeight(text, max);
  if (issue !== null) return text === '' ? '' : text;
  if (value === 0) return text.trim() === '' ? '' : text;
  return String(Math.round(convert(value)));
}

/** Converte o texto do combustível entre libras e litros. */
export function convertFuelText(
  text: string,
  from: FuelUnit,
  to: FuelUnit,
  densityLbPerGal: number | null,
): string {
  if (from === to || densityLbPerGal === null || densityLbPerGal <= 0) return text;
  return to === 'L'
    ? rewrite(text, MAX_INPUT_LB, (lb) => lbToLitres(lb, densityLbPerGal))
    : rewrite(text, MAX_INPUT_L, (l) => litresToLb(l, densityLbPerGal));
}

/** Converte todos os lançamentos de carga entre libras e quilogramas. */
export function convertCargoLoads(
  loads: Readonly<Record<string, string>>,
  from: CargoUnit,
  to: CargoUnit,
): Record<string, string> {
  const converted: Record<string, string> = {};
  for (const [id, text] of Object.entries(loads)) {
    converted[id] =
      from === to
        ? text
        : to === 'kg'
          ? rewrite(text, MAX_INPUT_LB, lbToKg)
          : rewrite(text, MAX_INPUT_CARGO_KG, kgToLb);
  }
  return converted;
}

/**
 * Converte o rascunho em planejamento numérico, pronto para o cálculo.
 *
 * É aqui, e só aqui, que a unidade de digitação vira a unidade canônica do
 * domínio — libras para carga e combustível. Nenhuma preferência de tela
 * atravessa esta fronteira.
 *
 * @param fuelDensityLbPerGal Densidade de referência do combustível cadastrado.
 *        Necessária apenas quando o piloto digita em litros. Sem ela a leitura
 *        em litros não tem como virar peso, e por isso a interface não oferece
 *        essa unidade — este caminho não deve ser alcançável em operação.
 */
export function toMissionPlan(
  draft: PlanDraft,
  fuelDensityLbPerGal: number | null,
): MissionPlan {
  const cargoInKg = draft.cargoUnit === 'kg';
  const cargoMax = cargoInKg ? MAX_INPUT_CARGO_KG : MAX_INPUT_LB;

  const positionLoads: Record<string, number> = {};
  for (const [id, text] of Object.entries(draft.positionLoads)) {
    const value = parseWeight(text, cargoMax).value;
    positionLoads[id] = cargoInKg ? kgToLb(value) : value;
  }

  const passengerLoads: Record<string, number> = {};
  for (const [id, text] of Object.entries(draft.passengerLoads)) {
    passengerLoads[id] = parseWeight(text, MAX_INPUT_KG).value;
  }

  const fuelInLitres = draft.fuelUnit === 'L';
  const fuelValue = parseWeight(
    draft.fuel,
    fuelInLitres ? MAX_INPUT_L : MAX_INPUT_LB,
  ).value;
  const fuelLb = fuelInLitres
    ? fuelDensityLbPerGal === null
      ? 0
      : litresToLb(fuelValue, fuelDensityLbPerGal)
    : fuelValue;

  return {
    aircraftId: draft.aircraftId,
    fuelLb,
    passengerLoads,
    passengerCount: parsePassengerCount(draft.passengerCount),
    crew: draft.crew.map((member) => ({
      id: member.id,
      role: member.role,
      weightKg: parseWeight(member.weight, MAX_INPUT_KG).value,
    })),
    positionLoads,
    cargoRestraint: draft.cargoRestraint,
  };
}
