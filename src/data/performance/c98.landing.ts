/**
 * Distância de pouso — flaps 30°, short field, cargo pod instalado.
 *
 * Fonte: POH Section 5, Figura 5-23, páginas 5-59 e 5-60, Revision 23.
 *
 * Os pesos são outros que os da decolagem — 8500 a 7000 lb, contra 8750 a
 * 7300 — porque o peso máximo de pouso é 8500 lb. Um pouso acima disso não
 * tem distância publicada, e o motor recusa em vez de inventar.
 *
 * A tabela publica uma velocidade só, a de travessia dos 50 pés: a aeronave
 * já está no ar quando ela começa a valer.
 */

import type { DistanceTable } from './types.ts';

/** Colunas de temperatura, em graus Celsius. Página 5-59. */
const TEMPERATURES_C = [-10, 0, 10, 20, 30, 40] as const;

/** Linhas de altitude-pressão, em pés. "SL" é o nível do mar. */
const ALTITUDES_FT = [0, 2000, 4000, 6000, 8000, 10_000, 12_000] as const;

export const C98_LANDING: DistanceTable = {
  id: 'landing',
  label: 'Pouso — flaps 30°',
  figure: '5-23',
  pages: ['5-59', '5-60'],
  configuration: 'cargo-pod',
  flapsDeg: 30,
  pressureAltitudesFt: ALTITUDES_FT,
  temperaturesC: TEMPERATURES_C,

  conditions: [
    'Flaps 30°',
    'Manete de potência em marcha lenta após transpor os obstáculos; beta (manete contra a mola) após o toque',
    'Manete de hélice em MAX',
    'Frenagem máxima',
    'Pista pavimentada, nivelada e seca',
    'Vento zero',
  ],

  notes: [
    'Empregar a técnica de pista curta especificada na Seção 4.',
    'Reduzir as distâncias em 10% a cada 11 nós de vento de proa. Com vento de cauda de até 10 nós, aumentar as distâncias em 10% a cada 2 nós.',
    'Em pista de grama seca, aumentar as distâncias em 40% da corrida no solo.',
    'Se for necessário pousar com os flaps recolhidos, aumentar a velocidade de aproximação em 15 KIAS e prever distâncias 40% maiores.',
    'O uso de reverso máximo após o toque reduz a corrida no solo em aproximadamente 10%.',
    'Onde os valores foram substituídos por traços, os limites de temperatura da aeronave seriam largamente excedidos. As distâncias impressas em que a operação excede ligeiramente o limite de temperatura constam apenas para fins de interpolação.',
  ],

  /* A Figura 5-23 não traz nota autorizando operar acima de 40 °C. */
  aboveTopTemperature: null,

  blocks: [
    {
      /* Página 5-60, "7000 Pounds". */
      weightLb: 7000,
      liftOffKias: null,
      at50FtKias: 71,
      cells: [
        /*   -10 °C       0 °C         10 °C        20 °C        30 °C        40 °C   */
        [[690, 1410], [715, 1450], [740, 1485], [765, 1525], [790, 1565], [820, 1600]], // SL
        [[740, 1485], [770, 1530], [795, 1570], [825, 1610], [850, 1650], [880, 1690]], // 2000
        [[795, 1570], [825, 1615], [855, 1660], [885, 1700], [915, 1745], [950, 1790]], // 4000
        [[860, 1660], [890, 1705], [925, 1755], [955, 1800], [990, 1845], [1020, 1895]], // 6000
        [[925, 1760], [960, 1810], [995, 1860], [1030, 1910], [1065, 1955], [1100, 2005]], // 8000
        [[1000, 1865], [1040, 1915], [1075, 1970], [1115, 2025], [1150, 2075], null], // 10000
        [[1080, 1980], [1125, 2035], [1165, 2090], [1205, 2150], [1245, 2205], null], // 12000
      ],
    },
    {
      /* Página 5-60, "7500 Pounds". */
      weightLb: 7500,
      liftOffKias: null,
      at50FtKias: 73,
      cells: [
        [[740, 1480], [765, 1520], [795, 1565], [820, 1605], [850, 1645], [880, 1685]], // SL
        [[795, 1565], [825, 1605], [855, 1650], [885, 1695], [915, 1740], [945, 1780]], // 2000
        [[855, 1650], [885, 1700], [920, 1745], [950, 1790], [985, 1840], [1015, 1885]], // 4000
        [[920, 1750], [955, 1800], [990, 1845], [1025, 1895], [1060, 1945], [1095, 1995]], // 6000
        [[995, 1850], [1030, 1905], [1070, 1960], [1105, 2010], [1145, 2065], [1185, 2115]], // 8000
        [[1075, 1965], [1115, 2020], [1155, 2075], [1195, 2135], [1235, 2190], null], // 10000
        [[1160, 2085], [1205, 2145], [1250, 2205], [1295, 2265], [1340, 2325], null], // 12000
      ],
    },
    {
      /* Página 5-59, "8000 Pounds". */
      weightLb: 8000,
      liftOffKias: null,
      at50FtKias: 75,
      cells: [
        [[785, 1555], [815, 1600], [845, 1640], [875, 1685], [905, 1730], [935, 1770]], // SL
        [[845, 1640], [880, 1690], [910, 1735], [940, 1780], [975, 1825], [1005, 1870]], // 2000
        [[910, 1735], [945, 1785], [980, 1835], [1015, 1885], [1050, 1930], [1085, 1980]], // 4000
        [[980, 1835], [1020, 1890], [1055, 1940], [1095, 1995], [1130, 2045], [1170, 2100]], // 6000
        [[1060, 1945], [1100, 2000], [1140, 2060], [1180, 2115], [1220, 2170], [1260, 2225]], // 8000
        [[1145, 2065], [1185, 2125], [1230, 2185], [1275, 2245], [1315, 2305], null], // 10000
        [[1235, 2195], [1285, 2255], [1330, 2320], [1380, 2385], [1425, 2450], null], // 12000
      ],
    },
    {
      /* Página 5-59, "8500 Pounds" — peso máximo de pouso. */
      weightLb: 8500,
      liftOffKias: null,
      at50FtKias: 78,
      cells: [
        [[835, 1625], [865, 1670], [900, 1715], [930, 1765], [965, 1810], [995, 1855]], // SL
        [[900, 1715], [935, 1765], [965, 1815], [1000, 1865], [1035, 1910], [1070, 1960]], // 2000
        [[970, 1815], [1005, 1865], [1040, 1920], [1080, 1970], [1115, 2020], [1150, 2075]], // 4000
        [[1045, 1920], [1080, 1975], [1120, 2030], [1160, 2085], [1200, 2140], [1240, 2195]], // 6000
        [[1125, 2035], [1170, 2095], [1210, 2155], [1255, 2215], [1295, 2270], [1340, 2330]], // 8000
        [[1215, 2160], [1260, 2225], [1310, 2290], [1355, 2350], [1400, 2415], null], // 10000
        [[1315, 2295], [1365, 2365], [1415, 2430], [1465, 2500], [1515, 2565], null], // 12000
      ],
    },
  ],
};
