/**
 * Combustível do C-98 Caravan.
 *
 * Fonte: Cessna Model 208B (675 SHP), POH Section 6, Revision 23, página 6-9.
 */

import type { FuelSpec } from './types.ts';

export const C98_FUEL: FuelSpec = {
  /**
   * Combustível utilizável: 332 galões × 6,7 lb/gal = 2.224 LB.
   *
   * ATENÇÃO: este peso vale para Jet A a 60 °F. O manual adverte que o
   * combustível pesa cerca de 0,1 lb/gal a mais a cada 25 °F de queda na
   * temperatura — os mesmos 332 galões chegam a 2.258 LB a 35 °F. Portanto o
   * limite em libras é uma referência, e não um teto físico absoluto: em dia
   * frio é possível embarcar mais libras dentro dos mesmos 332 galões.
   */
  usableCapacityLb: 2224,

  /** Capacidade utilizável real, que independe da temperatura. */
  usableCapacityGal: 332,

  /*
   * Capacidade TOTAL dos tanques, informada pelo operador em 04/08/2026.
   * 2.248 LB ÷ 6,7 lb/gal = 335,5 gal = 1.270 L — as duas conferem entre si.
   *
   * Serve para o piloto conferir contra o abastecimento, e NADA MAIS. O limite
   * do cálculo continua sendo `usableCapacityLb`, porque o peso básico da ficha
   * já contém o combustível não utilizável: "Basic Empty Weight (…) Includes
   * unusable fuel and full oil", manual página 6-55. Usar o total aqui somaria
   * os ~24 LB de não utilizável duas vezes.
   */
  totalCapacityLb: 2248,
  totalCapacityL: 1270,

  /** Densidade média das tabelas do manual, para Jet A. */
  referenceDensityLbPerGal: 6.7,

  /** Temperatura de referência das tabelas. */
  referenceTemperatureF: 60,

  /**
   * Combustível de táxi entre o peso de rampa e o de decolagem.
   * "The additional 35 pounds of taxi fuel provides a maximum ramp weight of
   * 8785 pounds". Manual, página 6-13.
   */
  taxiFuelLb: 35,
};
