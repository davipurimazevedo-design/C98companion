/**
 * Carga.
 *
 * A vista lateral é a forma principal de lançar: tocar o compartimento abre o
 * peso dele. As listas numéricas continuam existindo, recolhidas, para
 * conferência e para quem prefere digitar.
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

import { useState } from 'react';

import { MAX_INPUT_CARGO_KG, MAX_INPUT_LB } from '../../config/input.ts';
import { lbToKg } from '../../data/conversion.ts';
import type { LoadPosition } from '../../data/aircraft/types.ts';
import { limitOf, type CgResult } from '../../domain/calc/index.ts';
import type { CargoRestraint } from '../../domain/models/plan.ts';
import type { CargoUnit } from '../../store/draft.ts';
import { SideView, type LoadCell } from '../aircraftMap/SideView.tsx';
import { Disclosure } from '../../ui/components/Disclosure.tsx';
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
  /** Peso já convertido para libras, para o desenho e os limites. */
  readonly loadedLb: Readonly<Record<string, number>>;
  readonly unit: CargoUnit;
  readonly onChangeUnit: (unit: CargoUnit) => void;
  readonly restraint: CargoRestraint;
  readonly cabinOpen: boolean;
  readonly totalLb: number;
  readonly cabinLb: number;
  readonly podLb: number;
  readonly maxCabinLb: number | null;
  readonly maxPodLb: number | null;
  /**
   * Centragem apurada, marcada sobre o desenho.
   *
   * Mora aqui, e não só na seção Centragem, porque é aqui que a carga se move:
   * ver o traço andar em direção ao limite enquanto se lança peso responde à
   * pergunta na hora.
   */
  readonly cg: CgResult | null;
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

/** Rótulo curto que cabe dentro do compartimento: "3" para zona, "A" para pod. */
function shortLabel(position: LoadPosition): string {
  const parts = position.label.split(' ');
  return parts[parts.length - 1] ?? position.label;
}

export function CargoSection({
  positions,
  positionLoads,
  loadedLb,
  unit,
  onChangeUnit,
  restraint,
  cabinOpen,
  totalLb,
  cabinLb,
  podLb,
  maxCabinLb,
  maxPodLb,
  cg,
  onChangePosition,
  onChangeRestraint,
  onToggleCabin,
}: CargoSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [podListOpen, setPodListOpen] = useState(false);

  const cabin = positions.filter((position) => position.group === 'cabine');
  const pod = positions.filter((position) => position.group === 'pod');
  const inKg = unit === 'kg';

  /* Com carga lançada a cabine abre sozinha e não fecha. */
  const cabinLoaded = cabinLb > 0;
  const cabinVisible = cabinOpen || cabinLoaded;
  const cabinOver = maxCabinLb !== null && cabinLb > maxCabinLb;
  const podOver = maxPodLb !== null && podLb > maxPodLb;

  /* Só entram no desenho as posições com as estações cadastradas: sem elas não
     há como saber onde a posição cai no perfil. */
  const cells: LoadCell[] = positions.flatMap((position) => {
    const { fromIn, toIn } = position;
    if (fromIn === null || toIn === null) return [];

    const loaded = loadedLb[position.id] ?? 0;
    const limit = limitOf(position, restraint);

    return [
      {
        id: position.id,
        short: shortLabel(position),
        label: position.label,
        group: position.group,
        fromIn,
        toIn,
        loadedLb: loaded,
        over: limit !== null && loaded > limit,
      },
    ];
  });

  const hintOf = (position: LoadPosition) => {
    const limit = limitOf(position, restraint);
    if (limit === null) return 'Limite não cadastrado';
    return inKg
      ? `Máx. ${formatKg(Math.floor(lbToKg(limit)))} kg`
      : `Máx. ${formatLb(limit)} LB`;
  };

  const renderPosition = (position: LoadPosition) => {
    const value = positionLoads[position.id] ?? '';
    const error = fieldError(value, inKg ? MAX_INPUT_CARGO_KG : MAX_INPUT_LB);

    return (
      <FieldRow
        key={position.id}
        label={position.label}
        /* Só o peso máximo do setor: estações e volume não ajudam a decidir
           nada no pátio, e o braço de cada posição está documentado nos dados. */
        hint={hintOf(position)}
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

  const selected = positions.find((position) => position.id === selectedId);
  const selectedValue = selected ? (positionLoads[selected.id] ?? '') : '';
  const selectedError = fieldError(
    selectedValue,
    inKg ? MAX_INPUT_CARGO_KG : MAX_INPUT_LB,
  );

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

      {cells.length > 0 && (
        <>
          <SideView
            cells={cells}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
            cg={cg}
          />

          {selected ? (
            <div className={styles.editor}>
              <FieldRow
                label={selected.label}
                hint={hintOf(selected)}
                error={selectedError}
                onRemove={() => {
                  onChangePosition(selected.id, '');
                  setSelectedId(null);
                }}
                removeLabel={`Esvaziar ${selected.label}`}
              >
                <WeightInput
                  value={selectedValue}
                  unit={inKg ? 'kg' : 'LB'}
                  onChange={(text) => onChangePosition(selected.id, text)}
                  ariaLabel={`Peso em ${selected.label} em ${inKg ? 'quilogramas' : 'libras'}`}
                  invalid={selectedError !== null}
                />
              </FieldRow>
            </div>
          ) : (
            <p className={styles.pickHint}>
              Toque um compartimento do desenho para lançar o peso dele.
            </p>
          )}
        </>
      )}

      {pod.length > 0 && (
        <>
          <Disclosure
            title="Cargo pod"
            total={total(podLb, maxPodLb)}
            over={podOver}
            open={podListOpen}
            onToggle={setPodListOpen}
          />
          {podListOpen && pod.map(renderPosition)}
        </>
      )}

      {cabin.length > 0 && (
        <>
          <Disclosure
            title="Carga na cabine"
            total={total(cabinLb, maxCabinLb)}
            over={cabinOver}
            open={cabinVisible}
            locked={cabinLoaded}
            onToggle={onToggleCabin}
          />

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
