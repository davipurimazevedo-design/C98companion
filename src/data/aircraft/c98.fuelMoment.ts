/**
 * Tabela de peso e momento do combustível.
 *
 * Fonte: Figura 6-15, folha 6 de 11, página 6-49 —
 * "FUEL (JET A, JET A-1, JET B, JP-1 AND JP-8 WITH DENSITY OF 6.7 LBS/GAL AT 60°F)".
 *
 * O cabeçalho da coluna de momento diz `ARM VARIES`: o braço do combustível não
 * é constante. Vai de cerca de 206,1 pol com pouco combustível a 203,8 pol com
 * os tanques cheios, porque a geometria dos tanques nas asas desloca o centro
 * de massa conforme enchem. Por isso o momento é lido da tabela, e não
 * calculado por um braço fixo.
 *
 * O manual publica tabelas separadas para JP-4 (6,5 lb/gal), JP-5 (6,8) e
 * gasolina de aviação (6,0), nas páginas 6-50 a 6-52. Se a unidade operar com
 * outro combustível, é preciso acrescentar a tabela correspondente.
 */

/** Uma linha da tabela: galões, peso e momento/1000 publicados. */
export interface FuelMomentRow {
  readonly gal: number;
  readonly lb: number;
  readonly moment1000: number;
}

/** Combustível cadastrado. Trocar exige trocar a tabela inteira. */
export const FUEL_TABLE_LABEL = 'Jet A / JP-8 · 6,7 lb/gal a 60 °F';

/* Transcrição literal da página 6-49, na ordem publicada. */
export const C98_FUEL_MOMENTS: readonly FuelMomentRow[] = [
  { gal: 5, lb: 33, moment1000: 6.8 },
  { gal: 10, lb: 67, moment1000: 13.7 },
  { gal: 15, lb: 100, moment1000: 20.6 },
  { gal: 20, lb: 134, moment1000: 27.5 },
  { gal: 25, lb: 167, moment1000: 34.3 },
  { gal: 30, lb: 201, moment1000: 41.2 },
  { gal: 35, lb: 234, moment1000: 48.1 },
  { gal: 40, lb: 268, moment1000: 55.0 },
  { gal: 45, lb: 301, moment1000: 61.8 },
  { gal: 50, lb: 335, moment1000: 68.7 },
  { gal: 55, lb: 368, moment1000: 75.6 },
  { gal: 60, lb: 402, moment1000: 82.5 },
  { gal: 65, lb: 435, moment1000: 89.3 },
  { gal: 70, lb: 469, moment1000: 96.2 },
  { gal: 75, lb: 502, moment1000: 103.1 },
  { gal: 80, lb: 536, moment1000: 109.9 },
  { gal: 85, lb: 569, moment1000: 116.8 },
  { gal: 90, lb: 603, moment1000: 123.6 },
  { gal: 95, lb: 636, moment1000: 130.5 },
  { gal: 100, lb: 670, moment1000: 137.3 },
  { gal: 105, lb: 703, moment1000: 144.2 },
  { gal: 110, lb: 737, moment1000: 151.0 },
  { gal: 115, lb: 770, moment1000: 157.9 },
  { gal: 120, lb: 804, moment1000: 164.7 },
  { gal: 125, lb: 837, moment1000: 171.6 },
  { gal: 130, lb: 871, moment1000: 178.4 },
  { gal: 135, lb: 904, moment1000: 185.3 },
  { gal: 140, lb: 938, moment1000: 192.1 },
  { gal: 145, lb: 971, moment1000: 198.9 },
  { gal: 150, lb: 1005, moment1000: 205.8 },
  { gal: 155, lb: 1038, moment1000: 212.6 },
  { gal: 160, lb: 1072, moment1000: 219.4 },
  { gal: 165, lb: 1105, moment1000: 226.3 },
  { gal: 170, lb: 1139, moment1000: 233.1 },
  { gal: 175, lb: 1172, moment1000: 239.9 },
  { gal: 180, lb: 1206, moment1000: 246.7 },
  { gal: 185, lb: 1239, moment1000: 253.5 },
  { gal: 190, lb: 1273, moment1000: 260.4 },
  { gal: 195, lb: 1306, moment1000: 267.2 },
  { gal: 200, lb: 1340, moment1000: 274.0 },
  { gal: 205, lb: 1373, moment1000: 280.8 },
  { gal: 210, lb: 1407, moment1000: 287.6 },
  { gal: 215, lb: 1440, moment1000: 294.4 },
  { gal: 220, lb: 1474, moment1000: 301.2 },
  { gal: 225, lb: 1507, moment1000: 308.0 },
  { gal: 230, lb: 1541, moment1000: 314.8 },
  { gal: 235, lb: 1574, moment1000: 321.6 },
  { gal: 240, lb: 1608, moment1000: 328.4 },
  { gal: 245, lb: 1641, moment1000: 335.2 },
  { gal: 250, lb: 1675, moment1000: 342.0 },
  { gal: 255, lb: 1708, moment1000: 348.8 },
  { gal: 260, lb: 1742, moment1000: 355.6 },
  { gal: 265, lb: 1775, moment1000: 362.4 },
  { gal: 270, lb: 1809, moment1000: 369.2 },
  { gal: 275, lb: 1842, moment1000: 376.0 },
  { gal: 280, lb: 1876, moment1000: 382.8 },
  { gal: 285, lb: 1909, moment1000: 389.5 },
  { gal: 290, lb: 1943, moment1000: 396.3 },
  { gal: 295, lb: 1976, moment1000: 403.1 },
  { gal: 300, lb: 2010, moment1000: 409.9 },
  { gal: 305, lb: 2043, moment1000: 416.7 },
  { gal: 310, lb: 2077, moment1000: 423.4 },
  { gal: 315, lb: 2110, moment1000: 430.2 },
  { gal: 320, lb: 2144, moment1000: 437.0 },
  { gal: 325, lb: 2177, moment1000: 443.7 },
  { gal: 327, lb: 2189, moment1000: 446.1 },
  { gal: 330, lb: 2211, moment1000: 450.5 },
  { gal: 332, lb: 2224, moment1000: 453.2 },
];
