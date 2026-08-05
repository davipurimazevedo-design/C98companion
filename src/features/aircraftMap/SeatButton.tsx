/**
 * Um assento no mapa da cabine.
 *
 * Botão de verdade, e não um círculo de SVG: assim ganha foco visível,
 * navegação por teclado e leitura por voz sem nenhum trabalho extra. Num
 * aplicativo que se usa de luva no pátio, o alvo de toque também importa mais
 * do que o desenho — daí a área de toque estendida além do círculo.
 */

import type { CSSProperties } from 'react';

import { formatKg } from '../../utils/format.ts';
import styles from './SeatButton.module.css';

interface SeatButtonProps {
  /** Nome completo do assento, para leitura por voz. Ex.: "Assento 4". */
  readonly label: string;
  /** Número exibido quando o assento está vazio. */
  readonly number: number;
  /** Peso lançado, em quilogramas. Zero significa assento vazio. */
  readonly weightKg: number;
  readonly selected: boolean;
  /** Posição no desenho, calculada pela régua de estações. */
  readonly style: CSSProperties;
  readonly onClick: () => void;
}

export function SeatButton({
  label,
  number,
  weightKg,
  selected,
  style,
  onClick,
}: SeatButtonProps) {
  const occupied = weightKg > 0;

  return (
    <button
      type="button"
      className={`${styles.seat} ${occupied ? styles.occupied : ''} ${
        selected ? styles.selected : ''
      }`}
      style={style}
      aria-pressed={occupied}
      aria-label={
        occupied
          ? `${label}, ${formatKg(weightKg)} quilogramas`
          : `${label}, vazio`
      }
      onClick={onClick}
    >
      {/* Vazio mostra o número do assento; ocupado mostra o que importa a
          partir daí, que é o peso. O número continua na leitura por voz. */}
      <span className={styles.value}>
        {occupied ? formatKg(weightKg) : number}
      </span>
    </button>
  );
}
