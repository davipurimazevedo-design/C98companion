import { describe, expect, it } from 'vitest';

import { C98 } from '../../data/aircraft/index.ts';
import {
  C98_CABIN_SEATS,
  C98_PASSENGER_STATIONS,
} from '../../data/aircraft/c98.seats.ts';
import { crew, makePlan } from './__fixtures__/plan.ts';
import { resolveSeats } from './seats.ts';
import { computeTotals } from './totals.ts';
import { kgToLb } from './units.ts';

const POSITIONS = C98.positions;
const SEATS = resolveSeats(
  C98_CABIN_SEATS.escalonada,
  C98_PASSENGER_STATIONS.escalonada,
);
const totalsOf = (plan: Parameters<typeof computeTotals>[0]) =>
  computeTotals(plan, POSITIONS, SEATS);

describe('computeTotals', () => {
  it('planejamento vazio soma zero em tudo', () => {
    const totals = totalsOf(makePlan());

    expect(totals.crewLb).toBe(0);
    expect(totals.passengerLb).toBe(0);
    expect(totals.cargoLb).toBe(0);
    expect(totals.fuelLb).toBe(0);
    expect(totals.payloadLb).toBe(0);
    expect(totals.crewCount).toBe(0);
  });

  it('converte tripulação de quilogramas para libras', () => {
    const totals = totalsOf(makePlan({ crew: [crew('1', 80), crew('2', 75)] }));

    expect(totals.crewCount).toBe(2);
    expect(totals.crewKg).toBe(155);
    expect(totals.crewLb).toBeCloseTo(kgToLb(155), 9);
  });

  it('converte o peso total dos passageiros', () => {
    const totals = totalsOf(makePlan({ passengerLoads: { s4: 222.5 } }));

    expect(totals.passengerKg).toBe(222.5);
    expect(totals.passengerLb).toBeCloseTo(kgToLb(222.5), 9);
  });

  it('separa a carga da cabine da carga do cargo pod', () => {
    const totals = totalsOf(
      makePlan({
        positionLoads: { 'zona-1': 200, 'zona-3': 150, 'pod-a': 100, 'pod-c': 50 },
      }),
    );

    expect(totals.cabinCargoLb).toBe(350);
    expect(totals.podCargoLb).toBe(150);
    expect(totals.cargoLb).toBe(500);
  });

  it('ignora posições que não pertencem à aeronave', () => {
    /* Sem cargo pod, o peso lançado num compartimento do pod não entra na
       conta: a lista de posições é a autoridade. */
    const semPod = POSITIONS.filter((position) => position.group !== 'pod');
    const totals = computeTotals(
      makePlan({ positionLoads: { 'zona-1': 200, 'pod-a': 100 } }),
      semPod,
      SEATS,
    );

    expect(totals.podCargoLb).toBe(0);
    expect(totals.cargoLb).toBe(200);
  });

  it('peso zero combustível exclui o combustível do total', () => {
    const totals = totalsOf(
      makePlan({
        crew: [crew('1', 80)],
        positionLoads: { 'zona-1': 200 },
        fuelLb: 1000,
      }),
    );

    expect(totals.zeroFuelPayloadLb).toBeCloseTo(kgToLb(80) + 200, 9);
    expect(totals.payloadLb).toBeCloseTo(totals.zeroFuelPayloadLb + 1000, 9);
  });

  /**
   * Trava contra contagem dupla: um assento que a tripulação extra ocupou
   * (assignCrewSeats) sai da lista de `passengerSeats` recebida aqui. Se
   * sobrar um valor lançado antes de o assento virar da tripulação, ele não
   * pode ser somado de novo — o peso desse tripulante já está em `crewKg`.
   */
  it('ignora peso lançado num assento que não está mais disponível para passageiro', () => {
    const semAssento4 = SEATS.filter((seat) => seat.id !== 's4');
    const totals = computeTotals(
      makePlan({ passengerLoads: { s4: 90, s5: 80 } }),
      POSITIONS,
      semAssento4,
    );

    expect(totals.passengerKg).toBe(80);
  });
});
