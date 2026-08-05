/**
 * Limites de peso do C-98 Caravan.
 *
 * Fonte: Cessna Model 208B (675 SHP), POH Section 6, Revision 23.
 * Todos os valores em LIBRAS.
 */

import type { WeightLimits } from './types.ts';

export const C98_LIMITS: WeightLimits = {
  /** MAXIMUM STRUCTURAL WEIGHTS — MAX RAMP. Manual, página 6-15. */
  maxRampWeightLb: 8785,

  /** MAXIMUM STRUCTURAL WEIGHTS — MAX TAKEOFF. Manual, páginas 6-13 e 6-15. */
  maxTakeoffWeightLb: 8750,

  /**
   * MAXIMUM STRUCTURAL WEIGHTS — MAX LANDING. Manual, página 6-15.
   * Cadastrado, mas não verificado — ver comentário em `types.ts`.
   */
  maxLandingWeightLb: 8500,

  /**
   * "Maximum allowable cabin cargo weight of 3400 pounds". Manual, página 6-11.
   * Soma de todas as zonas da cabine.
   */
  maxCabinCargoLb: 3400,

  /**
   * CARGO POD — "maximum load weight limit of 1090 pounds". Manual, página 6-22.
   * Soma dos compartimentos A a D.
   */
  maxCargoPodLb: 1090,

  /**
   * Limiar do nível de atenção: 97% do peso máximo de decolagem, ou seja
   * 8.488 LB. Decisão operacional, não consta do manual.
   */
  warningThresholdPct: 97,
};

/*
 * NÃO PUBLICADOS nesta seção do manual, e por isso ausentes do sistema:
 *
 * - Peso máximo zero combustível: a Seção 6 não declara MZFW para o 208B.
 * - Carga útil máxima geral: o manual limita a carga por zona, por cabine
 *   (3400 LB) e por pod (1090 LB), e não por um total de carga útil.
 *
 * Limites de área que o aplicativo não tem como verificar, por dependerem das
 * dimensões do volume embarcado:
 * - Piso da cabine: 200 lb/ft² entre as estações 100 e 332 (página 6-18).
 * - Cargo pod: 30 lb/ft² (página 6-22).
 */
