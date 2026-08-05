/**
 * Contrato dos dados técnicos do C-98 Caravan.
 *
 * Fonte: Cessna Model 208B (675 SHP), Pilot's Operating Handbook,
 * Section 6 — Weight & Balance / Equipment List, Revision 23.
 *
 * Este arquivo define QUAIS dados existem e de que tipo são. Os VALORES ficam
 * nos arquivos irmãos, com a página do manual anotada em cada campo.
 */

import type { Pending } from '../pending.ts';
import type { FuelMomentRow } from './c98.fuelMoment.ts';
import type { SeatingArrangement } from './c98.seats.ts';

/** Onde fica a posição de carregamento. */
export type PositionGroup =
  /** Zonas 1 a 6 do piso da cabine. */
  | 'cabine'
  /** Compartimentos A a D do cargo pod, sob a fuselagem. */
  | 'pod';

/**
 * Uma posição de carregamento definida pelo manual.
 *
 * O manual publica DOIS limites por zona de cabine: um para carga amarrada com
 * tie-downs e outro, bem menor, para carga não amarrada contida por divisórias.
 * Qual vale depende de como a carga é presa naquele voo, e por isso o piloto
 * escolhe o modo no planejamento.
 */
export interface LoadPosition {
  /** Identificador estável, usado como chave de estado. Não aparece na tela. */
  readonly id: string;
  /** Nome como consta no manual. Aparece na tela. */
  readonly label: string;
  readonly group: PositionGroup;
  /**
   * Braço do centroide da posição, em polegadas atrás do datum.
   * Usado só no cálculo de momento; não influencia limite de peso.
   */
  readonly armIn: Pending<number>;
  /**
   * Estações inicial e final da posição, em polegadas atrás do datum.
   *
   * Não entram em cálculo nenhum: existem para que os desenhos da aeronave
   * possam ser traçados a partir das cotas publicadas na página 6-15, em vez
   * de proporções estimadas no olho.
   */
  readonly fromIn: Pending<number>;
  readonly toIn: Pending<number>;
  /** Limite com a carga amarrada por tie-downs. */
  readonly maxSecuredLb: Pending<number>;
  /** Limite com a carga não amarrada, contida por divisórias. */
  readonly maxUnsecuredLb: Pending<number>;
  /** Observação do manual, exibida abaixo do campo. */
  readonly note?: string;
}

/** Limites de peso do modelo. */
export interface WeightLimits {
  /** Peso máximo de rampa / táxi. */
  readonly maxRampWeightLb: Pending<number>;
  /** Peso máximo de decolagem. Referência principal do aplicativo. */
  readonly maxTakeoffWeightLb: Pending<number>;
  /**
   * Peso máximo de pouso.
   *
   * Cadastrado por ser limite estrutural publicado, mas NÃO verificado pelo
   * aplicativo: avaliá-lo exigiria saber quanto combustível será queimado até o
   * pouso, o que não se deduz dos dados do planejamento.
   */
  readonly maxLandingWeightLb: Pending<number>;
  /** Peso máximo de carga somando todas as zonas da cabine. */
  readonly maxCabinCargoLb: Pending<number>;
  /** Peso máximo de carga somando todos os compartimentos do cargo pod. */
  readonly maxCargoPodLb: Pending<number>;
  /**
   * Percentual do peso máximo de decolagem a partir do qual a situação vira
   * amarela. Decisão operacional, não dado do manual.
   */
  readonly warningThresholdPct: Pending<number>;
}

/** Capacidade de combustível. */
export interface FuelSpec {
  /** Combustível utilizável, em libras, na densidade de referência. */
  readonly usableCapacityLb: Pending<number>;
  /** Combustível utilizável, em galões. */
  readonly usableCapacityGal: Pending<number>;
  /**
   * Capacidade TOTAL dos tanques, em libras e em litros.
   *
   * É referência de abastecimento, NÃO limite de balanceamento. O peso básico da
   * ficha já inclui o combustível não utilizável — o manual é explícito na
   * página 6-55 — então o cálculo usa `usableCapacityLb`. Contar o total aqui
   * somaria o não utilizável duas vezes.
   */
  readonly totalCapacityLb: Pending<number>;
  readonly totalCapacityL: Pending<number>;
  /** Densidade de referência das tabelas do manual. */
  readonly referenceDensityLbPerGal: Pending<number>;
  /** Temperatura em que vale a densidade de referência, em graus Fahrenheit. */
  readonly referenceTemperatureF: Pending<number>;
  /** Combustível de táxi previsto entre o peso de rampa e o de decolagem. */
  readonly taxiFuelLb: Pending<number>;
}

/**
 * Dados permanentes de uma matrícula específica.
 *
 * Vêm da FICHA DE PESAGEM da aeronave, não do manual do modelo. Cada cauda tem
 * os seus. Somente leitura na interface.
 */
export interface AircraftRegistration {
  readonly id: string;
  /** Matrícula como aparece na aeronave. Ex.: "FAB 2720". */
  readonly tail: string;
  /** Peso básico vazio (Basic Empty Weight). */
  readonly basicEmptyWeightLb: Pending<number>;
  /**
   * Momento básico da ficha de pesagem.
   *
   * Armazenado como dado permanente, mas NÃO utilizado em cálculo: o escopo do
   * aplicativo é exclusivamente peso.
   */
  readonly basicMoment: Pending<number>;
  /** Data da última pesagem, formato ISO (AAAA-MM-DD). */
  readonly weighingDate: Pending<string>;
  /** Se esta matrícula tem o cargo pod instalado. */
  readonly hasCargoPod: boolean;
  /**
   * Assentos de passageiro instalados, sem contar os dois dianteiros, que são
   * da tripulação e entram pela seção própria.
   */
  readonly passengerSeats: number;
  /** Disposição dos assentos traseiros, que determina os braços. */
  readonly seatingArrangement: SeatingArrangement;
  readonly notes?: string;
}

/** Dados do modelo, comuns a todas as matrículas do C-98. */
export interface AircraftModel {
  readonly designation: string;
  /**
   * Revisão do manual de onde os limites foram transcritos.
   *
   * Exibida na tela: o piloto precisa poder confirmar que está planejando
   * contra a revisão vigente, e não contra uma transcrição antiga.
   */
  readonly manualRevision: string;
  readonly limits: WeightLimits;
  readonly fuel: FuelSpec;
  readonly positions: readonly LoadPosition[];
  /**
   * Tabela de peso e momento do combustível.
   *
   * É tabela, e não um braço fixo, porque o manual publica `ARM VARIES`: o
   * centro de massa do combustível se desloca conforme os tanques enchem.
   */
  readonly fuelMoments: readonly FuelMomentRow[];
}

/** Modelo e matrícula combinados — o que o cálculo consome. */
export interface AircraftProfile {
  readonly model: AircraftModel;
  readonly registration: AircraftRegistration;
}
