/**
 * Auditoria automática da transcrição das tabelas.
 *
 * São cerca de novecentos números copiados à mão do manual. Um dígito trocado
 * não aparece como erro: aparece como uma distância plausível e falsa, que
 * nenhum teste de lógica pegaria.
 *
 * O que este arquivo explora é que a física das tabelas é monótona — distância
 * cresce com altitude, com temperatura e com peso, sem exceção em nenhuma das
 * grades publicadas. Um `1595` digitado como `1595` está certo; digitado como
 * `595` ou `5195`, quebra a ordem e cai aqui.
 *
 * Vale para toda tabela cadastrada: uma tabela nova entra na auditoria só por
 * ser registrada em `index.ts`.
 */

import { describe, expect, it } from 'vitest';

import { PERFORMANCE_TABLES } from './index.ts';
import type { DistanceTable, PublishedCell } from './types.ts';

/** Descreve uma célula pela posição, para a mensagem de falha ser acionável. */
function where(
  table: DistanceTable,
  blockIndex: number,
  altIndex: number,
  tempIndex: number,
): string {
  const weight = table.blocks[blockIndex]?.weightLb;
  const alt = table.pressureAltitudesFt[altIndex];
  const temp = table.temperaturesC[tempIndex];
  return `${table.figure} · ${weight} lb · ${alt} ft · ${temp} °C`;
}

function cellAt(
  table: DistanceTable,
  blockIndex: number,
  altIndex: number,
  tempIndex: number,
): PublishedCell {
  return table.blocks[blockIndex]?.cells[altIndex]?.[tempIndex] ?? null;
}

describe.each(PERFORMANCE_TABLES.map((table) => [table.label, table] as const))(
  '%s',
  (_label, table) => {
    const alts = table.pressureAltitudesFt.length;
    const temps = table.temperaturesC.length;

    it('a grade tem exatamente o tamanho dos eixos', () => {
      /* Uma linha a mais ou a menos deslocaria toda a leitura em silêncio. */
      for (const block of table.blocks) {
        expect(block.cells).toHaveLength(alts);
        for (const row of block.cells) {
          expect(row).toHaveLength(temps);
        }
      }
    });

    it('os eixos estão em ordem crescente', () => {
      const crescente = (values: readonly number[]) =>
        values.every((value, i) => i === 0 || value > (values[i - 1] ?? 0));

      expect(crescente(table.pressureAltitudesFt)).toBe(true);
      expect(crescente(table.temperaturesC)).toBe(true);
      expect(crescente(table.blocks.map((block) => block.weightLb))).toBe(true);
    });

    it('a distância para 50 pés é sempre maior que a corrida no solo', () => {
      for (let b = 0; b < table.blocks.length; b += 1) {
        for (let a = 0; a < alts; a += 1) {
          for (let t = 0; t < temps; t += 1) {
            const cell = cellAt(table, b, a, t);
            if (!cell) continue;
            const [groundRoll, total] = cell;
            expect(
              total > groundRoll ? '' : where(table, b, a, t),
            ).toBe('');
          }
        }
      }
    });

    it('a distância cresce com a altitude', () => {
      for (let b = 0; b < table.blocks.length; b += 1) {
        for (let t = 0; t < temps; t += 1) {
          for (let a = 1; a < alts; a += 1) {
            const lower = cellAt(table, b, a - 1, t);
            const upper = cellAt(table, b, a, t);
            if (!lower || !upper) continue;
            expect(
              upper[0] > lower[0] && upper[1] > lower[1]
                ? ''
                : where(table, b, a, t),
            ).toBe('');
          }
        }
      }
    });

    it('a distância cresce com a temperatura', () => {
      for (let b = 0; b < table.blocks.length; b += 1) {
        for (let a = 0; a < alts; a += 1) {
          for (let t = 1; t < temps; t += 1) {
            const colder = cellAt(table, b, a, t - 1);
            const hotter = cellAt(table, b, a, t);
            if (!colder || !hotter) continue;
            expect(
              hotter[0] > colder[0] && hotter[1] > colder[1]
                ? ''
                : where(table, b, a, t),
            ).toBe('');
          }
        }
      }
    });

    it('a distância cresce com o peso', () => {
      for (let b = 1; b < table.blocks.length; b += 1) {
        for (let a = 0; a < alts; a += 1) {
          for (let t = 0; t < temps; t += 1) {
            const lighter = cellAt(table, b - 1, a, t);
            const heavier = cellAt(table, b, a, t);
            if (!lighter || !heavier) continue;
            expect(
              heavier[0] > lighter[0] && heavier[1] > lighter[1]
                ? ''
                : where(table, b, a, t),
            ).toBe('');
          }
        }
      }
    });

    it('os traços do manual ficam sempre no canto quente e alto', () => {
      /* O manual só suprime valores onde o limite de temperatura seria
         excedido: da esquerda para a direita e de baixo para cima, uma vez
         suprimido, não volta a aparecer. Um `null` no meio da grade seria
         transcrição errada, não dado do manual. */
      for (let b = 0; b < table.blocks.length; b += 1) {
        for (let a = 0; a < alts; a += 1) {
          for (let t = 1; t < temps; t += 1) {
            if (cellAt(table, b, a, t - 1)) continue;
            expect(
              cellAt(table, b, a, t) === null ? '' : where(table, b, a, t),
            ).toBe('');
          }
        }
        for (let t = 0; t < temps; t += 1) {
          for (let a = 1; a < alts; a += 1) {
            if (cellAt(table, b, a - 1, t)) continue;
            expect(
              cellAt(table, b, a, t) === null ? '' : where(table, b, a, t),
            ).toBe('');
          }
        }
      }
    });
  },
);
