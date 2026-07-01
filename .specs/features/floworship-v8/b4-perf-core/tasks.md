# Motor de Execução ao Vivo — Máquina de Estados & Sincronia Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/floworship-v8/b4-perf-core/spec.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase guidelines — confirm before Execute. Guidelines found: none — strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| State machine types | unit | All state interfaces, transition types defined | `src/engine/types/**/*.test.ts` | `npm run test:unit` |
| Programado state | unit | Auto-advance on duration, session end, event emission | `src/engine/states/**/*.test.ts` | `npm run test:unit` |
| Override state | unit | Override insertion, pointer pause, queue stacking | `src/engine/states/**/*.test.ts` | `npm run test:unit` |
| Retomada state | unit | Return to paused pointer, queue drain, no skips | `src/engine/states/**/*.test.ts` | `npm run test:unit` |
| Override cancellation | unit | Cancel returns to Programado, clears queue | `src/engine/states/**/*.test.ts` | `npm run test:unit` |
| WebSocket propagation | integration | Event emission to room, reconnection snapshot | `src/websocket/**/*.test.ts` | `npm run test:integration` |
| Room management | integration | Join/leave rooms, multi-room support | `src/websocket/**/*.test.ts` | `npm run test:integration` |
| Session execution log | integration | Log entries for all transitions | `src/services/logging/**/*.test.ts` | `npm run test:integration` |
| iOS/PWA detection | unit | Standalone detection, Wake Lock fallback | `src/platform/**/*.test.ts` | `npm run test:unit` |
| State machine integration | e2e | Full session lifecycle with overrides | `src/e2e/**/*.test.ts` | `npm run test:e2e` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|---|---|---|---|
| unit | Yes | Pure function tests; no shared state | Jest standard |
| integration | Yes | Each test spins up fresh server + WS client | Fastify + ws test helper |
| e2e | No | Full browser; shared session state | Playwright serial mode |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
|---|---|---|
| Quick | After tasks with unit tests only | `npm run test:unit` |
| Full | After tasks with integration tests | `npm run test:unit && npm run test:integration` |
| Build | After phase completion or config/entity-only tasks | `npm run build && npm run lint && npm run test` |

---

## Execution Plan

### Phase 1: Types & State Machine Core (Sequential)

```
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: WebSocket Layer (Parallel OK)

```
T6 complete, then:
  ├── T7 [P]
  └── T8 [P]
```

### Phase 3: Logging & Platform (Parallel OK)

```
T8 complete, then:
  ├── T9 [P]
  └── T10 [P]
```

### Phase 4: Integration & Verification (Sequential)

```
T10 complete, then:
  T11 → T12
