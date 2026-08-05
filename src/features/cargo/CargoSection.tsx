/**
 * Carga.
 *
 * O cargo pod vem primeiro porque é onde a carga costuma ir. As zonas da cabine
 * ficam recolhidas, para o caso de voo com os bancos removidos.
 *
 * Regra que não se negocia: peso lançado nunca fica escondido. O subtotal da
 * cabine aparece no cabeçalho mesmo recolhida, e com carga dentro ela não pode
 * ser fechada — do contrário o piloto poderia esquecer 400 LB fora de vista.
 *
 * O seletor de amarração fica dentro da cabine porque é só ali que ele muda
 * alguma coisa: o manual publica limites bem diferentes para carga amarrada e
 * carga contida por divisórias nas zonas, mas os compartimentos do pod têm um
 * único valor, igual nos dois modos.
 */

import { MAX_INPUT_CARGO_KG, MAX_INPUT_LB } from '../../config/input.ts';
import { lbToKg } from '../../data/conversion.ts';
import type { LoadPosition } from '../../data/aircraft/types.ts';
import { limitOf } from '../../domain/calc/index.ts';
import type { CargoRestraint } from '../../domain/models/plan.ts';
import type { CargoUnit } from '../../store/draft.ts';
import { FieldRow } from '../../ui/components/FieldRow.tsx';
import { SegmentedControl } from '../../ui/components/SegmentedControl.tsx';
import { Section } from '../../ui/components/Section.tsx';
import { WeightInput } from '../../ui/components/WeightInput.tsx';
import { fieldError } from '../../ui/fieldError.ts';
import { formatKg, formatLb } from '../../utils/format.ts';
import styles from './CargoSection.module.css';

interface CargoSectionProps {
  readonly positions: readonly LoadPosition[];
  readonly positionLoads: Readonly<Record<string, string>>;
  readonly unit: CargoUnit;
  readonly onChangeUnit: (unit: CargoUnit) => void;
  readonly restraint: CargoRestraint;
  readonly cabinOpen: boolean;
  readonly totalLb: number;
  readonly cabinLb: number;
  readonly podLb: number;
  readonly maxCabinLb: number | null;
  readonly maxPodLb: number | null;
  readonly onChangePosition: (positionId: string, text: string) => void;
  readonly onChangeRestraint: (restraint: CargoRestraint) => void;
  readonly onToggleCabin: (open: boolean) => void;
}

/**
 * Total de um grupo, sempre em libras — é nelas que os limites do manual estão
 * escritos, e é o número que precisa ser conferível contra o papel.
 */
function total(loaded: number, max: number | null): string {
  return max === null
    ? `${formatLb(loaded)} LB`
    : `${formatLb(loaded)} / ${formatLb(max)} LB`;
}

export function CargoSection({
  positions,
  positionLoads,
  unit,
  onChangeUnit,
  restraint,
  cabinOpen,
  totalLb,
  cabinLb,
  podLb,
  maxCabinLb,
  maxPodLb,
  onChangePosition,
  onChangeRestraint,
  onToggleCabin,
}: CargoSectionProps) {
  const cabin = positions.filter((position) => position.group === 'cabine');
  const pod = positions.filter((position) => position.group === 'pod');
  const inKg = unit === 'kg';

  /* Com carga lançada a cabine abre sozinha e não fecha. */
  const cabinLoaded = cabinLb > 0;
  const cabinVisible = cabinOpen || cabinLoaded;
  const cabinOver = maxCabinLb !== null && cabinLb > maxCabinLb;
  const podOver = maxPodLb !== null && podLb > maxPodLb;

  const renderPosition = (position: LoadPosition) => {
    const value = positionLoads[position.id] ?? '';
    const error = fieldError(value, inKg ? MAX_INPUT_CARGO_KG : MAX_INPUT_LB);
    const limit = limitOf(position, restraint);

    return (
      <FieldRow
        key={position.id}
        label={position.label}
        /* Só o peso máximo do setor: estações e volume não ajudam a decidir
           nada no pátio, e o braço de cada posição está documentado nos dados. */
        hint={
          limit === null
            ? 'Limite não cadastrado'
            : inKg
              ? `Máx. ${formatKg(Math.floor(lbToKg(limit)))} kg`
              : `Máx. ${formatLb(limit)} LB`
        }
        error={error}
      >
        <WeightInput
          value={value}
          unit={inKg ? 'kg' : 'LB'}
          onChange={(text) => onChangePosition(position.id, text)}
          ariaLabel={`Peso em ${position.label} em ${inKg ? 'quilogramas' : 'libras'}`}
          invalid={error !== null}
        />
      </FieldRow>
    );
  };

  return (
    <Section
      title="Carga"
      subtotal={`${formatLb(totalLb)} LB · ${formatKg(Math.round(lbToKg(totalLb)))} kg`}
    >
      <div className={styles.unitRow}>
        <SegmentedControl
          compact
          label="Unidade da carga"
          value={unit}
          onChange={onChangeUnit}
          options={[
            { value: 'LB', label: 'LB' },
            { value: 'kg', label: 'kg' },
          ]}
        />
      </div>

      {pod.length > 0 && (
        <>
          <div className={styles.group}>
            <span className={styles.groupTitle}>Cargo pod</span>
            <span
              className={`${styles.groupTotal} ${podOver ? styles.groupOver : ''}`}
            >
              {total(podLb, maxPodLb)}
            </span>
          </div>
          {pod.map(renderPosition)}
        </>
      )}

      {cabin.length > 0 && (
        <>
          <button
            type="button"
            className={styles.disclosure}
            aria-expanded={cabinVisible}
            disabled={cabinLoaded}
            onClick={() => onToggleCabin(!cabinOpen)}
          >
            <span className={styles.groupTitle}>Carga na cabine</span>
            <span
              className={`${styles.groupTotal} ${cabinOver ? styles.groupOver : ''}`}
            >
              {total(cabinLb, maxCabinLb)}
            </span>
            {!cabinLoaded && (
              <span className={styles.chevron} aria-hidden="true">
                {cabinVisible ? '▴' : '▾'}
              </span>
            )}
          </button>

          {cabinVisible && (
            <>
              <div className={styles.restraint}>
                <SegmentedControl
                  label="Amarração da carga na cabine"
                  value={restraint}
                  onChange={onChangeRestraint}
                  options={[
                    { value: 'amarrada', label: 'Amarrada' },
                    { value: 'sem-amarracao', label: 'Sem amarração' },
                  ]}
                />
              </div>
              <p className={styles.restraintHint}>
                {restraint === 'amarrada'
                  ? 'Limites de carga presa por tie-downs.'
                  : 'Limites de carga contida por divisórias. Exige densidade até 7,9 lb/ft³ e baia 75% cheia.'}
              </p>

              {cabin.map(renderPosition)}
            </>
          )}

          {cabinLoaded && (
            <p className={styles.lockNote}>
              Há carga lançada na cabine, então estas zonas permanecem à vista.
              Zere os campos para recolher.
            </p>
          )}
        </>
      )}

      {positions.length === 0 && (
        <p className={styles.empty}>
          Nenhuma posição de carga cadastrada para esta aeronave.
        </p>
      )}
    </Section>
  );
}
