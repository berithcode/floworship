import db from '../dexie/db';
import type { OfflinePendingAction } from '../dexie/db';

export interface QueueAction {
  type: string;
  endpoint: string;
  method: string;
  body: unknown;
}

export async function enqueueAction(action: QueueAction): Promise<number> {
  const id = await db.pendingActions.add({
    type: action.type,
    endpoint: action.endpoint,
    method: action.method,
    body: JSON.stringify(action.body),
    status: 'pending',
    retryCount: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
  });
  return id as number;
}

export async function getPendingActions(): Promise<OfflinePendingAction[]> {
  return db.pendingActions
    .where('status')
    .equals('pending')
    .sortBy('createdAt');
}

export async function markSynced(id: number): Promise<void> {
  await db.pendingActions.update(id, { status: 'synced' });
}

export async function markFailed(id: number, error: string): Promise<void> {
  const action = await db.pendingActions.get(id);
  if (!action) return;

  const newRetryCount = action.retryCount + 1;
  const newStatus = newRetryCount >= 6 ? 'failed' : 'pending';

  await db.pendingActions.update(id, {
    retryCount: newRetryCount,
    lastError: error,
    status: newStatus,
  });
}

export function getBackoffDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), 30000);
}

export async function retryWithBackoff(
  action: OfflinePendingAction,
  executor: (action: OfflinePendingAction) => Promise<void>
): Promise<boolean> {
  const delay = getBackoffDelay(action.retryCount);
  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    await executor(action);
    await markSynced(action.id!);
    return true;
  } catch (e) {
    await markFailed(action.id!, e instanceof Error ? e.message : String(e));
    return false;
  }
}

export async function syncAll(
  executor: (action: OfflinePendingAction) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingActions();
  let synced = 0;
  let failed = 0;

  for (const action of pending) {
    const success = await retryWithBackoff(action, executor);
    if (success) {
      synced++;
    } else {
      failed++;
      if ((action.retryCount + 1) < 6) break;
    }
  }

  return { synced, failed };
}