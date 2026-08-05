/**
 * Veredito — o que o piloto lê primeiro no cartão de resumo.
 *
 * Uma frase principal com o número que importa, seguida de complementos curtos
 * que respondem às perguntas seguintes: cabe mais gente? e se eu completar o
 * combustível, quanto fica?
 */

import { formatLb } from '../../utils/format.ts';
import type { Availability } from './availability.ts';
import type { Outcome } from './outcome.ts';
import type { PassengerCapacity } from './passengers.ts';
import type { SituationLevel } from './status.ts';

export interface Verdict {
  readonly level: SituationLevel;
  /** Frase principal. Ex.: "Ainda é possível embarcar 1.756 LB." */
  readonly headline: string;
  /** Linhas complementares, exibidas uma por linha abaixo da principal. */
  readonly notes: readonly string[];
  /** Fecho com o percentual utilizado. */
  readonly detail: string;
}

interface VerdictInput {
  readonly availability: Outcome<Availability>;
  readonly additionalFuel: Outcome<number>;
  readonly capacity: PassengerCapacity;
  readonly level: SituationLevel;
  readonly payloadLb: number;
  /** Combustível já considerado a bordo. */
  readonly fuelOnBoardLb: number;
  /** Passageiros além dos assentos instalados. */
  readonly seatOverflow: number;
}

/** Frase sobre quantos passageiros ainda cabem. */
function passengerNote(capacity: PassengerCapacity): string {
  const { count, averageKg, freeSeats, seats, limitedBy } = capacity;

  if (count === 0) {
    return freeSeats === 0
      ? 'Todos os assentos de passageiro estão ocupados.'
      : `Não cabe mais nenhum passageiro de ${averageKg} kg.`;
  }

  const pessoas = `${count} ${count === 1 ? 'passageiro' : 'passageiros'}`;

  if (limitedBy === 'assentos') {
    /* Com a quantidade a bordo informada sabemos quantos lugares sobraram.
       Sem ela, o que limita é o total de assentos da aeronave. */
    return freeSeats === null
      ? `Cabem ${pessoas} — limite de ${seats} assentos da aeronave.`
      : `Cabem mais ${pessoas} — limitado pelos assentos livres.`;
  }

  const assentos =
    freeSeats === null
      ? ''
      : ` (${freeSeats} ${freeSeats === 1 ? 'assento livre' : 'assentos livres'})`;

  return `Equivale a ${pessoas} de ${averageKg} kg${assentos}.`;
}

export function buildVerdict({
  availability,
  additionalFuel,
  capacity,
  level,
  payloadLb,
  fuelOnBoardLb,
  seatOverflow,
}: VerdictInput): Verdict {
  if (availability.status === 'pending') {
    return {
      level,
      headline: 'Aguardando dados oficiais do manual.',
      notes: [],
      detail:
        `Carga embarcada até agora: ${formatLb(payloadLb)} LB. ` +
        'O peso total e a disponibilidade dependem dos dados ainda não cadastrados.',
    };
  }

  const { availableLb, exceededByLb, usedPct, isExceeded } = availability.value;
  const percent = `${Math.round(usedPct)}% do peso máximo utilizado.`;

  if (isExceeded) {
    return {
      level,
      headline: `O limite foi excedido em ${formatLb(exceededByLb)} LB.`,
      notes: [],
      detail: `Retire peso antes da decolagem. ${percent}`,
    };
  }

  /* Gente demais é problema mesmo com o peso folgado. A frase principal precisa
     liderar com isso — um cartão vermelho dizendo "ainda é possível embarcar"
     se contradiz e faz o piloto duvidar do resto. */
  if (seatOverflow > 0) {
    const pessoas = `${seatOverflow} ${seatOverflow === 1 ? 'passageiro' : 'passageiros'}`;
    return {
      level,
      headline: `Há ${pessoas} a mais que assentos.`,
      notes: [],
      detail:
        `O peso está dentro dos limites: restam ${formatLb(availableLb)} LB. ` +
        percent,
    };
  }

  const notes: string[] = [passengerNote(capacity)];

  /* Onde o combustível chega se o piloto aceitar todo o adicional. */
  if (additionalFuel.status === 'ready') {
    const extra = additionalFuel.value;
    notes.push(
      extra === 0
        ? 'Não cabe mais combustível.'
        : `Somando ${formatLb(extra)} LB de combustível, o total a bordo ` +
          `fica em ${formatLb(fuelOnBoardLb + extra)} LB.`,
    );
  }

  return {
    level,
    headline: `Ainda é possível embarcar ${formatLb(availableLb)} LB.`,
    notes,
    detail: percent,
  };
}
