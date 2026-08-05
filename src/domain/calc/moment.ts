/**
 * Cálculo de momento.
 *
 * Primeira parte do módulo de centragem. Soma os momentos de tudo que está a
 * bordo, na mesma ordem e convenção do manifesto do manual (página 6-55), para
 * que os dois possam ser conferidos linha a linha.
 *
 * O momento é sempre exibido dividido por 1000, como no manual.
 *
 * A classificação do resultado contra o envelope fica em `cg.ts`.
 */

import type { AircraftProfile, LoadPosition } from '../../data/aircraft/types.ts';
import { CREW_ARM_IN } from '../../data/aircraft/c98.arms.ts';
import type { FuelMomentRow } from '../../data/aircraft/c98.fuelMoment.ts';
import type { PassengerStation } from '../../data/aircraft/c98.seats.ts';
import { isPresent } from '../../data/pending.ts';
import type { MissionPlan } from '../models/plan.ts';
import { pending, ready, type Outcome } from './outcome.ts';
import { kgToLb } from './units.ts';

/** Uma linha do cálculo de momento, espelhando o manifesto do manual. */
export interface MomentLine {
  readonly label: string;
  readonly weightLb: number;
  /** `null` quando o braço da posição não está cadastrado. */
  readonly armIn: number | null;
  /** Momento dividido por 1000, como o manual exibe. `null` se indeterminado. */
  readonly moment1000: number | null;
}

export interface MomentReport {
  readonly lines: readonly MomentLine[];
  /** Momento/1000 na rampa, antes do desconto do combustível de táxi. */
  readonly rampMoment1000: number;
  readonly rampWeightLb: number;
  /** Desconto do combustível de táxi, sempre negativo ou zero. */
  readonly taxiMoment1000: number;
  readonly taxiWeightLb: number;
  /** Momento/1000 na decolagem. */
  readonly takeoffMoment1000: number;
  readonly takeoffWeightLb: number;
  /**
   * Itens cujo momento não pôde ser apurado — o total não os inclui e por isso
   * não deve ser usado para centragem enquanto a lista não estiver vazia.
   */
  readonly unaccounted: readonly string[];
}

/**
 * Momento/1000 do combustível, interpolado na tabela do manual.
 *
 * A tabela é indexada por peso porque é assim que o aplicativo conhece o
 * combustível. Entre duas linhas publicadas, interpola linearmente; acima da
 * última linha, extrapola pelo braço da última linha, que é o comportamento
 * menos surpreendente para um valor fora de faixa.
 */
export function fuelMoment1000(
  weightLb: number,
  table: readonly FuelMomentRow[],
): number {
  if (weightLb <= 0 || table.length === 0) return 0;

  const first = table[0];
  const last = table[table.length - 1];
  if (!first || !last) return 0;

  if (weightLb <= first.lb) {
    /* Abaixo da primeira linha, proporcional a ela. */
    return (first.moment1000 * weightLb) / first.lb;
  }
  if (weightLb >= last.lb) {
    const armIn = (last.moment1000 * 1000) / last.lb;
    return (weightLb * armIn) / 1000;
  }

  for (let i = 1; i < table.length; i += 1) {
    const lower = table[i - 1];
    const upper = table[i];
    if (!lower || !upper) continue;
    if (weightLb <= upper.lb) {
      const span = upper.lb - lower.lb;
      if (span === 0) return lower.moment1000;
      const ratio = (weightLb - lower.lb) / span;
      return lower.moment1000 + ratio * (upper.moment1000 - lower.moment1000);
    }
  }

  return last.moment1000;
}

/** Momento/1000 de um item com braço conhecido. */
function moment1000Of(weightLb: number, armIn: number): number {
  return (weightLb * armIn) / 1000;
}

/**
 * Monta o relatório de momento do planejamento.
 *
 * Devolve `pending` se o peso básico ou o momento básico da matrícula não
 * estiverem cadastrados — sem eles não existe momento total.
 */
export function computeMoment(
  plan: MissionPlan,
  profile: AircraftProfile,
  positions: readonly LoadPosition[],
  stations: readonly PassengerStation[],
): Outcome<MomentReport> {
  const { basicEmptyWeightLb, basicMoment } = profile.registration;

  const missing: string[] = [];
  if (!isPresent(basicEmptyWeightLb)) missing.push('Peso básico vazio');
  if (!isPresent(basicMoment)) missing.push('Momento básico');
  if (!isPresent(basicEmptyWeightLb) || !isPresent(basicMoment)) {
    return pending(missing);
  }

  const lines: MomentLine[] = [];
  const unaccounted: string[] = [];

  /* 1 — Peso básico vazio. O momento básico já vem em lb·pol da ficha. */
  lines.push({
    label: 'Peso básico vazio',
    weightLb: basicEmptyWeightLb,
    armIn: basicMoment / basicEmptyWeightLb,
    moment1000: basicMoment / 1000,
  });

  /* 2 — Combustível utilizável, pela tabela (o braço varia). */
  const fuelLb = plan.fuelLb;
  lines.push({
    label: 'Combustível utilizável',
    weightLb: fuelLb,
    armIn: null,
    moment1000: fuelMoment1000(fuelLb, profile.model.fuelMoments),
  });

  /* 3 e 4 — Tripulação nos assentos dianteiros. */
  for (const member of plan.crew) {
    const weightLb = kgToLb(member.weightKg);
    lines.push({
      label: member.role,
      weightLb,
      armIn: CREW_ARM_IN,
      moment1000: moment1000Of(weightLb, CREW_ARM_IN),
    });
  }

  /* 5 — Passageiros traseiros, por estação de assento. */
  for (const station of stations) {
    const weightKg = plan.passengerLoads[station.id] ?? 0;
    if (weightKg === 0) continue;

    const weightLb = kgToLb(weightKg);
    lines.push({
      label: station.label,
      weightLb,
      armIn: station.armIn,
      moment1000: moment1000Of(weightLb, station.armIn),
    });
  }

  /* 6 e 7 — Carga por zona e compartimento. */
  for (const position of positions) {
    const weightLb = plan.positionLoads[position.id] ?? 0;
    if (weightLb === 0) continue;

    const armIn = position.armIn;
    if (!isPresent(armIn)) {
      lines.push({ label: position.label, weightLb, armIn: null, moment1000: null });
      unaccounted.push(position.label);
      continue;
    }
    lines.push({
      label: position.label,
      weightLb,
      armIn,
      moment1000: moment1000Of(weightLb, armIn),
    });
  }

  const rampWeightLb = lines.reduce((sum, l) => sum + l.weightLb, 0);
  const rampMoment1000 = lines.reduce((sum, l) => sum + (l.moment1000 ?? 0), 0);

  /* 9 — Desconto do combustível de partida, táxi e cheque.
     O manual subtrai o valor de tabela para esse peso (página 6-55). */
  const taxiLb = profile.model.fuel.taxiFuelLb ?? 0;
  const taxiWeightLb = -Math.min(taxiLb, fuelLb);
  const taxiMoment1000 =
    taxiWeightLb === 0
      ? 0
      : -fuelMoment1000(-taxiWeightLb, profile.model.fuelMoments);

  return ready({
    lines,
    rampWeightLb,
    rampMoment1000,
    taxiWeightLb,
    taxiMoment1000,
    takeoffWeightLb: rampWeightLb + taxiWeightLb,
    takeoffMoment1000: rampMoment1000 + taxiMoment1000,
    unaccounted,
  });
}
