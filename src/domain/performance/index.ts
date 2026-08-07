/**
 * Ponto único de cálculo de performance.
 *
 * A tela chama `computeTakeoff` ou `computeLanding` e recebe tudo pronto:
 * a célula lida, as correções aplicadas e a margem de pista. Nenhum
 * componente precisa saber a ordem das etapas nem onde cada regra mora.
 *
 * As funções são puras: mesmas entradas, mesmo resultado, sem efeito
 * colateral. É o que permite recalcular a cada tecla digitada e testar cada
 * regra isoladamente — a mesma escolha do módulo de peso e balanceamento.
 *
 * Fluxo, sempre nesta ordem:
 *
 *     consulta da tabela  (lookup.ts)
 *       ↓
 *     nota de temperatura alta, se houver  (corrections.ts)
 *       ↓
 *     correção de vento  (corrections.ts)
 *       ↓
 *     margem de pista
 */

import {
  C98_LANDING,
  C98_TAKEOFF_FLAPS_20,
  type DistanceTable,
} from '../../data/performance/index.ts';
import { RUNWAY_CRITICAL_USED_PCT } from '../../data/operational.ts';
import {
  applyTemperatureFactor,
  applyWind,
  MAX_TAILWIND_KT,
  type Distances,
  type WindEffect,
} from './corrections.ts';
import {
  describeReadFailure,
  readTable,
  type ReadFailure,
  type TableReading,
} from './lookup.ts';

/**
 * O que o piloto informou.
 *
 * `null` é campo em branco, e não zero: a 0 °C ao nível do mar a tabela tem
 * resposta, e confundir as duas coisas exibiria uma distância inventada para
 * um formulário vazio.
 *
 * Todas as grandezas já estão na unidade do manual — libras, pés, graus
 * Celsius e nós. A conversão do que a tela oferece em metros acontece antes,
 * na borda, como o módulo de peso e balanceamento faz com quilogramas.
 */
export interface PerformanceQuery {
  readonly weightLb: number | null;
  readonly pressureAltitudeFt: number | null;
  readonly temperatureC: number | null;
  /** Positivo é vento de proa; negativo, de cauda. Em branco vale zero. */
  readonly windKt: number;
  /** Comprimento da pista. Em branco, o resultado sai sem margem. */
  readonly runwayFt: number | null;
}

/** Como a distância exigida se compara com a pista disponível. */
export type RunwayVerdict = 'suficiente' | 'critica' | 'insuficiente';

export interface RunwayMargin {
  readonly runwayFt: number;
  /** Distância para transpor 50 pés, já corrigida. É o que a pista precisa ter. */
  readonly requiredFt: number;
  /** Pista menos distância exigida. Negativa quando não cabe. */
  readonly marginFt: number;
  readonly usedPct: number;
  readonly verdict: RunwayVerdict;
}

export interface DistanceResult {
  /** A tabela consultada, para a tela citar figura, páginas e notas. */
  readonly table: DistanceTable;
  /** A célula do manual e os valores de eixo que de fato valeram. */
  readonly reading: TableReading;
  /**
   * Distâncias de tabela depois da nota de temperatura alta e antes do vento.
   * Iguais às da célula quando a nota não se aplica.
   */
  readonly chart: Distances;
  readonly wind: WindEffect;
  /** `null` enquanto o comprimento da pista não for informado. */
  readonly margin: RunwayMargin | null;
}

/** Por que não há resultado. */
export type PerformanceFailure =
  | ReadFailure
  | { readonly reason: 'vento-de-cauda-excessivo'; readonly maxKt: number };

export type PerformanceOutcome =
  | { readonly status: 'ready'; readonly value: DistanceResult }
  /** Campos ainda em branco. Não é erro: o formulário só não foi preenchido. */
  | { readonly status: 'incomplete'; readonly missing: readonly string[] }
  | { readonly status: 'unavailable'; readonly failure: PerformanceFailure };

