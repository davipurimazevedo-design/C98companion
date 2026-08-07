/**
 * Rascunho da tela de Performance.
 *
 * Guarda o que o piloto digitou, em texto, exatamente como o rascunho de peso
 * e balanceamento faz. A conversão para número e para a unidade do manual
 * acontece num ponto só, em `toPerformanceQuery` — o equivalente aqui do
 * `toMissionPlan`.
 *
 * Decolagem e pouso são preenchimentos independentes: o peso de pouso não se
 * deduz do de decolagem sem saber quanto combustível será queimado no trecho,
 * e o aplicativo não tem esse dado.
 */

import {
  MAX_INPUT_ALTITUDE_FT,
  MAX_INPUT_LB,
  MAX_INPUT_RUNWAY_M,
  MAX_INPUT_TEMPERATURE_C,
  MAX_INPUT_WIND_KT,
  MIN_INPUT_ALTITUDE_FT,
  MIN_INPUT_TEMPERATURE_C,
} from '../config/input.ts';
import { metresToFeet } from '../data/conversion.ts';
import type { PerformanceQuery } from '../domain/performance/index.ts';
import { parseSignedNumber } from '../domain/validation/parseNumber.ts';

/** De onde sopra a componente de vento informada. */
export type WindDirectionChoice = 'proa' | 'cauda';

/** Um conjunto de condições, comum à decolagem e ao pouso. */
export interface ConditionsDraft {
  /** Peso, em libras. */
  readonly weight: string;
  /** Altitude-pressão, em pés. */
  readonly altitude: string;
  /** Temperatura, em graus Celsius. */
  readonly temperature: string;
  /** Intensidade do vento, em nós, sempre positiva. */
  readonly wind: string;
  readonly windDirection: WindDirectionChoice;
  /** Comprimento da pista, em METROS — a unidade das cartas brasileiras. */
  readonly runway: string;
}

export interface PerformanceDraft {
  readonly takeoff: ConditionsDraft;
  readonly landing: ConditionsDraft;
}

/** Qual dos dois conjuntos de condições está sendo editado. */
export type ConditionsKey = 'takeoff' | 'landing';

/** Campos de um conjunto de condições, para tipar as ações do store. */
export type ConditionsField = keyof ConditionsDraft;

const EMPTY_CONDITIONS: ConditionsDraft = {
  weight: '',
  altitude: '',
  temperature: '',
  wind: '',
  windDirection: 'proa',
  runway: '',
};

/** Rascunho de partida: tudo em branco. */
export function initialPerformanceDraft(): PerformanceDraft {
  return { takeoff: EMPTY_CONDITIONS, landing: EMPTY_CONDITIONS };
}

/** Faixas de digitação de cada campo, para o campo e a mensagem de erro. */
export const FIELD_RANGE = {
  weight: { min: 0, max: MAX_INPUT_LB },
  altitude: { min: MIN_INPUT_ALTITUDE_FT, max: MAX_INPUT_ALTITUDE_FT },
  temperature: { min: MIN_INPUT_TEMPERATURE_C, max: MAX_INPUT_TEMPERATURE_C },
  wind: { min: 0, max: MAX_INPUT_WIND_KT },
  runway: { min: 0, max: MAX_INPUT_RUNWAY_M },
} as const;

function parse(text: string, range: { min: number; max: number }): number | null {
  return parseSignedNumber(text, range.min, range.max).value;
}

/**
 * Converte o rascunho no que o motor consome.
 *
 * Único ponto de conversão de unidade da tela: a pista é digitada em metros e
 * entra no cálculo em pés, porque é a unidade das tabelas do manual. O vento
 * ganha sinal aqui — positivo de proa, negativo de cauda —, de modo que o
 * motor lida com uma grandeza só.
 */
export function toPerformanceQuery(
  conditions: ConditionsDraft,
): PerformanceQuery {
  const windKt = parse(conditions.wind, FIELD_RANGE.wind) ?? 0;
  const runwayM = parse(conditions.runway, FIELD_RANGE.runway);

  return {
    weightLb: parse(conditions.weight, FIELD_RANGE.weight),
    pressureAltitudeFt: parse(conditions.altitude, FIELD_RANGE.altitude),
    temperatureC: parse(conditions.temperature, FIELD_RANGE.temperature),
    windKt: conditions.windDirection === 'cauda' ? -windKt : windKt,
    /* Pista de zero metro não é pista curta: é campo não preenchido. Tratada
       como ausente, o cartão mostra as distâncias e omite a margem. */
    runwayFt: runwayM === null || runwayM <= 0 ? null : metresToFeet(runwayM),
  };
}
