/**
 * Campo de peso.
 *
 * Decisões de usabilidade, todas voltadas ao uso com uma mão no pátio:
 * - `type="text"` com `inputMode="decimal"` abre o teclado numérico do celular
 *   e, ao contrário de `type="number"`, não descarta a vírgula decimal;
 * - fonte de 16 px, mínimo que impede o iOS de dar zoom ao focar o campo;
 * - seleciona todo o conteúdo ao focar, para substituir um valor num toque;
 * - unidade fixa ao lado do número, para não haver dúvida sobre kg ou LB.
 */

import styles from './WeightInput.module.css';

interface WeightInputProps {
  readonly value: string;
  /**
   * `pax` é contagem e `L` é volume, não peso — usam o mesmo campo por
   * consistência visual, e a conversão para peso acontece em `toMissionPlan`.
   *
   * As quatro últimas são da tela de Performance, onde os campos não são de
   * peso mas pedem exatamente o mesmo comportamento: teclado numérico, fonte
   * que não provoca zoom no iOS e unidade fixa ao lado do número.
   */
  readonly unit: 'kg' | 'LB' | 'pax' | 'L' | 'ft' | '°C' | 'kt' | 'm';
  readonly onChange: (value: string) => void;
  readonly ariaLabel: string;
  readonly invalid?: boolean;
  readonly autoFocus?: boolean;
}

export function WeightInput({
  value,
  unit,
  onChange,
  ariaLabel,
  invalid = false,
  autoFocus = false,
}: WeightInputProps) {
  return (
    <span className={`${styles.field} ${invalid ? styles.invalid : ''}`}>
      <input
        className={styles.input}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint="done"
        placeholder="0"
        value={value}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- foca a linha recém-criada
        autoFocus={autoFocus}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <span className={styles.unit} aria-hidden="true">
        {unit}
      </span>
    </span>
  );
}
