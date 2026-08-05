import { describe, expect, it } from 'vitest';

import { MAX_INPUT_KG, MAX_INPUT_LB } from '../../config/input.ts';
import { describeIssue, parseWeight } from './parseWeight.ts';

describe('parseWeight', () => {
  it('aceita número inteiro', () => {
    expect(parseWeight('78', MAX_INPUT_KG)).toEqual({ value: 78, issue: null });
  });

  it('aceita vírgula como separador decimal', () => {
    expect(parseWeight('78,5', MAX_INPUT_KG)).toEqual({
      value: 78.5,
      issue: null,
    });
  });

  it('aceita ponto como separador decimal', () => {
    expect(parseWeight('78.5', MAX_INPUT_KG)).toEqual({
      value: 78.5,
      issue: null,
    });
  });

  it('ignora separador de milhar', () => {
    expect(parseWeight('1.250', MAX_INPUT_LB)).toEqual({
      value: 1250,
      issue: null,
    });
  });

  it('ignora espaços', () => {
    expect(parseWeight('  120  ', MAX_INPUT_KG)).toEqual({
      value: 120,
      issue: null,
    });
  });

  it('trata campo vazio como zero, sem erro', () => {
    expect(parseWeight('', MAX_INPUT_KG)).toEqual({ value: 0, issue: 'empty' });
    expect(parseWeight('   ', MAX_INPUT_KG)).toEqual({
      value: 0,
      issue: 'empty',
    });
  });

  it('rejeita texto que não é número', () => {
    expect(parseWeight('abc', MAX_INPUT_KG)).toEqual({
      value: 0,
      issue: 'not-a-number',
    });
    expect(parseWeight('12kg', MAX_INPUT_KG)).toEqual({
      value: 0,
      issue: 'not-a-number',
    });
  });

  it('rejeita peso negativo', () => {
    expect(parseWeight('-40', MAX_INPUT_KG)).toEqual({
      value: 0,
      issue: 'negative',
    });
  });

  it('rejeita valor acima do teto de digitação', () => {
    expect(parseWeight('100000', MAX_INPUT_LB)).toEqual({
      value: 0,
      issue: 'too-large',
    });
  });

  it('nunca devolve NaN nem infinito', () => {
    for (const raw of ['NaN', 'Infinity', '-Infinity', 'e', '1e999', '--5']) {
      const parsed = parseWeight(raw, MAX_INPUT_LB);
      expect(Number.isFinite(parsed.value)).toBe(true);
      expect(parsed.value).toBeGreaterThanOrEqual(0);
    }
  });

  it('arredonda para uma casa decimal', () => {
    expect(parseWeight('78,46', MAX_INPUT_KG).value).toBe(78.5);
  });

  it('campo vazio não gera mensagem de erro', () => {
    expect(describeIssue('empty')).toBeNull();
  });

  it('demais problemas geram mensagem explicativa', () => {
    for (const issue of ['not-a-number', 'negative', 'too-large'] as const) {
      expect(describeIssue(issue)).toBeTruthy();
    }
  });
});
