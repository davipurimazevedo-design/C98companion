/**
 * Tela de planejamento.
 *
 * Página única: o piloto rola e preenche, e a barra do topo mais o cartão de
 * resumo respondem a cada tecla. Não existe botão "Calcular" — o resultado é
 * consequência do preenchimento, não de uma ação à parte.
 */

import { useMemo } from 'react';

import {
  C98,
  DEFAULT_AIRCRAFT_ID,
  getProfile,
  passengerStationsFor,
} from '../data/aircraft/index.ts';
import { AVERAGE_PASSENGER_KG } from '../data/operational.ts';
import {
  computePlanResult,
  distributeBySeats,
  isReady,
  valueOrNull,
} from '../domain/calc/index.ts';
import { AircraftSection } from '../features/aircraft/AircraftSection.tsx';
import { CargoSection } from '../features/cargo/CargoSection.tsx';
import { CgCard } from '../features/cg/CgCard.tsx';
import { CrewSection } from '../features/crew/CrewSection.tsx';
import { FuelSection } from '../features/fuel/FuelSection.tsx';
import { PassengersSection } from '../features/passengers/PassengersSection.tsx';
import { ManifestTable } from '../features/summary/ManifestTable.tsx';
import { SummaryCard } from '../features/summary/SummaryCard.tsx';
import { usePlanStore } from '../store/planStore.ts';
import { toMissionPlan } from '../store/draft.ts';
import { AlertList } from '../ui/components/AlertList.tsx';
import { StatusBar } from '../ui/components/StatusBar.tsx';
import { VersionBar } from '../ui/components/VersionBar.tsx';
import { DASH, formatLb, formatPct } from '../utils/format.ts';
import styles from './PlanningScreen.module.css';

