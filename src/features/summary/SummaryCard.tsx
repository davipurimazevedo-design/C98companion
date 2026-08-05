/**
 * Cartão de resumo — o principal destaque da tela.
 *
 * Ordem deliberada: primeiro o que foi embarcado, depois o peso total, depois o
 * que ainda cabe, e por último o veredito em destaque. O piloto que só olhar as
 * duas últimas linhas já tem a resposta.
 */

import {
  isReady,
  type PlanResult,
} from '../../domain/calc/index.ts';
import { DASH, formatLb, formatSignedLb } from '../../utils/format.ts';
import styles from './SummaryCard.module.css';

const LEVEL_CLASS = {
  ok: styles.ok as string,
  warn: styles.warn as string,
  crit: styles.crit as string,
  pending: styles.pending as string,
};

const LEVEL_ICON = {
  ok: '✅',
  warn: '🟡',
  crit: '🔴',
  pending: '⏳',
};

function Row({
  icon,
  label,
  value,
  strong = false,
}: {
  readonly icon: string;
  readonly label: string;
  readonly value: string;
  readonly strong?: boolean;
}) {
  return (
    <div className={`${styles.row} ${strong ? styles.rowStrong : ''}`}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {value}
        {value !== DASH && <span className={styles.unit}>LB</span>}
      </span>
    </div>
  );
}

export function SummaryCard({ result }: { readonly result: PlanResult }) {
  const { totals, availability, additionalFuel, verdict, level } = result;

  const totalWeight = isReady(availability)
    ? formatLb(availability.value.totalWeightLb)
    : DASH;

  const available = isReady(availability)
    ? formatSignedLb(availability.value.availableLb)
    : DASH;

  const extraFuel = isReady(additionalFuel)
    ? formatLb(additionalFuel.value)
    : DASH;

  return (
    <section className={styles.card} aria-label="Resumo">
      <header className={styles.header}>
        <h2 className={styles.title}>Resumo</h2>
      </header>

      <div className={styles.rows}>
        <Row icon="👨‍✈️" label="Tripulação" value={formatLb(totals.crewLb)} />
        <Row icon="👥" label="Passageiros" value={formatLb(totals.passengerLb)} />
        <Row icon="📦" label="Carga" value={formatLb(totals.cargoLb)} />
        <Row icon="⛽" label="Combustível" value={formatLb(totals.fuelLb)} />
        <Row icon="✈️" label="Peso total da aeronave" value={totalWeight} strong />
        <Row icon="⚖️" label="Peso disponível restante" value={available} />
        <Row icon="⛽" label="Combustível adicional possível" value={extraFuel} />
      </div>

      <div className={`${styles.verdict} ${LEVEL_CLASS[level]}`}>
        <span className={styles.verdictIcon} aria-hidden="true">
          {LEVEL_ICON[level]}
        </span>
        <span className={styles.verdictText}>
          <strong className={styles.headline}>{verdict.headline}</strong>
          {verdict.notes.map((note) => (
            <span key={note} className={styles.note}>
              {note}
            </span>
          ))}
          <span className={styles.detail}>{verdict.detail}</span>
        </span>
      </div>
    </section>
  );
}
