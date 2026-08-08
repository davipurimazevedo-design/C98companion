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
 *
 * As distâncias são exibidas em METROS, que é a unidade das cartas e do
 * comprimento de pista publicado. O manual publica em pés, e é em pés que o
 * cálculo inteiro acontece — a conversão é só de exibição, no último passo.
 */

import {
  describeFailure,
  type PerformanceOutcome,
} from '../../domain/performance/index.ts';
import type {
  ConditionsDraft,
  ConditionsField,
  WindDirectionChoice,
} from '../../store/performanceDraft.ts';
import { feetToMetres } from '../../data/conversion.ts';
import { Section } from '../../ui/components/Section.tsx';
import { formatInteger } from '../../utils/format.ts';
import { ConditionsFields } from './ConditionsFields.tsx';
import { RunwayMargin } from './RunwayMargin.tsx';
import styles from './DistanceCard.module.css';

interface DistanceCardProps {
  readonly title: string;
  /** Explica qual peso este cartão espera. */
  readonly weightHint: string;
  readonly conditions: ConditionsDraft;
  readonly outcome: PerformanceOutcome;
  readonly onChangeField: (field: ConditionsField, value: string) => void;
  readonly onChangeWindDirection: (direction: WindDirectionChoice) => void;
}

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
  return formatInteger(value).replace('-', '−');
}

/** Percentual com sinal explícito. Ex.: `-11` → `"−11%"`. */
function signedPct(percent: number): string {
  if (percent === 0) return '0%';
  return percent < 0 ? `−${Math.abs(percent)}%` : `+${percent}%`;
}

/** Distância em metros inteiros, a partir dos pés do manual. */
function metres(feet: number): number {
  return Math.round(feetToMetres(feet));
}

/**
 * A variação do vento, em metros, com sinal explícito.
 *
 * É a DIFERENÇA entre os dois valores exibidos, e não a conversão do desconto
 * em pés. Convertendo e arredondando cada linha por conta própria, a coluna
 * podia não fechar por um metro — e quem confere somando à mão veria um erro
 * onde não há.
 */
function windDelta(fromMetres: number, toMetres: number): string {
  const delta = toMetres - fromMetres;
  if (delta === 0) return '—';
  return delta < 0
    ? `−${formatInteger(-delta)}`
    : `+${formatInteger(delta)}`;
}

export function DistanceCard({
  title,
  weightHint,
  conditions,
  outcome,
  onChangeField,
  onChangeWindDirection,
}: DistanceCardProps) {
  /* A corrida no solo, e não a distância para 50 pés: é o número que a
     margem de pista compara, e cabeçalho e veredito têm que falar do mesmo. */
  const subtotal =
    outcome.status === 'ready'
      ? `${formatInteger(metres(outcome.value.wind.groundRollFt))} m`
      : '—';

  return (
    <Section
      title={title}
      subtotal={subtotal}
      over={
        outcome.status === 'ready' &&
        outcome.value.margin?.verdict === 'insuficiente'
      }
    >
      <ConditionsFields
        conditions={conditions}
        weightHint={weightHint}
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

  /* Os quatro números exibidos, em metros inteiros. As duas pontas são a
     conversão fiel do que o manual publica; a linha do meio é a diferença
     entre elas, para que a coluna feche somada à mão. */
  const tabela = {
    solo: metres(chart.groundRollFt),
    total: metres(chart.totalFt),
  };
  const corrigida = {
    solo: metres(wind.groundRollFt),
    total: metres(wind.totalFt),
  };

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
            {/* A unidade no cabeçalho, e não repetida em cada célula: é a
                mesma convenção da conferência de carregamento. */}
            <th scope="col">
              Corrida no solo <span className={styles.unit}>(m)</span>
            </th>
            <th scope="col">
              Para 50 ft <span className={styles.unit}>(m)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={styles.rowHead}>
              Tabela
            </th>
            <td>{formatInteger(tabela.solo)}</td>
            <td>{formatInteger(tabela.total)}</td>
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
            <td>{windDelta(tabela.solo, corrigida.solo)}</td>
            <td>{windDelta(tabela.total, corrigida.total)}</td>
          </tr>
          <tr className={styles.total}>
            <th scope="row" className={styles.rowHead}>
              Corrigida
            </th>
            <td>{formatInteger(corrigida.solo)}</td>
            <td>{formatInteger(corrigida.total)}</td>
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
