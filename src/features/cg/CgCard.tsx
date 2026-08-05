/**
 * Centragem: leitura numérica e envelope desenhado.
 *
 * O gráfico segue a Figura 6-18 do manual — percentual da corda média no eixo
 * horizontal, peso no vertical — porque é a forma em que os limites são
 * publicados e a que se lê mais direto: quanto mais à direita o ponto, mais
 * traseiro o centro de gravidade.
 *
 * O polígono vem da mesma função que o alerta usa. Desenho e verificação não
 * podem divergir: um gráfico que mostrasse o ponto dentro enquanto o alerta diz
 * fora seria pior do que não ter gráfico.
 */

import {
  ENVELOPE_WEIGHT_RANGE,
  envelopePolygon,
  type CgResult,
} from '../../domain/calc/index.ts';
import { DASH, formatLb } from '../../utils/format.ts';
import styles from './CgCard.module.css';

interface CgCardProps {
  readonly cg: CgResult | null;
  /** Peso de decolagem, para posicionar o ponto. */
  readonly takeoffWeightLb: number | null;
  /** Motivo de a centragem não estar disponível, quando for o caso. */
  readonly missing: readonly string[];
}

/* Área útil do desenho, em unidades do viewBox. */
const VIEW = { w: 320, h: 240 };
const PAD = { left: 34, right: 10, top: 12, bottom: 26 };
const PLOT = {
  w: VIEW.w - PAD.left - PAD.right,
  h: VIEW.h - PAD.top - PAD.bottom,
};

/* Faixa do eixo horizontal, em % da corda média. */
const MAC_MIN = 0;
const MAC_MAX = 45;

const xOf = (pctMac: number) =>
  PAD.left + ((pctMac - MAC_MIN) / (MAC_MAX - MAC_MIN)) * PLOT.w;

const yOf = (weightLb: number) => {
  const { minLb, maxLb } = ENVELOPE_WEIGHT_RANGE;
  const ratio = (weightLb - minLb) / (maxLb - minLb);
  return PAD.top + (1 - ratio) * PLOT.h;
};

type Direction = 'right' | 'left' | 'up' | 'down';

/** Triângulo de 10 px apontando para fora do gráfico. */
function arrowPoints(x: number, y: number, direction: Direction): string {
  const a = 5;
  if (direction === 'right')
    return `${x - a},${y - a} ${x + a},${y} ${x - a},${y + a}`;
  if (direction === 'left')
    return `${x + a},${y - a} ${x - a},${y} ${x + a},${y + a}`;
  if (direction === 'up')
    return `${x - a},${y + a} ${x},${y - a} ${x + a},${y + a}`;
  return `${x - a},${y - a} ${x},${y + a} ${x + a},${y - a}`;
}

/**
 * Onde desenhar o ponto, preso às bordas quando o carregamento sai da escala.
 *
 * Um CG muito traseiro cai fora do eixo, e um ponto simplesmente ausente faria
 * o gráfico parecer tranquilo justamente no pior caso. Preso na borda, com
 * seta, ele continua dizendo a verdade.
 */
function markerAt(pctMac: number, weightLb: number) {
  const rawX = xOf(pctMac);
  const rawY = yOf(weightLb);
  const x = Math.min(Math.max(rawX, PAD.left), VIEW.w - PAD.right);
  const y = Math.min(Math.max(rawY, PAD.top), VIEW.h - PAD.bottom);

  let direction: Direction = 'right';
  if (rawX > x) direction = 'right';
  else if (rawX < x) direction = 'left';
  else if (rawY < y) direction = 'up';
  else if (rawY > y) direction = 'down';

  return { x, y, direction, offScale: rawX !== x || rawY !== y };
}

const STATUS_LABEL: Record<CgResult['status'], string> = {
  ok: 'Dentro dos limites',
  'aft-warning': 'Faixa de atenção traseira',
  forward: 'À frente do limite',
  aft: 'Atrás do limite',
};

