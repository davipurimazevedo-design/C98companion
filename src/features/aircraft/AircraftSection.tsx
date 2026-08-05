/**
 * Seleção da aeronave.
 *
 * Os dados permanentes aparecem somente para leitura: são da ficha de pesagem e
 * o piloto nunca os edita durante o planejamento.
 *
 * Só o peso básico é exibido. O momento básico da ficha continua cadastrado e
 * alimenta o cálculo de centragem, mas não é informação de decisão — ninguém
 * planeja olhando para 982.577,4, e ocupar meia tela com ele treina o olho a
 * ignorar o cartão.
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
      </dl>
    </Section>
  );
}
