/**
 * Alternância entre poucas opções mutuamente exclusivas.
 *
 * Usado em três lugares — amarração da carga, unidade do combustível e unidade
 * da carga. Extraído quando a terceira cópia da mesma marcação apareceu.
 *
 * Não é um grupo de rádio: cada opção é um botão com `aria-pressed`, porque a
 * escolha tem efeito imediato na tela em vez de aguardar envio de formulário.
 */

import styles from './SegmentedControl.module.css';

interface SegmentedControlProps<T extends string> {
  /** Descreve o grupo para quem usa leitor de tela. */
  readonly label: string;
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  /** Compacto: para seletores que dividem espaço com um título. */
  readonly compact?: boolean;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  compact = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`${styles.group} ${compact ? styles.compact : ''}`}
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.option}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
