/**
 * Acesso às tabelas de performance.
 *
 * Ponto único de leitura: nenhuma parte do sistema importa um arquivo de
 * tabela diretamente. Acrescentar uma tabela nova é registrá-la aqui, e ela
 * passa a ser auditada pelos testes estruturais automaticamente.
 *
 * A decolagem com flaps 0° (Figura 5-9A) foi transcrita e depois retirada por
 * decisão do esquadrão: aquela tabela vale para a técnica de decolagem com
 * fluido anti-gelo tipo II, III ou IV, e sua coluna mais quente é 10 °C — em
 * operação no Brasil ela responderia "fora da tabela" quase sempre. A
 * transcrição continua recuperável no commit d423d1e, caso volte a fazer
 * falta.
 */

import { C98_LANDING } from './c98.landing.ts';
import { C98_TAKEOFF_FLAPS_20 } from './c98.takeoff20.ts';
import type { DistanceTable } from './types.ts';

/** Todas as tabelas cadastradas, para auditoria e para a tela. */
export const PERFORMANCE_TABLES: readonly DistanceTable[] = [
  C98_TAKEOFF_FLAPS_20,
  C98_LANDING,
];

export { C98_LANDING, C98_TAKEOFF_FLAPS_20 };
export type {
  AboveTopTemperature,
  DistanceTable,
  PublishedCell,
  WeightBlock,
} from './types.ts';
