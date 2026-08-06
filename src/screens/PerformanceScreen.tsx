/**
 * Tela de performance.
 *
 * Dois cartões independentes — decolagem e pouso —, cada um com as próprias
 * condições. Não há botão "Calcular": as distâncias respondem a cada tecla,
 * como o resto do aplicativo.
 *
 * O peso é digitado, e não puxado do planejamento de peso e balanceamento:
 * assim a tela serve para consultar uma pista sem ter um plano montado. O
 * peso de pouso, em especial, dependeria de saber quanto combustível será
 * queimado no trecho, o que o aplicativo não tem como deduzir.
 */

import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { C98 } from '../data/aircraft/index.ts';
import {
  computeLanding,
  computeTakeoff,
} from '../domain/performance/index.ts';
import { DistanceCard } from '../features/performance/DistanceCard.tsx';
import { toPerformanceQuery } from '../store/performanceDraft.ts';
import { usePerformanceStore } from '../store/performanceStore.ts';
import { SegmentedControl } from '../ui/components/SegmentedControl.tsx';
import { VersionBar } from '../ui/components/VersionBar.tsx';
import styles from './PerformanceScreen.module.css';

export function PerformanceScreen({ nav }: { readonly nav: ReactNode }) {
  const draft = usePerformanceStore((state) => state.draft);
  const setField = usePerformanceStore((state) => state.setField);
  const setWindDirection = usePerformanceStore((state) => state.setWindDirection);
  const setTakeoffFlaps = usePerformanceStore((state) => state.setTakeoffFlaps);
  const reset = usePerformanceStore((state) => state.reset);

  const takeoff = useMemo(
    () => computeTakeoff(toPerformanceQuery(draft.takeoff), draft.takeoffFlaps),
    [draft.takeoff, draft.takeoffFlaps],
  );

  const landing = useMemo(
    () => computeLanding(toPerformanceQuery(draft.landing)),
    [draft.landing],
  );

  const handleReset = () => {
    if (window.confirm('Limpar os campos de performance?')) reset();
  };

  return (
    <div className={styles.shell}>
      <div className={styles.topbar}>
        <span className={styles.appName}>{C98.designation}</span>
        <span className={styles.betaBadge} title="Aplicativo em fase de testes">
          Beta
        </span>
        <button type="button" className={styles.reset} onClick={handleReset}>
          Limpar
        </button>
      </div>

      {nav}

      <main className={styles.main}>
        <DistanceCard
          title="Decolagem"
          weightHint="Peso na decolagem"
          control={
            <SegmentedControl
              compact
              label="Ajuste de flap na decolagem"
              value={draft.takeoffFlaps === 0 ? 'flaps-0' : 'flaps-20'}
              onChange={(value) => setTakeoffFlaps(value === 'flaps-0' ? 0 : 20)}
              options={[
                { value: 'flaps-20', label: 'Flaps 20°' },
                { value: 'flaps-0', label: 'Flaps 0°' },
              ]}
            />
          }
          conditions={draft.takeoff}
          outcome={takeoff}
          onChangeField={(field, value) => setField('takeoff', field, value)}
          onChangeWindDirection={(direction) =>
            setWindDirection('takeoff', direction)
          }
        />

        <DistanceCard
          title="Pouso"
          weightHint="Decolagem menos o combustível do trecho"
          conditions={draft.landing}
          outcome={landing}
          onChangeField={(field, value) => setField('landing', field, value)}
          onChangeWindDirection={(direction) =>
            setWindDirection('landing', direction)
          }
        />

        <p className={styles.scope}>
          Tabelas da aeronave <strong>com cargo pod instalado</strong>, técnica
          de pista curta, pista pavimentada, nivelada e seca. Pista de grama,
          separador inercial em bypass e aquecimento de cabine ligado exigem os
          acréscimos das notas da figura, que este cartão ainda não aplica.
        </p>
      </main>

      <VersionBar
        manualRevision={C98.manualRevision}
        sections="Section 5"
      />
    </div>
  );
}
