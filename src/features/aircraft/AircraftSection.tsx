/**
 * Seleção da aeronave.
 *
 * Os dados permanentes aparecem somente para leitura: são da ficha de pesagem e
 * o piloto nunca os edita durante o planejamento.
 */

import { listAircraft } from '../../data/aircraft/index.ts';
import type { AircraftRegistration } from '../../data/aircraft/types.ts';
import { Section } from '../../ui/components/Section.tsx';
import { DASH, formatLb } from '../../utils/format.ts';
import styles from './AircraftSection.module.css';

interface AircraftSectionProps {
  readonly registration: AircraftRegistration;
  readonly onSelect: (id: string) => void;
}

const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function AircraftSection({
  registration,
  onSelect,
}: AircraftSectionProps) {
  const fleet = listAircraft();

  return (
    <Section title="Aeronave">
      <label className={styles.label} htmlFor="matricula">
        Matrícula
      </label>
      <select
        id="matricula"
        className={styles.select}
        value={registration.id}
        onChange={(event) => onSelect(event.currentTarget.value)}
      >
        {fleet.map((aircraft) => (
          <option key={aircraft.id} value={aircraft.id}>
            {aircraft.tail}
          </option>
        ))}
      </select>

      <dl className={styles.readouts}>
        <div className={styles.readout}>
          <dt className={styles.term}>Peso básico</dt>
          <dd className={styles.definition}>
            {registration.basicEmptyWeightLb === null ? (
              DASH
            ) : (
              <>
                {formatLb(registration.basicEmptyWeightLb)}
                <span className={styles.unit}>LB</span>
              </>
            )}
          </dd>
        </div>
        <div className={styles.readout}>
          <dt className={styles.term}>Momento básico</dt>
          <dd className={styles.definition}>
            {registration.basicMoment === null
              ? DASH
              : integer.format(registration.basicMoment)}
          </dd>
        </div>
      </dl>
    </Section>
  );
}
