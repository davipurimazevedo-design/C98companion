/**
 * Formatação numérica em português.
 *
 * O cálculo trabalha com precisão total; o arredondamento acontece só aqui, na
 * borda da exibição. Assim a soma de muitos passageiros não acumula erro.
 */

const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Traço exibido no lugar de um valor ainda não disponível. */
export const DASH = '—';

/** Peso em libras, arredondado para inteiro. Ex.: `4812` → `"4.812"`. */
export function formatLb(value: number): string {
  return integer.format(Math.round(value));
}

/** Peso em quilogramas. Mantém uma casa quando houver fração. */
export function formatKg(value: number): string {
  return Number.isInteger(value)
    ? integer.format(value)
    : oneDecimal.format(value);
}

/** Volume em litros, arredondado para inteiro. Ex.: `1256.7` → `"1.257"`. */
export function formatL(value: number): string {
  return integer.format(Math.round(value));
}

/** Percentual sem casas decimais. Ex.: `76.6` → `"77%"`. */
export function formatPct(value: number): string {
  return `${integer.format(Math.round(value))}%`;
}

/**
 * Peso com sinal explícito, para valores que podem ficar negativos.
 * Usa o sinal de menos tipográfico, mais legível que o hífen.
 */
export function formatSignedLb(value: number): string {
  const rounded = Math.round(value);
  return rounded < 0
    ? `−${integer.format(Math.abs(rounded))}`
    : integer.format(rounded);
}
