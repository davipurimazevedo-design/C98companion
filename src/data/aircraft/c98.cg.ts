/**
 * Limites de centro de gravidade do C-98 Caravan.
 *
 * Fonte: POH Section 2 — LIMITATIONS, página 2-13, Revision 23.
 *
 * Estes valores vêm TABULADOS no manual, e não lidos do gráfico da Figura 6-17.
 * A distinção importa: a Seção 6 publica o envelope apenas em desenho, e medir
 * pontos de quebra num gráfico digitalizado produzia leituras variando vários
 * graus. Aqui os números são declarados.
 */

/** Um vértice do limite dianteiro: acima deste peso, o limite recua. */
export interface CgLimitPoint {
  readonly weightLb: number;
  readonly armIn: number;
}

export const C98_CG = {
  /** "Reference Datum: 100 inches forward of front face of firewall." */
  datumDescription:
    '100 polegadas à frente da face dianteira da parede de fogo',

  /** Bordo de ataque da corda média aerodinâmica, em polegadas atrás do datum. */
  macLeadingEdgeIn: 177.57,

  /** Comprimento da corda média aerodinâmica, em polegadas. */
  macLengthIn: 66.4,

  /**
   * Limite dianteiro, por trechos retos entre os pontos publicados.
   *
   * "179.60 inches (3.06% MAC) aft of datum at 5500 lbs or less, with straight
   *  line variation to 193.37 inches (23.80% MAC) at 8000 lbs, and straight
   *  line variation to 199.15 inches (32.50% MAC) at 8750 lbs."
   *
   * Abaixo de 5.500 LB o limite permanece em 179,60.
   */
  forwardLimit: [
    { weightLb: 5500, armIn: 179.6 },
    { weightLb: 8000, armIn: 193.37 },
    { weightLb: 8750, armIn: 199.15 },
  ] as readonly CgLimitPoint[],

  /**
   * Limite traseiro, constante.
   * "204.35 inches (40.33% MAC) aft of datum at all weights up to 8750 lbs."
   */
  aftLimitIn: 204.35,

  /**
   * Início da faixa de advertência traseira, em % MAC.
   *
   * A Seção 6, página 6-23, define uma área hachurada entre 38,33% e 40,33% da
   * MAC: dentro dela o carregamento só deve ser aceito se a determinação do CG
   * for precisa. Não é limite — é aviso.
   */
  aftWarningPctMac: 38.33,
} as const;

/**
 * Peso máximo para voo em condições de gelo conhecido. Página 2-13.
 *
 * Depende do cargo pod estar instalado, e é MENOR que o peso máximo de
 * decolagem normal — 200 LB a menos com o pod.
 */
export const C98_ICING_MAX_WEIGHT_LB = {
  withCargoPod: 8550,
  withoutCargoPod: 8750,
} as const;
