/**
 * Linha de formulário: rótulo à esquerda, campo à direita.
 *
 * A mensagem de erro fica sob o rótulo, e não sob o campo, porque ali há
 * largura para uma frase legível sem quebrar o alinhamento da coluna numérica.
 */

import type { ReactNode } from 'react';

import styles from './FieldRow.module.css';

interface FieldRowProps {
  readonly label: ReactNode;
  readonly hint?: string | undefined;
  readonly error?: string | null | undefined;
  /** Numeração exibida à esquerda, para linhas de uma lista. */
  readonly index?: number;
  readonly children: ReactNode;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
}

export function FieldRow({
  label,
  hint,
  error,
  index,
  children,
  onRemove,
  removeLabel,
}: FieldRowProps) {
  return (
    <div className={styles.row}>
      {index !== undefined && <span className={styles.index}>{index}</span>}

      <span className={styles.labels}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
        {error && <span className={styles.error}>{error}</span>}
      </span>

      {children}

      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          onClick={onRemove}
          aria-label={removeLabel ?? 'Remover'}
        >
          ×
        </button>
      )}
    </div>
  );
}
