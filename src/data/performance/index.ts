/**
 * Acesso às tabelas de performance.
 *
 * Ponto único de leitura: nenhuma parte do sistema importa um arquivo de
 * tabela diretamente. Acrescentar uma tabela nova é registrá-la aqui, e ela
 * passa a ser auditada pelos testes estruturais automaticamente.
 */

import { C98_TAKEOFF_FLAPS_20 } from './c98.takeoff20.ts';
import type { DistanceTable } from './types.ts';

/** Todas as tabelas cadastradas, para auditoria e para a tela. */
export const PERFORMANCE_TABLES: readonly DistanceTable[] = [
  C98_TAKEOFF_FLAPS_20,
];

export { C98_TAKEOFF_FLAPS_20 };
export type {
  AboveTopTemperature,
  DistanceTable,
  PublishedCell,
  WeightBlock,
} from './types.ts';
