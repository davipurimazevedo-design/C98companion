/**
 * Passageiros.
 *
 * O peso é lançado por ASSENTO, e não como um total único, porque a centragem
 * precisa saber onde as pessoas estão sentadas — o mesmo peso muda o centro de
 * gravidade conforme fica à frente ou atrás.
 *
 * O mapa da cabine é a forma principal de lançar: um toque embarca o passageiro
 * médio, o segundo abre o peso real. A lista numérica continua existindo,
 * recolhida, para conferência e para quem prefere digitar.
 *
 * Quando o lado dos assentos não está confirmado para a matrícula, o mapa não
 * aparece e a lista fica aberta. Desenhar assentos em lado adivinhado seria
 * pior do que não desenhar.
 */

import { useState } from 'react';

import { MAX_INPUT_KG } from '../../config/input.ts';
import type { SeatSlot } from '../../domain/calc/index.ts';
import { parseWeight } from '../../domain/validation/parseWeight.ts';
import { TopView, type CrewSeatCell } from '../aircraftMap/TopView.tsx';
import { Disclosure } from '../../ui/components/Disclosure.tsx';
import { FieldRow } from '../../ui/components/FieldRow.tsx';
import { Section } from '../../ui/components/Section.tsx';
import { WeightInput } from '../../ui/components/WeightInput.tsx';
import { fieldError } from '../../ui/fieldError.ts';
import { formatKg, formatLb } from '../../utils/format.ts';
import styles from './PassengersSection.module.css';

interface PassengersSectionProps {
  readonly seats: readonly SeatSlot[];
  /** Se o lado de todos os assentos está confirmado para esta matrícula. */
  readonly canDrawMap: boolean;
  readonly loads: Readonly<Record<string, string>>;
  readonly count: string;
  readonly parsedCount: number | null;
  readonly seatCount: number;
  readonly averageKg: number;
  readonly totalKg: number;
  readonly totalLb: number;
  /** Piloto e copiloto, para os assentos dianteiros do desenho. */
  readonly crew: readonly CrewSeatCell[];
  readonly onSelectCrew: () => void;
  readonly onChangeLoad: (seatId: string, text: string) => void;
  readonly onChangeCount: (text: string) => void;
  /** Distribui um peso total pelos assentos. */
  readonly onDistribute: (totalKg: number) => void;
}

export function PassengersSection({
  seats,
  canDrawMap,
  loads,
  count,
  parsedCount,
  seatCount,
  averageKg,
  totalKg,
  totalLb,
  crew,
  onSelectCrew,
  onChangeLoad,
  onChangeCount,
  onDistribute,
}: PassengersSectionProps) {
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const overflow = parsedCount !== null && parsedCount > seatCount;

  const weightOf = (seatId: string) =>
    parseWeight(loads[seatId] ?? '', MAX_INPUT_KG).value;

  const weightsKg: Record<string, number> = {};
  for (const seat of seats) {
    weightsKg[seat.id] = weightOf(seat.id);
  }

  const occupied = seats.filter((seat) => weightsKg[seat.id]! > 0).length;

  const subtotal =
    parsedCount === null
      ? `${formatKg(totalKg)} kg · ${formatLb(totalLb)} LB`
      : `${parsedCount}/${seatCount} · ${formatKg(totalKg)} kg`;

  const realAverage =
    parsedCount !== null && parsedCount > 0 && totalKg > 0
      ? totalKg / parsedCount
      : null;

  /* Assento vazio embarca o passageiro médio num toque. Ocupado, o toque
     apenas seleciona — o peso real se ajusta no bloco abaixo do desenho. */
  const handleSeat = (seatId: string) => {
    if (weightOf(seatId) === 0) {
      onChangeLoad(seatId, String(averageKg));
      setSelectedSeatId(seatId);
      return;
    }
    setSelectedSeatId(seatId === selectedSeatId ? null : seatId);
  };

  const selectedSeat = seats.find((seat) => seat.id === selectedSeatId) ?? null;
  const selectedValue = selectedSeat ? (loads[selectedSeat.id] ?? '') : '';
  const selectedError = fieldError(selectedValue, MAX_INPUT_KG);

  return (
    <Section title="Passageiros" subtotal={subtotal}>
      {canDrawMap && (
        <>
          <TopView
            seats={seats}
            weightsKg={weightsKg}
            selectedSeatId={selectedSeatId}
            onSelectSeat={handleSeat}
            crew={crew}
            onSelectCrew={onSelectCrew}
          />

          {selectedSeat ? (
            <div className={styles.editor}>
              <FieldRow
                label={selectedSeat.label}
                hint={`Estação ${formatKg(selectedSeat.armIn)} pol`}
                error={selectedError}
                onRemove={() => {
                  onChangeLoad(selectedSeat.id, '');
                  setSelectedSeatId(null);
                }}
                removeLabel={`Desembarcar ${selectedSeat.label}`}
              >
                <WeightInput
                  value={selectedValue}
                  unit="kg"
                  onChange={(text) => onChangeLoad(selectedSeat.id, text)}
                  ariaLabel={`Peso em ${selectedSeat.label} em quilogramas`}
                  invalid={selectedError !== null}
                />
              </FieldRow>
            </div>
          ) : (
            <p className={styles.hint}>
              {occupied === 0
                ? `Toque um assento para embarcar um passageiro de ${averageKg} kg.`
                : `${occupied} de ${seatCount} assentos ocupados. Toque um assento para ajustar o peso.`}
            </p>
          )}
        </>
      )}

      <FieldRow
        label="Quantidade"
        hint={`${seatCount} assentos instalados`}
        error={overflow ? `Excede em ${parsedCount - seatCount}.` : null}
      >
        <WeightInput
          value={count}
          unit="pax"
          onChange={onChangeCount}
          ariaLabel="Quantidade de passageiros"
          invalid={overflow}
        />
      </FieldRow>

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

      {canDrawMap && (
        <Disclosure
          title="Peso assento a assento"
          total={`${formatKg(totalKg)} kg`}
          open={listOpen}
          onToggle={setListOpen}
        />
      )}

      {(listOpen || !canDrawMap) &&
        seats.map((seat) => {
          const value = loads[seat.id] ?? '';
          const error = fieldError(value, MAX_INPUT_KG);
          return (
            <FieldRow
              key={seat.id}
              label={seat.label}
              hint={`Estação ${formatKg(seat.armIn)} pol`}
              error={error}
            >
              <WeightInput
                value={value}
                unit="kg"
                onChange={(text) => onChangeLoad(seat.id, text)}
                ariaLabel={`Peso em ${seat.label} em quilogramas`}
                invalid={error !== null}
              />
            </FieldRow>
          );
        })}

      {realAverage !== null && (
        <p className={styles.note}>Média real do grupo: {formatKg(realAverage)} kg.</p>
      )}
    </Section>
  );
}
