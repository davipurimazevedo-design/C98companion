/**
 * Margem entre a distância exigida e a pista disponível.
 *
 * As três faixas — suficiente, crítica, insuficiente — usam as mesmas cores
 * semânticas do semáforo de carregamento, para que verde, amarelo e vermelho
 * queiram dizer a mesma coisa nas duas telas.
 *
 * O corte do amarelo não é do POH, e o cartão diz isso em voz alta: o manual
 * informa qual distância a aeronave exige, e para por aí.
 */

import { RUNWAY_CRITICAL_USED_PCT } from '../../data/operational.ts';
import type { RunwayMargin as Margin } from '../../domain/performance/index.ts';
import { feetToMetres } from '../../data/conversion.ts';
import { formatM, formatPct } from '../../utils/format.ts';
import styles from './RunwayMargin.module.css';

const VERDICT_LABEL: Record<Margin['verdict'], string> = {
  suficiente: 'Pista suficiente',
  critica: 'Pista crítica',
  insuficiente: 'Pista insuficiente',
};

/** Distância em metros, a partir dos pés em que o manual publica. */
function metres(feet: number): string {
  return formatM(feetToMetres(feet));
}

export function RunwayMargin({ margin }: { readonly margin: Margin }) {
  const { verdict, usedPct, marginFt, runwayFt, requiredFt } = margin;
  const bar = Math.max(0, Math.min(100, usedPct));

  return (
    <div className={`${styles.box} ${styles[verdict]}`}>
      <div className={styles.head}>
        <strong className={styles.verdict}>{VERDICT_LABEL[verdict]}</strong>
        <span className={styles.used}>{formatPct(usedPct)} da pista</span>
      </div>

      <div className={styles.track} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${bar}%` }} />
      </div>

      <p className={styles.detail}>
        Exige {metres(requiredFt)} m de corrida no solo, de {metres(runwayFt)} m
        disponíveis.{' '}
        {marginFt >= 0
          ? `Sobram ${metres(marginFt)} m.`
          : `Faltam ${metres(-marginFt)} m.`}
      </p>

      <p className={styles.caveat}>
        A conta considera só a corrida no solo, e a faixa de atenção começa em{' '}
        {RUNWAY_CRITICAL_USED_PCT}% da pista consumida. As duas coisas são
        critério de emprego desta unidade, não do POH.
      </p>
    </div>
  );
}
