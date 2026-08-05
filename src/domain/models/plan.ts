/**
 * Modelos do planejamento de missão.
 *
 * Representam o que o piloto digita — nada aqui vem do manual. As unidades
 * estão gravadas no nome de cada campo (`Kg` / `Lb`) para que seja impossível
 * somar grandezas diferentes por descuido.
 *
 * Convenção do sistema: pessoas em QUILOGRAMAS, todo o resto em LIBRAS.
 */

/** Um tripulante. O peso é informado em quilogramas. */
export interface CrewMember {
  readonly id: string;
  /** Função a bordo: Piloto, Copiloto, Mecânico, Mestre de Carga… */
  readonly role: string;
  readonly weightKg: number;
}

/**
 * Como a carga está presa, o que determina qual limite de zona vale.
 *
 * O manual publica limites bem diferentes para os dois casos — a zona 2 admite
 * 3.100 LB amarrada e 860 LB apenas contida por divisórias.
 */
export type CargoRestraint = 'amarrada' | 'sem-amarracao';

/**
 * O planejamento completo.
 *
 * `positionLoads` guarda o peso lançado em cada zona ou compartimento do
 * manual, indexado pelo `id` da posição. Posições não preenchidas não aparecem
 * no mapa e valem zero.
 */
export interface MissionPlan {
  readonly aircraftId: string;

  /**
   * Combustível a bordo, em libras.
   *
   * Na interface é informado como "Combustível mínimo da perna": é o mínimo que
   * a missão exige, e portanto o que se considera embarcado ao calcular o peso.
   * O aplicativo responde quanto ainda pode ser somado a esse valor.
   */
  readonly fuelLb: number;

  readonly crew: readonly CrewMember[];

  /**
   * Peso dos passageiros por estação de assento, em quilogramas.
   *
   * Indexado pelo `id` da estação. Estações vazias não aparecem no mapa.
   * É por estação, e não um total único, porque a centragem precisa saber
   * ONDE o peso está — um mesmo total muda o centro de gravidade conforme as
   * pessoas se sentem à frente ou atrás.
   */
  readonly passengerLoads: Readonly<Record<string, number>>;

  /**
   * Quantidade de passageiros a bordo. `null` quando não informada.
   *
   * Opcional de propósito: o peso total basta para o cálculo. A quantidade só
   * acrescenta o controle de assentos livres, que é informação, não bloqueio.
   */
  readonly passengerCount: number | null;

  readonly positionLoads: Readonly<Record<string, number>>;

  readonly cargoRestraint: CargoRestraint;
}

/** Planejamento vazio, usado ao abrir o aplicativo pela primeira vez. */
export function emptyPlan(aircraftId: string): MissionPlan {
  return {
    aircraftId,
    fuelLb: 0,
    crew: [],
    passengerLoads: {},
    passengerCount: null,
    positionLoads: {},
    /* Amarrada é o caso normal em missão de carga e o que o manual trata como
       máximo da baia. */
    cargoRestraint: 'amarrada',
  };
}
