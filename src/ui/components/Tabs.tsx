/**
 * Alternância entre as telas do aplicativo.
 *
 * Duas telas, sempre à vista, sem menu escondido: peso e balanceamento e
 * performance são as duas metades do mesmo planejamento, e o piloto vai e
 * volta entre elas enquanto decide o carregamento.
 *
 * Cada tela mantém o próprio rascunho — trocar de aba não apaga nada.
 *
 * É navegação, e não um painel de abas: cada botão troca a tela inteira, e
 * por isso a marcação é `nav` com `aria-current`, e não `tablist`/`tab`, que
 * exigiria um `tabpanel` correspondente para fazer sentido no leitor de tela.
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
    <nav className={styles.bar} aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.tab}
          aria-current={value === option.value ? 'page' : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </nav>
  );
}
