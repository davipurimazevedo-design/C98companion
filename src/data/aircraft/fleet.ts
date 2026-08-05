/**
 * Frota cadastrada.
 *
 * Uma entrada por matrícula. Estes dados vêm da FICHA DE PESAGEM de cada
 * aeronave — não do manual do modelo. Duas caudas do mesmo C-98 têm pesos
 * básicos diferentes, conforme os equipamentos instalados.
 *
 * Estes valores NÃO constam do Pilot's Operating Handbook: vêm do registro de
 * pesagem que acompanha cada cauda (Airplane Weighing Form / Weight and Balance
 * Record), normalmente no envelope plástico no fim do manual da aeronave.
 *
 * Conferir a cada nova pesagem: o peso básico entra em todos os resultados da
 * tela, e o momento básico é o que torna a centragem possível.
 */

import { PENDING } from '../pending.ts';
import type { AircraftRegistration } from './types.ts';

export const FLEET: readonly AircraftRegistration[] = [
  {
    id: 'fab-2720',
    tail: 'FAB 2720',

    /*
     * Valores transcritos da ficha de pesagem da aeronave, quadro RESULTADOS,
     * em 04/08/2026. Substituem os 5.100 e 5.233 LB informados de memória antes
     * de o documento estar em mãos.
     *
     * A ficha declara, além destes: POSIÇÃO DO CG 191,8 in e ÍNDICE BÁSICO 983.
     * Ambos conferem — 982.577,4 ÷ 5.123,0 = 191,797, que a ficha arredonda para
     * 191,8; e o índice é o próprio momento dividido por 1.000.
     */

    /** PESO BÁSICO (lb) da ficha de pesagem. */
    basicEmptyWeightLb: 5123,

    /**
     * MOMENTO BÁSICO (lb·in) da ficha.
     *
     * É o valor preciso: o braço de 191,8 in impresso ao lado é ele arredondado.
     * Guardar o momento, e não o braço, evita reintroduzir esse arredondamento
     * em todo cálculo de centragem.
     */
    basicMoment: 982_577.4,

    /** Data da última pesagem, formato AAAA-MM-DD. */
    weighingDate: PENDING,

    /** Cargo pod instalado: compartimentos A a D disponíveis. */
    hasCargoPod: true,

    /**
     * 9 assentos de passageiro, além dos dois dianteiros da tripulação —
     * total de 11 lugares, confirmado pelo operador em 03/08/2026. Confere com
     * as configurações de assentos descritas na página 6-16 do manual.
     */
    passengerSeats: 9,

    /**
     * Arranjo escalonado, confirmado pelo operador em 03/08/2026.
     * Define os braços dos assentos traseiros — ver `c98.seats.ts`.
     */
    seatingArrangement: 'escalonada',
  },
];

/** Matrícula pré-selecionada ao abrir um planejamento novo. */
export const DEFAULT_AIRCRAFT_ID = 'fab-2720';
