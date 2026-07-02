import Dexie, { type EntityTable } from 'dexie';

export interface OfflineSong {
  id: string;
  title: string;
  artist: string | null;
  defaultKey: string | null;
  tags: string;
  status: string;
  notes: string | null;
  ministryId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfflineCueSheet {
  id: string;
  songId: string;
  referenceTrackUrl: string | null;
  totalDurationSeconds: number | null;
}

export interface OfflineCueBlock {
  id: string;
  cueSheetId: string;
  label: string;
  startTime: number;
  endTime: number;
  duration: number;
  chordproContent: string | null;
  order: number;
}

export interface OfflineSchedule {
  id: string;
  ministryId: string;
  date: string;
  createdById: string;
  createdAt: string;
}

export interface OfflinePendingAction {
  id?: number;
  type: string;
  endpoint: string;
  method: string;
  body: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  lastError: string | null;
  createdAt: string;
}

const db = new Dexie('FloworshipDB') as Dexie & {
  songs: EntityTable<OfflineSong, 'id'>;
  cueSheets: EntityTable<OfflineCueSheet, 'id'>;
  cueBlocks: EntityTable<OfflineCueBlock, 'id'>;
  schedules: EntityTable<OfflineSchedule, 'id'>;
  pendingActions: EntityTable<OfflinePendingAction, 'id'>;
};

db.version(1).stores({
  songs: 'id, ministryId, status, title',
  cueSheets: 'id, songId',
  cueBlocks: 'id, cueSheetId, order',
  schedules: 'id, ministryId, date',
  pendingActions: '++id, status, createdAt',
});

export { db };
export default db;