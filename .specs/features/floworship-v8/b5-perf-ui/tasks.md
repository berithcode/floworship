# Telas do Modo Performance (Mobile) Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/floworship-v8/b5-perf-ui/spec.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase guidelines — confirm before Execute. Guidelines found: none — strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| Modo Operador screen | integration | Header, dial, timeline, grid, badge, bottom nav render | `src/pages/performance/**/*.test.tsx` | `npm run test:integration` |
| Modo Letra screen | integration | Lyrics display, toggle, auto-advance, next preview | `src/pages/performance/**/*.test.tsx` | `npm run test:integration` |
| Modo Cifra screen | integration | Chords display, toggle, key indicator, auto-advance | `src/pages/performance/**/*.test.tsx` | `npm run test:integration` |
| Modo TV screen | integration | Dial circular, read-only, event-driven updates | `src/pages/performance/**/*.test.tsx` | `npm run test:integration` |
| WebSocket consumer hook | unit | Receives block_changed, updates state, reconnects | `src/hooks/**/*.test.ts` | `npm run test:unit` |
| Read-only enforcement | e2e | All Letra/Cifra/TV views change only via WS events | `src/e2e/**/*.test.ts` | `npm run test:e2e` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|---|---|---|---|
| unit | Yes | Per-test isolated; no shared state | Jest standard |
| integration | Yes | Each test mounts fresh component tree | React Testing Library standard |
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

### Phase 1: Operator View (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Musician Views (Parallel OK)

```
T3 complete, then:
  ├── T4 [P]
  └── T5 [P]
```

### Phase 3: TV View & Read-Only Enforcement (Sequential)

```
T5 complete, then:
  T6 → T7 → T8
```

### Phase 4: Final Verification (Sequential)

```
T8 complete, then:
  T9 → T10
```

---

## Task Breakdown

### T1: WebSocket Consumer Hook

**What**: Create a React hook that connects to the WebSocket, receives `block_changed` events, and manages session state on the client.
**Where**: `src/hooks/useSessionSocket.ts`
**Depends on**: B4-T7 (WebSocket server), B4-T8 (snapshot endpoint)
**Reuses**: B4 WebSocket events, B4 reconnection snapshot
**Requirement**: CORE-08, CORE-09, UI-01, UI-02, UI-03

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `useSessionSocket(sessionId, ministryId)` connects to WebSocket room
- [ ] On mount: fetches snapshot via `GET /sessions/:id/state`, initializes state
- [ ] On `block_changed` event: updates `currentBlockId`, `sequence`, `wasOverride`
- [ ] On disconnect: attempts reconnect with exponential backoff
- [ ] On reconnect: fetches snapshot before resuming
- [ ] Returns: `{ currentBlock, blocks, sequence, isOverrideActive, isConnected }`
- [ ] Cleanup: disconnects on unmount
- [ ] Unit tests: connect, receive event, reconnect, snapshot fetch, cleanup
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T2: Modo Operador — Header, Dial, Timeline, Grid, Badge

**What**: Build the Modo Operador screen with all components: header (song name/key/BPM), current block card with Dial Circular, horizontal timeline pills, tappable block grid, and state badge.
**Where**: `src/pages/performance/ModoOperador.tsx`
**Depends on**: T1, B0 (design system)
**Reuses**: B0 DialCircular, B0 CardItem, B0 PillToggle, B0 BottomNavPill, T1 useSessionSocket
**Requirement**: UI-01

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Header shows: song name, key, BPM
- [ ] Current block card shows: block label, Dial Circular with 0–100% progress (based on elapsed/duration), bg-card-elevated
- [ ] Horizontal timeline shows block pills; current block highlighted with accent-primary
- [ ] Block grid shows all blocks as tappable CardItem components
- [ ] Tapping a block in grid triggers Override (if operator has permission per CORE-04)
- [ ] State badge shows "Programado" (default accent) or "Override ativo" (warning color)
- [ ] When block changes (auto-advance or override): dial resets to 0%, timeline updates, block card updates
- [ ] Bottom nav pill shows: Ordem do Culto / Modo Operador / Chat / Encerrar sessão
- [ ] Integration tests: all components render, override triggers, badge updates, dial resets
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T3: Modo Operador — Override Confirmation & RBAC Integration

