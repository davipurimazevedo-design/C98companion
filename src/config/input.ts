/**
 * Limites de digitação.
 *
 * ATENÇÃO: estes NÃO são limites aeronáuticos. São apenas travas contra erro de
 * digitação — impedem que um zero a mais produza um número absurdo e contaminem
 * silenciosamente todo o cálculo.
 *
 * Os limites reais da aeronave ficam em `src/data/aircraft/`.
 */

/** Teto de digitação para o peso de uma PESSOA, em quilogramas. */
export const MAX_INPUT_KG = 999;

/** Teto de digitação para um peso em libras (carga e combustível). */
export const MAX_INPUT_LB = 99_999;

/**
 * Teto de digitação para CARGA em quilogramas.
 *
 * Separado do teto de pessoas: 3.400 LB de carga de cabine são 1.542 kg, muito
 * acima dos 999 kg que bastam para um ocupante.
 */
export const MAX_INPUT_CARGO_KG = 9_999;

/** Teto de digitação para combustível em litros. */
export const MAX_INPUT_L = 9_999;

/** Casas decimais aceitas na digitação de um peso. */
export const INPUT_DECIMALS = 1;
