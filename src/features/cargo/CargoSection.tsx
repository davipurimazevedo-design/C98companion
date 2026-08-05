/**
 * Carga — um grupo de posições, com o próprio desenho.
 *
 * Este componente é usado DUAS vezes, e é de propósito que seja o mesmo:
 *
 *   CARGO POD      — aberto, sempre à vista. É onde a carga vai na maioria das
 *                    missões, que são passageiros mais carga nos pods.
 *   CARGA NA CABINE — recolhida. Só entra em voo com os bancos removidos, e
 *                    ocupava meia tela de rolagem em todo planejamento normal.
 *
 * A única diferença real entre as duas é o seletor de amarração, que o manual
 * publica apenas para as zonas — os compartimentos do pod têm um valor único,
 * igual nos dois modos. Por isso ele entra por propriedade, e não por cópia do
 * componente.
 *
 * Regra que não se negocia: peso lançado nunca fica escondido. O subtotal
 * aparece no cabeçalho mesmo com a seção recolhida, e com carga dentro ela não
 * pode ser fechada.
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

/** O seletor de amarração, quando o grupo o tiver. */
interface RestraintControl {
  readonly value: CargoRestraint;
  readonly onChange: (restraint: CargoRestraint) => void;
}

interface CargoSectionProps {
  readonly title: string;
  readonly positions: readonly LoadPosition[];
  readonly positionLoads: Readonly<Record<string, string>>;
  /** Peso já convertido para libras, para o desenho e os limites. */
  readonly loadedLb: Readonly<Record<string, number>>;
  readonly unit: CargoUnit;
  readonly onChangeUnit: (unit: CargoUnit) => void;
  readonly totalLb: number;
  readonly maxLb: number | null;
  /**
   * Centragem marcada sobre o desenho. `null` na seção que não a exibe —
   * desenhar a mesma marca duas vezes na tela não ajudaria ninguém.
   */
  readonly cg: CgResult | null;
  /** Presente só no grupo em que o manual publica dois limites. */
  readonly restraint?: RestraintControl;
  /** Recolhível. Ausente, a seção fica sempre aberta. */
  readonly collapse?: {
    readonly open: boolean;
    readonly onToggle: (open: boolean) => void;
  };
  /** Nome da lista numérica recolhível, ao pé da seção. */
  readonly listLabel: string;
  readonly onChangePosition: (positionId: string, text: string) => void;
}

/**
 * Total do grupo, sempre em libras — é nelas que os limites do manual estão
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
  title,
  positions,
  positionLoads,
  loadedLb,
  unit,
  onChangeUnit,
  totalLb,
  maxLb,
  cg,
  restraint,
  collapse,
  listLabel,
  onChangePosition,
}: CargoSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const inKg = unit === 'kg';
  const over = maxLb !== null && totalLb > maxLb;
  const loaded = totalLb > 0;

  /* Só entram no desenho as posições com as estações cadastradas: sem elas não
     há como saber onde a posição cai no perfil. */
  const cells: LoadCell[] = positions.flatMap((position) => {
    const { fromIn, toIn } = position;
    if (fromIn === null || toIn === null) return [];

    const positionLb = loadedLb[position.id] ?? 0;
    const limit = limitOf(position, restraint?.value ?? 'amarrada');

    return [
      {
        id: position.id,
        short: shortLabel(position),
        label: position.label,
        group: position.group,
        fromIn,
        toIn,
        loadedLb: positionLb,
        over: limit !== null && positionLb > limit,
      },
    ];
  });

  const hintOf = (position: LoadPosition) => {
    const limit = limitOf(position, restraint?.value ?? 'amarrada');
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
      title={title}
      subtotal={total(totalLb, maxLb)}
      over={over}
      {...(collapse
        ? {
            collapsible: true,
            open: collapse.open,
            locked: loaded,
            onToggle: collapse.onToggle,
          }
        : {})}
    >
      {/* O seletor aparece nas duas seções, ligado ao mesmo estado: é uma
          preferência só, oferecida onde se está trabalhando. Deixá-la apenas
          numa delas obrigaria a rolar a tela para trocar a unidade da outra. */}
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

      {restraint && (
        <>
          <div className={styles.restraint}>
            <SegmentedControl
              label="Amarração da carga na cabine"
              value={restraint.value}
              onChange={restraint.onChange}
              options={[
                { value: 'amarrada', label: 'Amarrada' },
                { value: 'sem-amarracao', label: 'Sem amarração' },
              ]}
            />
          </div>
          <p className={styles.restraintHint}>
            {restraint.value === 'amarrada'
              ? 'Limites de carga presa por tie-downs.'
              : 'Limites de carga contida por divisórias. Exige densidade até 7,9 lb/ft³ e baia 75% cheia.'}
          </p>
        </>
      )}

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

          <Disclosure
            title={listLabel}
            total={total(totalLb, maxLb)}
            over={over}
            open={listOpen}
            onToggle={setListOpen}
          />
          {listOpen && positions.map(renderPosition)}
        </>
      )}

      {positions.length === 0 && (
        <p className={styles.empty}>
          Nenhuma posição de carga cadastrada para esta aeronave.
        </p>
      )}

      {collapse && loaded && (
        <p className={styles.lockNote}>
          Há carga lançada aqui, então esta seção permanece à vista. Zere os
          campos para recolher.
        </p>
      )}
    </Section>
  );
}
