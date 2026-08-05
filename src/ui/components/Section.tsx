/**
 * Seção do planejamento.
 *
 * O subtotal no cabeçalho é o que permite conferir o carregamento sem rolar a
 * tela inteira: cada seção declara o próprio peso ao lado do título.
 */

import type { ReactNode } from 'react';

import styles from './Section.module.css';

interface SectionProps {
  readonly title: string;
  readonly subtotal?: string;
  readonly children: ReactNode;
}

export function Section({ title, subtotal, children }: SectionProps) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtotal && <span className={styles.subtotal}>{subtotal}</span>}
      </header>
      <div className={styles.body}>{children}</div>
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
