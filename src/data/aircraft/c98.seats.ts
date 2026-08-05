/**
 * Estações e assentos de passageiro.
 *
 * Fonte: Figura 6-15, folhas 2 e 3 (páginas 6-45 e 6-46), configuração
 * "10 or 11-Place Commuter Seating". O manual publica dois arranjos, com
 * braços diferentes — qual vale depende de como os assentos estão instalados
 * na aeronave, e por isso a escolha fica na ficha de cada matrícula.
 *
 * Os dois assentos dianteiros não estão aqui: são da tripulação e usam o braço
 * único de 135,5 pol, em `c98.arms.ts`.
 *
 * Duas camadas, deliberadamente separadas:
 *
 *   ESTAÇÃO  — o que o manual publica. Define o BRAÇO, e é o que entra no
 *              cálculo de momento.
 *   ASSENTO  — cada lugar individual, para que o mapa da cabine possa ser
 *              tocado assento a assento. Não tem braço próprio: herda o da
 *              estação a que pertence.
 *
 * Assim o peso pode ser lançado por assento sem que exista mais de uma fonte
 * para o braço.
 */

import { PENDING, type Pending } from '../pending.ts';

/** Um grupo de assentos que compartilha a mesma estação. */
export interface PassengerStation {
  readonly id: string;
  /** Nome exibido, com os números de assento do manual. */
  readonly label: string;
  /** Quantos assentos há nesta estação. */
  readonly seats: number;
  /** Braço em polegadas atrás do datum. */
  readonly armIn: number;
}

/** Como os assentos traseiros estão dispostos. */
export type SeatingArrangement = 'escalonada' | 'lado-a-lado';

/** De que lado da cabine o assento está instalado, olhando para a frente. */
export type SeatSide = 'esquerda' | 'direita';

/**
 * Um assento individual.
 *
 * O LADO não é dado do manual. A página 6-47 avisa em nota:
 *
 *   "The airplane may be configured with left-hand single commuter seats
 *    installed on the right side, and right-hand single commuter seats
 *    installed on the left side. Actual seat location should be noted when
 *    computing airplane weight and balance."
 *
 * Ou seja: varia de aeronave para aeronave e precisa ser conferido. Por isso é
 * `Pending` — sem confirmação do operador, o mapa não desenha o assento em lado
 * nenhum, e a seção continua com os campos numéricos.
 *
 * O lado não influencia cálculo nenhum: o aplicativo apura centragem
 * longitudinal, e dois assentos na mesma estação têm o mesmo braço estejam
 * onde estiverem. É informação de desenho.
 */
export interface CabinSeat {
  readonly id: string;
  /** Número do assento como o manual o chama. */
  readonly number: number;
  /** Estação que define o braço deste assento. */
  readonly stationId: string;
  readonly side: Pending<SeatSide>;
}

/**
 * Arranjo escalonado — página 6-45.
 * Os assentos de um lado ficam adiantados em relação aos do outro, o que
 * produz seis estações distintas para nove assentos.
 */
const ESCALONADA: readonly PassengerStation[] = [
  { id: 'p45', label: 'Assentos 4 e 5', seats: 2, armIn: 173.9 },
  { id: 'p3', label: 'Assento 3', seats: 1, armIn: 189.9 },
  { id: 'p78', label: 'Assentos 7 e 8', seats: 2, armIn: 209.9 },
  { id: 'p6', label: 'Assento 6', seats: 1, armIn: 225.9 },
  { id: 'p910', label: 'Assentos 9 e 10', seats: 2, armIn: 245.9 },
  { id: 'p11', label: 'Assento 11', seats: 1, armIn: 261.9 },
];

/**
 * Assentos do arranjo escalonado da FAB 2720.
 *
 * Lado CONFIRMADO PELO OPERADOR, não transcrito do manual: os pares ficam à
 * direita e os individuais à esquerda, escalonados 16 polegadas atrás do par
 * correspondente. Conferir na aeronave antes de aplicar a outra matrícula.
 */
const ASSENTOS_ESCALONADA: readonly CabinSeat[] = [
  { id: 's4', number: 4, stationId: 'p45', side: 'direita' },
  { id: 's5', number: 5, stationId: 'p45', side: 'direita' },
  { id: 's3', number: 3, stationId: 'p3', side: 'esquerda' },
  { id: 's7', number: 7, stationId: 'p78', side: 'direita' },
  { id: 's8', number: 8, stationId: 'p78', side: 'direita' },
  { id: 's6', number: 6, stationId: 'p6', side: 'esquerda' },
  { id: 's9', number: 9, stationId: 'p910', side: 'direita' },
  { id: 's10', number: 10, stationId: 'p910', side: 'direita' },
  { id: 's11', number: 11, stationId: 'p11', side: 'esquerda' },
];

/**
 * Arranjo lado a lado — página 6-46.
 * Três fileiras alinhadas de três assentos.
 */
const LADO_A_LADO: readonly PassengerStation[] = [
  { id: 'p345', label: 'Assentos 3, 4 e 5', seats: 3, armIn: 173.9 },
  { id: 'p678', label: 'Assentos 6, 7 e 8', seats: 3, armIn: 209.9 },
  { id: 'p91011', label: 'Assentos 9, 10 e 11', seats: 3, armIn: 245.9 },
];

/**
 * Assentos do arranjo lado a lado.
 *
 * O lado fica PENDENTE: nenhuma aeronave da frota usa este arranjo hoje, e
 * deduzir a disposição lateral a partir da tabela de momentos seria inventar.
 * Enquanto estiver assim, a matrícula que usar este arranjo lança passageiros
 * pelos campos numéricos, sem mapa.
 */
const ASSENTOS_LADO_A_LADO: readonly CabinSeat[] = [
  { id: 's3', number: 3, stationId: 'p345', side: PENDING },
  { id: 's4', number: 4, stationId: 'p345', side: PENDING },
  { id: 's5', number: 5, stationId: 'p345', side: PENDING },
  { id: 's6', number: 6, stationId: 'p678', side: PENDING },
  { id: 's7', number: 7, stationId: 'p678', side: PENDING },
  { id: 's8', number: 8, stationId: 'p678', side: PENDING },
  { id: 's9', number: 9, stationId: 'p91011', side: PENDING },
  { id: 's10', number: 10, stationId: 'p91011', side: PENDING },
  { id: 's11', number: 11, stationId: 'p91011', side: PENDING },
];

export const C98_PASSENGER_STATIONS: Readonly<
  Record<SeatingArrangement, readonly PassengerStation[]>
> = {
  escalonada: ESCALONADA,
  'lado-a-lado': LADO_A_LADO,
};

export const C98_CABIN_SEATS: Readonly<
  Record<SeatingArrangement, readonly CabinSeat[]>
> = {
  escalonada: ASSENTOS_ESCALONADA,
  'lado-a-lado': ASSENTOS_LADO_A_LADO,
};

/** Braço de um assento, herdado da estação a que ele pertence. */
export function armOfSeat(
  seat: CabinSeat,
  stations: readonly PassengerStation[],
): number | null {
  const station = stations.find((s) => s.id === seat.stationId);
  return station ? station.armIn : null;
}
