/**
 * Mapa da cabine, visto de cima.
 *
 * Desenho fiel à planta da Figura 6-3, folha 2 (página 6-15): nariz à esquerda,
 * cauda à direita, e tudo posicionado pela estação em polegadas. O contorno é
 * ilustrativo; as COTAS é que são do manual.
 *
 * Só assentos. As zonas de carga do piso pertencem à seção Carga, que tem o
 * próprio desenho — repeti-las aqui competia com os assentos numa tela em que
 * o que se decide é onde as pessoas sentam.
 */

import { CREW_ARM_IN } from '../../data/aircraft/c98.arms.ts';
import type { SeatSlot } from '../../domain/calc/index.ts';
import { SeatButton } from './SeatButton.tsx';
import { percentOfStation } from './stationScale.ts';
import styles from './TopView.module.css';

/** Um lugar da tripulação, para desenhar os assentos 1 e 2. */
export interface CrewSeatCell {
  readonly label: string;
  readonly weightKg: number;
}

interface TopViewProps {
  readonly seats: readonly SeatSlot[];
  /** Peso lançado em cada assento, em quilogramas. */
  readonly weightsKg: Readonly<Record<string, number>>;
  readonly selectedSeatId: string | null;
  readonly onSelectSeat: (seatId: string) => void;
  /** Piloto e copiloto, nesta ordem. */
  readonly crew: readonly CrewSeatCell[];
  /** Leva à seção Tripulação ao tocar um dos assentos dianteiros. */
  readonly onSelectCrew: () => void;
}

/**
 * Faixas laterais do desenho, em porcentagem da altura do contorno.
 *
 * A 2720 leva dois assentos à direita e um à esquerda em cada fileira, com o
 * corredor entre eles. A ordem lateral DENTRO de um par — qual fica na janela e
 * qual fica no corredor — é escolha de desenho: o manual publica um braço só
 * para o par, e a posição lateral não entra em cálculo nenhum.
 */
const ROW = {
  direitaJanela: '18%',
  direitaCorredor: '46%',
  esquerda: '81%',
} as const;

/** Assentos dianteiros: simétricos em torno do eixo, como na planta. */
const CREW_ROW = ['28%', '72%'] as const;

function rowOf(seat: SeatSlot, indexWithinSide: number): string {
  if (seat.side === 'esquerda') return ROW.esquerda;
  return indexWithinSide === 0 ? ROW.direitaJanela : ROW.direitaCorredor;
}

export function TopView({
  seats,
  weightsKg,
  selectedSeatId,
  onSelectSeat,
  crew,
  onSelectCrew,
}: TopViewProps) {
  /* Quantos assentos já foram desenhados na mesma estação e do mesmo lado —
     é o que decide se este vai na janela ou no corredor. */
  const seen = new Map<string, number>();

  return (
    <div className={styles.frame}>
      {/* O convés é o próprio contorno da cabine, e é contra ELE que as
          faixas laterais dos assentos são medidas. */}
      <div className={styles.deck}>
        {crew.slice(0, 2).map((member, index) => (
          <button
            key={member.label}
            type="button"
            className={`${styles.crewSeat} ${
              member.weightKg > 0 ? styles.crewOccupied : ''
            }`}
            style={{
              left: percentOfStation(CREW_ARM_IN),
              top: CREW_ROW[index] ?? CREW_ROW[0],
            }}
            aria-label={`${member.label}, lançado na seção Tripulação`}
            onClick={onSelectCrew}
          >
            {index + 1}
          </button>
        ))}

        {seats.map((seat) => {
          const key = `${seat.stationId}:${seat.side ?? '?'}`;
          const index = seen.get(key) ?? 0;
          seen.set(key, index + 1);

          return (
            <SeatButton
              key={seat.id}
              label={seat.label}
              number={seat.number}
              weightKg={weightsKg[seat.id] ?? 0}
              selected={selectedSeatId === seat.id}
              style={{
                left: percentOfStation(seat.armIn),
                top: rowOf(seat, index),
              }}
              onClick={() => onSelectSeat(seat.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
