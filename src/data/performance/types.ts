/**
 * Contrato das tabelas de performance do C-98 Caravan.
 *
 * Fonte: Cessna Model 208B (675 SHP), Pilot's Operating Handbook,
 * Section 5 — Performance, Revision 23.
 *
 * Este arquivo define QUAIS dados existem e de que forma. Os VALORES ficam nos
 * arquivos irmãos, com a figura e a página do manual anotadas em cada tabela.
 *
 * Uma tabela do manual é uma grade de três eixos: peso, altitude-pressão e
 * temperatura. Cada tabela carrega os PRÓPRIOS eixos — a de flaps 0° vai de
 * −20 a 10 °C, e as outras de −10 a 40 °C. Nenhum eixo é compartilhado entre
 * tabelas, e nenhuma parte do código pressupõe uma faixa fixa.
 */

/**
 * Uma célula publicada: corrida no solo e distância total para transpor
 * 50 pés, ambas em PÉS.
 *
 * `null` onde o manual imprime traços — ali a operação excederia em muito os
 * limites de temperatura da aeronave, e o manual não publica distância. Um
 * traço nunca vira zero nem some: o motor devolve um estado próprio para ele.
 */
export type PublishedCell =
  | readonly [groundRollFt: number, totalFt: number]
  | null;

/**
 * Um bloco de peso da tabela, com as velocidades que o manual publica para
 * aquele peso.
 *
 * As velocidades não variam com altitude nem com temperatura: o manual as
 * imprime uma vez por bloco, na coluna da esquerda.
 */
export interface WeightBlock {
  readonly weightLb: number;
  /**
   * Velocidade de rotação. `null` nas tabelas de pouso, que não a publicam —
   * a aeronave já está no ar quando a tabela começa a valer.
   */
  readonly liftOffKias: number | null;
  /** Velocidade ao transpor os 50 pés. */
  readonly at50FtKias: number;
  /**
   * As células, na ordem `[altitude][temperatura]` dos eixos da tabela.
   *
   * Um teste garante que as dimensões batem com o comprimento dos eixos: uma
   * linha a mais ou a menos deslocaria toda a leitura em silêncio.
   */
  readonly cells: readonly (readonly PublishedCell[])[];
}

/** De onde a tabela veio e o que ela vale. */
export interface DistanceTable {
  /** Identificador estável. Não aparece na tela. */
  readonly id: string;
  /** Nome exibido. Ex.: "Decolagem — flaps 20°". */
  readonly label: string;
  /** Figura do manual. Ex.: "5-9". */
  readonly figure: string;
  /** Páginas de onde os números foram transcritos. Ex.: ["5-22", "5-23"]. */
  readonly pages: readonly string[];
  /**
   * Configuração da aeronave a que a tabela se aplica.
   *
   * Toda a frota da unidade tem cargo pod, e só as tabelas "AIRPLANES WITH
   * CARGO POD INSTALLED" estão cadastradas. O campo existe para que uma
   * aeronave sem pod possa ser acrescentada sem reescrever nada.
   */
  readonly configuration: 'cargo-pod';
  readonly flapsDeg: number;
  /** Altitudes-pressão publicadas, em pés, em ordem crescente. */
  readonly pressureAltitudesFt: readonly number[];
  /** Temperaturas publicadas, em graus Celsius, em ordem crescente. */
  readonly temperaturesC: readonly number[];
  /** Blocos de peso, em ordem crescente de peso. */
  readonly blocks: readonly WeightBlock[];
  /** Condições em que a tabela vale, como impressas no manual. */
  readonly conditions: readonly string[];
  /** Notas do manual, na numeração original. */
  readonly notes: readonly string[];
  /**
   * A tabela admite a nota que autoriza operar acima da maior temperatura
   * publicada multiplicando as distâncias dessa coluna.
   *
   * Só a tabela de flaps 20° traz essa nota (nota 6). Onde não há, temperatura
   * acima do topo do eixo é simplesmente fora da tabela.
   */
  readonly aboveTopTemperature: AboveTopTemperature | null;
}

/** A regra publicada para operar acima da maior temperatura da tabela. */
export interface AboveTopTemperature {
  /** Fator aplicado às distâncias da coluna mais quente. */
  readonly factor: number;
  /** Texto da nota, exibido junto do resultado. */
  readonly note: string;
}
