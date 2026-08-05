/**
 * Conversão de unidades para o domínio.
 *
 * Fachada sobre `src/data/conversion.ts`, onde mora o fator configurável. O
 * cálculo nunca converte por conta própria: se o manual determinar outro fator
 * ou outro arredondamento, basta alterar o arquivo de dados.
 */

import { kgToLb, lbToKg } from '../../data/conversion.ts';

export { kgToLb, lbToKg };

/**
 * Converte uma lista de pesos em quilogramas e devolve o total em libras.
 *
 * Converte item a item antes de somar, e não o contrário. A diferença só
 * aparece se o manual exigir arredondamento por conversão, mas nesse caso este
 * é o procedimento correto: é assim que a conta é feita no papel.
 */
export function sumKgToLb(weightsKg: readonly number[]): number {
  return weightsKg.reduce((total, kg) => total + kgToLb(kg), 0);
}

/** Soma simples de pesos já em libras. */
export function sumLb(weightsLb: readonly number[]): number {
  return weightsLb.reduce((total, lb) => total + lb, 0);
}
