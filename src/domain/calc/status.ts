/**
 * Situação geral da aeronave — o semáforo.
 *
 * Combina a disponibilidade de peso com todas as verificações de limite num
 * único nível, que a interface traduz em cor.
 */

import type { AircraftProfile } from '../../data/aircraft/types.ts';
import { isPresent } from '../../data/pending.ts';
import type { Availability } from './availability.ts';
import type { LimitReport } from './limits.ts';
import type { Outcome } from './outcome.ts';

export type SituationLevel =
  /** Dentro dos limites. */
  | 'ok'
  /** Atenção: margem estreita. */
  | 'warn'
  /** Fora dos limites. */
  | 'crit'
  /** Não é possível afirmar: faltam dados do manual. */
  | 'pending';

/**
 * Deriva o nível da situação.
 *
 * Um limite ultrapassado manda em tudo: mesmo com dados pendentes, se alguma
 * verificação já pôde ser feita e falhou, a situação é crítica. É mais seguro
 * gritar com informação parcial do que silenciar por falta de cadastro.
 *
 * O nível amarelo depende do `warningThresholdPct` estar cadastrado. Sem ele o
 * sistema distingue apenas dentro e fora dos limites.
 */
export function deriveSituation(
  availability: Outcome<Availability>,
  limits: LimitReport,
  profile: AircraftProfile,
): SituationLevel {
  if (limits.hasExceeded) return 'crit';
  if (availability.status === 'pending') return 'pending';

  const threshold = profile.model.limits.warningThresholdPct;
  if (isPresent(threshold) && availability.value.usedPct >= threshold) {
    return 'warn';
  }

  return 'ok';
}
