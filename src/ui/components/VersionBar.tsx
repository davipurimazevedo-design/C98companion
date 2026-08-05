/**
 * Rodapé de versão.
 *
 * Num aplicativo que roda offline, o piloto precisa poder confirmar contra qual
 * revisão do manual está planejando, e se há versão nova esperando para ser
 * aplicada. Sem isso, uma transcrição desatualizada passa despercebida.
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
      <span className={styles.line}>
        Limites transcritos do manual · {manualRevision}
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