**What**: Add override confirmation dialog and RBAC enforcement to the Modo Operador grid (operator only).
**Where**: `src/pages/performance/ModoOperador.tsx` (extend T2) + `src/components/performance/OverrideConfirm.tsx`
**Depends on**: T2, B1-T8 (RBAC)
**Reuses**: T2 ModoOperador, B1 RBAC
**Requirement**: UI-01, CORE-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Tapping block shows confirmation dialog: "Trigger override to [block name]?"
- [ ] Confirm sends override via WebSocket
- [ ] Musician role: grid taps are disabled (no override button)
- [ ] Operator role: grid taps trigger override flow
- [ ] Dialog uses B0 design system styling
- [ ] Unit tests: confirm dialog shows, override sent, musician blocked, operator allowed
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T4: Modo Letra Screen [P]

**What**: Build the Modo Letra screen showing lyrics-only view with toggle for chords and next block preview.
**Where**: `src/pages/performance/ModoLetra.tsx`
**Depends on**: T1, B0, B3-T7 (ChordPro rendering)
**Reuses**: B0 PillToggle, T1 useSessionSocket, B3 ChordPro renderer
**Requirement**: UI-02, UI-05

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Displays current block's lyrics in large font, no chords by default
- [ ] "Mostrar cifra" pill toggle: tapping reveals chords above lyrics
- [ ] On `block_changed` event: view updates to new block's content automatically
- [ ] Next block preview shown in footer
- [ ] No forward/back controls (read-only enforcement per UI-05)
- [ ] Empty content shows "[No content]" placeholder
- [ ] Integration tests: lyrics render, toggle shows chords, auto-advance on event, no navigation controls
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T5: Modo Cifra Screen [P]

**What**: Build the Modo Cifra screen showing chords-first view with lyrics toggle and key indicator.
**Where**: `src/pages/performance/ModoCifra.tsx`
**Depends on**: T1, B0, B3-T7 (ChordPro rendering)
**Reuses**: B0 PillToggle, T1 useSessionSocket, B3 ChordPro renderer
**Requirement**: UI-03, UI-05

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Displays current block's content with chords visible by default, aligned above lyric syllables
- [ ] "Ocultar letra" pill toggle: tapping hides lyrics, leaving only chords
- [ ] Header always shows current key indicator (e.g., "Key: C")
- [ ] On `block_changed` event: view updates automatically
- [ ] No manual navigation controls (read-only per UI-05)
- [ ] Integration tests: chords render, toggle hides lyrics, key indicator shows, auto-advance works
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T6: Modo TV Screen

**What**: Build the Modo TV screen for television output with Dial Circular progress and minimal UI.
**Where**: `src/pages/performance/ModoTV.tsx`
**Depends on**: T1, B0
**Reuses**: B0 DialCircular, T1 useSessionSocket
**Requirement**: UI-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Displays Dial Circular with current block progress (0–100%)
- [ ] Shows current block label and timing
- [ ] Auto-advances on `block_changed` events
- [ ] Minimal UI (optimized for TV display)
- [ ] Read-only (no interaction controls)
- [ ] Integration tests: dial renders, auto-advance, no interaction
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T7: Read-Only Enforcement Verification

**What**: Write tests verifying that Modo Letra, Modo Cifra, and Modo TV are truly read-only — changes occur ONLY via WebSocket events.
**Where**: `src/e2e/read-only-enforcement.test.ts`
**Depends on**: T4, T5, T6
**Reuses**: All Modo Performance views
**Requirement**: UI-05

**Tools**:
- MCP: NONE
- Skill: `webapp-testing`

**Done when**:
- [ ] Test: Modo Letra — verify no navigation buttons, no manual block change
- [ ] Test: Modo Cifra — verify no navigation buttons, no manual block change
- [ ] Test: Modo TV — verify no interaction controls
- [ ] Test: Verify that local state mutation (bypassing WebSocket) does NOT update the view
- [ ] Test: Verify that only WebSocket `block_changed` events cause view updates
- [ ] All tests pass
- [ ] Gate check passes: `npm run test:e2e`

