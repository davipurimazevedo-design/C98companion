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

/* ------------------------------------------------------------------------ *
 * Performance
 *
 * Mesma natureza dos anteriores: travas de digitação, não limites da
 * aeronave. Os limites reais estão nas tabelas do manual, e o motor recusa
 * qualquer valor fora delas mesmo que a digitação passe daqui — estes tetos
 * só evitam que um zero a mais vire uma altitude de 90.000 pés.
 * ------------------------------------------------------------------------ */

/** Faixa de digitação da altitude-pressão, em pés. */
export const MIN_INPUT_ALTITUDE_FT = -2000;
export const MAX_INPUT_ALTITUDE_FT = 30_000;

/** Faixa de digitação da temperatura, em graus Celsius. */
export const MIN_INPUT_TEMPERATURE_C = -60;
export const MAX_INPUT_TEMPERATURE_C = 60;

/** Faixa de digitação da componente de vento, em nós. */
export const MAX_INPUT_WIND_KT = 99;

/** Faixa de digitação do comprimento de pista, em metros. */
export const MAX_INPUT_RUNWAY_M = 9_999;
