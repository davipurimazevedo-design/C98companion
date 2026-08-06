/**
 * Cartão de distância — serve à decolagem e ao pouso.
 *
 * Os dois percorrem as mesmas etapas e exibem as mesmas linhas; o que muda é
 * a tabela consultada e, nela, quais velocidades o manual publica. Por isso
 * existe um componente só, e não dois quase iguais.
 *
 * A tabela de resultados mostra as três etapas em vez de só o número final:
 * valor de tabela, efeito do vento e distância corrigida. É o mesmo caminho
 * que o piloto percorre no papel, e permite conferir o aplicativo contra o
 * manual linha a linha.
 *
 * Os valores de eixo efetivamente lidos aparecem em destaque porque a leitura
 * é conservadora: quem informou 8.600 lb precisa ver que a resposta veio da
 * tabela de 8.750.
 */

import type { ReactNode } from 'react';

import {
  describeFailure,
  type PerformanceOutcome,
} from '../../domain/performance/index.ts';
import type {
  ConditionsDraft,
  ConditionsField,
  WindDirectionChoice,
} from '../../store/performanceDraft.ts';
import { Section } from '../../ui/components/Section.tsx';
import { formatFt } from '../../utils/format.ts';
import { ConditionsFields } from './ConditionsFields.tsx';
import { RunwayMargin } from './RunwayMargin.tsx';
import styles from './DistanceCard.module.css';

interface DistanceCardProps {
  readonly title: string;
  /** Controle exibido na linha do título. Hoje, o ajuste de flap. */
  readonly control?: ReactNode;
  readonly conditions: ConditionsDraft;
  readonly outcome: PerformanceOutcome;
  readonly onChangeField: (field: ConditionsField, value: string) => void;
  readonly onChangeWindDirection: (direction: WindDirectionChoice) => void;
}

const INTEGER = new Intl.NumberFormat('pt-BR');

/** "peso, altitude-pressão e temperatura" — com o "e" antes do último. */
const LIST = new Intl.ListFormat('pt-BR', {
  style: 'long',
  type: 'conjunction',
});

/**
 * Valor de eixo lido na tabela. Usa o sinal de menos tipográfico, como o
 * resto do aplicativo — o hífen é estreito demais para uma temperatura
 * negativa não passar batida.
 */
function axisValue(value: number): string {
  return INTEGER.format(value).replace('-', '−');
}

/** Percentual com sinal explícito. Ex.: `-11` → `"−11%"`. */
function signedPct(percent: number): string {
  if (percent === 0) return '0%';
  return percent < 0 ? `−${Math.abs(percent)}%` : `+${percent}%`;
}

/** Pés com sinal explícito, para a linha de efeito do vento. */
function signedFt(feet: number): string {
  if (feet === 0) return '—';
  return feet < 0
    ? `−${formatFt(Math.abs(feet))}`
    : `+${formatFt(feet)}`;
}

export function DistanceCard({
  title,
  control,
  conditions,
  outcome,
  onChangeField,
  onChangeWindDirection,
}: DistanceCardProps) {
  const subtotal =
    outcome.status === 'ready' ? `${formatFt(outcome.value.wind.totalFt)} ft` : '—';

  return (
    <Section
      title={title}
      subtotal={subtotal}
      over={
        outcome.status === 'ready' &&
        outcome.value.margin?.verdict === 'insuficiente'
      }
      {...(control ? { control } : {})}
    >
      <ConditionsFields
        conditions={conditions}
        onChangeField={onChangeField}
        onChangeWindDirection={onChangeWindDirection}
      />

      {outcome.status === 'incomplete' && (
        <p className={styles.pending}>
          Informe{' '}
          {LIST.format(outcome.missing.map((field) => field.toLowerCase()))}{' '}
          para consultar a tabela.
        </p>
      )}

      {outcome.status === 'unavailable' && (
        <p className={styles.failure}>{describeFailure(outcome.failure)}</p>
      )}

      {outcome.status === 'ready' && <Result outcome={outcome.value} />}
    </Section>
  );
}

function Result({
  outcome,
}: {
  readonly outcome: Extract<PerformanceOutcome, { status: 'ready' }>['value'];
}) {
  const { reading, chart, wind, margin, table } = outcome;

  return (
    <>
      <div className={styles.read}>
        <span className={styles.readLabel}>Lido na tabela</span>
        <span className={styles.readValues}>
          {axisValue(reading.weightLb)} lb ·{' '}
          {axisValue(reading.pressureAltitudeFt)} ft ·{' '}
          {axisValue(reading.temperatureC)} °C
        </span>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.rowHead}>
              Distância
            </th>
            <th scope="col">Corrida no solo</th>
            <th scope="col">Para 50 ft</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={styles.rowHead}>
              Tabela
            </th>
            <td>{formatFt(chart.groundRollFt)}</td>
            <td>{formatFt(chart.totalFt)}</td>
          </tr>
          <tr>
            <th scope="row" className={styles.rowHead}>
              {wind.direction === 'nenhum' ? (
                'Vento zero'
              ) : (
                <>
                  Vento de {wind.direction}{' '}
                  <span className={styles.pct}>{signedPct(wind.percent)}</span>
                </>
              )}
            </th>
            <td>{signedFt(wind.groundRollDeltaFt)}</td>
            <td>{signedFt(wind.totalDeltaFt)}</td>
          </tr>
          <tr className={styles.total}>
            <th scope="row" className={styles.rowHead}>
              Corrigida
            </th>
            <td>{formatFt(wind.groundRollFt)}</td>
            <td>{formatFt(wind.totalFt)}</td>
          </tr>
        </tbody>
      </table>

      <p className={styles.speeds}>
        {reading.liftOffKias !== null && (
          <>
            Rotação <strong>{reading.liftOffKias} KIAS</strong> ·{' '}
          </>
        )}
        Aos 50 pés <strong>{reading.at50FtKias} KIAS</strong>
      </p>

      {reading.aboveTopTemperature && (
        <p className={styles.note}>{reading.aboveTopTemperature.note}</p>
      )}

      {margin && <RunwayMargin margin={margin} />}

      <p className={styles.source}>
        Figura {table.figure}, {table.pages.length > 1 ? 'páginas' : 'página'}{' '}
        {table.pages.join(' e ')}. Valores lidos no próximo peso, altitude e
        temperatura acima dos informados, como o manual determina.
      </p>
    </>
  );
}
