/**
 * Barra fixa no topo.
 *
 * Acompanha a rolagem para que a resposta — matrícula, peso total, percentual e
 * cor da situação — nunca saia da vista enquanto o piloto preenche os campos
 * mais abaixo.
 */

import type { SituationLevel } from '../../domain/calc/index.ts';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  readonly tail: string;
  readonly level: SituationLevel;
  /** Peso total já formatado, ou o traço quando ainda pendente. */
  readonly total: string;
  readonly percent: string;
  /** Preenchimento da barra de progresso, de 0 a 100. */
  readonly progress: number;
}

const LEVEL_CLASS: Record<SituationLevel, string> = {
  ok: styles.ok as string,
  warn: styles.warn as string,
  crit: styles.crit as string,
  pending: styles.pending as string,
};

const LEVEL_TEXT: Record<SituationLevel, string> = {
  ok: 'Dentro dos limites',
  warn: 'Atenção',
  crit: 'Fora dos limites',
  pending: 'Aguardando dados do manual',
};

export function StatusBar({
  tail,
  level,
  total,
  percent,
  progress,
}: StatusBarProps) {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.bar} ${LEVEL_CLASS[level]}`}>
        <span className={styles.dot} role="img" aria-label={LEVEL_TEXT[level]} />
        <span className={styles.tail}>{tail}</span>
        <span className={styles.metrics}>
          <span className={styles.total}>
            {total}
            <span className={styles.unit}>LB</span>
          </span>
          <span className={styles.percent}>{percent}</span>
        </span>
      </div>
      <div className={`${styles.track} ${LEVEL_CLASS[level]}`}>
        <i
          className={styles.fill}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
