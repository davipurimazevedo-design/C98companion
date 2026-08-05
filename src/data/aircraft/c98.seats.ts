/**
 * Estações dos assentos de passageiro.
 *
 * Fonte: Figura 6-15, folhas 2 e 3 (páginas 6-45 e 6-46), configuração
 * "10 or 11-Place Commuter Seating". O manual publica dois arranjos, com
 * braços diferentes — qual vale depende de como os assentos estão instalados
 * na aeronave, e por isso a escolha fica na ficha de cada matrícula.
 *
 * Os dois assentos dianteiros não estão aqui: são da tripulação e usam o braço
 * único de 135,5 pol, em `c98.arms.ts`.
 */

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
 * Arranjo lado a lado — página 6-46.
 * Três fileiras alinhadas de três assentos.
 */
const LADO_A_LADO: readonly PassengerStation[] = [
  { id: 'p345', label: 'Assentos 3, 4 e 5', seats: 3, armIn: 173.9 },
  { id: 'p678', label: 'Assentos 6, 7 e 8', seats: 3, armIn: 209.9 },
  { id: 'p91011', label: 'Assentos 9, 10 e 11', seats: 3, armIn: 245.9 },
];

export const C98_PASSENGER_STATIONS: Readonly<
  Record<SeatingArrangement, readonly PassengerStation[]>
> = {
  escalonada: ESCALONADA,
  'lado-a-lado': LADO_A_LADO,
};
