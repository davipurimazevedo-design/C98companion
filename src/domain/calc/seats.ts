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

import { FRONT_CREW_SEATS } from '../../data/aircraft/c98.arms.ts';
import {
  armOfSeat,
  type CabinSeat,
  type PassengerStation,
  type SeatSide,
} from '../../data/aircraft/c98.seats.ts';
import type { CrewMember } from '../models/plan.ts';

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

/** Um tripulante extra, sentado num assento da cabine em vez de na frente. */
export interface CrewSeatAssignment {
  readonly crewId: string;
  readonly crewRole: string;
  readonly weightKg: number;
  readonly seat: SeatSlot;
}

/**
 * Como piloto, copiloto, tripulantes extras e passageiros se repartem entre os
 * assentos.
 */
export interface CrewSeatPlan {
  /** Tripulantes extras, na ordem em que ocupam a cabine. */
  readonly assignments: readonly CrewSeatAssignment[];
  /** Assentos que sobraram para passageiro, na mesma ordem física. */
  readonly passengerSeats: readonly SeatSlot[];
  /**
   * Tripulante extra sem assento — só ocorre com mais gente na cabine do que
   * lugares instalados, o que não deveria acontecer em operação normal.
   * Mantido na tripulação com o braço dianteiro como aproximação, para que o
   * peso dele nunca desapareça do cálculo.
   */
  readonly unseated: readonly CrewMember[];
}

/**
 * Reparte piloto/copiloto (braço dianteiro fixo) e tripulantes extras
 * (assento da cabine) entre si.
 *
 * Decisão do esquadrão, não do manual: o Mecânico senta no assento 4, e cada
 * tripulante acrescentado depois ocupa o assento seguinte na mesma ordem
 * física em que os passageiros são distribuídos — a mesma lista que
 * `resolveSeats` devolve, sem outra fonte de posição. Assim "travar" um
 * tripulante extra a um assento é automático: o terceiro tripulante da lista
 * (o primeiro além de piloto e copiloto) sempre cai no primeiro assento da
 * cabine, esteja ele em qual matrícula estiver.
 *
 * O braço errado de um tripulante desloca o CG calculado sem nenhum aviso na
 * tela — por isso esta função existe como um ponto único, testado, em vez de
 * cada consumidor calcular "quem senta onde" à sua maneira.
 */
export function assignCrewSeats(
  crew: readonly CrewMember[],
  seats: readonly SeatSlot[],
): CrewSeatPlan {
  const extra = crew.slice(FRONT_CREW_SEATS);
  const assignments: CrewSeatAssignment[] = [];
  const unseated: CrewMember[] = [];

  extra.forEach((member, index) => {
    const seat = seats[index];
    if (!seat) {
      unseated.push(member);
      return;
    }
    assignments.push({
      crewId: member.id,
      crewRole: member.role,
      weightKg: member.weightKg,
      seat,
    });
  });

  return {
    assignments,
    passengerSeats: seats.slice(extra.length),
    unseated,
  };
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
