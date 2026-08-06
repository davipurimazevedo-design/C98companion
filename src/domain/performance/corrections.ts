/**
 * Correções previstas nas notas das tabelas de performance.
 *
 * Separado da consulta de propósito: `lookup.ts` devolve o que está impresso
 * na página, e este módulo aplica o que as notas mandam somar ou descontar.
 * O fluxo é sempre consulta → correção, nunca os dois misturados.
 *
 * ## O arredondamento reproduz o do manual
 *
 * A nota 2 diz "reduzir 10% a cada 11 nós de vento de proa". Para 12 nós, o
 * Sample Problem da página 5-7 faz:
 *
 *     12 nós ÷ 11 nós × 10% = 11% de redução
 *     1875 pés × 11% = 206 pés
 *     1875 − 206 = 1669 pés
 *
 * Repare que o manual arredonda o PERCENTUAL para inteiro antes de aplicar:
 * 12/11 × 10 dá 10,909…%, que vira 11%. Calculando com a fração exata, a
 * redução seria de 205 pés e o resultado 1670 — um pé de diferença do que
 * está publicado.
 *
 * A ordem aqui é, portanto, deliberada: arredonda o percentual, aplica,
 * arredonda a diferença para pé inteiro, subtrai. É a única forma de a tela
 * fechar com a conta que o piloto faz no papel.
 */

/** Redução percentual a cada `HEADWIND_STEP_KT` nós de proa. Nota 2. */
const STEP_PERCENT = 10;

/** Nós de vento de proa que valem um passo de correção. Nota 2. */
const HEADWIND_STEP_KT = 11;

/** Nós de vento de cauda que valem um passo de correção. Nota 2. */
const TAILWIND_STEP_KT = 2;

/**
 * Vento de cauda máximo previsto pela nota 2 ("tailwinds up to 10 knots").
 *
 * Acima disso o manual não publica correção, e o motor recusa em vez de
 * projetar a regra para além do que ela cobre.
 */
export const MAX_TAILWIND_KT = 10;

/** De onde vem o vento, do ponto de vista da correção. */
export type WindDirection = 'proa' | 'cauda' | 'nenhum';

/** O efeito do vento sobre as duas distâncias. */
export interface WindEffect {
  readonly direction: WindDirection;
  /** Intensidade informada, sempre positiva. */
  readonly knots: number;
  /**
   * Percentual aplicado, já arredondado para inteiro como o manual faz.
   * Negativo com vento de proa, positivo com vento de cauda.
   */
  readonly percent: number;
  /** Variação em pés. Negativa com vento de proa. */
  readonly groundRollDeltaFt: number;
  readonly totalDeltaFt: number;
  readonly groundRollFt: number;
  readonly totalFt: number;
}

/** Um par de distâncias, como sai da tabela. */
export interface Distances {
  readonly groundRollFt: number;
  readonly totalFt: number;
}

/**
 * Percentual de correção para um vento, arredondado como o manual arredonda.
 *
 * @param windKt Positivo é vento de proa; negativo, de cauda.
 * @returns Percentual inteiro. Negativo reduz a distância.
 */
export function windPercent(windKt: number): number {
  if (windKt === 0) return 0;

  if (windKt > 0) {
    return -Math.round((windKt / HEADWIND_STEP_KT) * STEP_PERCENT);
  }
  return Math.round((-windKt / TAILWIND_STEP_KT) * STEP_PERCENT);
}

/** Aplica um percentual a uma distância, arredondando em pé inteiro. */
function applyPercent(distanceFt: number, percent: number): number {
  return Math.round((distanceFt * percent) / 100);
}

/**
 * Aplica a nota 2 às duas distâncias.
 *
 * Não valida o limite de vento de cauda: quem decide se a nota cobre o vento
 * informado é o motor, que tem como recusar o resultado inteiro. Aqui só
 * existe a aritmética.
 */
export function applyWind(distances: Distances, windKt: number): WindEffect {
  const percent = windPercent(windKt);
  const groundRollDeltaFt = applyPercent(distances.groundRollFt, percent);
  const totalDeltaFt = applyPercent(distances.totalFt, percent);

  const direction: WindDirection =
    windKt > 0 ? 'proa' : windKt < 0 ? 'cauda' : 'nenhum';

  return {
    direction,
    knots: Math.abs(windKt),
    percent,
    groundRollDeltaFt,
    totalDeltaFt,
    groundRollFt: distances.groundRollFt + groundRollDeltaFt,
    totalFt: distances.totalFt + totalDeltaFt,
  };
}

/**
 * Aplica o fator da nota que autoriza operar acima da coluna mais quente.
 *
 * Vem ANTES da correção de vento: a nota fala em multiplicar as distâncias da
 * tabela, e é sobre a distância de tabela que a nota 2 manda aplicar o vento.
 */
export function applyTemperatureFactor(
  distances: Distances,
  factor: number,
): Distances {
  return {
    groundRollFt: Math.round(distances.groundRollFt * factor),
    totalFt: Math.round(distances.totalFt * factor),
  };
}
