# Motor de Execução ao Vivo — Máquina de Estados & Sincronia Specification

## Problem Statement

The live performance engine is the heart of Floworship. It manages a session's state machine (Programado → Override → Retomada), advances blocks automatically based on timing, propagates block changes via WebSocket to all connected clients, and handles reconnection gracefully. The state machine must be deterministic: when a block finishes (by duration), the next block in order is activated; when an override is triggered, an extra block execution is inserted and the normal sequence resumes after its duration completes. Only operators/leaders can trigger overrides. The engine must log all state transitions and handle iOS background reconnection.

## Goals

- [ ] Automatic block advancement based on `duration` (Programado state) *(REQ-CORE-01)*
- [ ] Override state: extra block execution inserted; normal sequence pauses *(REQ-CORE-02)*
- [ ] Retomada: automatic return to Programado after Override completes *(REQ-CORE-03)*
- [ ] Override restricted to Operator/Leader role *(REQ-CORE-04)*
- [ ] Override cancellation (return directly to Programado) *(REQ-CORE-05)*
- [ ] Multiple sequential Overrides allowed *(REQ-CORE-06)*
- [ ] Session execution log persists all overrides with timestamp *(REQ-CORE-07)*
- [ ] Block transitions propagated via lightweight WebSocket events per room *(REQ-CORE-08)*
- [ ] Reconnection flow: fetch snapshot via `GET /sessions/:id/state` before resuming *(REQ-CORE-09)*
- [ ] iOS/PWA standalone detection; Wake Lock fallback *(REQ-CORE-10)*

## Out of Scope

| Feature | Reason |
|---|---|
| Undo last block advancement | Not specified; once advanced, cannot go back (only override forward) |
| Pause/resume the session clock | Not in source spec §3.3 (clock always advances) |
| Multi-song sessions (cross-song transitions) | Source spec §3.3 implies single-song sessions for MVP |
| Real-time collaboration between operators | Not specified |
| iOS Wake Lock API (full) | Only "fallback visual" for iOS <18.4 per REQ-CORE-10 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| State machine implementation | Finite state machine (FSM) with states: `idle`, `programado`, `override`, `retomada`; transitions triggered by timer or operator action | Clean separation of concerns; testable as pure function. | n |
| Timer mechanism | `setInterval` with drift correction (server-side); client receives state, not raw timer | Server is source of truth for time; clients display server-pushed state. | n |
| Override behavior when no override is active | Insert override block immediately; pause the "next expected" pointer | Matches REQ-CORE-02 exactly. | n |
| Override behavior when an override IS active | Queue the new override; it will execute after current override finishes (sequential, REQ-CORE-06) | Clean stacking without complexity; allows "repeat chorus 3x" pattern. | n |
| Cancel override when multiple overrides are queued | Cancel the CURRENT override only; queued overrides remain | Most intuitive UX; operator knows what they just triggered. | n |
| WebSocket event format | `{ event: "block_changed", block_id: string, session_id: string, triggered_at: string (ISO), was_override: boolean, sequence: number }` | Matches REQ-CORE-08; `sequence` enables ordering/conflict detection. | n |
| Reconnection snapshot endpoint | `GET /sessions/:id/state` returns: `{ current_block_id, blocks[], sequence, timestamp, programado_pointer, override_stack }` | Provides full state for client to resume display. | n |
| iOS standalone detection | `navigator.standalone` (iOS Safari) + `display-mode: standalone` media query | Standard PWA detection; both Web and Mobile use the same codebase. | n |
| Wake Lock fallback (iOS <18.4) | Visual indicator showing "Keep screen on" with instructions; no programmatic lock | iOS <18.4 doesn't support Wake Lock API; visual fallback per REQ-CORE-10. | n |
| Session execution log format | `{ session_id, block_id, triggered_at, was_override, triggered_by_user_id, duration_seconds }` | Captures all required data for REQ-CORE-07. | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Programado State (Auto-Advance) ⭐ MVP

**User Story**: As an operator, I want the session to automatically advance to the next block when the current block's duration expires so that the performance flows without manual intervention.

**Why P1**: Core state machine behavior; the simplest path to a working live session.

**Acceptance Criteria**:

