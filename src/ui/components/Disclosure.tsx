/**
 * Cabeçalho recolhível de um grupo.
 *
 * Extraído quando a terceira cópia apareceu: carga na cabine, lista de
 * passageiros e conferência do carregamento repetem a mesma forma — título à
 * esquerda, total à direita, seta indicando o estado.
 *
 * Regra que o componente sustenta: o total fica SEMPRE à vista, aberto ou
 * recolhido. Um grupo que esconde o peso que tem dentro é pior do que um grupo
 * que ocupa espaço.
 */

import styles from './Disclosure.module.css';

interface DisclosureProps {
  readonly title: string;
  /** Total do grupo, exibido mesmo com o conteúdo recolhido. */
  readonly total?: string;
  /** Destaca o total em vermelho, quando o grupo ultrapassou um limite. */
  readonly over?: boolean;
  readonly open: boolean;
  /**
   * Trava o cabeçalho aberto. Usado quando recolher esconderia peso lançado.
   */
  readonly locked?: boolean;
  readonly onToggle: (open: boolean) => void;
}

export function Disclosure({
  title,
  total,
  over = false,
  open,
  locked = false,
  onToggle,
}: DisclosureProps) {
  return (
    <button
      type="button"
      className={styles.header}
      aria-expanded={open}
      disabled={locked}
      onClick={() => onToggle(!open)}
    >
      <span className={styles.title}>{title}</span>
      {total !== undefined && (
        <span className={`${styles.total} ${over ? styles.over : ''}`}>
          {total}
        </span>
      )}
      {!locked && (
        <span className={styles.chevron} aria-hidden="true">
          {open ? '▴' : '▾'}
        </span>
      )}
    </button>
  );
}
