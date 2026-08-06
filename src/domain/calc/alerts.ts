/**
 * Alertas exibidos ao piloto.
 *
 * Todo alerta explica o motivo com números, nunca apenas "fora dos limites".
 * O texto mora no domínio, e não na interface, porque a redação faz parte da
 * regra: dizer *quanto* excedeu é tão importante quanto dizer *que* excedeu.
 */

import { formatLb } from '../../utils/format.ts';
import type { Availability } from './availability.ts';
import type { CgResult } from './cg.ts';
import type { LimitCheck, LimitReport } from './limits.ts';
import type { Outcome } from './outcome.ts';

export type AlertLevel = 'ok' | 'warn' | 'crit';

export interface Alert {
  readonly id: string;
  readonly level: AlertLevel;
  readonly title: string;
  readonly detail: string;
}

/** Texto específico de cada limite ultrapassado. */
function describeExceeded(check: LimitCheck): Alert {
  const actual = formatLb(check.actualLb ?? 0);
  const limit = formatLb(check.limitLb ?? 0);
  const excess = formatLb(check.exceededByLb);

  if (check.id === 'fuel-capacity') {
    return {
      id: check.id,
      level: 'crit',
      title: 'Capacidade de combustível excedida',
      detail: `Informado ${actual} LB, capacidade utilizável de ${limit} LB.`,
    };
  }

  if (check.id.startsWith('position:')) {
    return {
      id: check.id,
      level: 'crit',
      title: `${check.label} acima do limite`,
      detail: `${actual} LB lançados, máximo de ${limit} LB. Excesso de ${excess} LB.`,
    };
  }

  if (check.id === 'cabin-cargo' || check.id === 'pod-cargo') {
    const onde = check.id === 'cabin-cargo' ? 'da cabine' : 'do cargo pod';
    return {
      id: check.id,
      level: 'crit',
      title: `Carga ${onde} acima do limite`,
      detail: `${actual} LB no total, máximo de ${limit} LB. Excesso de ${excess} LB.`,
    };
  }

  /* Genérico. A frase evita concordância de gênero com o rótulo. */
  return {
    id: check.id,
    level: 'crit',
    title: `Limite excedido: ${check.label.toLowerCase()}`,
    detail: `Apurado ${actual} LB contra limite de ${limit} LB. Excesso de ${excess} LB.`,
  };
}

interface AlertInput {
  readonly availability: Outcome<Availability>;
  readonly limits: LimitReport;
  /** Dados ainda não cadastrados para esta aeronave. */
  readonly missingData: readonly string[];
  /** Passageiros além dos assentos disponíveis. */
  readonly seatOverflow: number;
  /** Assentos disponíveis para passageiro — descontados os da tripulação extra. */
  readonly seats: number;
  /** Centragem apurada. `null` enquanto o momento básico não estiver cadastrado. */
  readonly cg: CgResult | null;
}

/** Alerta de centragem, quando há o que dizer sobre ela. */
function cgAlert(cg: CgResult): Alert | null {
  const posicao = `CG em ${cg.armIn.toFixed(1)} pol (${cg.pctMac.toFixed(1)}% MAC)`;

  if (cg.status === 'forward') {
    return {
      id: 'cg',
      level: 'crit',
      title: 'Centro de gravidade à frente do limite',
      detail:
        `${posicao}, contra limite dianteiro de ${cg.forwardLimitIn.toFixed(2)} pol ` +
        `para este peso. Excede em ${cg.exceededByIn.toFixed(1)} pol. ` +
        'Desloque carga para trás.',
    };
  }

  if (cg.status === 'aft') {
    return {
      id: 'cg',
      level: 'crit',
      title: 'Centro de gravidade atrás do limite',
      detail:
        `${posicao}, contra limite traseiro de ${cg.aftLimitIn.toFixed(2)} pol. ` +
        `Excede em ${cg.exceededByIn.toFixed(1)} pol. Desloque carga para a frente.`,
    };
  }

  if (cg.status === 'aft-warning') {
    return {
      id: 'cg',
      level: 'warn',
      title: 'Centragem na faixa de atenção traseira',
      detail:
        `${posicao}, dentro dos limites mas na área que o manual marca entre ` +
        '38,33% e 40,33% da MAC. Só aceite este carregamento com determinação ' +
        'precisa do centro de gravidade.',
    };
  }

  return null;
}

/** Monta a lista de alertas, do mais grave para o menos grave. */
export function buildAlerts({
  availability,
  limits,
  missingData,
  seatOverflow,
  seats,
  cg,
}: AlertInput): Alert[] {
  const alerts: Alert[] = limits.exceeded.map(describeExceeded);

  const centragem = cg === null ? null : cgAlert(cg);
  if (centragem) alerts.push(centragem);

  if (seatOverflow > 0) {
    alerts.push({
      id: 'seats',
      level: 'crit',
      title: 'Passageiros acima dos assentos disponíveis',
      detail:
        `${seatOverflow} ${seatOverflow === 1 ? 'passageiro' : 'passageiros'} ` +
        `sem assento. A aeronave tem ${seats} lugares de passageiro.`,
    });
  }

  /* Confirmação positiva só faz sentido quando nada foi ultrapassado. */
  if (
    alerts.length === 0 &&
    availability.status === 'ready' &&
    !availability.value.isExceeded
  ) {
    const { availableLb, usedPct } = availability.value;
    alerts.push({
      id: 'within-limits',
      level: 'ok',
      title: 'Dentro dos limites',
      detail:
        `Restam ${formatLb(availableLb)} LB até o peso máximo ` +
        `(${Math.round(usedPct)}% utilizado).`,
    });
  }

  if (missingData.length > 0) {
    alerts.push({
      id: 'missing-data',
      level: 'warn',
      title: 'Dados não cadastrados',
      detail:
        `Aguardando ${missingData.length} ` +
        `${missingData.length === 1 ? 'campo' : 'campos'}: ` +
        `${missingData.join(', ')}.`,
    });
  }

  return alerts;
}