export function PlanningScreen() {
  const draft = usePlanStore((state) => state.draft);
  const selectAircraft = usePlanStore((state) => state.selectAircraft);
  const setFuel = usePlanStore((state) => state.setFuel);
  const setFuelUnit = usePlanStore((state) => state.setFuelUnit);
  const setCargoUnit = usePlanStore((state) => state.setCargoUnit);
  const setPassengerLoad = usePlanStore((state) => state.setPassengerLoad);
  const setPassengerLoads = usePlanStore((state) => state.setPassengerLoads);
  const setPassengerCount = usePlanStore((state) => state.setPassengerCount);
  const setCrewWeight = usePlanStore((state) => state.setCrewWeight);
  const addCrewMember = usePlanStore((state) => state.addCrewMember);
  const removeCrewMember = usePlanStore((state) => state.removeCrewMember);
  const setPositionLoad = usePlanStore((state) => state.setPositionLoad);
  const setCargoRestraint = usePlanStore((state) => state.setCargoRestraint);
  const setCabinCargoOpen = usePlanStore((state) => state.setCabinCargoOpen);
  const reset = usePlanStore((state) => state.reset);

  /* A matrícula pode ter saído da frota entre duas versões do aplicativo. */
  const profile = useMemo(
    () => getProfile(draft.aircraftId) ?? getProfile(DEFAULT_AIRCRAFT_ID),
    [draft.aircraftId],
  );

  const fuelDensity =
    profile?.model.fuel.referenceDensityLbPerGal ?? null;

  const plan = useMemo(
    () => toMissionPlan(draft, fuelDensity),
    [draft, fuelDensity],
  );
  const stations = useMemo(
    () => (profile ? passengerStationsFor(profile) : []),
    [profile],
  );

  const result = useMemo(
    () => (profile ? computePlanResult(plan, profile) : null),
    [plan, profile],
  );

  if (!profile || !result) {
    return (
      <p className={styles.fatal}>
        Nenhuma aeronave cadastrada. Verifique <code>src/data/aircraft/fleet.ts</code>.
      </p>
    );
  }

  const { totals, availability, level, alerts, missingData } = result;

  const totalText = isReady(availability)
    ? formatLb(availability.value.totalWeightLb)
    : DASH;
  const percentText = isReady(availability)
    ? formatPct(availability.value.usedPct)
    : DASH;
  const progress = isReady(availability) ? availability.value.usedPct : 0;

  const handleReset = () => {
    if (window.confirm('Limpar todos os campos e começar um planejamento novo?')) {
      reset();
    }
  };

  return (
    <div className={styles.shell}>
      <StatusBar
        tail={profile.registration.tail}
        level={level}
        total={totalText}
        percent={percentText}
        progress={progress}
      />

      <div className={styles.topbar}>
        <span className={styles.appName}>{C98.designation}</span>
        <button type="button" className={styles.reset} onClick={handleReset}>
          Novo planejamento
        </button>
      </div>

      {missingData.length > 0 && (
        <div className={styles.pending}>
          <strong className={styles.pendingTitle}>
            Falta a ficha de pesagem da {profile.registration.tail}
          </strong>
          <span className={styles.pendingText}>
            Os limites do manual já estão cadastrados. O peso total e a
            disponibilidade dependem do peso básico desta aeronave:{' '}
            {missingData.join(', ')}.
          </span>
        </div>
      )}

      <main className={styles.main}>
        <AircraftSection
          registration={profile.registration}
          onSelect={selectAircraft}
        />

        <FuelSection
          value={draft.fuel}
          unit={draft.fuelUnit}
          totalLb={totals.fuelLb}
          usableCapacityLb={profile.model.fuel.usableCapacityLb}
          totalCapacityLb={profile.model.fuel.totalCapacityLb}
          totalCapacityL={profile.model.fuel.totalCapacityL}
          densityLbPerGal={fuelDensity}
          additionalLb={valueOrNull(result.additionalFuel)}
          onChange={setFuel}
          onChangeUnit={setFuelUnit}
        />

        <CrewSection
          crew={draft.crew}
          totalKg={totals.crewKg}
          totalLb={totals.crewLb}
          onChangeWeight={setCrewWeight}
          onAdd={addCrewMember}
          onRemove={removeCrewMember}
        />

        <PassengersSection
          stations={stations}
          loads={draft.passengerLoads}
          count={draft.passengerCount}
          parsedCount={plan.passengerCount}
          seats={profile.registration.passengerSeats}
          averageKg={AVERAGE_PASSENGER_KG}
          totalKg={totals.passengerKg}
          totalLb={totals.passengerLb}
          onChangeLoad={setPassengerLoad}
          onChangeCount={setPassengerCount}
          onDistribute={(totalKg) => {
            const spread = distributeBySeats(totalKg, stations);
            const asText: Record<string, string> = {};
            for (const [id, kg] of Object.entries(spread)) {
              asText[id] = String(kg);
            }
            setPassengerLoads(asText);
          }}
        />

        <CargoSection
          positions={result.positions}
          positionLoads={draft.positionLoads}
          unit={draft.cargoUnit}
          onChangeUnit={setCargoUnit}
          restraint={draft.cargoRestraint}
          cabinOpen={draft.cabinCargoOpen}
          totalLb={totals.cargoLb}
          cabinLb={totals.cabinCargoLb}
          podLb={totals.podCargoLb}
          maxCabinLb={profile.model.limits.maxCabinCargoLb}
          maxPodLb={
            profile.registration.hasCargoPod
              ? profile.model.limits.maxCargoPodLb
              : null
          }
          onChangePosition={setPositionLoad}
          onChangeRestraint={setCargoRestraint}
          onToggleCabin={setCabinCargoOpen}
        />

        <SummaryCard result={result} />

        <CgCard
          cg={result.cg}
          takeoffWeightLb={
            isReady(result.moment) ? result.moment.value.takeoffWeightLb : null
          }
          missing={
            result.moment.status === 'pending' ? result.moment.missing : []
          }
        />

        <AlertList alerts={alerts} />

        <ManifestTable
          result={result}
          plan={plan}
          basicEmptyWeightLb={profile.registration.basicEmptyWeightLb}
          units={{
            cargo: draft.cargoUnit,
            fuel: draft.fuelUnit,
            fuelDensityLbPerGal: fuelDensity,
          }}
        />
      </main>

      <VersionBar manualRevision={profile.model.manualRevision} />
    </div>
  );
}
