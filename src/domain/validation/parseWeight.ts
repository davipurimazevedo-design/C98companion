/**
 * Interpretação de um peso digitado.
 *
 * Único ponto do sistema que transforma texto em número. Toda entrada do piloto
 * passa por aqui, o que garante tratamento idêntico para vírgula decimal, campo
 * vazio, número negativo e digitação absurda.
 *
 * Regra de ouro: nunca lançar exceção e nunca devolver `NaN`. Uma entrada
 * inválida vira zero e informa o motivo, para que a interface possa sinalizar o
 * campo sem interromper o recálculo do restante do planejamento.
 */

import { INPUT_DECIMALS } from '../../config/input.ts';
import { normalize } from './normalize.ts';

/** O que há de errado com o valor digitado, se houver. */
export type InputIssue =
  /** Campo em branco. Não é erro: apenas ainda não foi preenchido. */
  | 'empty'
  /** Texto que não representa um número. */
  | 'not-a-number'
  /** Peso negativo. */
  | 'negative'
  /** Acima do teto de digitação — provável erro de digitação. */
  | 'too-large';

export interface ParsedWeight {
  /** Valor utilizável no cálculo. Sempre finito e maior ou igual a zero. */
  readonly value: number;
  /** `null` quando a entrada é válida e preenchida. */
  readonly issue: InputIssue | null;
}

/**
 * Converte o texto digitado em peso utilizável.
 *
 * @param raw   Texto exatamente como está no campo.
 * @param max   Teto de digitação da unidade (ver `src/config/input.ts`).
 */
export function parseWeight(raw: string, max: number): ParsedWeight {
  const text = normalize(raw);

  if (text === '') {
    return { value: 0, issue: 'empty' };
  }

  const parsed = Number(text);

  if (!Number.isFinite(parsed)) {
    return { value: 0, issue: 'not-a-number' };
  }

  if (parsed < 0) {
    return { value: 0, issue: 'negative' };
  }

  if (parsed > max) {
    return { value: 0, issue: 'too-large' };
  }

  return { value: round(parsed, INPUT_DECIMALS), issue: null };
}

/** Arredonda para o número de casas aceito na digitação. */
function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Mensagem em português para exibir junto do campo. */
export function describeIssue(issue: InputIssue): string | null {
  switch (issue) {
    case 'empty':
      return null; // Campo não preenchido não merece mensagem de erro.
    case 'not-a-number':
      return 'Informe apenas números.';
    case 'negative':
      return 'O peso não pode ser negativo.';
    case 'too-large':
      return 'Valor acima do aceito. Confira a digitação.';
  }
}
