/**
 * Vista lateral: cargo pod, zonas do piso e o centro de gravidade.
 *
 * Mesma régua de estações da vista de cima, e é isso que faz a Zona 3 do piso
 * cair exatamente sobre o Pod C. As cotas vêm da Figura 6-3, folha 2 (página
 * 6-15); o contorno é ilustrativo.
 *
 * É aqui que a carga é lançada — tocar um compartimento seleciona e abre o
 * campo de peso. E é aqui que a marca do CG faz mais sentido: mover carga e ver
 * o traço andar em direção ao limite responde à pergunta na hora, sem precisar
 * traduzir o gráfico de percentual da corda média.
 *
 * O gráfico do envelope continua existindo, na seção Centragem: é a forma em
 * que o manual publica, e é contra ele que se confere o papel.
 */

import type { CgResult } from '../../domain/calc/index.ts';
import { formatLb } from '../../utils/format.ts';
import { percentBetween, percentOfStation } from './stationScale.ts';
import styles from './SideView.module.css';

/** Uma posição de carga desenhada no perfil. */
export interface LoadCell {
  readonly id: string;
  /** Rótulo curto que cabe dentro do compartimento. Ex.: "3", "A". */
  readonly short: string;
  readonly label: string;
  readonly group: 'cabine' | 'pod';
  readonly fromIn: number;
  readonly toIn: number;
  readonly loadedLb: number;
  readonly over: boolean;
}

interface SideViewProps {
  readonly cells: readonly LoadCell[];
  readonly selectedId: string | null;
  readonly onSelect: (positionId: string) => void;
  /** Centragem apurada. `null` enquanto não há peso ou ficha de pesagem. */
  readonly cg: CgResult | null;
}

const STATUS_CLASS: Record<CgResult['status'], string> = {
  ok: styles.cgOk as string,
  'aft-warning': styles.cgWarn as string,
  forward: styles.cgCrit as string,
  aft: styles.cgCrit as string,
};

const STATUS_LABEL: Record<CgResult['status'], string> = {
  ok: 'dentro dos limites',
  'aft-warning': 'na faixa de atenção traseira',
  forward: 'à frente do limite',
  aft: 'atrás do limite',
};

/**
 * Escala AMPLIADA da faixa de centragem.
 *
 * A régua da aeronave cobre 256 polegadas; a faixa de CG inteira tem cerca de
 * 25. Na escala do desenho ela ocuparia menos de um décimo da largura, e uma
 * ultrapassagem de sete polegadas viraria três pixels — um desenho que parece
 * bem justamente quando não está.
 *
 * Por isso a régua de baixo tem escala própria, com uma folga de 8 polegadas
 * de cada lado dos limites, e é rotulada como ampliação. A marca fina sobre a
 * fuselagem continua na escala da aeronave, para mostrar ONDE o CG cai; esta
 * mostra QUANTO falta para o limite.
 */
const ZOOM_MARGIN_IN = 8;

function zoomFraction(valueIn: number, cg: CgResult): number {
  const from = cg.forwardLimitIn - ZOOM_MARGIN_IN;
  const to = cg.aftLimitIn + ZOOM_MARGIN_IN;
  const raw = (valueIn - from) / (to - from);
  return Math.min(Math.max(raw, 0), 1);
}

function zoomPercent(valueIn: number, cg: CgResult): string {
  return `${(zoomFraction(valueIn, cg) * 100).toFixed(3)}%`;
}

function Band({
  cells,
  selectedId,
  onSelect,
  className,
}: {
  readonly cells: readonly LoadCell[];
  readonly selectedId: string | null;
  readonly onSelect: (positionId: string) => void;
  readonly className: string;
}) {
  return (
    <>
      {cells.map((cell) => (
        <button
          key={cell.id}
          type="button"
          className={`${className} ${cell.loadedLb > 0 ? styles.loaded : ''} ${
            cell.over ? styles.over : ''
          } ${selectedId === cell.id ? styles.selected : ''}`}
          style={{
            left: percentOfStation(cell.fromIn),
            width: percentBetween(cell.fromIn, cell.toIn),
          }}
          aria-pressed={cell.loadedLb > 0}
          aria-label={
            cell.loadedLb > 0
              ? `${cell.label}, ${formatLb(cell.loadedLb)} libras`
              : `${cell.label}, vazio`
          }
          onClick={() => onSelect(cell.id)}
        >
          <span className={styles.cellLabel}>
            {cell.loadedLb > 0 ? formatLb(cell.loadedLb) : cell.short}
          </span>
        </button>
      ))}
    </>
  );
}

export function SideView({ cells, selectedId, onSelect, cg }: SideViewProps) {
  const cabin = cells.filter((cell) => cell.group === 'cabine');
  const pod = cells.filter((cell) => cell.group === 'pod');

  return (
    <div className={styles.frame}>
      <div className={styles.fuselage}>
        <Band
          cells={cabin}
          selectedId={selectedId}
          onSelect={onSelect}
          className={styles.zone as string}
        />
        {/* Marca fina na escala da aeronave: mostra onde o CG cai ao longo do
            avião. A margem até o limite se lê na régua ampliada abaixo. */}
        {cg && (
          <div
            className={`${styles.cgTick} ${STATUS_CLASS[cg.status]}`}
            style={{ left: percentOfStation(cg.armIn) }}
            aria-hidden="true"
          />
        )}
      </div>

      {pod.length > 0 && (
        <div className={styles.podShell}>
          <Band
            cells={pod}
            selectedId={selectedId}
            onSelect={onSelect}
            className={styles.pod as string}
          />
        </div>
      )}

      {/* Régua do centro de gravidade, em escala ampliada. */}
      <div className={styles.cgRuler}>
        {cg ? (
          <>
            <span className={styles.cgCaption}>CG · escala ampliada</span>

            <div className={styles.cgTrack}>
              <div
                className={styles.cgRange}
                style={{
                  left: zoomPercent(cg.forwardLimitIn, cg),
                  width: `${
                    (zoomFraction(cg.aftLimitIn, cg) -
                      zoomFraction(cg.forwardLimitIn, cg)) *
                    100
                  }%`,
                }}
              />
              <div
                className={`${styles.cgMark} ${STATUS_CLASS[cg.status]}`}
                style={{ left: zoomPercent(cg.armIn, cg) }}
                role="img"
                aria-label={`Centro de gravidade em ${cg.armIn.toFixed(1)} polegadas, ${STATUS_LABEL[cg.status]}. Faixa permitida de ${cg.forwardLimitIn.toFixed(2)} a ${cg.aftLimitIn.toFixed(2)} polegadas.`}
              >
                <span className={styles.cgValue}>{cg.armIn.toFixed(1)}</span>
              </div>
            </div>

            <div className={styles.cgLimits}>
              <span>{cg.forwardLimitIn.toFixed(2)}</span>
              <span>{cg.aftLimitIn.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <span className={styles.cgEmpty}>
            Centro de gravidade aparece aqui quando houver peso a bordo.
          </span>
        )}
      </div>
    </div>
  );
}
