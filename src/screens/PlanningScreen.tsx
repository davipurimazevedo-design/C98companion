/**
 * Tela de planejamento.
 *
 * Página única: o piloto rola e preenche, e a barra do topo mais o cartão de
 * resumo respondem a cada tecla. Não existe botão "Calcular" — o resultado é
 * consequência do preenchimento, não de uma ação à parte.
 */

import { useMemo, useRef } from 'react';

import {
  C98,
  DEFAULT_AIRCRAFT_ID,
  canDrawCabinMap,
  getProfile,
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

  const result = useMemo(
    () => (profile ? computePlanResult(plan, profile) : null),
    [plan, profile],
  );

  /* Tocar um assento dianteiro no mapa leva à seção onde ele é lançado. */
  const crewRef = useRef<HTMLDivElement>(null);

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

  const podPositions = result.positions.filter(
    (position) => position.group === 'pod',
  );
  const cabinPositions = result.positions.filter(
    (position) => position.group === 'cabine',
  );

  /* Assentos 1 e 2 do desenho: os dois primeiros da tripulação, que é onde o
     manual coloca piloto e copiloto. Tripulantes além disso entram no cálculo
     pelo mesmo braço, mas não têm assento desenhado. */
  const crewCells = plan.crew.slice(0, 2).map((member) => ({
    label: member.role,
    weightKg: member.weightKg,
  }));

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
        <span className={styles.betaBadge} title="Aplicativo em fase de testes">
          Beta
        </span>
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

        <div ref={crewRef}>
          <CrewSection
            crew={draft.crew}
            totalKg={totals.crewKg}
            totalLb={totals.crewLb}
            onChangeWeight={setCrewWeight}
            onAdd={addCrewMember}
            onRemove={removeCrewMember}
          />
        </div>

        <PassengersSection
          seats={result.seats}
          canDrawMap={canDrawCabinMap(profile)}
          loads={draft.passengerLoads}
          count={draft.passengerCount}
          parsedCount={plan.passengerCount}
          seatCount={profile.registration.passengerSeats}
          averageKg={AVERAGE_PASSENGER_KG}
          totalKg={totals.passengerKg}
          totalLb={totals.passengerLb}
          crew={crewCells}
          onSelectCrew={() =>
            crewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          onChangeLoad={setPassengerLoad}
          onChangeCount={setPassengerCount}
          onDistribute={(count) => {
            const spread = distributeBySeats(
              count,
              AVERAGE_PASSENGER_KG,
              result.seats,
            );
            const asText: Record<string, string> = {};
            for (const [id, kg] of Object.entries(spread)) {
              asText[id] = String(kg);
            }
            setPassengerLoads(asText);
          }}
        />

        {/* O pod primeiro e aberto: é onde a carga vai na maioria das missões.
            A régua do CG fica nele, que é a seção sempre à vista. */}
        {podPositions.length > 0 && (
          <CargoSection
            title="Cargo pod"
            positions={podPositions}
            positionLoads={draft.positionLoads}
            loadedLb={plan.positionLoads}
            cg={result.cg}
            unit={draft.cargoUnit}
            onChangeUnit={setCargoUnit}
            totalLb={totals.podCargoLb}
            maxLb={profile.model.limits.maxCargoPodLb}
            listLabel="Peso compartimento a compartimento"
            onChangePosition={setPositionLoad}
          />
        )}

        {/* A cabine recolhida: só entra em voo com os bancos removidos. */}
        {cabinPositions.length > 0 && (
          <CargoSection
            title="Carga na cabine"
            positions={cabinPositions}
            positionLoads={draft.positionLoads}
            loadedLb={plan.positionLoads}
            cg={null}
            unit={draft.cargoUnit}
            onChangeUnit={setCargoUnit}
            totalLb={totals.cabinCargoLb}
            maxLb={profile.model.limits.maxCabinCargoLb}
            restraint={{
              value: draft.cargoRestraint,
              onChange: setCargoRestraint,
            }}
            collapse={{
              open: draft.cabinCargoOpen,
              onToggle: setCabinCargoOpen,
            }}
            listLabel="Peso zona a zona"
            onChangePosition={setPositionLoad}
          />
        )}

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
