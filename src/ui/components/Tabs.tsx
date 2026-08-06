/**
 * Alternância entre as telas do aplicativo.
 *
 * Duas telas, sempre à vista, sem menu escondido: peso e balanceamento e
 * performance são as duas metades do mesmo planejamento, e o piloto vai e
 * volta entre elas enquanto decide o carregamento.
 *
 * Cada tela mantém o próprio rascunho — trocar de aba não apaga nada.
 */

import styles from './Tabs.module.css';

interface TabsProps<T extends string> {
  readonly label: string;
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}

export function Tabs<T extends string>({
  label,
  options,
  value,
  onChange,
}: TabsProps<T>) {
  return (
    <div className={styles.bar} role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
