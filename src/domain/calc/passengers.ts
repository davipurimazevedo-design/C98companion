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

import type { PassengerStation } from '../../data/aircraft/c98.seats.ts';
import { AVERAGE_PASSENGER_KG } from '../../data/operational.ts';
import { kgToLb } from './units.ts';

/**
 * Reparte um peso total entre as estações, proporcionalmente aos lugares.
 *
 * É uma conveniência de preenchimento, não uma regra: dá um ponto de partida
 * equilibrado que o piloto ajusta em seguida, estação por estação. A última
 * estação absorve a sobra do arredondamento, para que a soma feche com o total.
 */
export function distributeBySeats(
  totalKg: number,
  stations: readonly PassengerStation[],
): Record<string, number> {
  const totalSeats = stations.reduce((sum, s) => sum + s.seats, 0);
  if (totalSeats === 0 || totalKg <= 0) return {};

  const loads: Record<string, number> = {};
  let assigned = 0;

  stations.forEach((station, index) => {
    const isLast = index === stations.length - 1;
    const share = isLast
      ? totalKg - assigned
      : Math.round((totalKg * station.seats * 10) / totalSeats) / 10;
    loads[station.id] = Math.round(share * 10) / 10;
    assigned += loads[station.id] ?? 0;
  });

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
