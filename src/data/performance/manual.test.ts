/**
 * Conferência das tabelas de performance contra o manual.
 *
 * Cada asserção repete o valor publicado e a página de onde saiu, como já é
 * feito em `data/aircraft/manual.test.ts`. Complementa a auditoria estrutural
 * de `monotonia.test.ts`: aquela pega dígito trocado, esta pega linha ou
 * coluna deslocada — um erro que preserva a ordem e passaria despercebido.
 *
 * Fonte: Cessna Model 208B (675 SHP), POH Section 5, Revision 23.
 */

import { describe, expect, it } from 'vitest';

import {
  C98_LANDING,
  C98_TAKEOFF_FLAPS_0,
  C98_TAKEOFF_FLAPS_20,
} from './index.ts';
import type { DistanceTable } from './types.ts';

/** Lê uma célula pelos valores dos eixos, como se lê a página impressa. */
function cell(
  table: DistanceTable,
  weightLb: number,
  altitudeFt: number,
  temperatureC: number,
): readonly [number, number] | null {
  const block = table.blocks.find((item) => item.weightLb === weightLb);
  const alt = table.pressureAltitudesFt.indexOf(altitudeFt);
  const temp = table.temperaturesC.indexOf(temperatureC);
  if (!block || alt < 0 || temp < 0) {
    throw new Error(`Eixo inexistente: ${weightLb} lb, ${altitudeFt} ft, ${temperatureC} °C`);
  }
  return block.cells[alt]?.[temp] ?? null;
}

describe('decolagem flaps 20° — Figura 5-9 (páginas 5-22 e 5-23)', () => {
  const table = C98_TAKEOFF_FLAPS_20;

  it('vale para a aeronave com cargo pod instalado', () => {
    expect(table.configuration).toBe('cargo-pod');
    expect(table.flapsDeg).toBe(20);
  });

  it('os quatro pesos publicados', () => {
    expect(table.blocks.map((block) => block.weightLb)).toEqual([
      7300, 7800, 8300, 8750,
    ]);
  });

  it('velocidades de decolagem por peso', () => {
    /* Coluna "TAKEOFF SPEED KIAS": rotação e travessia dos 50 pés. */
    expect(table.blocks.map((b) => [b.weightLb, b.liftOffKias, b.at50FtKias])).toEqual([
      [7300, 61, 73],
      [7800, 64, 76],
      [8300, 67, 80],
      [8750, 70, 83],
    ]);
  });

  it('eixos de altitude e de temperatura', () => {
    expect(table.pressureAltitudesFt).toEqual([0, 2000, 4000, 6000, 8000, 10_000, 12_000]);
    expect(table.temperaturesC).toEqual([-10, 0, 10, 20, 30, 40]);
  });

  /* O valor que o Sample Problem da página 5-7 usa. É o cruzamento mais
     conferido de toda a seção, e amarra a leitura das duas páginas. */
  it('8750 lb, 4000 ft, 20 °C: 1875 e 3295 pés', () => {
    expect(cell(table, 8750, 4000, 20)).toEqual([1875, 3295]);
  });

  it('cantos do bloco de 8750 lb', () => {
    expect(cell(table, 8750, 0, -10)).toEqual([1205, 2160]);
    expect(cell(table, 8750, 0, 40)).toEqual([1625, 2870]);
    expect(cell(table, 8750, 12_000, -10)).toEqual([2875, 5155]);
    expect(cell(table, 8750, 12_000, 20)).toEqual([4350, 8865]);
  });

  it('cantos do bloco de 8300 lb', () => {
    expect(cell(table, 8300, 0, -10)).toEqual([1050, 1870]);
    expect(cell(table, 8300, 0, 40)).toEqual([1415, 2470]);
    expect(cell(table, 8300, 12_000, -10)).toEqual([2480, 4350]);
    expect(cell(table, 8300, 12_000, 30)).toEqual([4330, 8965]);
  });

  it('cantos do bloco de 7800 lb', () => {
    expect(cell(table, 7800, 0, -10)).toEqual([895, 1585]);
    expect(cell(table, 7800, 0, 40)).toEqual([1205, 2080]);
    expect(cell(table, 7800, 12_000, -10)).toEqual([2090, 3605]);
    expect(cell(table, 7800, 12_000, 30)).toEqual([3575, 6920]);
  });

  it('cantos do bloco de 7300 lb', () => {
    expect(cell(table, 7300, 0, -10)).toEqual([760, 1345]);
    expect(cell(table, 7300, 0, 40)).toEqual([1015, 1755]);
    expect(cell(table, 7300, 12_000, -10)).toEqual([1750, 2985]);
    expect(cell(table, 7300, 12_000, 30)).toEqual([2930, 5460]);
  });

  it('os traços publicados', () => {
    /* 8750 lb perde a coluna de 40 °C a partir de 10000 ft, e a de 30 °C a
       12000 ft. Os pesos menores perdem só a de 40 °C. */
    expect(cell(table, 8750, 10_000, 40)).toBeNull();
    expect(cell(table, 8750, 12_000, 30)).toBeNull();
    expect(cell(table, 8750, 12_000, 40)).toBeNull();
    expect(cell(table, 8300, 12_000, 30)).not.toBeNull();
    expect(cell(table, 8300, 12_000, 40)).toBeNull();
    expect(cell(table, 7300, 10_000, 40)).toBeNull();
  });

  it('a nota 6 autoriza operar acima de 40 °C multiplicando por 1,2', () => {
    expect(table.aboveTopTemperature?.factor).toBe(1.2);
  });

  it('as seis notas do manual estão registradas', () => {
    expect(table.notes).toHaveLength(6);
    expect(table.notes[1]).toContain('11 nós');
    expect(table.notes[1]).toContain('2 nós');
  });
});