1. WHEN a session starts in Programado state THEN the clock SHALL begin at block `order = 0` (first block). *(REQ-CORE-01)*
2. WHEN the elapsed time reaches the current block's `duration` THEN the system SHALL automatically advance to the next block (`order + 1`). *(REQ-CORE-01)*
3. WHEN the last block's duration expires THEN the session SHALL end (no further advancement). *(Implicit: end of sequence)*
4. WHEN the system advances THEN it SHALL emit a `block_changed` event via WebSocket to the session room. *(REQ-CORE-08)*
5. WHEN a block transitions THEN the `block_changed` event SHALL include: `block_id`, `session_id`, `triggered_at`, `was_override: false`. *(REQ-CORE-08)*

**Independent Test**: Start session with 3 blocks (5s, 10s, 5s) → watch auto-advance: block 0 (5s) → block 1 (10s) → block 2 (5s) → session ends. Verify WebSocket events received by connected client.

---

### P1: Override State ⭐ MVP

**User Story**: As an operator, I want to trigger an override (play a block out of order) so that I can repeat a chorus or jump to a bridge based on the worship leader's direction.

**Why P1**: Critical for live worship; leaders often call for ad-hoc repetitions.

**Acceptance Criteria**:

1. WHEN the operator taps a block in the grid (while in Programado) THEN the system SHALL enter Override state and begin playing the selected block with its full `duration`. *(REQ-CORE-02)*
2. WHEN Override is active THEN the Programado pointer SHALL remain paused at the next expected block (not advancing). *(REQ-CORE-02)*
3. WHEN Override is active AND the operator taps another block THEN a new Override SHALL be queued (will execute after current Override finishes). *(REQ-CORE-06)*
4. WHEN a user with `musician` role attempts to trigger an Override THEN the system SHALL reject the action (button hidden or 403 on server). *(REQ-CORE-04)*
5. WHEN an Override begins THEN the `block_changed` event SHALL have `was_override: true`. *(REQ-CORE-08)*
6. WHEN the Override block's duration expires THEN the system SHALL automatically transition to Retomada state. *(REQ-CORE-03)*

**Independent Test**: Start session in Programado (block 0, duration 60s) → at 10s, trigger Override to block 2 → block 2 plays for its full duration → system returns to Programado at block 1 (where it was paused).

---

### P1: Retomada State ⭐ MVP

**User Story**: As an operator, I want the session to automatically resume the normal Programado sequence after an Override completes so that I don't lose track of where I was.

**Why P1**: Without Retomada, overrides would break the session flow permanently.

**Acceptance Criteria**:

1. WHEN an Override completes (its duration expires) THEN the system SHALL return to Programado state. *(REQ-CORE-03)*
2. WHEN returning to Programado THEN the system SHALL resume at the exact block where the Programado pointer was paused — not at the block after the override. *(REQ-CORE-03)*
3. WHEN returning to Programado THEN no blocks SHALL be skipped or repeated (beyond the override that just completed). *(REQ-CORE-03)*
4. When the override stack has queued overrides THEN the next queued override SHALL execute before returning to Programado. *(REQ-CORE-06)*

**AC example from spec**: Dado fluxo `Intro→Verso1→PréRefrão→Refrão→Verso2→Refrão→Ponte→Fim`, um Override do bloco "Refrão" antes do fluxo natural chegar lá deve, ao terminar, retomar exatamente em "Verso2".

**Independent Test**: Session: Intro(5s) → V1(5s) → PR(5s) → Ref(5s) → V2(5s) → Ref(5s) → Ponte(5s) → Fim(5s). At 2s of Intro, override to Ref(5s). After Ref(5s), system resumes at V1 (where Programado pointer was). Verify: Ref played once (override), V1 now playing.

---

### P1: Override Cancellation ⭐ MVP

**User Story**: As an operator, I want to cancel an in-progress Override and return directly to the Programado flow so that I can change my mind mid-override.

**Why P1**: REQ-CORE-05; essential UX for live worship where plans change rapidly.

**Acceptance Criteria**:

1. WHEN an Override is active AND the operator clicks "Cancel Override" THEN the system SHALL immediately return to Programado state at the paused pointer. *(REQ-CORE-05)*
2. WHEN the Override is cancelled THEN no queued overrides SHALL be executed (they are also cleared). *(REQ-CORE-05 implicit)*
3. WHEN the Override is cancelled THEN the `block_changed` event SHALL reflect the return to Programado with `was_override: false`. *(REQ-CORE-08)*

**Independent Test**: Start session → override to block 2 (duration 30s) → at 5s, cancel override → system immediately returns to block 1 (Programado pointer).

