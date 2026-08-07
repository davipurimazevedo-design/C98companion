/**
 * Persistência local da tela de Performance.
 *
 * Chave e versão PRÓPRIAS, separadas do rascunho de peso e balanceamento.
 * A separação é deliberada: a versão do outro formato é incrementada sempre
 * que a forma dele muda de modo incompatível, e cada incremento descarta o
 * rascunho salvo. Compartilhar a chave faria uma mudança em Performance
 * apagar o planejamento de peso e balanceamento em andamento de alguém.
 *
 * A política de leitura é a mesma: todo dado recuperado é tratado como
 * suspeito, e o que não passar na conferência é descartado em silêncio.
 */

import type {
  ConditionsDraft,
  PerformanceDraft,
  WindDirectionChoice,
} from '../store/performanceDraft.ts';
import { initialPerformanceDraft } from '../store/performanceDraft.ts';

const KEY = 'planejador-c98:performance';

/**
 * Versão do formato salvo. Incrementar quando `PerformanceDraft` mudar de
 * modo INCOMPATÍVEL — um campo que passa a significar outra coisa, ou uma
 * unidade trocada. Campo removido não conta: `takeoffFlaps` saiu junto com a
 * tabela de flaps 0°, e um rascunho antigo que ainda o traga é lido sem ele,
 * sem que o piloto perca o que já havia digitado.
 */
const VERSION = 1;

interface Envelope {
  readonly version: number;
  readonly draft: PerformanceDraft;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asWindDirection(value: unknown): WindDirectionChoice {
  return value === 'cauda' ? 'cauda' : 'proa';
}

function sanitizeConditions(value: unknown): ConditionsDraft {
  const source = isRecord(value) ? value : {};
  return {
    weight: asText(source['weight']),
    altitude: asText(source['altitude']),
    temperature: asText(source['temperature']),
    wind: asText(source['wind']),
    windDirection: asWindDirection(source['windDirection']),
    runway: asText(source['runway']),
  };
}

/** Recupera o rascunho salvo, ou um em branco se não houver um utilizável. */
export function loadPerformanceDraft(): PerformanceDraft {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return initialPerformanceDraft(); // Armazenamento indisponível.
  }
  if (!raw) return initialPerformanceDraft();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed['version'] !== VERSION) {
      return initialPerformanceDraft();
    }

    const draft = parsed['draft'];
    if (!isRecord(draft)) return initialPerformanceDraft();

    return {
      takeoff: sanitizeConditions(draft['takeoff']),
      landing: sanitizeConditions(draft['landing']),
    };
  } catch {
    return initialPerformanceDraft();
  }
}

/** Salva o rascunho. Falhas de armazenamento não interrompem o cálculo. */
export function savePerformanceDraft(draft: PerformanceDraft): void {
  const envelope: Envelope = { version: VERSION, draft };
  try {
    localStorage.setItem(KEY, JSON.stringify(envelope));
  } catch {
    /* Cota excedida ou armazenamento bloqueado: o cálculo continua em memória. */
  }
}
