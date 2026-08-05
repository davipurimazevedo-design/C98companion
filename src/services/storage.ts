/**
 * Persistência local do planejamento.
 *
 * O planejamento sobrevive a fechar o aplicativo, perder a rede ou o aparelho
 * reiniciar. Nada sai do dispositivo.
 *
 * Todo dado lido de volta é tratado como suspeito: uma versão anterior do
 * aplicativo, uma edição manual ou um armazenamento corrompido não podem
 * derrubar a tela. O que não passar na conferência é descartado em silêncio e
 * o piloto recomeça de um rascunho limpo.
 */

import type { CargoRestraint } from '../domain/models/plan.ts';
import type {
  CargoUnit,
  CrewDraft,
  FuelUnit,
  PlanDraft,
} from '../store/draft.ts';

const KEY = 'planejador-c98:rascunho';

/**
 * Versão do formato salvo. Incrementar sempre que a forma de `PlanDraft` mudar
 * de modo incompatível — rascunhos de versões anteriores são descartados.
 */
const VERSION = 5;

interface Envelope {
  readonly version: number;
  readonly draft: PlanDraft;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/* Rascunhos gravados antes das unidades alternativas guardavam tudo em libras,
   que é exatamente o que o padrão devolve — por isso não há bump de versão e o
   planejamento em andamento do piloto sobrevive à atualização. */
function asFuelUnit(value: unknown): FuelUnit {
  return value === 'L' ? 'L' : 'LB';
}

function asCargoUnit(value: unknown): CargoUnit {
  return value === 'kg' ? 'kg' : 'LB';
}

function asRestraint(value: unknown): CargoRestraint {
  return value === 'sem-amarracao' ? 'sem-amarracao' : 'amarrada';
}

function sanitizeCrew(value: unknown): CrewDraft[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((member) => ({
    id: asText(member['id']),
    role: asText(member['role']),
    weight: asText(member['weight']),
  }));
}

function sanitizeLoads(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const loads: Record<string, string> = {};
  for (const [id, weight] of Object.entries(value)) {
    loads[id] = asText(weight);
  }
  return loads;
}

/** Recupera o rascunho salvo, ou `null` se não houver um utilizável. */
export function loadDraft(): PlanDraft | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null; // Armazenamento indisponível (janela privada, permissão negada).
  }
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed['version'] !== VERSION) return null;

    const draft = parsed['draft'];
    if (!isRecord(draft)) return null;

    const crew = sanitizeCrew(draft['crew']);
    /* Um rascunho sem nenhum tripulante indica dado corrompido: a tripulação
       inicial nunca é vazia. Melhor recomeçar do que exibir uma tela quebrada. */
    if (crew.length === 0) return null;

    return {
      aircraftId: asText(draft['aircraftId']),
      fuel: asText(draft['fuel']),
      fuelUnit: asFuelUnit(draft['fuelUnit']),
      passengerLoads: sanitizeLoads(draft['passengerLoads']),
      passengerCount: asText(draft['passengerCount']),
      crew,
      positionLoads: sanitizeLoads(draft['positionLoads']),
      cargoUnit: asCargoUnit(draft['cargoUnit']),
      cargoRestraint: asRestraint(draft['cargoRestraint']),
      cabinCargoOpen: draft['cabinCargoOpen'] === true,
    };
  } catch {
    return null;
  }
}

/** Salva o rascunho. Falhas de armazenamento não interrompem o planejamento. */
export function saveDraft(draft: PlanDraft): void {
  const envelope: Envelope = { version: VERSION, draft };
  try {
    localStorage.setItem(KEY, JSON.stringify(envelope));
  } catch {
    /* Cota excedida ou armazenamento bloqueado: o cálculo continua em memória. */
  }
}

/** Apaga o rascunho salvo. */
export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Nada a fazer. */
  }
}
