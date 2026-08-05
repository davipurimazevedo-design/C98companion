/**
 * Resultado que pode depender de dados ainda não cadastrados.
 *
 * Nenhuma função de cálculo devolve um número quando o dado que o sustenta está
 * pendente. Ela devolve `pending` com a lista do que falta, e a interface exibe
 * "—". Isso torna impossível apresentar ao piloto um resultado apoiado em dado
 * inexistente: o tipo obriga a tratar o caso.
 */

export type Outcome<T> =
  | { readonly status: 'ready'; readonly value: T }
  | { readonly status: 'pending'; readonly missing: readonly string[] };

export function ready<T>(value: T): Outcome<T> {
  return { status: 'ready', value };
}

export function pending<T>(missing: readonly string[]): Outcome<T> {
  return { status: 'pending', missing };
}

/** Verdadeiro quando o resultado pode ser exibido. */
export function isReady<T>(
  outcome: Outcome<T>,
): outcome is { status: 'ready'; value: T } {
  return outcome.status === 'ready';
}

/** Valor do resultado, ou `null` se ainda estiver pendente. */
export function valueOrNull<T>(outcome: Outcome<T>): T | null {
  return outcome.status === 'ready' ? outcome.value : null;
}
