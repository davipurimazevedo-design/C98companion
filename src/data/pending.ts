/**
 * Mecanismo de "dado pendente".
 *
 * Todo valor técnico proveniente do Manual de Peso e Balanceamento é declarado
 * como `Pending<T>` e nasce com o valor `PENDING` (null). Nenhum número
 * provisório, estimado ou obtido de outra fonte pode ocupar esses campos.
 *
 * Motivo: enquanto o manual não for cadastrado, o aplicativo precisa recusar-se
 * a exibir qualquer resultado que dependa desses valores. Um número inventado
 * numa tela de peso e balanceamento é pior do que nenhum número.
 *
 * O compilador reforça a regra: `Pending<number>` não é aceito onde se espera
 * `number`, então todo cálculo é obrigado a tratar explicitamente o caso nulo.
 */

/** Valor que virá do manual. `null` enquanto não cadastrado. */
export type Pending<T> = T | null;

/** Marcador de campo ainda não cadastrado. */
export const PENDING = null;

/** Verdadeiro quando o valor ainda não foi cadastrado. */
export function isPending<T>(value: Pending<T>): value is null {
  return value === null;
}

/** Verdadeiro quando o valor já foi cadastrado e pode ser usado em cálculo. */
export function isPresent<T>(value: Pending<T>): value is T {
  return value !== null;
}

/**
 * Descreve quais campos de um conjunto ainda estão pendentes.
 *
 * Recebe pares `[rótulo legível, valor]` e devolve os rótulos dos que faltam,
 * na ordem informada. A interface usa essa lista para dizer ao piloto
 * exatamente o que falta cadastrar, em vez de um aviso genérico.
 */
export function missingLabels(
  fields: readonly (readonly [label: string, value: Pending<unknown>])[],
): string[] {
  return fields.filter(([, value]) => isPending(value)).map(([label]) => label);
}
