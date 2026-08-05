/**
 * Posições de carregamento do C-98 Caravan.
 *
 * Fonte: MAXIMUM ZONE/COMPARTMENT LOADINGS, manual página 6-22.
 * Estações do centro de gravidade conferidas na figura da página 6-15.
 *
 * O manual publica dois limites por zona de cabine:
 *
 *   SECURED BY TIE-DOWNS      — máximo da baia com a carga amarrada.
 *   UNSECURED USING PARTITIONS — carga contida por divisórias, sem amarração.
 *                                Exige densidade ≤ 7,9 lb/ft³ e baia ≥ 75% cheia.
 *
 * Os compartimentos do cargo pod têm um único limite publicado, que o aplicativo
 * aplica nos dois modos.
 */

import type { LoadPosition } from './types.ts';

export const C98_POSITIONS: readonly LoadPosition[] = [
  /* ---------- Zonas da cabine (estações 155,4 a 356,0) ---------- */
  {
    id: 'zona-1',
    label: 'Zona 1',
    group: 'cabine',
    armIn: 172.0,
    fromIn: 155.4,
    toIn: 188.7,
    maxSecuredLb: 1780,
    maxUnsecuredLb: 415,
    note: 'Estações 155,4 a 188,7 · 52,9 ft³',
  },
  {
    id: 'zona-2',
    label: 'Zona 2',
    group: 'cabine',
    armIn: 217.8,
    fromIn: 188.7,
    toIn: 246.8,
    maxSecuredLb: 3100,
    maxUnsecuredLb: 860,
    note: 'Estações 188,7 a 246,8 · 109,0 ft³',
  },
  {
    id: 'zona-3',
    label: 'Zona 3',
    group: 'cabine',
    armIn: 264.4,
    fromIn: 246.8,
    toIn: 282.0,
    maxSecuredLb: 1900,
    maxUnsecuredLb: 495,
    note: 'Estações 246,8 a 282,0 · 63,0 ft³',
  },
  {
    id: 'zona-4',
    label: 'Zona 4',
    group: 'cabine',
    armIn: 294.5,
    fromIn: 282.0,
    toIn: 307.0,
    maxSecuredLb: 1380,
    maxUnsecuredLb: 340,
    note: 'Estações 282,0 a 307,0 · 43,5 ft³',
  },
  {
    id: 'zona-5',
    label: 'Zona 5',
    group: 'cabine',
    armIn: 319.5,
    fromIn: 307.0,
    toIn: 332.0,
    maxSecuredLb: 1270,
    maxUnsecuredLb: 315,
    note: 'Estações 307,0 a 332,0 · 40,1 ft³',
  },
  {
    id: 'zona-6',
    label: 'Zona 6',
    group: 'cabine',
    armIn: 344.0,
    fromIn: 332.0,
    toIn: 356.0,
    maxSecuredLb: 320,
    maxUnsecuredLb: 245,
    note: 'Piso elevado, estações 332,0 a 356,0 · 31,5 ft³',
  },

  /* ---------- Compartimentos do cargo pod ---------- */
  {
    id: 'pod-a',
    label: 'Pod A',
    group: 'pod',
    armIn: 132.4,
    fromIn: 100.0,
    toIn: 154.75,
    maxSecuredLb: 230,
    maxUnsecuredLb: 230,
    note: 'Estações 100,0 a 154,75 · 23,4 ft³',
  },
  {
    id: 'pod-b',
    label: 'Pod B',
    group: 'pod',
    armIn: 182.1,
    fromIn: 154.75,
    toIn: 209.35,
    maxSecuredLb: 310,
    maxUnsecuredLb: 310,
    note: 'Estações 154,75 a 209,35 · 31,5 ft³',
  },
  {
    id: 'pod-c',
    label: 'Pod C',
    group: 'pod',
    armIn: 233.4,
    fromIn: 209.35,
    toIn: 257.35,
    maxSecuredLb: 270,
    maxUnsecuredLb: 270,
    note: 'Estações 209,35 a 257,35 · 27,8 ft³',
  },
  {
    id: 'pod-d',
    label: 'Pod D',
    group: 'pod',
    armIn: 287.6,
    fromIn: 257.35,
    toIn: 332.0,
    maxSecuredLb: 280,
    maxUnsecuredLb: 280,
    note: 'Estações 257,35 a 332,0 · 28,8 ft³',
  },
];
