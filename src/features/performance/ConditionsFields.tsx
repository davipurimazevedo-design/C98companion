/**
 * Os campos de condição de um cartão de performance.
 *
 * Decolagem e pouso pedem exatamente as mesmas grandezas — peso,
 * altitude-pressão, temperatura, vento e comprimento de pista —, então existe
 * um componente só. O que muda entre os dois cartões é a tabela consultada,
 * não o formulário.
 *
 * O botão de sinal existe porque o teclado numérico do celular não traz o
 * menos: sem ele, digitar −5 °C num iPhone seria impossível sem trocar de
 * teclado.
 */

import { MAX_INPUT_LB } from '../../config/input.ts';
import { metresToFeet } from '../../data/conversion.ts';
import {
  FIELD_RANGE,
  type ConditionsDraft,
  type ConditionsField,
  type WindDirectionChoice,
} from '../../store/performanceDraft.ts';
import { FieldRow } from '../../ui/components/FieldRow.tsx';
import { SegmentedControl } from '../../ui/components/SegmentedControl.tsx';
import { WeightInput } from '../../ui/components/WeightInput.tsx';
import { fieldError, signedFieldError } from '../../ui/fieldError.ts';
import { formatFt } from '../../utils/format.ts';
import styles from './ConditionsFields.module.css';

interface ConditionsFieldsProps {
  readonly conditions: ConditionsDraft;
  readonly onChangeField: (field: ConditionsField, value: string) => void;
  readonly onChangeWindDirection: (direction: WindDirectionChoice) => void;
}

/** Inverte o sinal do texto digitado, preservando o que já está escrito. */
function toggleSign(text: string): string {
  const trimmed = text.trim();
  if (trimmed === '') return '-';
  return trimmed.startsWith('-') ? trimmed.slice(1) : `-${trimmed}`;
}

function SignButton({ onClick }: { readonly onClick: () => void }) {
  return (
    <button
      type="button"
      className={styles.sign}
      onClick={onClick}
      aria-label="Inverter o sinal"
      title="Inverter o sinal"
    >
      ±
    </button>
  );
}

export function ConditionsFields({
  conditions,
  onChangeField,
  onChangeWindDirection,
}: ConditionsFieldsProps) {
  const weightError = fieldError(conditions.weight, MAX_INPUT_LB);
  const altitudeError = signedFieldError(
    conditions.altitude,
    FIELD_RANGE.altitude.min,
    FIELD_RANGE.altitude.max,
  );
  const temperatureError = signedFieldError(
    conditions.temperature,
    FIELD_RANGE.temperature.min,
    FIELD_RANGE.temperature.max,
  );
  const windError = fieldError(conditions.wind, FIELD_RANGE.wind.max);
  const runwayError = fieldError(conditions.runway, FIELD_RANGE.runway.max);

  /* Equivalente em pés ao lado do campo: as cartas publicam metros, e as
     tabelas do manual, pés. Ver os dois evita a conversão de cabeça. */
  const runwayM = Number(conditions.runway.replace(',', '.'));
  const runwayHint =
    Number.isFinite(runwayM) && runwayM > 0
      ? `${formatFt(metresToFeet(runwayM))} ft`
      : 'Comprimento disponível';

  return (
    <>
      <FieldRow label="Peso" hint="Na decolagem ou no pouso" error={weightError}>
        <WeightInput
          value={conditions.weight}
          unit="LB"
          onChange={(value) => onChangeField('weight', value)}
          ariaLabel="Peso em libras"
          invalid={weightError !== null}
        />
      </FieldRow>

      <FieldRow
        label="Altitude-pressão"
        hint="Altímetro em 29,92"
        error={altitudeError}
      >
        <SignButton
          onClick={() => onChangeField('altitude', toggleSign(conditions.altitude))}
        />
        <WeightInput
          value={conditions.altitude}
          unit="ft"
          onChange={(value) => onChangeField('altitude', value)}
          ariaLabel="Altitude-pressão em pés"
          invalid={altitudeError !== null}
        />
      </FieldRow>

      <FieldRow
        label="Temperatura"
        hint="No aeródromo"
        error={temperatureError}
      >
        <SignButton
          onClick={() =>
            onChangeField('temperature', toggleSign(conditions.temperature))
          }
        />
        <WeightInput
          value={conditions.temperature}
          unit="°C"
          onChange={(value) => onChangeField('temperature', value)}
          ariaLabel="Temperatura em graus Celsius"
          invalid={temperatureError !== null}
        />
      </FieldRow>

      <FieldRow
        label="Vento"
        hint="Componente da pista"
        error={windError}
      >
        <SegmentedControl
          compact
          label="Direção do vento"
          value={conditions.windDirection}
          onChange={onChangeWindDirection}
          options={[
            { value: 'proa', label: 'Proa' },
            { value: 'cauda', label: 'Cauda' },
          ]}
        />
        <WeightInput
          value={conditions.wind}
          unit="kt"
          onChange={(value) => onChangeField('wind', value)}
          ariaLabel="Componente de vento em nós"
          invalid={windError !== null}
        />
      </FieldRow>

      <FieldRow label="Pista" hint={runwayHint} error={runwayError}>
        <WeightInput
          value={conditions.runway}
          unit="m"
          onChange={(value) => onChangeField('runway', value)}
          ariaLabel="Comprimento da pista em metros"
          invalid={runwayError !== null}
        />
      </FieldRow>
    </>
  );
}
