/**
 * Mensagem de erro de um campo de peso, ou `null` quando não há o que apontar.
 * Reúne validação e redação num só lugar para que toda seção reaja igual.
 */

import {
  describeIssue,
  parseWeight,
} from '../domain/validation/parseWeight.ts';

export function fieldError(text: string, max: number): string | null {
  const { issue } = parseWeight(text, max);
  return issue === null ? null : describeIssue(issue);
}