describe('decolagem flaps 0° — Figura 5-9A (páginas 5-24 e 5-25)', () => {
  const table = C98_TAKEOFF_FLAPS_0;

  it('o eixo de temperatura é outro: −20 a 10 °C', () => {
    /* A diferença mais importante entre as duas tabelas de decolagem. Ler a
       de flaps 0° com o eixo da de flaps 20° devolveria a coluna errada. */
    expect(table.temperaturesC).toEqual([-20, -10, 0, 10]);
    expect(table.pressureAltitudesFt).toEqual([0, 2000, 4000, 6000, 8000, 10_000, 12_000]);
  });

  it('as velocidades são as mesmas nos quatro pesos: 83 e 104 KIAS', () => {
    expect(table.blocks.map((b) => [b.weightLb, b.liftOffKias, b.at50FtKias])).toEqual([
      [7300, 83, 104],
      [7800, 83, 104],
      [8300, 83, 104],
      [8750, 83, 104],
    ]);
  });

  it('cantos do bloco de 8750 lb', () => {
    expect(cell(table, 8750, 0, -20)).toEqual([1720, 3205]);
    expect(cell(table, 8750, 0, 10)).toEqual([2085, 3880]);
    expect(cell(table, 8750, 12_000, -20)).toEqual([3930, 7485]);
    expect(cell(table, 8750, 12_000, 10)).toEqual([5955, 12_585]);
  });

  it('cantos do bloco de 8300 lb', () => {
    expect(cell(table, 8300, 0, -20)).toEqual([1620, 3015]);
    expect(cell(table, 8300, 0, 10)).toEqual([1965, 3650]);
    expect(cell(table, 8300, 12_000, -20)).toEqual([3690, 7010]);
    expect(cell(table, 8300, 12_000, 10)).toEqual([5570, 11_705]);
  });

  it('cantos do bloco de 7800 lb', () => {
    expect(cell(table, 7800, 0, -20)).toEqual([1510, 2810]);
    expect(cell(table, 7800, 0, 10)).toEqual([1830, 3395]);
    expect(cell(table, 7800, 12_000, -20)).toEqual([3430, 6495]);
    expect(cell(table, 7800, 12_000, 10)).toEqual([5155, 10_765]);
  });

  it('cantos do bloco de 7300 lb', () => {
    expect(cell(table, 7300, 0, -20)).toEqual([1405, 2605]);
    expect(cell(table, 7300, 0, 10)).toEqual([1695, 3145]);
    expect(cell(table, 7300, 12_000, -20)).toEqual([3170, 5995]);
    expect(cell(table, 7300, 12_000, 10)).toEqual([4750, 9865]);
  });

  it('não há traço nenhum: a tabela para em 10 °C', () => {
    const todas = table.blocks.flatMap((block) => block.cells.flat());
    expect(todas.every((item) => item !== null)).toBe(true);
  });

  it('não existe nota autorizando operar acima da coluna mais quente', () => {
    expect(table.aboveTopTemperature).toBeNull();
  });

  it('flaps 0° exige mais pista que flaps 20° no mesmo ponto da grade', () => {
    /* Confere que as duas tabelas não foram trocadas uma pela outra. */
    const zero = cell(table, 8750, 4000, 0);
    const vinte = cell(C98_TAKEOFF_FLAPS_20, 8750, 4000, 0);
    expect(zero?.[0]).toBeGreaterThan(vinte?.[0] ?? 0);
    expect(zero?.[1]).toBeGreaterThan(vinte?.[1] ?? 0);
  });
});

