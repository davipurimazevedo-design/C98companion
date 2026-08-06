/**
 * Mensagem de erro de um campo de peso, ou `null` quando não há o que apontar.
 * Reúne validação e redação num só lugar para que toda seção reaja igual.
 */

import {
  describeNumberIssue,
  parseSignedNumber,
} from '../domain/validation/parseNumber.ts';
import {
  describeIssue,
  parseWeight,
} from '../domain/validation/parseWeight.ts';

export function fieldError(text: string, max: number): string | null {
  const { issue } = parseWeight(text, max);
  return issue === null ? null : describeIssue(issue);
}

/**
 * O mesmo, para os campos que aceitam negativo — temperatura e
 * altitude-pressão, na tela de Performance.
 */
export function signedFieldError(
  text: string,
  min: number,
  max: number,
): string | null {
  const { issue } = parseSignedNumber(text, min, max);
  return issue === null ? null : describeNumberIssue(issue, min, max);
}