export function CgCard({ cg, takeoffWeightLb, missing }: CgCardProps) {
  const polygon = envelopePolygon();
  const points = polygon
    .map((p) => `${xOf(p.pctMac).toFixed(1)},${yOf(p.weightLb).toFixed(1)}`)
    .join(' ');

  /* Faixa de atenção do manual: 38,33% a 40,33% da MAC. */
  const warnLeft = xOf(38.33);
  const warnRight = xOf(40.33);

  const marker =
    cg && takeoffWeightLb !== null
      ? markerAt(cg.pctMac, takeoffWeightLb)
      : null;

  const weightTicks = [4000, 5000, 6000, 7000, 8000, 8750];
  const macTicks = [0, 10, 20, 30, 40];

  const statusClass =
    cg === null
      ? styles.pending
      : cg.status === 'ok'
        ? styles.ok
        : cg.status === 'aft-warning'
          ? styles.warn
          : styles.crit;

  return (
    <section className={styles.card} aria-label="Centragem">
      <header className={styles.header}>
        <h2 className={styles.title}>Centragem</h2>
        {cg && (
          <span className={`${styles.badge} ${statusClass}`}>
            {STATUS_LABEL[cg.status]}
          </span>
        )}
      </header>

      <dl className={styles.readouts}>
        <div>
          <dt>CG</dt>
          <dd>
            {cg === null ? DASH : cg.armIn.toFixed(1)}
            {cg && <span className={styles.unit}>pol</span>}
          </dd>
        </div>
        <div>
          <dt>% MAC</dt>
          <dd>
            {cg === null ? DASH : cg.pctMac.toFixed(1)}
            {cg && <span className={styles.unit}>%</span>}
          </dd>
        </div>
        <div>
          <dt>Limite dianteiro</dt>
          <dd>
            {cg === null ? DASH : cg.forwardLimitIn.toFixed(2)}
            {cg && <span className={styles.unit}>pol</span>}
          </dd>
        </div>
        <div>
          <dt>Limite traseiro</dt>
          <dd>
            {cg === null ? DASH : cg.aftLimitIn.toFixed(2)}
            {cg && <span className={styles.unit}>pol</span>}
          </dd>
        </div>
      </dl>

      <div className={styles.chartWrap}>
        <svg
          className={styles.chart}
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          role="img"
          aria-label={
            cg === null
              ? 'Envelope de centragem. Posição do centro de gravidade indisponível.'
              : `Envelope de centragem. Centro de gravidade em ${cg.pctMac.toFixed(1)} por cento da corda média, ${STATUS_LABEL[cg.status]}.` +
                (marker?.offScale ? ' Fora da escala do gráfico.' : '')
          }
        >
          {/* grade horizontal e rótulos de peso */}
          {weightTicks.map((w) => (
            <g key={w}>
              <line
                className={styles.grid}
                x1={PAD.left}
                x2={VIEW.w - PAD.right}
                y1={yOf(w)}
                y2={yOf(w)}
              />
              <text className={styles.axis} x={PAD.left - 5} y={yOf(w) + 3} textAnchor="end">
                {formatLb(w)}
              </text>
            </g>
          ))}

          {/* rótulos de % MAC */}
          {macTicks.map((m) => (
            <text
              key={m}
              className={styles.axis}
              x={xOf(m)}
              y={VIEW.h - 10}
              textAnchor="middle"
            >
              {m}%
            </text>
          ))}

          {/* faixa de atenção traseira */}
          <rect
            className={styles.warnBand}
            x={warnLeft}
            y={PAD.top}
            width={warnRight - warnLeft}
            height={PLOT.h}
          />

          {/* envelope */}
          <polygon className={styles.envelope} points={points} />

          {/* ponto do carregamento */}
          {marker && (
            <g>
              <line
                className={styles.crosshair}
                x1={PAD.left}
                x2={marker.x}
                y1={marker.y}
                y2={marker.y}
              />
              {marker.offScale ? (
                /* Fora da escala: seta na borda apontando para onde o ponto
                   caiu. Um ponto simplesmente ausente faria o gráfico parecer
                   que não há problema, justamente quando há o maior deles. */
                <polygon
                  className={`${styles.point} ${statusClass}`}
                  points={arrowPoints(marker.x, marker.y, marker.direction)}
                />
              ) : (
                <circle
                  className={`${styles.point} ${statusClass}`}
                  cx={marker.x}
                  cy={marker.y}
                  r={5}
                />
              )}
            </g>
          )}
        </svg>
      </div>

      {cg === null && (
        <p className={styles.note}>
          {missing.length > 0
            ? `Aguardando ${missing.join(', ').toLowerCase()} da ficha de pesagem da aeronave.`
            : 'Centragem indisponível.'}
        </p>
      )}
    </section>
  );
}
