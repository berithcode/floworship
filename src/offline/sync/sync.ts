import db from '../dexie/db';
import type { OfflineSong, OfflineSchedule } from '../dexie/db';
import { syncAll, type QueueAction } from '../queue/queue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let isSyncing = false;

async function apiCall(action: { endpoint: string; method: string; body: string }): Promise<unknown> {
  const res = await fetch(`${API_URL}${action.endpoint}`, {
    method: action.method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: action.body !== '{}' ? action.body : undefined,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function syncOnReconnect(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  isSyncing = true;
  try {
    const result = await syncAll(async (action) => {
      await apiCall(action);
    });
    return result;
  } finally {
    isSyncing = false;
  }
}

export async function cacheSongs(songs: OfflineSong[]): Promise<void> {
  await db.songs.bulkPut(songs);
}

export async function getCachedSongs(ministryId: string): Promise<OfflineSong[]> {
  return db.songs.where('ministryId').equals(ministryId).toArray();
}

export async function cacheSchedules(schedules: OfflineSchedule[]): Promise<void> {
  await db.schedules.bulkPut(schedules);
}

export async function getCachedSchedules(ministryId: string): Promise<OfflineSchedule[]> {
  return db.schedules.where('ministryId').equals(ministryId).toArray();
}

export async function queueAndSync(action: QueueAction): Promise<boolean> {
  const { enqueueAction } = await import('../queue/queue');
  await enqueueAction(action);

  if (navigator.onLine) {
    const result = await syncOnReconnect();
    return result.failed === 0;
  }
  return false;
}

export function setupOnlineListener(): void {
  window.addEventListener('online', () => {
    console.log('[SYNC] Online detected, syncing...');
    syncOnReconnect().then((result) => {
      console.log(`[SYNC] Complete: ${result.synced} synced, ${result.failed} failed`);
    });
  });
}