/** Rótulos dos campos obrigatórios, na ordem em que aparecem na tela. */
const REQUIRED_FIELDS = [
  ['weightLb', 'Peso'],
  ['pressureAltitudeFt', 'Altitude-pressão'],
  ['temperatureC', 'Temperatura'],
] as const;

function missingFields(query: PerformanceQuery): string[] {
  return REQUIRED_FIELDS.filter(([key]) => query[key] === null).map(
    ([, label]) => label,
  );
}

/**
 * Compara a distância exigida com a pista disponível.
 *
 * O corte do amarelo é decisão de emprego, não do POH — vive em
 * `data/operational.ts` junto dos demais parâmetros que o operador define.
 */
function computeMargin(runwayFt: number, requiredFt: number): RunwayMargin {
  const usedPct = runwayFt > 0 ? (requiredFt / runwayFt) * 100 : Infinity;

  const verdict: RunwayVerdict =
    usedPct > 100
      ? 'insuficiente'
      : usedPct > RUNWAY_CRITICAL_USED_PCT
        ? 'critica'
        : 'suficiente';

  return {
    runwayFt,
    requiredFt,
    marginFt: runwayFt - requiredFt,
    usedPct,
    verdict,
  };
}

/**
 * Resolve uma tabela qualquer contra o que o piloto informou.
 *
 * Decolagem e pouso percorrem exatamente as mesmas etapas — mudam a tabela e,
 * nela, quais velocidades são publicadas. Por isso existe uma função só.
 */
function computeDistance(
  table: DistanceTable,
  query: PerformanceQuery,
): PerformanceOutcome {
  const missing = missingFields(query);
  if (missing.length > 0) return { status: 'incomplete', missing };

  /* A nota 2 cobre vento de cauda só até 10 nós. Acima disso não há correção
     publicada, e projetar a regra para além do que ela cobre seria inventar. */
  if (query.windKt < -MAX_TAILWIND_KT) {
    return {
      status: 'unavailable',
      failure: { reason: 'vento-de-cauda-excessivo', maxKt: MAX_TAILWIND_KT },
    };
  }

  const reading = readTable(table, {
    weightLb: query.weightLb ?? 0,
    pressureAltitudeFt: query.pressureAltitudeFt ?? 0,
    temperatureC: query.temperatureC ?? 0,
  });
  if (reading.status !== 'ready') {
    return { status: 'unavailable', failure: reading.failure };
  }

  const published: Distances = {
    groundRollFt: reading.value.groundRollFt,
    totalFt: reading.value.totalFt,
  };
  const factor = reading.value.aboveTopTemperature?.factor;
  const chart =
    factor === undefined
      ? published
      : applyTemperatureFactor(published, factor);

  const wind = applyWind(chart, query.windKt);

  return {
    status: 'ready',
    value: {
      table,
      reading: reading.value,
      chart,
      wind,
      margin:
        query.runwayFt === null
          ? null
          : computeMargin(query.runwayFt, wind.totalFt),
    },
  };
}

/** Distância de decolagem, técnica de pista curta com flaps 20°. */
export function computeTakeoff(query: PerformanceQuery): PerformanceOutcome {
  return computeDistance(C98_TAKEOFF_FLAPS_20, query);
}

/** Distância de pouso. */
export function computeLanding(query: PerformanceQuery): PerformanceOutcome {
  return computeDistance(C98_LANDING, query);
}

/** Mensagem em português para exibir no lugar do resultado. */
export function describeFailure(failure: PerformanceFailure): string {
  if (failure.reason === 'vento-de-cauda-excessivo') {
    return `O manual só publica correção para vento de cauda de até ${failure.maxKt} nós.`;
  }
  return describeReadFailure(failure);
}

export { MAX_TAILWIND_KT, windPercent } from './corrections.ts';
export { nextAtOrAbove, readTable } from './lookup.ts';
export type { Distances, WindDirection, WindEffect } from './corrections.ts';
export type { Axis, ReadFailure, TableReading } from './lookup.ts';
