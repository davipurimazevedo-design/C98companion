/**
 * Consulta às tabelas de performance.
 *
 * Responsabilidade única: dado um peso, uma altitude-pressão e uma
 * temperatura, dizer QUAL célula do manual vale e devolvê-la. Nenhuma
 * correção é aplicada aqui — vento e nota de temperatura alta ficam em
 * `corrections.ts`, para que a consulta continue sendo uma leitura fiel da
 * página impressa.
 *
 * ## Como cada eixo é resolvido
 *
 * O manual não manda interpolar: manda ler no PRÓXIMO valor publicado acima
 * do pedido ("Conservative distances can be established by reading the chart
 * at the next higher value of weight, altitude and temperature", página 5-7),
 * e é assim que o próprio Sample Problem resolve — 8600 lb são lidos na
 * tabela de 8750.
 *
 * A mesma regra serve aos três eixos, e é toda a lógica de resolução que
 * existe:
 *
 * - peso 6000 lb lê o bloco de 7300 lb — mais pesado, distância maior;
 * - altitude abaixo do nível do mar lê o nível do mar;
 * - temperatura de −25 °C lê a coluna de −10 °C — mais quente, distância
 *   maior.
 *
 * Em todos os casos o valor lido é conservador. Por isso **fora da tabela só
 * acontece acima do topo de um eixo**, nunca abaixo do início.
 *
 * Trocar esta política por interpolação é substituir `nextAtOrAbove` — os
 * dados e a tela não mudam.
 */

import type {
  AboveTopTemperature,
  DistanceTable,
} from '../../data/performance/index.ts';

/** Um dos três eixos da tabela. */
export type Axis = 'peso' | 'altitude' | 'temperatura';

/** O que o piloto informou. */
export interface TableQuery {
  readonly weightLb: number;
  readonly pressureAltitudeFt: number;
  readonly temperatureC: number;
}

/** A célula lida, com os valores de eixo que de fato valeram. */
export interface TableReading {
  /**
   * Valores de eixo efetivamente usados. Não são os informados: são os do
   * manual, arredondados para cima. A tela mostra os dois, porque a diferença
   * entre "informei 8600" e "a tabela leu 8750" é a margem de conservadorismo
   * embutida no número — e o piloto precisa vê-la.
   */
  readonly weightLb: number;
  readonly pressureAltitudeFt: number;
  readonly temperatureC: number;

  readonly groundRollFt: number;
  readonly totalFt: number;

  readonly liftOffKias: number | null;
  readonly at50FtKias: number;

  /**
   * A temperatura informada passa do topo do eixo, e a tabela traz nota
   * autorizando operar assim. Os valores acima são os da coluna mais quente,
   * ainda SEM o fator da nota — quem o aplica é `corrections.ts`.
   */
  readonly aboveTopTemperature: AboveTopTemperature | null;
}

/** Por que não há distância publicada para o que foi pedido. */
export type ReadFailure =
  /** Acima do maior valor publicado naquele eixo. */
  | { readonly reason: 'fora-da-tabela'; readonly axis: Axis; readonly publishedMax: number }
  /** O manual imprime traço na célula: o limite de temperatura seria excedido. */
  | { readonly reason: 'limite-de-temperatura' };

export type Reading =
  | { readonly status: 'ready'; readonly value: TableReading }
  | { readonly status: 'unavailable'; readonly failure: ReadFailure };

/**
 * Índice do menor valor publicado que seja maior ou igual ao pedido.
 *
 * `null` quando o pedido passa do último valor — o único caso em que a tabela
 * não tem resposta conservadora a dar. Espera a lista já em ordem crescente,
 * o que um teste de `data/performance` garante.
 */
export function nextAtOrAbove(
  values: readonly number[],
  requested: number,
): number | null {
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value !== undefined && value >= requested) return i;
  }
  return null;
}

/** Último valor de um eixo, para informar o máximo publicado. */
function topOf(values: readonly number[]): number {
  return values[values.length - 1] ?? 0;
}

function unavailable(failure: ReadFailure): Reading {
  return { status: 'unavailable', failure };
}

/**
 * Lê a distância publicada para as condições informadas.
 *
 * Nunca extrapola e nunca estima: ou devolve uma célula que está impressa na
 * página, ou diz por que não há uma.
 */
export function readTable(table: DistanceTable, query: TableQuery): Reading {
  const weights = table.blocks.map((block) => block.weightLb);

  const weightIndex = nextAtOrAbove(weights, query.weightLb);
  if (weightIndex === null) {
    return unavailable({
      reason: 'fora-da-tabela',
      axis: 'peso',
      publishedMax: topOf(weights),
    });
  }

  const altitudeIndex = nextAtOrAbove(
    table.pressureAltitudesFt,
    query.pressureAltitudeFt,
  );
  if (altitudeIndex === null) {
    return unavailable({
      reason: 'fora-da-tabela',
      axis: 'altitude',
      publishedMax: topOf(table.pressureAltitudesFt),
    });
  }

  /* Acima da coluna mais quente, só há resposta se o manual publicar a nota
     que autoriza — e aí a leitura é a da própria coluna mais quente. */
  const withinAxis = nextAtOrAbove(table.temperaturesC, query.temperatureC);
  const aboveTop = withinAxis === null ? table.aboveTopTemperature : null;
  if (withinAxis === null && !aboveTop) {
    return unavailable({
      reason: 'fora-da-tabela',
      axis: 'temperatura',
      publishedMax: topOf(table.temperaturesC),
    });
  }
  const temperatureIndex = withinAxis ?? table.temperaturesC.length - 1;

  const block = table.blocks[weightIndex];
  const cell = block?.cells[altitudeIndex]?.[temperatureIndex];
  if (!block || !cell) {
    return unavailable({ reason: 'limite-de-temperatura' });
  }

  const [groundRollFt, totalFt] = cell;

  return {
    status: 'ready',
    value: {
      weightLb: block.weightLb,
      pressureAltitudeFt: table.pressureAltitudesFt[altitudeIndex] ?? 0,
      temperatureC: table.temperaturesC[temperatureIndex] ?? 0,
      groundRollFt,
      totalFt,
      liftOffKias: block.liftOffKias,
      at50FtKias: block.at50FtKias,
      aboveTopTemperature: aboveTop,
    },
  };
}

/** Mensagem em português para exibir no lugar do resultado. */
export function describeFailure(failure: ReadFailure): string {
  if (failure.reason === 'limite-de-temperatura') {
    return 'O manual não publica distância para esta combinação: os limites de temperatura da aeronave seriam excedidos.';
  }

  const max = new Intl.NumberFormat('pt-BR').format(failure.publishedMax);
  switch (failure.axis) {
    case 'peso':
      return `Peso acima do máximo tabelado. A tabela vai até ${max} lb.`;
    case 'altitude':
      return `Altitude-pressão acima do máximo tabelado. A tabela vai até ${max} ft.`;
    case 'temperatura':
      return `Temperatura acima do máximo tabelado. A tabela vai até ${max} °C.`;
  }
}
