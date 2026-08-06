/**
 * Normalização do texto digitado, antes de virar número.
 *
 * Extraído para um arquivo próprio quando `parseNumber` passou a precisar do
 * mesmo tratamento de `parseWeight`: vírgula decimal, espaço e separador de
 * milhar têm que ser aceitos de forma idêntica nos dois, ou o mesmo `1.234`
 * viraria mil duzentos e trinta e quatro num campo e um vírgula dois em
 * outro.
 */

/** Aceita vírgula como separador decimal e ignora espaços e separador de milhar. */
export function normalize(raw: string): string {
  return raw
    .trim()
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}\b)/g, '') // 1.234 → 1234
    .replace(',', '.');
}
