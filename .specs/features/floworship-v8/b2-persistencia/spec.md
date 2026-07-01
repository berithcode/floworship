# Persistência — Backend + Client Offline Specification

## Problem Statement

Floworship needs a dual-layer persistence architecture: a server-side source of truth (PostgreSQL/Neon + Prisma behind Fastify API) and a client-side offline cache (IndexedDB via Dexie.js in the PWA). The server stores all canonical data — songs, cue sheets, scales, members, session logs — while the client caches read-heavy data for offline study mode and queues pending actions (e.g., attendance confirmation) for sync on reconnection. The live session state must NEVER be read from IndexedDB as truth — it always comes from the server via WebSocket in real time.

## Goals

- [ ] PostgreSQL (Neon) + Prisma as server-side source of truth behind Fastify API
- [ ] IndexedDB via Dexie.js on the client-side PWA (never SQLite/Capacitor)
- [ ] Local cache limited to: song library/chords/confirmed scales (offline study) and pending action queue
- [ ] Live session state always from server via WebSocket, never from IndexedDB
- [ ] Prisma schema covering all entities: songs, song_cue_sheet blocks, scales, members, session_execution_log, etc.
- [ ] Offline action queue synchronized on reconnection

## Out of Scope

| Feature | Reason |
|---|---|
| SQLite / Capacitor storage | Explicitly excluded by REQ-DATA-02 |
| Real-time data from IndexedDB as source of truth | REQ-DATA-03 negative AC: live session state comes from server |
| Full-text search in IndexedDB | Overkill for MVP; use server-side search |
| Data migration utilities between environments | Not specified in source spec |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Prisma schema location | `prisma/schema.prisma` in the Fastify backend root | Standard Prisma convention; single schema file for all models. | n |
| Dexie.js database versioning | Initial version 1 (`version(1).stores({...})`); migrations via Dexie upgrade mechanism | Standard Dexie pattern; allows incremental schema evolution. | n |
| Offline queue retry strategy | Exponential backoff: 1s, 2s, 4s, 8s, 16s, then give up (6 attempts max) | Covers temporary disconnections without infinite retries; max 6 attempts prevents zombie queue growth. | n |
| Offline queue persistence | Store in IndexedDB (Dexie table `pendingActions`) | Survives page reload; Dexie handles serialization. | n |
| Sync conflict resolution | Server wins (no client-side merge) for writes; client cache is read-only except for pending actions | Simplifies offline architecture; no CRDT or operational transform needed. | n |
| Prisma migration strategy | `prisma migrate dev` for local development; `prisma migrate deploy` for production | Standard Prisma workflow; Neon supports direct connection. | n |
| Database seeding | Seed script for dev/test; production seeded by admin | Allows testing without manual data entry. | n |
| song_cue_sheet.block ordering | `order` field (integer, 0-based); blocks array stored in DB; order enforced by application logic | Matches REQ-DATA-04 `blocks[]` structure. | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Server-Side Schema & API ⭐ MVP

**User Story**: As a developer, I want a complete Prisma schema defining all Floworship entities so that the Fastify API can perform CRUD operations against a PostgreSQL (Neon) database with type safety.

**Why P1**: Foundation for all server-side logic; every other block depends on the data model.

**Acceptance Criteria**:

1. WHEN the Prisma schema is defined THEN it SHALL include models for: `User`, `Ministry`, `MinistryMember`, `Song`, `SongCueSheet`, `CueBlock`, `ServiceSchedule`, `ServiceAssignment`, `ServiceRepertoireItem`, `SessionExecutionLog`, `AvailabilityResponse`, `Musician`, `WhatsAppMessageLog`. *(REQ-DATA-01, REQ-DATA-04)*
2. WHEN `SongCueSheet` is defined THEN it SHALL have fields: `song_id`, `reference_track_url`, `total_duration_seconds`, `blocks` (relation to `CueBlock[]`). *(REQ-DATA-04)*
3. WHEN `CueBlock` is defined THEN it SHALL have fields: `id`, `label`, `start_time`, `end_time`, `duration` (calculated), `chordpro_content`, `order`. *(REQ-DATA-04)*
4. WHEN `Song` is defined THEN it SHALL have a `default_key` field and a `status` field (`rascunho | pronta | arquivada`). *(REQ-DATA-04 + REQ-REP-01)*
5. WHEN the schema is migrated THEN `prisma migrate dev` SHALL complete without errors and create all tables in the development database.

