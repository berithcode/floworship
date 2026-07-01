# Persistência — Backend + Client Offline Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/floworship-v8/b2-persistencia/spec.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase guidelines — confirm before Execute. Guidelines found: none — strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| Prisma schema (full) | none (migration verifies) | All models, relations, indexes correct | `prisma/schema.prisma` | `npx prisma migrate dev` |
| Seed script | integration | Dev database seeded with test data | `prisma/seed.ts` | `npx prisma db seed` |
| Fastify CRUD routes | integration | All CRUD operations for core entities | `src/routes/**/*.test.ts` | `npm run test:integration` |
| API validation | unit | Zod schemas reject invalid input; 400 on bad payload | `src/schemas/**/*.test.ts` | `npm run test:unit` |
| Dexie.js schema | unit | Tables created, versioning works | `src/offline/dexie/**/*.test.ts` | `npm run test:unit` |
| Offline action queue | unit | Enqueue, dequeue, retry, exponential backoff | `src/offline/queue/**/*.test.ts` | `npm run test:unit` |
| Sync logic | integration | Pending actions sync on reconnect; server wins on conflict | `src/offline/sync/**/*.test.ts` | `npm run test:integration` |
| Negative AC test | e2e | Live session state NEVER from IndexedDB | `src/e2e/**/*.test.ts` | `npm run test:e2e` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|---|---|---|---|
| unit | Yes | Per-test isolated; no shared DB state | Jest standard |
| integration | Yes | Each test spins up fresh Fastify instance + test DB | Fastify test helper pattern |
| e2e | No | Full browser; shared IndexedDB state | Playwright serial mode |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
|---|---|---|
| Quick | After tasks with unit tests only | `npm run test:unit` |
| Full | After tasks with integration tests | `npm run test:unit && npm run test:integration` |
| Build | After phase completion or config/entity-only tasks | `npm run build && npm run lint && npm run test` |

---

## Execution Plan

### Phase 1: Full Schema & Seed (Sequential)

```
T1 → T2
```

### Phase 2: API Layer (Parallel OK)

```
T2 complete, then:
  ├── T3 [P]
  ├── T4 [P]
  └── T5 [P]
```

### Phase 3: Offline Layer (Sequential)

```
T5 complete, then:
  T6 → T7 → T8
```

### Phase 4: Negative AC & Verification (Sequential)

```
T8 complete, then:
  T9 → T10
```

---

## Task Breakdown

### T1: Full Prisma Schema — All Models

**What**: Extend the B1 schema to include all remaining Floworship entities: Song, SongCueSheet, CueBlock, ServiceSchedule, ServiceAssignment, ServiceRepertoireItem, SessionExecutionLog, AvailabilityResponse, Musician, WhatsAppMessageLog.
**Where**: `prisma/schema.prisma`
**Depends on**: B1-T1 (User, Ministry, MinistryMember already exist)
**Reuses**: B1-T1 schema
**Requirement**: DATA-01, DATA-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `Song` model has: `id`, `title`, `artist`, `default_key`, `tags` (String[]), `status` (enum: rascunho/pronta/arquivada), `notes`, `ministry_id` (FK), `created_by` (FK → User), `created_at`, `updated_at`
- [ ] `SongCueSheet` model has: `id`, `song_id` (FK → Song, unique), `reference_track_url`, `total_duration_seconds`, `created_at`, `updated_at`
- [ ] `CueBlock` model has: `id`, `cue_sheet_id` (FK → SongCueSheet), `label`, `start_time`, `end_time`, `duration` (Float), `chordpro_content` (Text), `order` (Int)
- [ ] `ServiceSchedule` model has: `id`, `ministry_id` (FK), `date`, `created_by` (FK → User), `created_at`
- [ ] `ServiceAssignment` model has: `id`, `schedule_id` (FK → ServiceSchedule), `user_id` (FK → User), `role`, `confirmed` (Boolean), `confirmed_at`
- [ ] `ServiceRepertoireItem` model has: `id`, `schedule_id` (FK), `song_id` (FK → Song), `order` (Int), `key_override`
- [ ] `SessionExecutionLog` model has: `id`, `session_id` (FK), `block_id` (FK → CueBlock), `triggered_at` (DateTime), `was_override` (Boolean), `triggered_by_user_id` (FK → User), `duration_seconds` (Float)
- [ ] `Musician` model has: `id`, `user_id` (FK → User), `instrument`, `ministry_id` (FK), `created_at`
- [ ] `WhatsAppMessageLog` model has: `id`, `ministry_id` (FK), `message`, `sent_by` (FK → User), `sent_at`
- [ ] All indexes defined for foreign keys and frequently queried fields
- [ ] `npx prisma migrate dev --name init-full-schema` completes without errors
- [ ] Gate check passes: `npx prisma validate`

**Tests**: none (migration verifies)
**Gate**: build

---

### T2: Migration & Seed Script

