/**
 * Distância de decolagem — flaps 0°, cargo pod instalado.
 *
 * Fonte: POH Section 5, Figura 5-9A, páginas 5-24 e 5-25, Revision 23.
 *
 * Duas diferenças que importam em relação à tabela de flaps 20°:
 *
 * - O eixo de temperatura é OUTRO: de −20 a 10 °C, contra −10 a 40 °C. É a
 *   razão de cada tabela carregar os próprios eixos em vez de um eixo comum.
 * - Não há nota autorizando operar acima da coluna mais quente. Acima de
 *   10 °C esta tabela simplesmente não publica distância.
 *
 * As velocidades são as mesmas nos quatro pesos — 83 e 104 KIAS —, como o
 * manual imprime.
 */

import type { DistanceTable } from './types.ts';

/** Colunas de temperatura, em graus Celsius. Página 5-24. */
const TEMPERATURES_C = [-20, -10, 0, 10] as const;

/** Linhas de altitude-pressão, em pés. "SL" é o nível do mar. */
const ALTITUDES_FT = [0, 2000, 4000, 6000, 8000, 10_000, 12_000] as const;

export const C98_TAKEOFF_FLAPS_0: DistanceTable = {
  id: 'takeoff-flaps-0',
  label: 'Decolagem — flaps 0°',
  figure: '5-9A',
  pages: ['5-24', '5-25'],
  configuration: 'cargo-pod',
  flapsDeg: 0,
  pressureAltitudesFt: ALTITUDES_FT,
  temperaturesC: TEMPERATURES_C,

  conditions: [
    'Flaps 0°',
    '1900 RPM',
    'Separador inercial em NORMAL',
    'Aquecimento de cabine desligado',
    'Torque ajustado conforme a Figura 5-8',
    'Pista pavimentada, nivelada e seca',
    'Vento zero',
  ],

  notes: [
    'Empregar a técnica de decolagem com fluido anti-gelo tipo II, III ou IV especificada na Seção 4.',
    'Reduzir as distâncias em 10% a cada 11 nós de vento de proa. Com vento de cauda de até 10 nós, aumentar as distâncias em 10% a cada 2 nós.',
    'Em pista de grama seca, aumentar as distâncias em 15% da corrida no solo.',
    'Com o torque de decolagem ajustado abaixo do limite (1865 ft-lbs), aumentar as distâncias (corrida no solo e total) em 3% com o separador inercial em BYPASS; e aumentar a corrida no solo em 5% e as distâncias totais em 10% com o aquecimento de cabine ligado.',
    'Onde os valores foram substituídos por traços, os limites de temperatura da aeronave seriam largamente excedidos. As distâncias impressas em que a operação excede ligeiramente o limite de temperatura constam apenas para fins de interpolação.',
  ],

  /* A Figura 5-9A não traz a nota 6 da Figura 5-9. */
  aboveTopTemperature: null,

  blocks: [
    {
      /* Página 5-25, bloco "7300". */
      weightLb: 7300,
      liftOffKias: 83,
      at50FtKias: 104,
      cells: [
        /*    -20 °C        -10 °C        0 °C         10 °C   */
        [[1405, 2605], [1500, 2780], [1595, 2960], [1695, 3145]], // SL
        [[1585, 2945], [1695, 3145], [1810, 3355], [1925, 3570]], // 2000
        [[1800, 3340], [1925, 3575], [2055, 3820], [2190, 4075]], // 4000
        [[2055, 3810], [2200, 4085], [2350, 4375], [2505, 4675]], // 6000
        [[2350, 4375], [2520, 4700], [2695, 5040], [2910, 5475]], // 8000
        [[2705, 5050], [2905, 5440], [3220, 6125], [3675, 7190]], // 10000
        [[3170, 5995], [3595, 6960], [4115, 8215], [4750, 9865]], // 12000
      ],
    },
    {
      /* Página 5-25, bloco "7800". */
      weightLb: 7800,
      liftOffKias: 83,
      at50FtKias: 104,
      cells: [
        [[1510, 2810], [1615, 2995], [1720, 3190], [1830, 3395]], // SL
        [[1710, 3175], [1825, 3390], [1950, 3620], [2075, 3855]], // 2000
        [[1940, 3605], [2080, 3860], [2220, 4125], [2365, 4400]], // 4000
        [[2215, 4115], [2370, 4415], [2535, 4730], [2705, 5055]], // 6000
        [[2535, 4730], [2720, 5085], [2910, 5455], [3145, 5930]], // 8000
        [[2920, 5465], [3135, 5890], [3480, 6640], [3975, 7810]], // 10000
        [[3430, 6495], [3890, 7555], [4460, 8935], [5155, 10_765]], // 12000
      ],
    },
    {
      /* Página 5-25, bloco "8300". */
      weightLb: 8300,
      liftOffKias: 83,
      at50FtKias: 104,
      cells: [
        [[1620, 3015], [1730, 3220], [1845, 3430], [1965, 3650]], // SL
        [[1835, 3410], [1960, 3645], [2095, 3890], [2230, 4145]], // 2000
        [[2085, 3875], [2230, 4150], [2385, 4435], [2540, 4735]], // 4000
        [[2380, 4430], [2550, 4750], [2725, 5090], [2910, 5445]], // 6000
        [[2725, 5090], [2925, 5475], [3130, 5880], [3385, 6395]], // 8000
        [[3140, 5890], [3375, 6350], [3750, 7170], [4285, 8450]], // 10000
        [[3690, 7010], [4195, 8170], [4810, 9685], [5570, 11_705]], // 12000
      ],
    },
    {
      /* Página 5-24, bloco "8750" — peso máximo de decolagem. */
      weightLb: 8750,
      liftOffKias: 83,
      at50FtKias: 104,
      cells: [
        [[1720, 3205], [1840, 3420], [1960, 3645], [2085, 3880]], // SL
        [[1950, 3625], [2085, 3875], [2225, 4140], [2370, 4410]], // 2000
        [[2215, 4125], [2370, 4415], [2535, 4725], [2700, 5045]], // 4000
        [[2530, 4715], [2710, 5060], [2900, 5425], [3095, 5805]], // 6000
        [[2900, 5425], [3110, 5835], [3335, 6270], [3605, 6825]], // 8000
        [[3340, 6280], [3590, 6775], [3995, 7660], [4575, 9045]], // 10000
        [[3930, 7485], [4475, 8740], [5135, 10_385], [5955, 12_585]], // 12000
      ],
    },
  ],
};
