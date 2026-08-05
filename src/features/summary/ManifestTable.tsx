/**
 * Tabela de conferência.
 *
 * Recolhida por padrão — no uso normal o cartão de resumo basta. Serve para o
 * momento em que o piloto precisa conferir item a item contra o papel, antes de
 * assinar o manifesto.
 *
 * Mostra o peso em libras de tudo que compõe o total, na mesma ordem em que
 * aparece na tela, e o peso original em quilogramas onde ele foi digitado assim
 * — para que a conferência não dependa de refazer a conversão de cabeça.
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

interface Row {
  readonly label: string;
  readonly origin: string | null;
  readonly lb: number | null;
}

/** Unidades escolhidas na tela, para repetir na coluna "Informado". */
export interface ManifestUnits {
  readonly cargo: CargoUnit;
  readonly fuel: FuelUnit;
  readonly fuelDensityLbPerGal: number | null;
}

function buildRows(
  result: PlanResult,
  plan: MissionPlan,
  basicEmptyWeightLb: number | null,
  units: ManifestUnits,
): Row[] {
  const { totals, positions } = result;
  const rows: Row[] = [
    {
      label: 'Peso básico vazio',
      origin: null,
      lb: basicEmptyWeightLb,
    },
  ];

  for (const member of plan.crew) {
    rows.push({
      label: member.role,
      origin: `${formatKg(member.weightKg)} kg`,
      lb: kgToLb(member.weightKg),
    });
  }

  rows.push({
    label:
      plan.passengerCount === null
        ? 'Passageiros'
        : `Passageiros (${plan.passengerCount})`,
    origin: `${formatKg(totals.passengerKg)} kg`,
    lb: totals.passengerLb,
  });

  /* Só as posições realmente carregadas: uma tabela com dez zeros não ajuda a
     conferir nada. */
  const loaded = positions.filter(
    (position: LoadPosition) => (plan.positionLoads[position.id] ?? 0) > 0,
  );
  for (const position of loaded) {
    const lb = plan.positionLoads[position.id] ?? 0;
    rows.push({
      label: position.label,
      /* A coluna "Informado" repete o que o piloto digitou, na unidade em que
         ele digitou — é o que permite conferir a tabela contra o papel sem
         refazer conversão de cabeça. */
      origin: units.cargo === 'kg' ? `${formatKg(Math.round(lbToKg(lb)))} kg` : null,
      lb,
    });
  }

  rows.push({
    label: 'Combustível',
    origin:
      units.fuel === 'L' && units.fuelDensityLbPerGal !== null
        ? `${formatL(lbToLitres(totals.fuelLb, units.fuelDensityLbPerGal))} L`
        : null,
    lb: totals.fuelLb,
  });

  return rows;
}

export function ManifestTable({
  result,
  plan,
  basicEmptyWeightLb,
  units,
}: ManifestTableProps) {
  const rows = buildRows(result, plan, basicEmptyWeightLb, units);
  const total = isReady(result.availability)
    ? result.availability.value.totalWeightLb
    : null;

  return (
    <details className={styles.wrapper}>
      <summary className={styles.summary}>Conferência do carregamento</summary>

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col" className={styles.right}>
                Informado
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
                <td className={`${styles.right} ${styles.origin}`}>
                  {row.origin ?? ''}
                </td>
                <td className={`${styles.right} ${styles.number}`}>
                  {row.lb === null ? DASH : formatLb(row.lb)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>
                Peso total
              </th>
              <td className={`${styles.right} ${styles.number}`}>
                {total === null ? DASH : formatLb(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </details>
  );
}
