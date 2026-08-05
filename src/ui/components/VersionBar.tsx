/**
 * Rodapé de versão e procedência.
 *
 * Num aplicativo que roda offline, o piloto precisa poder confirmar contra qual
 * revisão do manual está planejando, e se há versão nova esperando para ser
 * aplicada. Sem isso, uma transcrição desatualizada passa despercebida.
 *
 * A revisão do manual vem do dado cadastrado, e não escrita à mão no texto: se
 * a transcrição for atualizada, o rodapé acompanha sozinho.
 *
 * A última linha não é formalidade. Esta é uma ferramenta de apoio construída
 * sobre uma transcrição, e quem responde pela operação dentro dos limites é o
 * comandante da aeronave.
 */

import { useRegisterSW } from 'virtual:pwa-register/react';

import styles from './VersionBar.module.css';

export function VersionBar({
  manualRevision,
}: {
  readonly manualRevision: string;
}) {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <footer className={styles.bar}>
      <span className={styles.line}>
        Planejador C-98 v{__APP_VERSION__} · build {__BUILD_DATE__}
      </span>
      <span className={styles.source}>
        Limites transcritos do POH do Cessna Caravan 208B, Section 6 e
        Section 2, {manualRevision}. Confira sempre a revisão vigente antes de
        usar em planejamento.
      </span>
      <span className={styles.source}>
        A responsabilidade pela operação dentro dos limites é do comandante da
        aeronave.
      </span>

      {needRefresh && (
        <div className={styles.update} role="status">
          <span>Há uma versão nova disponível.</span>
          <span className={styles.actions}>
            <button
              type="button"
              className={styles.apply}
              onClick={() => void updateServiceWorker(true)}
            >
              Atualizar agora
            </button>
            <button
              type="button"
              className={styles.dismiss}
              onClick={() => setNeedRefresh(false)}
            >
              Depois
            </button>
          </span>
        </div>
      )}
    </footer>
  );
}
