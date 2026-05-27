/**
 * Fila de operações offline persistida no LocalStorage.
 * Cada operação pendente é salva com todos os dados necessários
 * para ser reenviada quando a conexão retornar.
 */

export type OfflineOperation = {
  id: string;
  timestamp: number;
  type: 'create' | 'update' | 'delete' | 'complete';
  entity: 'task';
  payload: Record<string, unknown>;
};

const QUEUE_KEY = 'agenda_turma_offline_queue';
const CACHE_PREFIX = 'agenda_turma_cache_';

// ─── Offline Queue ───────────────────────────────────────────

export function getOfflineQueue(): OfflineOperation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(op: Omit<OfflineOperation, 'id' | 'timestamp'>): OfflineOperation {
  const queue = getOfflineQueue();
  const entry: OfflineOperation = {
    ...op,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  queue.push(entry);
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
  return entry;
}

export function removeFromOfflineQueue(operationId: string): void {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue().filter((op) => op.id !== operationId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  }
}

export function getQueueSize(): number {
  return getOfflineQueue().length;
}

// ─── Cache de dados locais ───────────────────────────────────

export function setCacheData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      cachedAt: Date.now(),
    }));
  } catch (e) {
    console.warn('Erro ao salvar cache:', e);
  }
}

export function getCacheData<T>(key: string, maxAgeMs = 5 * 60 * 1000): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw);
    if (Date.now() - cachedAt > maxAgeMs) return null;
    return data as T;
  } catch {
    return null;
  }
}

export function clearCache(): void {
  if (typeof window === 'undefined') return;
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
  keys.forEach((k) => localStorage.removeItem(k));
}
