/**
 * Repartição dos assentos entre tripulação e passageiros.
 *
 * O que estes testes protegem: quem senta onde decide o BRAÇO de cada pessoa,
 * e um assento reservado indevidamente empurra um passageiro real para trás,
 * deslocando o centro de gravidade sem que nenhum peso na tela explique o
 * deslocamento. É o tipo de erro que não aparece como número errado — aparece
 * como um ponto fora do envelope sem causa visível.
 */

import { describe, expect, it } from 'vitest';

import {
  C98_CABIN_SEATS,
  C98_PASSENGER_STATIONS,
} from '../../data/aircraft/c98.seats.ts';
import type { CrewMember } from '../models/plan.ts';
import { assignCrewSeats, resolveSeats } from './seats.ts';

const SEATS = resolveSeats(
  C98_CABIN_SEATS.escalonada,
  C98_PASSENGER_STATIONS.escalonada,
);

/** Tripulação como o rascunho inicial a monta, com pesos ajustáveis. */
function crewOf(...weightsKg: readonly number[]): CrewMember[] {
  const roles = [
    'Piloto',
    'Copiloto',
    'Mecânico',
    'Segundo Mecânico',
    'Tripulante 5',
  ];
  return weightsKg.map((weightKg, index) => ({
    id: `c${index}`,
    role: roles[index] ?? `Tripulante ${index + 1}`,
    weightKg,
  }));
}

describe('piloto e copiloto não entram na cabine', () => {
  it('os dois dianteiros nunca recebem assento da cabine', () => {
    const plan = assignCrewSeats(crewOf(85, 80), SEATS);

    expect(plan.assignments).toHaveLength(0);
    expect(plan.passengerSeats).toHaveLength(SEATS.length);
  });
});

describe('mecânico, tripulante fixo', () => {
  it('ocupa o assento 4 mesmo com o peso ainda em branco', () => {
    /* Decisão do esquadrão: toda missão leva mecânico, e o assento 4 fica
       reservado desde a primeira tela, antes de qualquer peso digitado. */
    const plan = assignCrewSeats(crewOf(0, 0, 0), SEATS);

    expect(plan.assignments).toHaveLength(1);
    expect(plan.assignments[0]?.crewRole).toBe('Mecânico');
    expect(plan.assignments[0]?.seat.id).toBe('s4');
    expect(plan.passengerSeats).toHaveLength(SEATS.length - 1);
  });

  it('com peso lançado, continua no mesmo assento', () => {
    const plan = assignCrewSeats(crewOf(85, 80, 90), SEATS);

    expect(plan.assignments[0]?.seat.id).toBe('s4');
    expect(plan.assignments[0]?.weightKg).toBe(90);
  });
});

/**
 * Regressão da causa raiz auditada: `assignCrewSeats` reservava assento para
 * QUALQUER tripulante extra, mesmo com peso zero. Um "Segundo Mecânico"
 * acrescentado e deixado em branco empurrava o primeiro passageiro do assento
 * 5 para o 3 (189,9 pol em vez de 173,9), deslocando o CG para trás sem que
 * houvesse peso nenhum justificando — e em configurações leves, onde a
 * sensibilidade do CG é maior, isso corroía a margem até o limite.
 */
describe('tripulante extra sem peso não reserva assento', () => {
  it('segundo mecânico em branco deixa o assento livre para passageiro', () => {
    const plan = assignCrewSeats(crewOf(85, 80, 90, 0), SEATS);

    /* Só o mecânico ocupa assento; o segundo mecânico em branco não. */
    expect(plan.assignments).toHaveLength(1);
    expect(plan.assignments[0]?.crewRole).toBe('Mecânico');
    expect(plan.passengerSeats).toHaveLength(SEATS.length - 1);
    expect(plan.passengerSeats[0]?.id).toBe('s5');
  });

  it('vários tripulantes em branco não acumulam assentos reservados', () => {
    const plan = assignCrewSeats(crewOf(85, 80, 90, 0, 0), SEATS);

    expect(plan.assignments).toHaveLength(1);
    expect(plan.passengerSeats).toHaveLength(SEATS.length - 1);
  });

  it('assim que o peso é lançado, o assento volta a ser reservado', () => {
    const plan = assignCrewSeats(crewOf(85, 80, 90, 88), SEATS);

    expect(plan.assignments).toHaveLength(2);
    expect(plan.assignments[1]?.crewRole).toBe('Segundo Mecânico');
    expect(plan.assignments[1]?.seat.id).toBe('s5');
    expect(plan.passengerSeats[0]?.id).toBe('s3');
  });

  it('a ordem dos assentos segue a ordem física, sem buracos', () => {
    /* Terceiro tripulante extra com peso, quarto em branco: o que tem peso
       assume o assento seguinte, não pula um lugar por causa do vazio. */
    const plan = assignCrewSeats(crewOf(85, 80, 90, 0, 75), SEATS);

    expect(plan.assignments).toHaveLength(2);
    expect(plan.assignments[0]?.seat.id).toBe('s4');
    expect(plan.assignments[1]?.seat.id).toBe('s5');
    expect(plan.assignments[1]?.crewRole).toBe('Tripulante 5');
  });
});

describe('mais tripulantes do que assentos', () => {
  it('o excedente fica sem assento em vez de sumir do cálculo', () => {
    const comPeso = Array.from({ length: SEATS.length + 3 }, () => 80);
    const plan = assignCrewSeats(crewOf(...comPeso), SEATS);

    expect(plan.assignments).toHaveLength(SEATS.length);
    expect(plan.unseated).toHaveLength(comPeso.length - 2 - SEATS.length);
    expect(plan.passengerSeats).toHaveLength(0);
  });
});