```

---

## Task Breakdown

### T1: State Machine Types & Interfaces

**What**: Define all TypeScript types and interfaces for the live session state machine: states, transitions, events, and session state.
**Where**: `src/engine/types.ts`
**Depends on**: None
**Reuses**: None (first task)
**Requirement**: CORE-01, CORE-02, CORE-03

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `SessionState` interface: `session_id`, `current_block_id`, `blocks[]`, `programado_pointer`, `override_stack`, `sequence`, `timestamp`
- [ ] `Block` interface: `id`, `label`, `start_time`, `end_time`, `duration`, `order`
- [ ] `EngineState` type: `"idle" | "programado" | "override" | "retomada"`
- [ ] `TransitionEvent` interface: `block_id`, `session_id`, `triggered_at`, `was_override`, `sequence`, `triggered_by_user_id`
- [ ] `OverrideAction` interface: `block_id`, `triggered_by_user_id`, `triggered_at`
- [ ] All types exported
- [ ] Unit tests: types compile, interfaces match spec
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T2: Programado State — Auto-Advance Engine

**What**: Implement the Programado state that auto-advances blocks based on duration and emits WebSocket events.
**Where**: `src/engine/states/programado.ts`
**Depends on**: T1
**Reuses**: Types from T1
**Requirement**: CORE-01

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `startProgramado(session)` begins at `order = 0`, starts timer
- [ ] When elapsed time reaches current block's `duration`, advances to next block (`order + 1`)
- [ ] When last block's duration expires, session ends (emits `session_ended`)
- [ ] Each advancement emits `block_changed` event with `was_override: false`
- [ ] Timer uses `setInterval` with drift correction (server-side)
- [ ] Unit tests: start at block 0, auto-advance after duration, session ends on last block, event emitted
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T3: Override State — Extra Block Insertion

**What**: Implement the Override state that inserts an extra block execution and pauses the Programado pointer.
**Where**: `src/engine/states/override.ts`
**Depends on**: T1, T2
**Reuses**: Types from T1, Programado from T2
**Requirement**: CORE-02, CORE-04, CORE-06

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `triggerOverride(session, blockId, userId)` enters Override state
- [ ] Programado pointer pauses at next expected block (not advancing)
- [ ] Override block plays for its full `duration`
- [ ] While Override is active, tapping another block queues it (sequential stacking per CORE-06)
- [ ] Override restricted to operator/leader role (CORE-04) — reject with error if musician
- [ ] `block_changed` event has `was_override: true`
- [ ] When Override duration expires, transitions to Retomada
- [ ] Unit tests: override insertion, pointer pause, queue stacking, role rejection, event emission
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T4: Retomada State — Resume Programado

**What**: Implement the Retomada state that returns to Programado at the paused pointer after Override completes.
**Where**: `src/engine/states/retomada.ts`
**Depends on**: T1, T2, T3
**Reuses**: Types from T1, Programado from T2, Override from T3
**Requirement**: CORE-03, CORE-06

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `startRetomada(session)` returns to Programado state at paused pointer
- [ ] Resumes at exact block where Programado pointer was paused — not after override
- [ ] No blocks skipped or repeated (beyond the override that just completed)
- [ ] If override stack has queued overrides, next queued override executes before returning to Programado
- [ ] `block_changed` event emitted with `was_override: false`
- [ ] Unit tests: return to paused pointer, no skips, queue drain, event emission
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T5: Override Cancellation

**What**: Implement override cancellation that returns directly to Programado and clears the override queue.
**Where**: `src/engine/states/cancel-override.ts`
**Depends on**: T1, T3, T4
**Reuses**: Types from T1, Override from T3, Retomada from T4
**Requirement**: CORE-05

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `cancelOverride(session)` immediately returns to Programado at paused pointer
- [ ] All queued overrides are cleared (not executed)
- [ ] `block_changed` event reflects return with `was_override: false`
- [ ] If no override active, cancel is a no-op
- [ ] Unit tests: cancel returns to Programado, clears queue, no-op when not overriding, event emission
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T6: Override Stacking — Multiple Sequential Overrides

**What**: Implement the override stacking logic that queues multiple overrides and executes them sequentially.
**Where**: `src/engine/states/override-stack.ts`
**Depends**: T1, T3, T4
**Reuses**: Types from T1, Override from T3, Retomada from T4
**Requirement**: CORE-06

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] When override IS active and operator triggers another, it is queued (not executed immediately)
- [ ] Queued overrides execute sequentially after current override completes
- [ ] Each queued override plays for its full duration
- [ ] After all queued overrides complete, system returns to Programado
- [ ] Cancel clears all queued overrides
- [ ] Unit tests: queue 2 overrides, execute sequentially, cancel clears queue, return to Programado after all
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T7: WebSocket Event Propagation [P]

**What**: Implement WebSocket server that broadcasts `block_changed` events to all clients in the session room.
**Where**: `src/websocket/server.ts` + `src/websocket/events.ts`
**Depends on**: T1, T6
**Reuses**: Types from T1, state machine from T6
**Requirement**: CORE-08

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `block_changed` event emitted to all sockets in room `ministry:{ministryId}:session:{sessionId}`
- [ ] Event payload: `{ event: "block_changed", block_id, session_id, triggered_at, was_override, sequence }`
- [ ] Event does NOT include full `song_cue_sheet` — only lightweight fields
- [ ] Room join requires valid JWT + ministry membership (from B1-T12)
- [ ] Room leave on disconnect
- [ ] Integration tests: client receives event on block change, multi-client broadcast, room isolation
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T8: Reconnection Snapshot Endpoint [P]

**What**: Implement `GET /sessions/:id/state` endpoint that returns full session state for reconnection.
**Where**: `src/routes/sessions/state.ts`
**Depends on**: T1, T7
**Reuses**: Types from T1, WebSocket from T7
**Requirement**: CORE-09

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `GET /sessions/:id/state` returns: `{ current_block_id, blocks[], sequence, timestamp, programado_pointer, override_stack }`
- [ ] Endpoint requires valid JWT + ministry membership
- [ ] Client fetches snapshot before resuming WebSocket listening on reconnection
- [ ] Snapshot includes all blocks in order
- [ ] Snapshot reflects latest server state (not stale)
- [ ] Integration tests: fetch snapshot, verify all fields, auth required, stale data not served
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T9: Session Execution Log Persistence [P]

**What**: Implement logging of all state transitions (auto-advance, override, retomada) to `session_execution_log`.
**Where**: `src/services/logging/session-log.ts`
**Depends on**: T1, B2-T1
**Reuses**: Types from T1, Prisma schema from B2
**Requirement**: CORE-07

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] On every block transition (auto-advance, override trigger, retomada completion), log entry created in `session_execution_log`
- [ ] Log entry includes: `session_id`, `block_id`, `triggered_at` (ISO), `was_override`, `triggered_by_user_id`, `duration_seconds`
- [ ] Session end produces a complete log of all transitions
- [ ] Log is queryable by admin for session history
- [ ] Integration tests: auto-advance logs 1 entry, override logs 1 entry, retomada logs 1 entry, query returns all
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T10: iOS/PWA Standalone Detection & Wake Lock Fallback [P]

**What**: Implement iOS/PWA standalone detection and Wake Lock fallback for keeping screen on during live sessions.
**Where**: `src/platform/standalone.ts` + `src/platform/wake-lock.ts`
**Depends on**: None (client-side only)
**Reuses**: None
**Requirement**: CORE-10

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `isStandalone()` returns true when `navigator.standalone === true` (iOS) or `display-mode: standalone` media query matches
- [ ] `requestWakeLock()` requests Screen Wake Lock API if available
- [ ] `requestWakeLock()` fallback for iOS <18.4: shows visual indicator with instructions to enable "Keep Screen On" in iOS Settings
- [ ] Wake Lock released on session end or page unload
- [ ] Unit tests: standalone detection, Wake Lock request, fallback visual indicator
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T11: State Machine Integration Test

**What**: Write integration tests for the full session lifecycle: start → auto-advance → override → retomada → cancel → end.
**Where**: `src/engine/__tests__/state-machine.integration.test.ts`
**Depends on**: T2–T10
**Reuses**: All state machine modules
**Requirement**: CORE-01 through CORE-10

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Test: start session → auto-advance through 3 blocks → session ends
- [ ] Test: start session → override to block 2 → retomada returns to paused pointer
- [ ] Test: start session → override → cancel → returns to Programado immediately
- [ ] Test: start session → 2 sequential overrides → both execute → return to Programado
- [ ] Test: block_changed events received by connected client
- [ ] Test: reconnection fetches snapshot and resumes
- [ ] Test: musician cannot trigger override (rejected)
- [ ] All tests pass
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T12: Final Build Verification

**What**: Run full build + lint + all tests to verify B4 is complete.
**Where**: N/A (project root)
**Depends on**: T11
**Reuses**: None
**Requirement**: CORE-01 through CORE-10

**Tools**:
- MCP: NONE
- Skill: `lint-and-validate`

**Done when**:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (no errors)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All e2e tests pass
- [ ] Session auto-advances correctly
- [ ] Override inserts extra block; pointer pauses; retomada resumes
- [ ] Multiple overrides stack correctly
- [ ] Override cancellation returns to Programado
- [ ] All transitions logged
- [ ] WebSocket events propagate to all clients
- [ ] Reconnection fetches snapshot and resumes
- [ ] iOS PWA detects standalone and shows Wake Lock guidance

**Tests**: integration
**Gate**: build

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3 ──→ T4 ──→ T5 ──→ T6

Phase 2 (Parallel):
  T6 complete, then:
    ├── T7 [P]
    └── T8 [P]

Phase 3 (Parallel):
  T8 complete, then:
    ├── T9 [P]
    └── T10 [P]

Phase 4 (Sequential):
  T10 complete, then:
    T11 ──→ T12
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: State machine types | 1 types file | ✅ Granular |
| T2: Programado state | 1 state file | ✅ Granular |
| T3: Override state | 1 state file | ✅ Granular |
| T4: Retomada state | 1 state file | ✅ Granular |
| T5: Override cancellation | 1 state file | ✅ Granular |
| T6: Override stacking | 1 state file | ✅ Granular |
| T7: WebSocket propagation | 2 files (server + events) | ✅ Granular |
| T8: Reconnection snapshot | 1 route file | ✅ Granular |
| T9: Session execution log | 1 service file | ✅ Granular |
| T10: iOS/PWA detection + Wake Lock | 2 files | ✅ Granular |
| T11: State machine integration test | 1 test file | ✅ Granular |
| T12: Final build verification | Build gate | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T1, T2 | T1, T2 | ✅ Match |
| T4 | T1, T2, T3 | T1, T2, T3 | ✅ Match |
| T5 | T1, T3, T4 | T1, T3, T4 | ✅ Match |
| T6 | T1, T3, T4 | T1, T3, T4 | ✅ Match |
| T7 | T1, T6 | T1, T6 | ✅ Match |
| T8 | T1, T7 | T1, T7 | ✅ Match |
| T9 | T1, B2-T1 | T1, B2-T1 | ✅ Match |
| T10 | None | None | ✅ Match |
| T11 | T2–T10 | T2–T10 | ✅ Match |
| T12 | T11 | T11 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | State machine types | unit | unit | ✅ OK |
| T2 | Programado state | unit | unit | ✅ OK |
| T3 | Override state | unit | unit | ✅ OK |
| T4 | Retomada state | unit | unit | ✅ OK |
| T5 | Override cancellation | unit | unit | ✅ OK |
| T6 | Override stacking | unit | unit | ✅ OK |
| T7 | WebSocket propagation | integration | integration | ✅ OK |
| T8 | Reconnection snapshot | integration | integration | ✅ OK |
| T9 | Session execution log | integration | integration | ✅ OK |
| T10 | iOS/PWA detection | unit | unit | ✅ OK |
| T11 | State machine integration | integration | integration | ✅ OK |
| T12 | Build gate | none | build | ✅ OK |
