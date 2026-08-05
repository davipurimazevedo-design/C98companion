/**
 * Lista de alertas.
 *
 * Todo alerta traz o motivo com números. O ícone repete a informação que a cor
 * já dá, para que a leitura não dependa de distinguir verde de vermelho.
 */

import type { Alert, AlertLevel } from '../../domain/calc/index.ts';
import styles from './AlertList.module.css';

const LEVEL_CLASS: Record<AlertLevel, string> = {
  ok: styles.ok as string,
  warn: styles.warn as string,
  crit: styles.crit as string,
};

const LEVEL_ICON: Record<AlertLevel, string> = {
  ok: '🟢',
  warn: '🟡',
  crit: '🔴',
};

export function AlertList({ alerts }: { readonly alerts: readonly Alert[] }) {
  if (alerts.length === 0) return null;

  return (
    <section className={styles.list} aria-label="Alertas">
      {alerts.map((alert) => (
        <div key={alert.id} className={`${styles.alert} ${LEVEL_CLASS[alert.level]}`}>
          <span className={styles.icon} aria-hidden="true">
            {LEVEL_ICON[alert.level]}
          </span>
          <span className={styles.text}>
            <strong className={styles.title}>{alert.title}</strong>
            <span className={styles.detail}>{alert.detail}</span>
          </span>
        </div>
      ))}
    </section>
  );
}
