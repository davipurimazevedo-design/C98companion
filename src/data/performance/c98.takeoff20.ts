/**
 * Distância de decolagem — flaps 20°, short field, cargo pod instalado.
 *
 * Fonte: POH Section 5, Figura 5-9, páginas 5-22 e 5-23, Revision 23.
 *
 * As linhas abaixo reproduzem a grade impressa: uma linha de código por linha
 * de altitude, seis pares por linha, na ordem das colunas de temperatura. Foi
 * escrita assim para poder ser conferida contra a página com o dedo, sem
 * decifrar estrutura.
 */

import type { DistanceTable } from './types.ts';

/** Colunas de temperatura, em graus Celsius. Página 5-22. */
const TEMPERATURES_C = [-10, 0, 10, 20, 30, 40] as const;

/** Linhas de altitude-pressão, em pés. "SL" é o nível do mar. */
const ALTITUDES_FT = [0, 2000, 4000, 6000, 8000, 10_000, 12_000] as const;

export const C98_TAKEOFF_FLAPS_20: DistanceTable = {
  id: 'takeoff-flaps-20',
  label: 'Decolagem — flaps 20°',
  figure: '5-9',
  pages: ['5-22', '5-23'],
  configuration: 'cargo-pod',
  flapsDeg: 20,
  pressureAltitudesFt: ALTITUDES_FT,
  temperaturesC: TEMPERATURES_C,

  conditions: [
    'Flaps 20°',
    '1900 RPM',
    'Separador inercial em NORMAL',
    'Aquecimento de cabine desligado',
    'Torque ajustado conforme a Figura 5-8',
    'Pista pavimentada, nivelada e seca',
    'Vento zero',
  ],

  notes: [
    'Empregar a técnica de pista curta especificada na Seção 4.',
    'Reduzir as distâncias em 10% a cada 11 nós de vento de proa. Com vento de cauda de até 10 nós, aumentar as distâncias em 10% a cada 2 nós.',
    'Em pista de grama seca, aumentar as distâncias em 15% da corrida no solo.',
    'Com o torque de decolagem ajustado abaixo do limite (1865 ft-lbs), aumentar as distâncias (corrida no solo e total) em 3% com o separador inercial em BYPASS; e aumentar a corrida no solo em 5% e as distâncias totais em 10% com o aquecimento de cabine ligado.',
    'Onde os valores foram substituídos por traços, os limites de temperatura da aeronave seriam largamente excedidos. As distâncias impressas em que a operação excede ligeiramente o limite de temperatura constam apenas para fins de interpolação.',
    'Para operações acima de 40 °C e abaixo das limitações de temperatura de operação, multiplicar as distâncias de decolagem de 40 °C por 1,2.',
  ],

  aboveTopTemperature: {
    factor: 1.2,
    note: 'Nota 6 da Figura 5-9: acima de 40 °C, as distâncias de 40 °C multiplicadas por 1,2. Válido apenas abaixo da limitação de temperatura de operação da aeronave (Figura 5-5).',
  },

  blocks: [
    {
      /* Página 5-23, "7300 Pounds". */
      weightLb: 7300,
      liftOffKias: 61,
      at50FtKias: 73,
      cells: [
        /*    -10 °C        0 °C         10 °C        20 °C        30 °C        40 °C   */
        [[760, 1345], [805, 1420], [855, 1500], [910, 1580], [960, 1665], [1015, 1755]], // SL
        [[855, 1500], [910, 1585], [970, 1680], [1025, 1775], [1085, 1870], [1185, 2045]], // 2000
        [[970, 1680], [1035, 1780], [1100, 1885], [1165, 1995], [1240, 2115], [1405, 2435]], // 4000
        [[1100, 1895], [1175, 2010], [1250, 2130], [1330, 2260], [1495, 2570], [1695, 2965]], // 6000
        [[1255, 2145], [1340, 2280], [1445, 2455], [1630, 2800], [1845, 3225], [2115, 3780]], // 8000
        [[1440, 2440], [1585, 2695], [1780, 3065], [2020, 3530], [2305, 4130], null], // 10000
        [[1750, 2985], [1970, 3405], [2225, 3910], [2540, 4575], [2930, 5460], null], // 12000
      ],
    },
    {
      /* Página 5-23, "7800 Pounds". */
      weightLb: 7800,
      liftOffKias: 64,
      at50FtKias: 76,
      cells: [
        [[895, 1585], [955, 1680], [1015, 1775], [1075, 1875], [1140, 1975], [1205, 2080]], // SL
        [[1015, 1775], [1080, 1880], [1145, 1990], [1215, 2105], [1290, 2225], [1410, 2440]], // 2000
        [[1150, 1995], [1225, 2115], [1300, 2245], [1385, 2375], [1470, 2525], [1675, 2925]], // 4000
        [[1305, 2250], [1395, 2395], [1485, 2545], [1580, 2700], [1780, 3085], [2030, 3595]], // 6000
        [[1495, 2555], [1595, 2725], [1720, 2940], [1945, 3375], [2215, 3920], [2550, 4645]], // 8000
        [[1715, 2920], [1890, 3240], [2130, 3705], [2425, 4310], [2785, 5100], null], // 10000
        [[2090, 3605], [2360, 4135], [2680, 4800], [3075, 5685], [3575, 6920], null], // 12000
      ],
    },
    {
      /* Página 5-22, "8300 Pounds". */
      weightLb: 8300,
      liftOffKias: 67,
      at50FtKias: 80,
      cells: [
        [[1050, 1870], [1120, 1980], [1190, 2095], [1260, 2215], [1335, 2340], [1415, 2470]], // SL
        [[1190, 2095], [1265, 2225], [1345, 2360], [1430, 2495], [1515, 2640], [1660, 2910]], // 2000
        [[1350, 2360], [1440, 2510], [1530, 2665], [1630, 2825], [1735, 3005], [1980, 3510]], // 4000
        [[1535, 2675], [1640, 2850], [1750, 3030], [1860, 3220], [2105, 3710], [2415, 4360]], // 6000
        [[1760, 3045], [1880, 3250], [2030, 3515], [2305, 4070], [2635, 4775], [3050, 5745]], // 8000
        [[2025, 3490], [2235, 3890], [2530, 4485], [2890, 5275], [3340, 6345], null], // 10000
        [[2480, 4350], [2810, 5040], [3205, 5915], [3700, 7135], [4330, 8965], null], // 12000
      ],
    },
    {
      /* Página 5-22, "8750 Pounds" — peso máximo de decolagem. */
      weightLb: 8750,
      liftOffKias: 70,
      at50FtKias: 83,
      cells: [
        [[1205, 2160], [1280, 2295], [1365, 2430], [1445, 2570], [1535, 2720], [1625, 2870]], // SL
        [[1360, 2430], [1455, 2580], [1545, 2740], [1645, 2905], [1745, 3075], [1910, 3400]], // 2000
        [[1550, 2745], [1655, 2920], [1760, 3105], [1875, 3295], [1995, 3510], [2290, 4135]], // 4000
        [[1765, 3115], [1890, 3325], [2015, 3540], [2145, 3765], [2435, 4370], [2805, 5195]], // 6000
        [[2025, 3560], [2165, 3805], [2345, 4125], [2670, 4815], [3065, 5715], [3565, 7005]], // 8000
        [[2335, 4090], [2585, 4580], [2930, 5325], [3370, 6350], [3915, 7790], null], // 10000
        [[2875, 5155], [3270, 6030], [3745, 7175], [4350, 8865], null, null], // 12000
      ],
    },
  ],
};
