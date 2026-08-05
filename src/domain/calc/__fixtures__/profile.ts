/**
 * Perfis de teste.
 *
 * `realProfile` usa os limites REAIS cadastrados a partir do manual, com um
 * peso básico fictício de 5.000 LB — o peso básico vem da ficha de pesagem de
 * cada cauda, não do manual, e não pode ser inventado no código de produção.
 *
 * `pendingProfile` reproduz o estado de uma aeronave ainda sem ficha de
 * pesagem, que é a situação real da FAB 2720 hoje.
 */

import { C98 } from '../../../data/aircraft/index.ts';
import { PENDING } from '../../../data/pending.ts';
import type { AircraftProfile } from '../../../data/aircraft/types.ts';

/** Peso básico fictício, apenas para exercitar as fórmulas. */
export const TEST_BEW_LB = 5000;

/** Aeronave com os limites do manual e um peso básico de teste. */
export function realProfile(
  overrides: { hasCargoPod?: boolean; passengerSeats?: number } = {},
): AircraftProfile {
  return {
    model: C98,
    registration: {
      id: 'teste',
      tail: 'TESTE 0000',
      basicEmptyWeightLb: TEST_BEW_LB,
      /* 5.000 LB × 192 pol. A estação 192 é a referência da fórmula de índice
         do manual — escolha neutra, que põe a aeronave vazia no meio do
         envelope e deixa os testes de PESO livres da centragem. */
      basicMoment: TEST_BEW_LB * 192,
      weighingDate: '2020-01-01',
      hasCargoPod: overrides.hasCargoPod ?? true,
      passengerSeats: overrides.passengerSeats ?? 9,
      seatingArrangement: 'escalonada',
    },
  };
}

/** Aeronave sem ficha de pesagem: o estado real antes do cadastro. */
export function pendingProfile(): AircraftProfile {
  return {
    model: C98,
    registration: {
      id: 'teste',
      tail: 'TESTE 0000',
      basicEmptyWeightLb: PENDING,
      basicMoment: PENDING,
      weighingDate: PENDING,
      hasCargoPod: true,
      passengerSeats: 9,
      seatingArrangement: 'escalonada',
    },
  };
}
