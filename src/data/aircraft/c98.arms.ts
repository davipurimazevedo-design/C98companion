/**
 * Braços de momento do C-98 Caravan.
 *
 * Fonte: cabeçalhos das tabelas da Figura 6-15 (páginas 6-44 a 6-54) e o
 * diagrama de estações da página 6-15. Os dois conferem entre si, e ambos
 * conferem com a aritmética do exemplo resolvido da página 6-55.
 *
 * Todos em POLEGADAS atrás do datum (estação 0,0). O momento de um item é
 * `peso × braço`; o manual exibe `momento/1000`.
 *
 * O braço do COMBUSTÍVEL não está aqui: ele varia com a quantidade embarcada, e
 * por isso mora em `c98.fuelMoment.ts`, como tabela.
 */

/** Assentos do piloto e do passageiro dianteiro. Tabela da página 6-44. */
export const CREW_ARM_IN = 135.5;

/**
 * Quantos tripulantes usam o braço dianteiro fixo antes de a tripulação
 * passar a ocupar assentos da cabine.
 *
 * São os dois assentos 1 e 2, exclusivos de piloto e copiloto — nunca de um
 * tripulante extra, mesmo que a aeronave leve só um deles a bordo.
 */
export const FRONT_CREW_SEATS = 2;

/**
 * Fórmula de índice do manifesto de carga, página 6-15.
 *
 * Não é usada no cálculo do aplicativo — que trabalha com momento direto, mais
 * preciso — mas fica registrada porque é como o índice impresso no manifesto é
 * obtido, e alguém pode precisar conferir um contra o outro.
 *
 *   ÍNDICE BÁSICO   = peso × (braço − 192) / 500 + 500
 *   ÍNDICE DE ITEM  = peso × (braço − 192) / 500   (se negativo, subtrair de 1000)
 */
export const INDEX_REFERENCE_ARM_IN = 192;
export const INDEX_DIVISOR = 500;
export const INDEX_OFFSET = 500;