**Independent Test**: Run `prisma migrate dev` → all tables created; `prisma studio` → can browse models.

---

### P1: Dexie.js Client Database ⭐ MVP

**User Story**: As a musician using the PWA, I want my song library, chords, and confirmed scales cached locally so that I can access them in the Modo Estudo even when offline.

**Why P1**: Enables the offline study mode (B6); Dexie.js is the approved client storage (REQ-DATA-02).

**Acceptance Criteria**:

1. WHEN the Dexie database is initialized THEN it SHALL create tables for: `songs`, `songCueSheets`, `scales` (confirmed), `pendingActions`. *(REQ-DATA-02, REQ-DATA-03)*
2. WHEN the client fetches songs/cales/cue sheets from the server THEN the data SHALL be cached in IndexedDB for offline access. *(REQ-DATA-03)*
3. WHEN the client is offline AND requests cached data THEN Dexie SHALL return the cached version without error. *(REQ-DATA-03)*
4. WHEN live session state (current block of Modo Operador) is requested THEN it SHALL come from the server via WebSocket — NEVER from IndexedDB. *(REQ-DATA-03 negative AC)*
5. WHEN the client performs an action that requires server confirmation (e.g., attendance) while offline THEN the action SHALL be stored in `pendingActions` table with status "pending". *(REQ-DATA-03)*
6. WHEN the client reconnects THEN all pending actions in `pendingActions` SHALL be sent to the server in order; successful actions SHALL be marked "synced"; failed actions SHALL be retried with exponential backoff. *(REQ-DATA-03)*

**Independent Test**: Cache songs via API → go offline (devtools) → navigate to Modo Estudo → songs load from cache. Start live session → go offline → current block does NOT update from cache (stays on last server value).

---

### P1: Fastify CRUD API Routes ⭐ MVP

**User Story**: As a frontend developer, I want typed Fastify routes for all core entities (songs, cue sheets, ministries, members, scales) so that the web and mobile clients can perform CRUD operations against the server.

**Why P1**: Enables B3 (Library), B5 (UI), B8 (Repertoire) to interact with the server.

**Acceptance Criteria**:

1. WHEN the Fastify app starts THEN it SHALL expose CRUD routes for: `/songs`, `/songs/:id/cue-sheet`, `/ministries`, `/ministries/:id/members`, `/scales`, `/service-schedules`, `/service-assignments`. *(REQ-DATA-01)*
2. WHEN a route receives invalid input THEN it SHALL return a 400 with a structured error message (not a generic 500). *(Implicit API quality)*
3. WHEN a route requires authentication THEN it SHALL validate the JWT access token before processing. *(REQ-AUTH-01 — security boundary)*
4. WHEN a route requires a specific role THEN it SHALL enforce RBAC via the middleware from B1. *(REQ-AUTH-07)*
5. WHEN the API is used THEN error responses SHALL follow the format `{ error: string, details?: object }`. *(Implicit API consistency)*

**Independent Test**: POST /songs with valid payload → 201 created; GET /songs → list; GET /songs/:id → detail; POST /songs with invalid payload → 400 with error message.

---

## Edge Cases

- WHEN IndexedDB is full or unavailable THEN the Dexie wrapper SHALL throw a descriptive error and the app SHALL degrade gracefully (show cached data if available, or error message if not).
- WHEN a sync conflict occurs (server data changed since client cached it) THEN the server SHALL win; client cache SHALL be overwritten on next sync.
- WHEN a pending action references an entity that no longer exists (e.g., song deleted) THEN the sync SHALL skip that action and log a warning.
- WHEN the client is offline for >30 days THEN cached data SHALL still be served (no TTL on cached reads).
- WHEN the database schema is updated (Prisma migration) THEN existing data SHALL be preserved (no data loss on migration).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| DATA-01 | P1: Server-Side Schema & API, Fastify CRUD | Backend | Pending |
| DATA-02 | P1: Dexie.js Client Database | Client | Pending |
| DATA-03 | P1: Dexie.js Client Database, Sync | Client | Pending |
| DATA-04 | P1: Server-Side Schema & API | Backend | Pending |

**Coverage:** 4 total, 4 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] `prisma migrate dev` creates all tables without errors
- [ ] `prisma studio` shows all models with correct relationships
- [ ] Fastify routes return typed responses for all CRUD operations
- [ ] Dexie.js caches songs/cales/cue sheets; offline access works
- [ ] Live session state never reads from IndexedDB (verified by negative test)
- [ ] Pending action queue syncs on reconnection with retry logic