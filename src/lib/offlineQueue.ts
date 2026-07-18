import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Cola de operaciones pendientes para jugar offline.
 * Las escrituras a Supabase que fallan por falta de red (o porque el usuario
 * está offline) se encolan en localStorage y se reintentan al recuperar
 * conexión. Como los guardados son snapshots completos del estado, se
 * coalescan: solo se conserva la última operación de cada `kind` por usuario.
 */

const QUEUE_STORAGE_KEY = 'truckSurfers_sync_queue_v1';

export type PendingOpKind = 'game_state' | 'millas';

export interface PendingOp {
  kind: PendingOpKind;
  userId: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

function readQueue(): PendingOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingOp[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(ops: PendingOp[]) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(ops));
  } catch {
    // localStorage lleno o no disponible: se pierde la cola, el estado local
    // de Zustand sigue siendo la fuente de verdad.
  }
}

export function enqueueOp(op: Omit<PendingOp, 'createdAt'>) {
  const queue = readQueue().filter(
    (existing) => !(existing.kind === op.kind && existing.userId === op.userId)
  );
  queue.push({ ...op, createdAt: Date.now() });
  writeQueue(queue);
}

export function pendingOpsCount(): number {
  return readQueue().length;
}

/**
 * Reintenta las operaciones encoladas en orden. Devuelve cuántas se
 * sincronizaron. Se detiene al primer fallo (probablemente sigue sin haber
 * red) conservando el resto de la cola.
 */
export async function flushPendingOps(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

  const queue = readQueue();
  if (queue.length === 0) return 0;

  let flushed = 0;
  const remaining: PendingOp[] = [];
  for (const op of queue) {
    const { error } = await supabase.from('game_state').upsert(op.payload);
    if (error) {
      console.warn('[offlineQueue] Flush failed, keeping op queued:', error.message);
      remaining.push(op);
      // Conserva también las siguientes para reintentar en el próximo flush.
      remaining.push(...queue.slice(queue.indexOf(op) + 1));
      break;
    }
    flushed += 1;
  }
  writeQueue(remaining);
  return flushed;
}
