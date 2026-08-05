/**
 * A régua dos desenhos da aeronave.
 *
 * Único lugar que sabe converter estação em posição na tela. As duas vistas —
 * de cima e de lado — usam esta função, e é isso que garante que a Zona 3 no
 * desenho de cima fique exatamente sobre a Zona 3 no desenho de lado.
 *
 * Devolve uma FRAÇÃO de 0 a 1, e não pixels: quem desenha multiplica pela
 * própria escala. Assim a mesma régua serve para o SVG do contorno, que
 * trabalha em unidades de `viewBox`, e para os botões em HTML, que trabalham
 * em porcentagem.
 *
 * A faixa desenhada é a faixa COTADA no manual, página 6-15: da estação 100,0,
 * onde começa o cargo pod, à 356,0, onde termina a Zona 6. Nada é desenhado
 * fora dela — um nariz ou uma cauda inventados dariam ao desenho uma proporção
 * que o manual não publica.
 */

/** Extremos cotados na página 6-15. */
export const STATION_RANGE = { fromIn: 100, toIn: 356 } as const;

const SPAN = STATION_RANGE.toIn - STATION_RANGE.fromIn;

/**
 * Posição de uma estação na faixa desenhada, de 0 (frente) a 1 (trás).
 *
 * Estações fora da faixa são presas ao extremo: melhor um item encostado na
 * borda do que um item desenhado fora do contorno da aeronave.
 */
export function fractionOfStation(stationIn: number): number {
  const raw = (stationIn - STATION_RANGE.fromIn) / SPAN;
  return Math.min(Math.max(raw, 0), 1);
}

/** Largura de um trecho entre duas estações, na mesma fração. */
export function fractionBetween(fromIn: number, toIn: number): number {
  return fractionOfStation(toIn) - fractionOfStation(fromIn);
}

/** A mesma posição em porcentagem, pronta para estilo em linha. */
export function percentOfStation(stationIn: number): string {
  return `${(fractionOfStation(stationIn) * 100).toFixed(3)}%`;
}

/** A mesma largura em porcentagem. */
export function percentBetween(fromIn: number, toIn: number): string {
  return `${(fractionBetween(fromIn, toIn) * 100).toFixed(3)}%`;
}
