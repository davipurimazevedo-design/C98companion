/**
 * Passageiros.
 *
 * O peso é lançado por estação de assento, e não como um total único, porque a
 * centragem precisa saber onde as pessoas estão sentadas — o mesmo peso muda o
 * centro de gravidade conforme fica à frente ou atrás.
 *
 * A quantidade continua opcional e serve ao controle de assentos livres.
 */

import { MAX_INPUT_KG } from '../../config/input.ts';
import type { PassengerStation } from '../../data/aircraft/c98.seats.ts';
import { FieldRow } from '../../ui/components/FieldRow.tsx';
import { Section } from '../../ui/components/Section.tsx';
import { WeightInput } from '../../ui/components/WeightInput.tsx';
import { fieldError } from '../../ui/fieldError.ts';
import { formatKg, formatLb } from '../../utils/format.ts';
import styles from './PassengersSection.module.css';

interface PassengersSectionProps {
  readonly stations: readonly PassengerStation[];
  readonly loads: Readonly<Record<string, string>>;
  readonly count: string;
  readonly parsedCount: number | null;
  readonly seats: number;
  readonly averageKg: number;
  readonly totalKg: number;
  readonly totalLb: number;
  readonly onChangeLoad: (stationId: string, text: string) => void;
  readonly onChangeCount: (text: string) => void;
  /** Distribui um peso total pelas estações, da frente para trás. */
  readonly onDistribute: (totalKg: number) => void;
}

export function PassengersSection({
  stations,
  loads,
  count,
  parsedCount,
  seats,
  averageKg,
  totalKg,
  totalLb,
  onChangeLoad,
  onChangeCount,
  onDistribute,
}: PassengersSectionProps) {
  const overflow = parsedCount !== null && parsedCount > seats;

  const subtotal =
    parsedCount === null
      ? `${formatKg(totalKg)} kg · ${formatLb(totalLb)} LB`
      : `${parsedCount}/${seats} · ${formatKg(totalKg)} kg`;

  const realAverage =
    parsedCount !== null && parsedCount > 0 && totalKg > 0
      ? totalKg / parsedCount
      : null;

  return (
    <Section title="Passageiros" subtotal={subtotal}>
      <FieldRow
        label="Quantidade"
        hint={`${seats} assentos instalados`}
        error={overflow ? `Excede em ${parsedCount - seats}.` : null}
      >
        <WeightInput
          value={count}
          unit="pax"
          onChange={onChangeCount}
          ariaLabel="Quantidade de passageiros"
          invalid={overflow}
        />
      </FieldRow>

      {stations.map((station) => {
        const value = loads[station.id] ?? '';
        const error = fieldError(value, MAX_INPUT_KG);
        return (
          <FieldRow
            key={station.id}
            label={station.label}
            hint={`${station.seats} ${station.seats === 1 ? 'lugar' : 'lugares'} · estação ${formatKg(station.armIn)} pol`}
            error={error}
          >
            <WeightInput
              value={value}
              unit="kg"
              onChange={(text) => onChangeLoad(station.id, text)}
              ariaLabel={`Peso em ${station.label} em quilogramas`}
              invalid={error !== null}
            />
          </FieldRow>
        );
      })}

      {parsedCount !== null && parsedCount > 0 && (
        <button
          type="button"
          className={styles.average}
          onClick={() => onDistribute(parsedCount * averageKg)}
        >
          Distribuir pela média: {parsedCount} × {averageKg} kg ={' '}
          {formatKg(parsedCount * averageKg)} kg
        </button>
      )}

      {realAverage !== null && (
        <p className={styles.note}>Média real do grupo: {formatKg(realAverage)} kg.</p>
      )}
    </Section>
  );
}
