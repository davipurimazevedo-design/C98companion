/**
 * Interpretação de um número digitado que pode ser negativo.
 *
 * `parseWeight` não serve aqui: peso negativo é sempre erro, e por isso ela
 * recusa o sinal por construção. Temperatura de −5 °C e altitude-pressão
 * abaixo do nível do mar são valores legítimos.
 *
 * Duas diferenças em relação a `parseWeight`, ambas necessárias:
 *
 * - o campo em branco devolve `null`, e não zero. Em performance, 0 °C ao
 *   nível do mar é uma condição de voo com resposta na tabela; tratar o campo
 *   vazio como zero exibiria uma distância inventada para um formulário que
 *   ninguém preencheu;
 * - a faixa aceita entra por parâmetro, porque cada grandeza tem a sua.
 *
 * A regra de ouro é a mesma: nunca lançar exceção e nunca devolver `NaN`.
 */

import { INPUT_DECIMALS } from '../../config/input.ts';
import { normalize } from './normalize.ts';

/** O que há de errado com o valor digitado, se houver. */
export type NumberIssue =
  /** Campo em branco. Não é erro: apenas ainda não foi preenchido. */
  | 'empty'
  /** Texto que não representa um número. */
  | 'not-a-number'
  /** Abaixo do piso de digitação. */
  | 'below-min'
  /** Acima do teto de digitação. */
  | 'above-max';

export interface ParsedNumber {
  /** `null` sempre que não houver um número utilizável. */
  readonly value: number | null;
  /** `null` quando a entrada é válida e preenchida. */
  readonly issue: NumberIssue | null;
}

/**
 * Converte o texto digitado em número utilizável.
 *
 * @param raw Texto exatamente como está no campo.
 * @param min Piso de digitação, inclusive.
 * @param max Teto de digitação, inclusive.
 */
export function parseSignedNumber(
  raw: string,
  min: number,
  max: number,
): ParsedNumber {
  const text = normalize(raw);

  if (text === '' || text === '-') {
    /* O sinal sozinho é o estado intermediário de quem está digitando −5. */
    return { value: null, issue: 'empty' };
  }

  const parsed = Number(text);

  if (!Number.isFinite(parsed)) return { value: null, issue: 'not-a-number' };
  if (parsed < min) return { value: null, issue: 'below-min' };
  if (parsed > max) return { value: null, issue: 'above-max' };

  const factor = 10 ** INPUT_DECIMALS;
  return { value: Math.round(parsed * factor) / factor, issue: null };
}

/** Mensagem em português para exibir junto do campo. */
export function describeNumberIssue(
  issue: NumberIssue,
  min: number,
  max: number,
): string | null {
  const format = new Intl.NumberFormat('pt-BR');
  switch (issue) {
    case 'empty':
      return null; // Campo não preenchido não merece mensagem de erro.
    case 'not-a-number':
      return 'Informe apenas números.';
    case 'below-min':
      return `Valor abaixo de ${format.format(min)}. Confira a digitação.`;
    case 'above-max':
      return `Valor acima de ${format.format(max)}. Confira a digitação.`;
  }
}