**What**: Create a seed script that populates the dev database with realistic test data for all entities.
**Where**: `prisma/seed.ts`
**Depends on**: T1
**Reuses**: Full Prisma schema from T1
**Requirement**: DATA-01

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Seed script creates: 1 ministry, 3 users (admin, operator, musician), 5 songs with cue sheets and blocks, 1 service schedule with assignments
- [ ] Seed script is idempotent (clears before seeding or uses upsert)
- [ ] `npx prisma db seed` completes without errors
- [ ] `npx prisma studio` shows populated data with correct relations
- [ ] Seed data covers all entity types for manual testing
- [ ] Gate check passes: `npx prisma db seed`

**Tests**: none (manual verification)
**Gate**: build

---

### T3: Fastify CRUD Routes — Songs & Cue Sheets [P]

**What**: Implement Fastify CRUD routes for songs and their cue sheets with full validation.
**Where**: `src/routes/songs/songs.ts` + `src/routes/songs/cue-sheet.ts`
**Depends on**: T1
**Reuses**: Prisma schema from T1, RBAC from B1-T8
**Requirement**: DATA-01

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `GET /songs` returns list of songs for current ministry (filtered by `ministry_id` from JWT)
- [ ] `POST /songs` creates song (admin/operator only), returns 201
- [ ] `GET /songs/:id` returns song detail with cue sheet
- [ ] `PUT /songs/:id` updates song (admin/operator only)
- [ ] `DELETE /songs/:id` soft-deletes (sets status to "arquivada")
- [ ] `POST /songs/:id/cue-sheet` creates/updates cue sheet with blocks
- [ ] `GET /songs/:id/cue-sheet` returns cue sheet with blocks ordered by `order`
- [ ] Invalid input returns 400 with `{ error: string, details?: object }`
- [ ] Unauthorized (musician on write routes) returns 403
- [ ] Integration tests for all CRUD operations
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T4: Fastify CRUD Routes — Ministries, Members, Schedules [P]

**What**: Implement Fastify CRUD routes for ministries, members, service schedules, and assignments.
**Where**: `src/routes/ministries/ministries.ts` + `src/routes/ministries/members.ts` + `src/routes/schedules/schedules.ts`
**Depends on**: T1
**Reuses**: Prisma schema from T1, RBAC from B1-T8
**Requirement**: DATA-01

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `GET /ministries` returns ministries for current user
- [ ] `POST /ministries` creates ministry (admin only)
- [ ] `GET /ministries/:id/members` returns member list with roles
- [ ] `POST /ministries/:id/members` adds member (admin only)
- [ ] `DELETE /ministries/:id/members/:memberId` removes member (admin only)
- [ ] `GET /schedules` returns service schedules for ministry
- [ ] `POST /schedules` creates schedule (admin/operator)
- [ ] `POST /schedules/:id/assignments` assigns musician to schedule
- [ ] `PUT /schedules/:id/assignments/:assignmentId/confirm` confirms attendance
- [ ] Invalid input returns 400; unauthorized returns 403
- [ ] Integration tests for all operations
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T5: API Validation & Error Handling Layer [P]

**What**: Create centralized Zod validation schemas and error handling middleware for all API routes.
**Where**: `src/schemas/` directory + `src/middleware/error-handler.ts`
**Depends on**: T1
**Reuses**: None
**Requirement**: DATA-01

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Zod schemas defined for all request bodies: `createSongSchema`, `updateSongSchema`, `createCueSheetSchema`, `loginSchema`, `registerSchema`, `inviteSchema`
- [ ] `validateInput(schema)` Fastify preHandler that validates request body against Zod schema
- [ ] Validation failure returns 400 with structured error: `{ error: "Validation failed", details: [{ field, message }] }`
- [ ] Global error handler catches unhandled errors and returns 500 with `{ error: "Internal server error" }` (no stack trace in production)
- [ ] Prisma unique constraint violations return 409 with `{ error: "Resource already exists" }`
- [ ] Unit tests: valid input passes, invalid input returns 400 with correct details
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T6: Dexie.js Client Database Schema

**What**: Initialize the Dexie.js database with tables for songs, cue sheets, scales, and pending actions.
**Where**: `src/offline/dexie/db.ts`
**Depends on**: None (client-side only)
**Reuses**: None
**Requirement**: DATA-02, DATA-03

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Dexie database created with version 1
- [ ] Tables: `songs` (keyPath: id), `songCueSheets` (keyPath: id, index: song_id), `scales` (keyPath: id), `pendingActions` (keyPath: id, index: status)
- [ ] `Dexie` instance exported for use by other offline modules
- [ ] Schema types exported (TypeScript interfaces matching table structure)
- [ ] Unit tests: database initializes, tables exist, can add/read records
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T7: Offline Action Queue

**What**: Implement the offline action queue that stores pending actions in IndexedDB and syncs on reconnection with exponential backoff.
**Where**: `src/offline/queue/queue.ts` + `src/offline/queue/queue.test.ts`
**Depends on**: T6
**Reuses**: Dexie database from T6
**Requirement**: DATA-03

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `enqueueAction(action)` stores action in `pendingActions` table with status "pending" and retry_count = 0
- [ ] `getPendingActions()` returns all actions with status "pending" ordered by creation time
- [ ] `markSynced(actionId)` sets status to "synced"
- [ ] `markFailed(actionId, error)` increments retry_count; if retry_count >= 6, sets status to "failed"
- [ ] `retryWithBackoff(action)` implements exponential backoff: 1s, 2s, 4s, 8s, 16s
- [ ] `syncAll()` processes pending actions in order; stops on first failure (retries later)
- [ ] Unit tests: enqueue/dequeue, sync flow, retry backoff, max retries, failure handling
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T8: Sync Logic & Server Reconciliation

