/**
 * Conversão de unidades e política de arredondamento.
 *
 * Isolado num arquivo próprio porque é a única constante numérica do sistema
 * que NÃO vem do manual — é uma equivalência física universal. Ainda assim
 * fica aqui, e não dentro do cálculo, porque o Manual de Peso e Balanceamento
 * pode determinar um fator simplificado (por exemplo 2,2) ou exigir
 * arredondamento para número inteiro em cada etapa.
 *
 * >>> CONFERIR COM O MANUAL <<<
 * Se o manual especificar fator ou arredondamento diferentes, altere apenas
 * este arquivo. Nenhum outro ponto do sistema converte unidades.
 */

/** Quilogramas para libras. Equivalência exata do Sistema Internacional. */
export const KG_TO_LB = 2.204_622_621_848_775_9;

/**
 * Como arredondar o peso convertido.
 *
 * - `'none'`   — mantém a precisão total no cálculo e arredonda só na exibição.
 *                Evita acúmulo de erro ao somar muitos passageiros. Padrão.
 * - `'integer'`— arredonda cada conversão para libra inteira, caso o manual
 *                determine esse procedimento.
 */
export const CONVERSION_ROUNDING: 'none' | 'integer' = 'none';

/** Converte quilogramas em libras, aplicando a política de arredondamento. */
export function kgToLb(kg: number): number {
  const lb = kg * KG_TO_LB;
  return CONVERSION_ROUNDING === 'integer' ? Math.round(lb) : lb;
}

/** Converte libras em quilogramas. Usado apenas para exibição auxiliar. */
export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

/** Litros por galão americano. Equivalência exata, por definição. */
export const LITRES_PER_US_GAL = 3.785_411_784;

/**
 * Converte um volume de combustível em peso.
 *
 * A densidade entra por parâmetro, e não por importação, para que este arquivo
 * continue livre de dados de aeronave. Quem chama busca o valor em
 * `C98_FUEL.referenceDensityLbPerGal` — 6,7 lb/gal a 60 °F para Jet A e JP-8.
 *
 * ATENÇÃO: o manual adverte que o combustível pesa cerca de 0,1 lb/gal a mais a
 * cada 25 °F de queda de temperatura. Em dia frio, os mesmos litros pesam mais
 * do que esta conta indica.
 */
export function litresToLb(litres: number, densityLbPerGal: number): number {
  return (litres / LITRES_PER_US_GAL) * densityLbPerGal;
}

/** Converte peso de combustível em volume, na densidade de referência. */
export function lbToLitres(lb: number, densityLbPerGal: number): number {
  if (densityLbPerGal <= 0) return 0;
  return (lb / densityLbPerGal) * LITRES_PER_US_GAL;
}
