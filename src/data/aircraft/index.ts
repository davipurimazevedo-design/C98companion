/**
 * Ponto único de acesso aos dados técnicos.
 *
 * O restante do sistema importa APENAS deste arquivo — nunca dos arquivos de
 * valores diretamente. Assim, reorganizar os dados do manual no futuro não
 * quebra nenhum consumidor.
 */

import { isPresent, missingLabels } from '../pending.ts';
import { C98_FUEL } from './c98.fuel.ts';
import { C98_FUEL_MOMENTS } from './c98.fuelMoment.ts';
import { C98_LIMITS } from './c98.limits.ts';
import { C98_POSITIONS } from './c98.positions.ts';
import {
  C98_CABIN_SEATS,
  C98_PASSENGER_STATIONS,
  type CabinSeat,
  type PassengerStation,
} from './c98.seats.ts';
import { DEFAULT_AIRCRAFT_ID, FLEET } from './fleet.ts';
import type {
  AircraftModel,
  AircraftProfile,
  AircraftRegistration,
  LoadPosition,
} from './types.ts';

/** O único modelo suportado pelo aplicativo. */
export const C98: AircraftModel = {
  designation: 'C-98 Caravan',
  /* Cessna Model 208B (675 SHP), POH Section 6. */
  manualRevision: 'Revision 23',
  limits: C98_LIMITS,
  fuel: C98_FUEL,
  positions: C98_POSITIONS,
  fuelMoments: C98_FUEL_MOMENTS,
};

export { DEFAULT_AIRCRAFT_ID };

/** Todas as matrículas cadastradas, na ordem em que aparecem no seletor. */
export function listAircraft(): readonly AircraftRegistration[] {
  return FLEET;
}

/** Busca uma matrícula pelo identificador interno. */
export function findAircraft(id: string): AircraftRegistration | undefined {
  return FLEET.find((aircraft) => aircraft.id === id);
}

/**
 * Monta o perfil consumido pelos cálculos: dados do modelo somados aos da
 * matrícula. Devolve `undefined` se o identificador não existir.
 */
export function getProfile(id: string): AircraftProfile | undefined {
  const registration = findAircraft(id);
  if (!registration) return undefined;
  return { model: C98, registration };
}

/**
 * Posições realmente disponíveis nesta aeronave.
 *
 * Uma cauda sem cargo pod não deve exibir os compartimentos A a D, nem ser
 * avaliada contra o limite do pod.
 */
export function positionsFor(profile: AircraftProfile): readonly LoadPosition[] {
  if (profile.registration.hasCargoPod) return profile.model.positions;
  return profile.model.positions.filter(
    (position) => position.group !== 'pod',
  );
}

/** Estações de assento desta aeronave, conforme o arranjo instalado. */
export function passengerStationsFor(
  profile: AircraftProfile,
): readonly PassengerStation[] {
  return C98_PASSENGER_STATIONS[profile.registration.seatingArrangement];
}

/** Assentos individuais desta aeronave, conforme o arranjo instalado. */
export function cabinSeatsFor(profile: AircraftProfile): readonly CabinSeat[] {
  return C98_CABIN_SEATS[profile.registration.seatingArrangement];
}

/**
 * Se o mapa da cabine pode ser desenhado para esta aeronave.
 *
 * Exige o lado de TODOS os assentos confirmado. Desenhar metade dos assentos
 * seria pior do que não desenhar nenhum: o piloto contaria os lugares no
 * desenho e chegaria a um número que não é o da aeronave.
 */
export function canDrawCabinMap(profile: AircraftProfile): boolean {
  const seats = cabinSeatsFor(profile);
  return seats.length > 0 && seats.every((seat) => isPresent(seat.side));
}

/**
 * Lista, prontos para exibição, os dados que IMPEDEM algum cálculo.
 *
 * Esta lista alimenta o aviso do topo da tela, que trata de PESO. Momento
 * básico e data de pesagem ficam de fora de propósito:
 *
 *   - a data é registro, não insumo de cálculo nenhum;
 *   - o momento básico é insumo da CENTRAGEM, e a falta dele já é anunciada
 *     onde importa: o cartão de Centragem se declara indisponível e nomeia o
 *     campo que falta.
 *
 * Repetir a pendência no topo faria a tela avisar duas vezes a mesma coisa, e
 * avisar demais treina o piloto a ignorar o aviso justamente quando ele importa.
 *
 * Lista vazia significa que todos os cálculos podem ser apresentados.
 */
export function describeMissingData(profile: AircraftProfile): string[] {
  const { model, registration } = profile;

  const missing = missingLabels([
    ['Peso básico vazio', registration.basicEmptyWeightLb],
    ['Peso máximo de rampa', model.limits.maxRampWeightLb],
    ['Peso máximo de decolagem', model.limits.maxTakeoffWeightLb],
    ['Peso máximo de pouso', model.limits.maxLandingWeightLb],
    ['Carga máxima da cabine', model.limits.maxCabinCargoLb],
    ['Carga máxima do cargo pod', model.limits.maxCargoPodLb],
    ['Limiar de atenção', model.limits.warningThresholdPct],
    ['Capacidade utilizável de combustível', model.fuel.usableCapacityLb],
  ]);

  if (model.positions.length === 0) {
    missing.push('Posições de carga');
  }

  return missing;
}
