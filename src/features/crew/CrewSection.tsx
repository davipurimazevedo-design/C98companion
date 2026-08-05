/**
 * Tripulação.
 *
 * Piloto e copiloto são fixos — estão em praticamente toda missão e removê-los
 * não faria sentido. Os demais tripulantes são acrescentados conforme a
 * necessidade e podem ser removidos num toque.
 */

import { MAX_INPUT_KG } from '../../config/input.ts';
import type { CrewDraft } from '../../store/draft.ts';
import { FieldRow } from '../../ui/components/FieldRow.tsx';
import { AddButton, Section } from '../../ui/components/Section.tsx';
import { WeightInput } from '../../ui/components/WeightInput.tsx';
import { fieldError } from '../../ui/fieldError.ts';
import { formatKg, formatLb } from '../../utils/format.ts';

/** Posições fixas: as duas primeiras linhas não podem ser removidas. */
const FIXED_ROWS = 2;

interface CrewSectionProps {
  readonly crew: readonly CrewDraft[];
  readonly totalKg: number;
  readonly totalLb: number;
  readonly onChangeWeight: (id: string, text: string) => void;
  readonly onAdd: () => void;
  readonly onRemove: (id: string) => void;
}

export function CrewSection({
  crew,
  totalKg,
  totalLb,
  onChangeWeight,
  onAdd,
  onRemove,
}: CrewSectionProps) {
  return (
    <Section
      title="Tripulação"
      subtotal={`${formatKg(totalKg)} kg · ${formatLb(totalLb)} LB`}
    >
      {crew.map((member, index) => {
        const error = fieldError(member.weight, MAX_INPUT_KG);
        const removable = index >= FIXED_ROWS;

        return (
          <FieldRow
            key={member.id}
            label={member.role}
            error={error}
            {...(removable
              ? {
                  onRemove: () => onRemove(member.id),
                  removeLabel: `Remover ${member.role}`,
                }
              : {})}
          >
            <WeightInput
              value={member.weight}
              unit="kg"
              onChange={(text) => onChangeWeight(member.id, text)}
              ariaLabel={`Peso do ${member.role} em quilogramas`}
              invalid={error !== null}
            />
          </FieldRow>
        );
      })}

      <AddButton label="Adicionar tripulante" onClick={onAdd} />
    </Section>
  );
}
