/**
 * Seção do planejamento.
 *
 * O subtotal no cabeçalho é o que permite conferir o carregamento sem rolar a
 * tela inteira: cada seção declara o próprio peso ao lado do título.
 *
 * Uma seção recolhível continua exibindo título e subtotal fechada, e não
 * fecha enquanto houver peso lançado dentro. Peso embarcado nunca sai de vista
 * — esconder 400 LB atrás de um triângulo é como não tê-los lançado.
 */

import type { ReactNode } from 'react';

import styles from './Section.module.css';

interface SectionProps {
  readonly title: string;
  readonly subtotal?: string;
  /** Destaca o subtotal, quando o grupo ultrapassou um limite. */
  readonly over?: boolean;
  /**
   * Controle exibido na própria linha do título, entre ele e o subtotal.
   *
   * Serve ao que é preferência da seção inteira — a unidade do combustível, por
   * exemplo — e que ocuparia uma linha só para si dentro do corpo.
   */
  readonly control?: ReactNode;
  /** Torna o cabeçalho um botão que abre e fecha o corpo. */
  readonly collapsible?: boolean;
  readonly open?: boolean;
  /** Impede o recolhimento. Usado quando fechar esconderia peso lançado. */
  readonly locked?: boolean;
  readonly onToggle?: (open: boolean) => void;
  readonly children: ReactNode;
}

export function Section({
  title,
  subtotal,
  over = false,
  control,
  collapsible = false,
  open = true,
  locked = false,
  onToggle,
  children,
}: SectionProps) {
  const visible = !collapsible || open || locked;

  const head = (
    <>
      <h2 className={styles.title}>{title}</h2>
      {control && <span className={styles.control}>{control}</span>}
      {subtotal && (
        <span className={`${styles.subtotal} ${over ? styles.over : ''}`}>
          {subtotal}
        </span>
      )}
      {collapsible && !locked && (
        <span className={styles.chevron} aria-hidden="true">
          {visible ? '▴' : '▾'}
        </span>
      )}
    </>
  );

  return (
    <section className={styles.card}>
      {collapsible ? (
        <button
          type="button"
          className={`${styles.header} ${styles.headerButton}`}
          aria-expanded={visible}
          disabled={locked}
          onClick={() => onToggle?.(!open)}
        >
          {head}
        </button>
      ) : (
        <header className={styles.header}>{head}</header>
      )}

      {visible && <div className={styles.body}>{children}</div>}
    </section>
  );
}

/** Botão de acrescentar linha, sempre ao final de uma lista. */
export function AddButton({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button type="button" className={styles.add} onClick={onClick}>
      + {label}
    </button>
  );
}
