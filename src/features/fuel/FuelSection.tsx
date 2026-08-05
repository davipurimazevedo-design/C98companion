/**
 * Combustível.
 *
 * Um campo: o mínimo que a perna exige. É o combustível considerado a bordo no
 * cálculo do peso, e o aplicativo responde quanto ainda pode ser somado.
 *
 * O seletor de unidade existe porque o abastecimento é feito em litros, e
 * converter de cabeça no pátio é onde o erro custa caro. Ele fica na linha do
 * título: é preferência da seção inteira, e ali não rouba uma linha do corpo.
 *
 * O subtotal do cabeçalho é sempre em LIBRAS. Digitando em litros, o cabeçalho
 * passa a mostrar quanto aquilo dá em libras — a conversão fica à vista sem
 * pedir. E as libras, que são a unidade de todo limite do manual, nunca somem
 * do topo da seção.
 */

import { MAX_INPUT_L, MAX_INPUT_LB } from '../../config/input.ts';
import { lbToLitres } from '../../data/conversion.ts';
import { FieldRow } from '../../ui/components/FieldRow.tsx';
import { SegmentedControl } from '../../ui/components/SegmentedControl.tsx';
import { Section } from '../../ui/components/Section.tsx';
import { WeightInput } from '../../ui/components/WeightInput.tsx';
import { fieldError } from '../../ui/fieldError.ts';
import { formatL, formatLb } from '../../utils/format.ts';
import type { FuelUnit } from '../../store/draft.ts';
import styles from './FuelSection.module.css';

interface FuelSectionProps {
  readonly value: string;
  readonly unit: FuelUnit;
  readonly totalLb: number;
  /** Capacidade utilizável dos tanques, em libras. `null` se não cadastrada. */
  readonly usableCapacityLb: number | null;
  /** Capacidade total, só de referência para o abastecimento. */
  readonly totalCapacityLb: number | null;
  readonly totalCapacityL: number | null;
  /** Densidade de referência. Sem ela a unidade em litros não é oferecida. */
  readonly densityLbPerGal: number | null;
  /** Quanto ainda cabe além do que já está a bordo. `null` se indeterminado. */
  readonly additionalLb: number | null;
  readonly onChange: (text: string) => void;
  readonly onChangeUnit: (unit: FuelUnit) => void;
}

export function FuelSection({
  value,
  unit,
  totalLb,
  usableCapacityLb,
  totalCapacityLb,
  totalCapacityL,
  densityLbPerGal,
  additionalLb,
  onChange,
  onChangeUnit,
}: FuelSectionProps) {
  const inLitres = unit === 'L';
  const error = fieldError(value, inLitres ? MAX_INPUT_L : MAX_INPUT_LB);

  /* Sem densidade não há como converter litros em peso — nesse caso o seletor
     não aparece, e o campo continua em libras. */
  const canUseLitres = densityLbPerGal !== null && densityLbPerGal > 0;
  const toDisplay = (lb: number) =>
    inLitres && canUseLitres ? lbToLitres(lb, densityLbPerGal) : lb;
  const format = (lb: number) =>
    inLitres && canUseLitres ? formatL(toDisplay(lb)) : formatLb(lb);

  /* Só oferece "completar" quando de fato há espaço a completar. */
  const maxAllowedLb =
    additionalLb !== null && additionalLb > 0 ? totalLb + additionalLb : null;

  /* Rótulos curtos: com "Litros" os três elementos do cabeçalho não caberiam
     numa tela de 375 px sem risco de aperto. */
  const unitControl = canUseLitres ? (
    <SegmentedControl
      compact
      label="Unidade do combustível"
      value={unit}
      onChange={onChangeUnit}
      options={[
        { value: 'LB', label: 'LB' },
        { value: 'L', label: 'L' },
      ]}
    />
  ) : undefined;

  return (
    <Section
      title="Combustível"
      subtotal={`${formatLb(totalLb)} LB`}
      {...(unitControl ? { control: unitControl } : {})}
    >
      <FieldRow
        label="Mínimo da perna"
        hint={
          usableCapacityLb === null
            ? 'Combustível considerado a bordo'
            : `Utilizável ${format(usableCapacityLb)} ${unit === 'L' ? 'L' : 'LB'}`
        }
        error={error}
      >
        <WeightInput
          value={value}
          unit={inLitres ? 'L' : 'LB'}
          onChange={onChange}
          ariaLabel={`Combustível mínimo da perna em ${inLitres ? 'litros' : 'libras'}`}
          invalid={error !== null}
        />
      </FieldRow>

      {(usableCapacityLb !== null || maxAllowedLb !== null) && (
        <div className={styles.shortcuts}>
          {usableCapacityLb !== null && (
            <button
              type="button"
              className={styles.shortcut}
              /* Arredonda para baixo, nunca para cima: em litros, arredondar
                 1.256,5 para 1.257 colocaria o tanque 1 LB acima do utilizável
                 e dispararia alerta de capacidade excedida por artefato de
                 conversão. */
              onClick={() =>
                onChange(String(Math.floor(toDisplay(usableCapacityLb))))
              }
            >
              Tanques cheios
              <span className={styles.amount}>
                {inLitres
                  ? `${formatL(Math.floor(toDisplay(usableCapacityLb)))} L`
                  : `${formatLb(usableCapacityLb)} LB`}
              </span>
            </button>
          )}
          {maxAllowedLb !== null && (
            <button
              type="button"
              className={styles.shortcut}
              onClick={() =>
                onChange(String(Math.floor(toDisplay(maxAllowedLb))))
              }
            >
              Completar até o peso
              <span className={styles.amount}>
                {format(maxAllowedLb)} {inLitres ? 'L' : 'LB'}
              </span>
            </button>
          )}
        </div>
      )}

      {totalCapacityLb !== null && totalCapacityL !== null && (
        <p className={styles.capacity}>
          Capacidade total dos tanques: {formatLb(totalCapacityLb)} LB ·{' '}
          {formatL(totalCapacityL)} L. O balanceamento usa apenas o utilizável —
          o não utilizável já está no peso básico da aeronave.
        </p>
      )}
    </Section>
  );
}
