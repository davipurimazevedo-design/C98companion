/**
 * Conferência dos assentos cadastrados.
 *
 * Registro auditável: cada asserção repete o que a página 6-45 publica, para
 * que a transcrição possa ser conferida contra o manual sem ler o código.
 *
 * A parte que NÃO vem do manual — o lado de cada assento — é verificada
 * separadamente, e o teste diz de onde ela veio.
 */

import { describe, expect, it } from 'vitest';

import { C98_CABIN_SEATS, C98_PASSENGER_STATIONS } from './c98.seats.ts';
import { resolveSeats } from '../../domain/calc/seats.ts';
import { FLEET } from './fleet.ts';
import { isPresent } from '../pending.ts';

const STATIONS = C98_PASSENGER_STATIONS.escalonada;
const SEATS = C98_CABIN_SEATS.escalonada;

describe('arranjo escalonado, página 6-45', () => {
  it('tem nove assentos traseiros, numerados de 3 a 11', () => {
    expect(SEATS).toHaveLength(9);
    const numbers = SEATS.map((seat) => seat.number).sort((a, b) => a - b);
    expect(numbers).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('não repete identificador', () => {
    const ids = new Set(SEATS.map((seat) => seat.id));
    expect(ids.size).toBe(SEATS.length);
  });

  it('toda estação referida existe', () => {
    for (const seat of SEATS) {
      const station = STATIONS.find((s) => s.id === seat.stationId);
      expect(station, `assento ${seat.number}`).toBeDefined();
    }
  });

  it('nenhum assento é descartado ao resolver o braço', () => {
    /* `resolveSeats` descarta assento sem estação. Se algum sumir aqui, é
       porque o cadastro ficou inconsistente. */
    expect(resolveSeats(SEATS, STATIONS)).toHaveLength(SEATS.length);
  });

  it('a contagem por estação bate com os grupos publicados', () => {
    /* [estação, quantos assentos, braço publicado] */
    const publicados: readonly (readonly [string, number, number])[] = [
      ['p45', 2, 173.9],
      ['p3', 1, 189.9],
      ['p78', 2, 209.9],
      ['p6', 1, 225.9],
      ['p910', 2, 245.9],
      ['p11', 1, 261.9],
    ];

    for (const [id, quantos, braço] of publicados) {
      const station = STATIONS.find((s) => s.id === id);
      expect(station?.seats, id).toBe(quantos);
      expect(station?.armIn, id).toBe(braço);
      expect(
        SEATS.filter((seat) => seat.stationId === id),
        id,
      ).toHaveLength(quantos);
    }
  });

  it('cada assento herda o braço da sua estação', () => {
    const resolvidos = resolveSeats(SEATS, STATIONS);
    const braçoDe = (número: number) =>
      resolvidos.find((seat) => seat.number === número)?.armIn;

    expect(braçoDe(4)).toBe(173.9);
    expect(braçoDe(5)).toBe(173.9);
    expect(braçoDe(3)).toBe(189.9);
    expect(braçoDe(11)).toBe(261.9);
  });
});

describe('lado dos assentos, confirmado pelo operador', () => {
  /* O manual não fixa o lado — a página 6-47 avisa que a instalação varia e
     manda conferir na aeronave. Isto aqui é a confirmação para a FAB 2720. */

  it('os pares ficam à direita e os individuais à esquerda', () => {
    const ladoDe = (número: number) =>
      SEATS.find((seat) => seat.number === número)?.side;

    for (const número of [4, 5, 7, 8, 9, 10]) {
      expect(ladoDe(número), `assento ${número}`).toBe('direita');
    }
    for (const número of [3, 6, 11]) {
      expect(ladoDe(número), `assento ${número}`).toBe('esquerda');
    }
  });

  it('os individuais ficam 16 polegadas atrás do par correspondente', () => {
    const braço = (id: string) => STATIONS.find((s) => s.id === id)?.armIn ?? 0;
    expect(braço('p3') - braço('p45')).toBeCloseTo(16, 6);
    expect(braço('p6') - braço('p78')).toBeCloseTo(16, 6);
    expect(braço('p11') - braço('p910')).toBeCloseTo(16, 6);
  });

  it('o arranjo lado a lado permanece com o lado pendente', () => {
    /* Nenhuma aeronave da frota o usa, e deduzir a disposição lateral a partir
       da tabela de momentos seria inventar. */
    for (const seat of C98_CABIN_SEATS['lado-a-lado']) {
      expect(isPresent(seat.side), `assento ${seat.number}`).toBe(false);
    }
  });
});

describe('coerência com a frota', () => {
  it('a quantidade de assentos da matrícula bate com o arranjo instalado', () => {
    for (const aircraft of FLEET) {
      const seats = C98_CABIN_SEATS[aircraft.seatingArrangement];
      expect(seats.length, aircraft.tail).toBe(aircraft.passengerSeats);
    }
  });
});