describe('pouso — Figura 5-23 (páginas 5-59 e 5-60)', () => {
  const table = C98_LANDING;

  it('flaps 30°, com cargo pod instalado', () => {
    expect(table.configuration).toBe('cargo-pod');
    expect(table.flapsDeg).toBe(30);
  });

  it('os pesos param em 8500 lb, que é o peso máximo de pouso', () => {
    expect(table.blocks.map((block) => block.weightLb)).toEqual([
      7000, 7500, 8000, 8500,
    ]);
  });

  it('publica só a velocidade de travessia dos 50 pés', () => {
    expect(table.blocks.map((b) => [b.weightLb, b.liftOffKias, b.at50FtKias])).toEqual([
      [7000, null, 71],
      [7500, null, 73],
      [8000, null, 75],
      [8500, null, 78],
    ]);
  });

  /* O valor que o Sample Problem da página 5-11 usa, depois de arredondar o
     peso de pouso de 6975 lb para o bloco de 7000. */
  it('7000 lb, 2000 ft, 30 °C: 850 e 1650 pés', () => {
    expect(cell(table, 7000, 2000, 30)).toEqual([850, 1650]);
  });

  it('cantos do bloco de 8500 lb', () => {
    expect(cell(table, 8500, 0, -10)).toEqual([835, 1625]);
    expect(cell(table, 8500, 0, 40)).toEqual([995, 1855]);
    expect(cell(table, 8500, 12_000, -10)).toEqual([1315, 2295]);
    expect(cell(table, 8500, 12_000, 30)).toEqual([1515, 2565]);
  });

  it('cantos do bloco de 8000 lb', () => {
    expect(cell(table, 8000, 0, -10)).toEqual([785, 1555]);
    expect(cell(table, 8000, 0, 40)).toEqual([935, 1770]);
    expect(cell(table, 8000, 12_000, -10)).toEqual([1235, 2195]);
    expect(cell(table, 8000, 12_000, 30)).toEqual([1425, 2450]);
  });

  it('cantos do bloco de 7500 lb', () => {
    expect(cell(table, 7500, 0, -10)).toEqual([740, 1480]);
    expect(cell(table, 7500, 0, 40)).toEqual([880, 1685]);
    expect(cell(table, 7500, 12_000, -10)).toEqual([1160, 2085]);
    expect(cell(table, 7500, 12_000, 30)).toEqual([1340, 2325]);
  });

  it('cantos do bloco de 7000 lb', () => {
    expect(cell(table, 7000, 0, -10)).toEqual([690, 1410]);
    expect(cell(table, 7000, 0, 40)).toEqual([820, 1600]);
    expect(cell(table, 7000, 12_000, -10)).toEqual([1080, 1980]);
    expect(cell(table, 7000, 12_000, 30)).toEqual([1245, 2205]);
  });

  it('a coluna de 40 °C some a partir de 10000 ft, em todos os pesos', () => {
    for (const block of table.blocks) {
      expect(cell(table, block.weightLb, 8000, 40)).not.toBeNull();
      expect(cell(table, block.weightLb, 10_000, 40)).toBeNull();
      expect(cell(table, block.weightLb, 12_000, 40)).toBeNull();
    }
  });

  it('pousar exige menos pista que decolar no mesmo peso e ponto da grade', () => {
    /* Guarda contra as tabelas de pouso e decolagem trocadas entre si. */
    const pouso = cell(table, 8000, 4000, 20);
    const decolagem = cell(C98_TAKEOFF_FLAPS_20, 8300, 4000, 20);
    expect(pouso?.[1]).toBeLessThan(decolagem?.[1] ?? 0);
  });
});