---

### P1: Session Execution Log ⭐ MVP

**User Story**: As an admin, I want every state transition (including overrides) logged with timestamp so that I can review what happened during a past session.

**Why P1**: REQ-CORE-07; provides audit trail for post-session analysis.

**Acceptance Criteria**:

1. WHEN a block transition occurs (Programado auto-advance OR Override trigger OR Retomada completion) THEN it SHALL be logged in `session_execution_log` with: `session_id`, `block_id`, `triggered_at` (ISO timestamp), `was_override`, `triggered_by_user_id`, `duration_seconds`. *(REQ-CORE-07)*
2. WHEN the session ends THEN the log SHALL contain a complete record of all transitions that occurred during the session. *(REQ-CORE-07)*
3. WHEN an admin views session history THEN they SHALL see the full execution log for that session. *(Implicit: log is queryable)*

**Independent Test**: Run a session with 1 auto-advance + 1 override + 1 retomada → query `session_execution_log` → 3 entries with correct fields.

---

### P1: WebSocket Event Propagation ⭐ MVP

**User Story**: As a musician in Modo Letra/Cifra, I want to see the current block update on my screen the instant the operator advances or overrides so that I always see the right lyrics/chords.

**Why P1**: REQ-CORE-08; enables the real-time sync between operator and musician devices.

**Acceptance Criteria**:

1. WHEN a block transition occurs THEN the server SHALL emit a `block_changed` event to all sockets in the room `ministry:{ministryId}:session:{sessionId}`. *(REQ-CORE-08)*
2. WHEN a client receives `block_changed` THEN it SHALL update the displayed block (Modo Letra/Cifra/TV) without page reload. *(REQ-CORE-08)*
3. WHEN the event is emitted THEN it SHALL NOT include the full `song_cue_sheet` — only the lightweight fields: `block_id`, `session_id`, `triggered_at`, `was_override`, `sequence`. *(REQ-CORE-08)*
4. WHEN a client reconnects THEN it SHALL first fetch the snapshot via `GET /sessions/:id/state` before resuming WebSocket listening. *(REQ-CORE-09)*

**Independent Test**: Open Modo Operador on one device → Open Modo Letra on another → operator advances block → Modo Letra updates instantly.

---

## Edge Cases

- WHEN a session has only 1 block THEN auto-advance after that block ends SHALL end the session (no next block).
- WHEN an Override targets a block that is currently playing in Programado THEN the system SHALL still insert the override (playing the same block twice: once as Programado, once as Override).
- WHEN the operator triggers Override to the last block in the sequence THEN after the override completes, the system returns to Programado at whatever pointer was paused.
- WHEN multiple clients are connected AND one disconnects THEN the other clients continue receiving events normally.
- WHEN the WebSocket connection drops on iOS (background) THEN on foreground the client SHALL fetch snapshot and resume without user intervention. *(REQ-CORE-09)*
- WHEN `navigator.standalone` is true (iOS PWA installed) THEN the app SHALL display a visual indicator to enable Wake Lock manually. *(REQ-CORE-10)*

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| CORE-01 | P1: Programado State | State Machine | Pending |
| CORE-02 | P1: Override State | State Machine | Pending |
| CORE-03 | P1: Retomada State | State Machine | Pending |
| CORE-04 | P1: Override State (RBAC) | Security | Pending |
| CORE-05 | P1: Override Cancellation | State Machine | Pending |
| CORE-06 | P1: Override State (Stacking) | State Machine | Pending |
| CORE-07 | P1: Session Execution Log | Logging | Pending |
| CORE-08 | P1: WebSocket Propagation | Networking | Pending |
| CORE-09 | P1: Reconnection | Networking | Pending |
| CORE-10 | P1: iOS/PWA Detection | Platform | Pending |

**Coverage:** 10 total, 10 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Session auto-advances through blocks based on duration
- [ ] Override inserts extra block; Programado pointer pauses; Retomada resumes exactly where it paused
- [ ] Multiple overrides stack correctly (sequential)
- [ ] Override cancellation returns to Programado immediately
- [ ] All state transitions logged in `session_execution_log`
- [ ] WebSocket events propagate block changes to all connected clients
- [ ] Reconnection fetches snapshot and resumes without user intervention
- [ ] iOS PWA detects standalone mode and shows Wake Lock guidance