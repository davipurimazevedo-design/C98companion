/**
 * Raiz do aplicativo.
 *
 * Duas telas, cada uma com o próprio rascunho salvo no aparelho: peso e
 * balanceamento e performance. A aba escolhida é estado de sessão e não é
 * persistida — abrir o aplicativo sempre começa pelo carregamento, que é por
 * onde o planejamento começa.
 */

import { useState } from 'react';

import { PerformanceScreen } from '../screens/PerformanceScreen.tsx';
import { PlanningScreen } from '../screens/PlanningScreen.tsx';
import { Tabs } from '../ui/components/Tabs.tsx';

type Screen = 'peso' | 'performance';

export function App() {
  const [screen, setScreen] = useState<Screen>('peso');

  const nav = (
    <Tabs
      label="Telas do planejamento"
      value={screen}
      onChange={setScreen}
      options={[
        { value: 'peso', label: 'Peso e balanceamento' },
        { value: 'performance', label: 'Performance' },
      ]}
    />
  );

  return screen === 'peso' ? (
    <PlanningScreen nav={nav} />
  ) : (
    <PerformanceScreen nav={nav} />
  );
}