**What**: Implement the sync logic that sends pending actions to the server on reconnection and reconciles cache with server state.
**Where**: `src/offline/sync/sync.ts` + `src/offline/sync/sync.test.ts`
**Depends on**: T6, T7
**Reuses**: Dexie database from T6, queue from T7
**Requirement**: DATA-03

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `syncOnReconnect()` called when `navigator.onLine` transitions from false to true
- [ ] Fetches pending actions, sends to server in order via API calls
- [ ] On success: marks action as "synced", updates local cache with server response
- [ ] On conflict (server data changed): server wins; local cache overwritten
- [ ] On network failure: retries with exponential backoff (via queue)
- [ ] `cacheFromServer(entity, data)` writes to Dexie for offline reads
- [ ] `getCachedSongs()` returns songs from IndexedDB (offline mode)
- [ ] Integration tests: full sync flow, conflict resolution, network failure handling
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T9: Negative AC Test — Live Session NOT from IndexedDB

**What**: Write an end-to-end test verifying that live session state is never read from IndexedDB — it always comes from the server via WebSocket.
**Where**: `src/e2e/live-session-negative.test.ts`
**Depends on**: T8
**Reuses**: Dexie database from T6
**Requirement**: DATA-03

**Tools**:
- MCP: NONE
- Skill: `webapp-testing`

**Done when**:
- [ ] Test caches song data in IndexedDB
- [ ] Test starts a live session via WebSocket
- [ ] Test verifies that current block state comes from WebSocket events, not from IndexedDB
- [ ] Test clears IndexedDB mid-session and verifies session continues (WebSocket still provides state)
- [ ] Test confirms `session_execution_log` entries are server-sourced
- [ ] Test passes with zero IndexedDB reads for live session state
- [ ] Gate check passes: `npm run test:e2e`

**Tests**: e2e
**Gate**: full

---

### T10: Final Build Verification

**What**: Run full build + lint + all tests to verify B2 is complete.
**Where**: N/A (project root)
**Depends on**: T9
**Reuses**: None
**Requirement**: DATA-01 through DATA-04

**Tools**:
- MCP: NONE
- Skill: `lint-and-validate`

**Done when**:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (no errors)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All e2e tests pass
- [ ] `npx prisma migrate dev` completes without errors
- [ ] `npx prisma db seed` populates test data
- [ ] Dexie schema initializes correctly
- [ ] Offline queue syncs on reconnect
- [ ] Live session state never from IndexedDB (negative AC verified)

**Tests**: integration
**Gate**: build

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2

Phase 2 (Parallel):
  T2 complete, then:
    ├── T3 [P]
    ├── T4 [P]
    └── T5 [P]

Phase 3 (Sequential):
  T5 complete, then:
    T6 ──→ T7 ──→ T8

Phase 4 (Sequential):
  T8 complete, then:
    T9 ──→ T10
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: Full Prisma schema | 1 schema file | ✅ Granular |
| T2: Migration & seed script | 1 seed file | ✅ Granular |
| T3: Songs & cue sheet routes | 2 route files | ✅ Granular |
| T4: Ministries/members/schedules routes | 3 route files | ✅ Granular |
| T5: Validation & error handling | 1 directory + 1 middleware | ✅ Granular |
| T6: Dexie.js schema | 1 module | ✅ Granular |
| T7: Offline action queue | 1 module | ✅ Granular |
| T8: Sync logic | 1 module | ✅ Granular |
| T9: Negative AC test | 1 test file | ✅ Granular |
| T10: Final build verification | Build gate | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | B1-T1 | B1-T1 | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T1 | T1 | ✅ Match |
| T4 | T1 | T1 | ✅ Match |
| T5 | T1 | T1 | ✅ Match |
| T6 | None | None | ✅ Match |
| T7 | T6 | T6 | ✅ Match |
| T8 | T6, T7 | T6, T7 | ✅ Match |
| T9 | T8 | T8 | ✅ Match |
| T10 | T9 | T9 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Prisma schema (full) | none | none (migration) | ✅ OK |
| T2 | Seed script | integration | none (manual) | ✅ OK |
| T3 | Fastify CRUD routes | integration | integration | ✅ OK |
| T4 | Fastify CRUD routes | integration | integration | ✅ OK |
| T5 | API validation | unit | unit | ✅ OK |
| T6 | Dexie.js schema | unit | unit | ✅ OK |
| T7 | Offline action queue | unit | unit | ✅ OK |
| T8 | Sync logic | integration | integration | ✅ OK |
| T9 | Negative AC test | e2e | e2e | ✅ OK |
| T10 | Build gate | none | build | ✅ OK |
