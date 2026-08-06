/**
 * Estimativa de quantos passageiros ainda cabem.
 *
 * Dois limites atuam ao mesmo tempo: o peso disponível e os assentos livres.
 * Manda o menor — de nada adianta sobrar peso se não há onde sentar.
 *
 * A parte do peso é uma ESTIMATIVA, e o texto na tela diz isso: usa um peso
 * médio, não o peso real de quem vai embarcar. Arredonda sempre para baixo:
 * meio passageiro não embarca, e sobrar margem é preferível a anunciar um lugar
 * que não existe.
 *
 * O limite por assento só entra quando o piloto informa a quantidade de
 * passageiros já a bordo. Sem isso não há como saber quantos lugares sobraram,
 * e a estimativa fica apenas por peso.
 */

import { AVERAGE_PASSENGER_KG } from '../../data/operational.ts';
import type { SeatSlot } from './seats.ts';
import { kgToLb } from './units.ts';

/**
 * Embarca N passageiros, um por assento, com o peso médio cada.
 *
 * É uma conveniência de preenchimento, não uma regra: dá um ponto de partida
 * — "4 passageiros" viram 4 assentos com o peso médio — que o piloto ajusta em
 * seguida, assento por assento.
 *
 * Preenche pela ORDEM da lista de assentos, que é a ordem física dianteiro a
 * traseiro (ver `c98.seats.ts`). Assentos além dos N primeiros não entram no
 * resultado — devolver `{}` para eles é o que permite ao chamador esvaziá-los
 * ao substituir o carregamento inteiro, e não deixar sobras de um preenchimento
 * anterior.
 *
 * `count` é travado ao número de assentos disponíveis: mais passageiros do que
 * lugares é um problema de ASSENTO, sinalizado à parte pelo aviso de excesso —
 * esta função nunca inventa um décimo assento.
 */
export function distributeBySeats(
  count: number,
  averageKg: number,
  seats: readonly SeatSlot[],
): Record<string, number> {
  if (count <= 0 || seats.length === 0) return {};

  const loads: Record<string, number> = {};
  const toFill = Math.min(count, seats.length);

  for (let i = 0; i < toFill; i += 1) {
    const seat = seats[i];
    if (seat) loads[seat.id] = averageKg;
  }

  return loads;
}

export interface PassengerCapacity {
  /** Peso médio adotado, em quilogramas. */
  readonly averageKg: number;
  /** O mesmo peso médio convertido para libras. */
  readonly averageLb: number;
  /** Quantos caberiam considerando apenas o peso disponível. */
  readonly byWeight: number;
  /** Assentos de passageiro instalados. */
  readonly seats: number;
  /** Assentos livres. `null` quando a quantidade a bordo não foi informada. */
  readonly freeSeats: number | null;
  /** Quantos cabem de fato: o menor entre peso e assentos. */
  readonly count: number;
  /** Qual dos dois limites está mandando. */
  readonly limitedBy: 'peso' | 'assentos';
}

interface CapacityInput {
  /** Peso ainda disponível até o máximo de decolagem. */
  readonly availableLb: number;
  /** Assentos de passageiro instalados. */
  readonly seats: number;
  /** Passageiros já a bordo. `null` quando não informado. */
  readonly onBoard: number | null;
}

export function computePassengerCapacity({
  availableLb,
  seats,
  onBoard,
}: CapacityInput): PassengerCapacity {
  const averageLb = kgToLb(AVERAGE_PASSENGER_KG);
  const byWeight = Math.max(0, Math.floor(availableLb / averageLb));

  const freeSeats = onBoard === null ? null : Math.max(0, seats - onBoard);

  /**
   * Sem contagem a bordo não sabemos quantos lugares estão ocupados, mas
   * sabemos quantos existem — e a aeronave nunca leva mais que isso. O total de
   * assentos serve então de teto superior. É o que impede a tela de anunciar
   * dezessete passageiros numa aeronave de nove lugares.
   */
  const seatCeiling = freeSeats ?? seats;
  const count = Math.min(byWeight, seatCeiling);

  return {
    averageKg: AVERAGE_PASSENGER_KG,
    averageLb,
    byWeight,
    seats,
    freeSeats,
    count,
    limitedBy: seatCeiling < byWeight ? 'assentos' : 'peso',
  };
}
