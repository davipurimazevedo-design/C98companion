/**
 * Assentos resolvidos.
 *
 * O manual publica o braço por ESTAÇÃO, e uma estação pode conter dois ou três
 * assentos. A tela, desde que existe o mapa da cabine, lança peso por ASSENTO.
 *
 * Este módulo junta as duas coisas uma única vez: cada assento recebe o braço
 * da estação a que pertence, e o resto do cálculo trabalha só com o resultado.
 * Assim continua havendo uma só fonte para o braço — a estação — sem que cada
 * consumidor precise fazer a costura.
 */

import {
  armOfSeat,
  type CabinSeat,
  type PassengerStation,
  type SeatSide,
} from '../../data/aircraft/c98.seats.ts';

/** Um assento pronto para uso: identidade, braço e lado já resolvidos. */
export interface SeatSlot {
  /** Identificador do assento. É a chave do peso lançado. */
  readonly id: string;
  /** Nome exibido. Ex.: "Assento 4". */
  readonly label: string;
  readonly number: number;
  /** Estação de onde veio o braço. */
  readonly stationId: string;
  readonly armIn: number;
  /** Lado instalado, ou `null` quando não confirmado para esta aeronave. */
  readonly side: SeatSide | null;
}

/**
 * Resolve os assentos contra as estações publicadas.
 *
 * Um assento cuja estação não existe é DESCARTADO em vez de receber braço zero:
 * um assento com braço errado deslocaria o centro de gravidade sem nenhum sinal
 * na tela, enquanto um assento a menos é imediatamente visível. Um teste garante
 * que isso não aconteça com os dados cadastrados.
 */
export function resolveSeats(
  seats: readonly CabinSeat[],
  stations: readonly PassengerStation[],
): readonly SeatSlot[] {
  const resolved: SeatSlot[] = [];

  for (const seat of seats) {
    const armIn = armOfSeat(seat, stations);
    if (armIn === null) continue;

    resolved.push({
      id: seat.id,
      label: `Assento ${seat.number}`,
      number: seat.number,
      stationId: seat.stationId,
      armIn,
      side: seat.side,
    });
  }

  return resolved;
}

/** Soma o peso lançado nos assentos de uma estação. */
export function stationLoadKg(
  stationId: string,
  seats: readonly SeatSlot[],
  loads: Readonly<Record<string, number>>,
): number {
  return seats
    .filter((seat) => seat.stationId === stationId)
    .reduce((total, seat) => total + (loads[seat.id] ?? 0), 0);
}
