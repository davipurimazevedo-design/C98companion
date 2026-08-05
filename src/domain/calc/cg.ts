/**
 * Centro de gravidade.
 *
 * Segunda parte do módulo de centragem. Recebe peso e momento já apurados e
 * responde onde o CG cai e se está dentro dos limites da Seção 2.
 *
 * Trabalha em polegadas atrás do datum, que é a unidade em que o manual declara
 * os limites. O percentual da corda média (% MAC) é derivado, para conferência
 * contra o manifesto, mas não é a grandeza verificada.
 */

import { C98_CG, type CgLimitPoint } from '../../data/aircraft/c98.cg.ts';

export type CgStatus =
  /** Dentro dos limites, com folga da faixa de advertência. */
  | 'ok'
  /** Dentro dos limites, mas na área hachurada traseira do manual. */
  | 'aft-warning'
  /** À frente do limite dianteiro. */
  | 'forward'
  /** Atrás do limite traseiro. */
  | 'aft';

export interface CgResult {
  /** Posição do CG, em polegadas atrás do datum. */
  readonly armIn: number;
  /** A mesma posição, em percentual da corda média aerodinâmica. */
  readonly pctMac: number;
  /** Limite dianteiro aplicável a este peso. */
  readonly forwardLimitIn: number;
  /** Limite traseiro aplicável a este peso. */
  readonly aftLimitIn: number;
  readonly status: CgStatus;
  /** Quanto passou do limite, em polegadas. Zero quando dentro. */
  readonly exceededByIn: number;
}

/**
 * Limite dianteiro para um dado peso.
 *
 * O manual descreve o limite como retas entre pontos publicados. Abaixo do
 * primeiro ponto o limite é constante; acima do último, mantém-se o do último —
 * situação que só ocorre acima do peso máximo de decolagem, quando o problema
 * já é outro.
 */
export function forwardLimitAt(
  weightLb: number,
  points: readonly CgLimitPoint[] = C98_CG.forwardLimit,
): number {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return 0;

  if (weightLb <= first.weightLb) return first.armIn;
  if (weightLb >= last.weightLb) return last.armIn;

  for (let i = 1; i < points.length; i += 1) {
    const lower = points[i - 1];
    const upper = points[i];
    if (!lower || !upper) continue;
    if (weightLb <= upper.weightLb) {
      const span = upper.weightLb - lower.weightLb;
      if (span === 0) return upper.armIn;
      const ratio = (weightLb - lower.weightLb) / span;
      return lower.armIn + ratio * (upper.armIn - lower.armIn);
    }
  }

  return last.armIn;
}

/** Converte uma posição em polegadas para percentual da corda média. */
export function toPctMac(armIn: number): number {
  return ((armIn - C98_CG.macLeadingEdgeIn) / C98_CG.macLengthIn) * 100;
}

/** Um vértice do envelope, na forma em que o gráfico o desenha. */
export interface EnvelopePoint {
  readonly weightLb: number;
  readonly armIn: number;
  readonly pctMac: number;
}

/** Faixa de pesos desenhada no gráfico, seguindo a Figura 6-18 do manual. */
export const ENVELOPE_WEIGHT_RANGE = { minLb: 4000, maxLb: 8750 } as const;

/**
 * Vértices do envelope, em ordem de desenho: sobe pelo limite dianteiro e
 * desce pelo traseiro, fechando o polígono.
 *
 * Deriva dos mesmos pontos publicados que a verificação usa — o desenho e o
 * alerta não podem divergir.
 */
export function envelopePolygon(): readonly EnvelopePoint[] {
  const at = (weightLb: number, armIn: number): EnvelopePoint => ({
    weightLb,
    armIn,
    pctMac: toPctMac(armIn),
  });

  const { minLb, maxLb } = ENVELOPE_WEIGHT_RANGE;

  const forward: EnvelopePoint[] = [at(minLb, forwardLimitAt(minLb))];
  for (const point of C98_CG.forwardLimit) {
    if (point.weightLb > minLb && point.weightLb <= maxLb) {
      forward.push(at(point.weightLb, point.armIn));
    }
  }

  /* Volta pelo limite traseiro, que é constante em todos os pesos. */
  return [
    ...forward,
    at(maxLb, C98_CG.aftLimitIn),
    at(minLb, C98_CG.aftLimitIn),
  ];
}

/**
 * Calcula o CG e o classifica contra os limites.
 *
 * @param weightLb    Peso total da aeronave.
 * @param moment1000  Momento total dividido por 1000, como o manual publica.
 */
export function computeCg(weightLb: number, moment1000: number): CgResult | null {
  /* Sem peso não há centro de gravidade definido. */
  if (weightLb <= 0) return null;

  const armIn = (moment1000 * 1000) / weightLb;
  const forwardLimitIn = forwardLimitAt(weightLb);
  const aftLimitIn = C98_CG.aftLimitIn;
  const pctMac = toPctMac(armIn);

  let status: CgStatus = 'ok';
  let exceededByIn = 0;

  if (armIn < forwardLimitIn) {
    status = 'forward';
    exceededByIn = forwardLimitIn - armIn;
  } else if (armIn > aftLimitIn) {
    status = 'aft';
    exceededByIn = armIn - aftLimitIn;
  } else if (pctMac >= C98_CG.aftWarningPctMac) {
    status = 'aft-warning';
  }

  return { armIn, pctMac, forwardLimitIn, aftLimitIn, status, exceededByIn };
}