**Tests**: e2e
**Gate**: full

---

### T8: Modo Performance Route Integration

**What**: Wire all Modo Performance views into the React Router with session-based routing and role-based default view.
**Where**: `src/routes/performance.tsx`
**Depends on**: T2, T4, T5, T6
**Reuses**: All Modo Performance views
**Requirement**: UI-01 through UI-05

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Route `/session/:sessionId/operador` → Modo Operador (operator only)
- [ ] Route `/session/:sessionId/letra` → Modo Letra (musician default)
- [ ] Route `/session/:sessionId/cifra` → Modo Cifra
- [ ] Route `/session/:sessionId/tv` → Modo TV
- [ ] Role-based default: operator → Operador; musician → Letra
- [ ] Unauthorized access redirects to appropriate view or shows error
- [ ] Integration tests: routing works, role-based defaults, unauthorized redirect
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T9: Session End Screen

**What**: Create the session end screen that shows when the session completes.
**Where**: `src/pages/performance/SessionEnd.tsx`
**Depends on**: T1
**Reuses**: B0 design system
**Requirement**: UI-01

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Shows "Session ended" message
- [ ] "Return to home" button navigates to home route
- [ ] Uses B0 design system styling
- [ ] Unit tests: renders correctly, button navigates
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T10: Final Build Verification

**What**: Run full build + lint + all tests to verify B5 is complete.
**Where**: N/A (project root)
**Depends on**: T9
**Reuses**: None
**Requirement**: UI-01 through UI-05

**Tools**:
- MCP: NONE
- Skill: `lint-and-validate`

**Done when**:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (no errors)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All e2e tests pass
- [ ] Modo Operador: header, dial, timeline, grid, badge, bottom nav all render
- [ ] Modo Letra: lyrics display, toggle, auto-advance work
- [ ] Modo Cifra: chords display, toggle, key indicator work
- [ ] Modo TV: dial renders, auto-advances
- [ ] Read-only enforcement: all views change only via WebSocket events

**Tests**: integration
**Gate**: build

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3

Phase 2 (Parallel):
  T3 complete, then:
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
| T1: WebSocket consumer hook | 1 hook file | ✅ Granular |
| T2: Modo Operador screen | 1 page | ✅ Granular |
| T3: Override confirmation & RBAC | 1 component + page extension | ✅ Granular |
| T4: Modo Letra screen | 1 page | ✅ Granular |
| T5: Modo Cifra screen | 1 page | ✅ Granular |
| T6: Modo TV screen | 1 page | ✅ Granular |
| T7: Read-only enforcement | 1 test file | ✅ Granular |
| T8: Route integration | 1 route file | ✅ Granular |
| T9: Session end screen | 1 page | ✅ Granular |
| T10: Final build verification | Build gate | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | B4-T7, B4-T8 | B4-T7, B4-T8 | ✅ Match |
| T2 | T1, B0 | T1, B0 | ✅ Match |
| T3 | T2, B1-T8 | T2, B1-T8 | ✅ Match |
| T4 | T1, B0, B3-T7 | T1, B0, B3-T7 | ✅ Match |
| T5 | T1, B0, B3-T7 | T1, B0, B3-T7 | ✅ Match |
| T6 | T1, B0 | T1, B0 | ✅ Match |
| T7 | T4, T5, T6 | T4, T5, T6 | ✅ Match |
| T8 | T2, T4, T5, T6 | T2, T4, T5, T6 | ✅ Match |
| T9 | T1 | T1 | ✅ Match |
| T10 | T9 | T9 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | WebSocket consumer hook | unit | unit | ✅ OK |
| T2 | Modo Operador screen | integration | integration | ✅ OK |
| T3 | Override confirmation | unit | unit | ✅ OK |
| T4 | Modo Letra screen | integration | integration | ✅ OK |
| T5 | Modo Cifra screen | integration | integration | ✅ OK |
| T6 | Modo TV screen | integration | integration | ✅ OK |
| T7 | Read-only enforcement | e2e | e2e | ✅ OK |
| T8 | Route integration | integration | integration | ✅ OK |
| T9 | Session end screen | unit | unit | ✅ OK |
| T10 | Build gate | none | build | ✅ OK |
