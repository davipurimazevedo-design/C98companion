/**
 * Tabela de conferência.
 *
 * Recolhida por padrão — no uso normal o cartão de resumo basta. Serve para o
 * momento em que o piloto precisa conferir item a item contra o papel, antes de
 * assinar o manifesto.
 *
 * Três colunas: o item, o peso em quilogramas e o peso em libras. TODA linha
 * traz as duas unidades, inclusive carga e combustível — quem confere não
 * deveria ter de converter de cabeça justamente na hora da conferência.
 *
 * Duas decisões de arredondamento, ambas a favor de quem soma no papel:
 *
 *   - os quilogramas saem INTEIROS: centésimos de quilo poluem a coluna sem
 *     decidir nada;
 *   - o total em quilogramas é a SOMA DAS LINHAS já arredondadas, e não a
 *     conversão do total em libras. As duas formas diferem em um ou dois
 *     quilos; o que precisa fechar quando somado à mão é a coluna. Nenhum
 *     limite do manual é expresso em quilogramas, então nada depende disso.
 *
 * As duas colunas se comportam DIFERENTE de propósito, e isso não é descuido:
 * o total em libras é o peso real do planejamento, o mesmo número da barra do
 * topo e o que se compara com o limite de decolagem. Ele não pode ser a soma de
 * valores arredondados. Somada à mão, a coluna de libras pode portanto divergir
 * do rodapé em uma ou duas libras — sempre a favor da autoridade do total.
 */

import { kgToLb, lbToKg, lbToLitres } from '../../data/conversion.ts';
import type { CargoUnit, FuelUnit } from '../../store/draft.ts';
import type { LoadPosition } from '../../data/aircraft/types.ts';
import { isReady, type PlanResult } from '../../domain/calc/index.ts';
import type { MissionPlan } from '../../domain/models/plan.ts';
import { DASH, formatKg, formatL, formatLb } from '../../utils/format.ts';
import styles from './ManifestTable.module.css';

interface ManifestTableProps {
  readonly result: PlanResult;
  readonly plan: MissionPlan;
  readonly basicEmptyWeightLb: number | null;
  readonly units: ManifestUnits;
}

/** Uma linha da conferência. */
export interface ManifestRow {
  readonly label: string;
  /** Peso em quilogramas, já arredondado. `null` quando não cadastrado. */
  readonly kg: number | null;
  readonly lb: number | null;
}

/** Unidades escolhidas na tela, para a conferência repetir o que foi digitado. */
export interface ManifestUnits {
  readonly cargo: CargoUnit;
  readonly fuel: FuelUnit;
  readonly fuelDensityLbPerGal: number | null;
}

/** Quilogramas exibidos: sempre inteiros. */
function kg(value: number): number {
  return Math.round(value);
}

/**
 * Monta as linhas da conferência, na mesma ordem em que aparecem na tela.
 *
 * Função pura e exportada para poder ser conferida por teste — é a tabela que
 * o piloto usa para bater o planejamento contra o papel.
 */
export function buildManifestRows(
  result: PlanResult,
  plan: MissionPlan,
  basicEmptyWeightLb: number | null,
  units: ManifestUnits,
): ManifestRow[] {
  const { totals, positions } = result;

  const rows: ManifestRow[] = [
    {
      label: 'Peso básico vazio',
      kg: basicEmptyWeightLb === null ? null : kg(lbToKg(basicEmptyWeightLb)),
      lb: basicEmptyWeightLb,
    },
  ];

  for (const member of plan.crew) {
    rows.push({
      label: member.role,
      kg: kg(member.weightKg),
      lb: kgToLb(member.weightKg),
    });
  }

  /* Assento a assento, como no manifesto do manual: é o que permite conferir
     onde cada pessoa está sentada, e não só quanto pesam somadas. */
  const occupied = result.seats.filter(
    (seat) => (plan.passengerLoads[seat.id] ?? 0) > 0,
  );
  for (const seat of occupied) {
    const weightKg = plan.passengerLoads[seat.id] ?? 0;
    rows.push({
      label: seat.label,
      kg: kg(weightKg),
      lb: kgToLb(weightKg),
    });
  }

  if (occupied.length === 0) {
    rows.push({
      label:
        plan.passengerCount === null
          ? 'Passageiros'
          : `Passageiros (${plan.passengerCount})`,
      kg: kg(totals.passengerKg),
      lb: totals.passengerLb,
    });
  }

  /* Só as posições realmente carregadas: uma tabela com dez zeros não ajuda a
     conferir nada. */
  const loaded = positions.filter(
    (position: LoadPosition) => (plan.positionLoads[position.id] ?? 0) > 0,
  );
  for (const position of loaded) {
    const lb = plan.positionLoads[position.id] ?? 0;
    rows.push({ label: position.label, kg: kg(lbToKg(lb)), lb });
  }

  /* O volume vai no rótulo, e não numa quarta coluna: numa tela de 375 px a
     coluna extra custaria mais do que informa. */
  const litres =
    units.fuel === 'L' && units.fuelDensityLbPerGal !== null
      ? ` (${formatL(lbToLitres(totals.fuelLb, units.fuelDensityLbPerGal))} L)`
      : '';

  rows.push({
    label: `Combustível${litres}`,
    kg: kg(lbToKg(totals.fuelLb)),
    lb: totals.fuelLb,
  });

  return rows;
}

/** Soma da coluna de quilogramas, exatamente como ela é exibida. */
export function manifestTotalKg(rows: readonly ManifestRow[]): number {
  return rows.reduce((sum, row) => sum + (row.kg ?? 0), 0);
}

export function ManifestTable({
  result,
  plan,
  basicEmptyWeightLb,
  units,
}: ManifestTableProps) {
  const rows = buildManifestRows(result, plan, basicEmptyWeightLb, units);
  const totalLb = isReady(result.availability)
    ? result.availability.value.totalWeightLb
    : null;
  const totalKg = manifestTotalKg(rows);

  return (
    <details className={styles.wrapper}>
      <summary className={styles.summary}>Conferência do carregamento</summary>

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col" className={styles.right}>
                KG
              </th>
              <th scope="col" className={styles.right}>
                LB
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.label}-${index}`}>
                <td>{row.label}</td>
                <td className={`${styles.right} ${styles.number}`}>
                  {row.kg === null ? DASH : formatKg(row.kg)}
                </td>
                <td className={`${styles.right} ${styles.number}`}>
                  {row.lb === null ? DASH : formatLb(row.lb)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Peso total</th>
              <td className={`${styles.right} ${styles.number}`}>
                {formatKg(totalKg)}
              </td>
              <td className={`${styles.right} ${styles.number}`}>
                {totalLb === null ? DASH : formatLb(totalLb)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </details>
  );
}
