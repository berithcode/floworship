# B7 — Navegação Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/floworship-v8/b7-navegacao/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase sampling (no existing tests found — strong defaults applied). Confirm before Execute.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Component (Shell/Web) | unit | All nav states: active highlight, collapse/expand, tooltip visibility, grouped items render | `src/components/**/*.test.tsx` | `vitest run` |
| Component (Mobile Nav) | unit | Bottom nav renders 4 items, active icon accent, pill position | `src/components/**/*.test.tsx` | `vitest run` |
| Component (Page Pattern) | unit | Header renders title + description + action; detail page renders tabs | `src/components/**/*.test.tsx` | `vitest run` |
| Hook (useNavigation) | unit | Route matching, active state derivation, collapse toggle | `src/hooks/**/*.test.ts` | `vitest run` |
| Route definitions | none | — (build gate only) | — | build gate only |
| Integration (Shell + Router) | integration | Navigation click updates URL, active state reflects route, sidebar collapse persists | `src/**/*.integration.test.tsx` | `vitest run --project integration` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --------- | -------------- | --------------- | -------- |
| unit (Component) | Yes | Each test mounts component in isolation; no shared state | Standard React Testing Library pattern — each test creates its own container |
| unit (Hook) | Yes | renderHook with mocked router context per test | Standard vitest pattern |
| integration | Yes | Each test creates fresh MemoryRouter + render tree | No shared backing store; fully mocked |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `vitest run` |
| Full | After tasks with integration tests | `vitest run --project integration` |
| Build | After phase completion or config/entity-only tasks | `tsc --noEmit && vitest run` |

---

## Execution Plan

### Phase 1: Web Shell Foundation (Sequential)

Tasks that must be done first — layout primitives and routing.

```
T1 → T2 → T3
```

### Phase 2: Web Shell Features (Parallel OK)

After foundation, sidebar collapse, topbar, and page pattern can run in parallel.

```
     ┌→ T4 ─┐
T3 ──┼→ T5 ─┼──→ T7
     └→ T6 ─┘
```

### Phase 3: Mobile Shell (Sequential)

Bottom nav, session card, and detail page pattern.

```
T7 → T8 → T9
```

### Phase 4: Takeover & Study Access (Sequential)

Full-screen takeover mode and study route integration.

```
T9 → T10 → T11
```

---

## Task Breakdown

### T1: Create Web Layout Shell Component

**What**: Create the root `WebLayout` component that renders Sidebar + Topbar + content area in the standard dashboard layout pattern.
**Where**: `src/components/layout/WebLayout.tsx`
**Depends on**: None
**Reuses**: B0 shared design tokens, `bg-primary` background
**Requirement**: REQ-NAV-01

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `WebLayout` renders sidebar (240px fixed) + topbar + content slot
- [ ] Layout matches the spec layout diagram (sidebar left, topbar top, content right)
- [ ] Sidebar groups are defined: Visão Geral, Repertório, Escalas, Ao Vivo, Comunicação, Configurações
- [ ] Footer area in sidebar renders avatar + user name placeholder
- [ ] No TypeScript errors
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T2: Create Sidebar Component with Grouped Navigation

**What**: Create the `Sidebar` component with grouped nav items, active highlight, and collapse behavior.
**Where**: `src/components/layout/Sidebar.tsx`
**Depends on**: T1
**Reuses**: B0 Pill toggle pattern, `bg-card-elevated` for active state, `accent-primary` for 3px bar
**Requirement**: REQ-NAV-01, REQ-NAV-02

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Sidebar renders all nav groups: Visão Geral, Repertório, Escalas, Ao Vivo, Comunicação, Configurações
- [ ] Active item has `bg-card-elevated` background + 3px vertical bar in `accent-primary`
- [ ] Sidebar is collapsible to 64px (icon-only) with tooltip on hover
- [ ] Collapse state persists in localStorage
- [ ] Ministry logo/name renders at top (clickable placeholder)
- [ ] Footer renders avatar + user name + dropdown menu (Perfil, Trocar Ministério, Sair)
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T3: Create Topbar Component with Search Trigger

**What**: Create the `Topbar` component with route-aware title, Cmd+K search trigger, notifications, and avatar.
**Where**: `src/components/layout/Topbar.tsx`
**Depends on**: T1
**Reuses**: B0 Avatar circular with notification badge
**Requirement**: REQ-NAV-03

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Topbar displays current route title (reactive to router state)
- [ ] Cmd/Ctrl+K keyboard shortcut triggers search modal placeholder
- [ ] Notifications icon renders with badge (placeholder)
- [ ] Avatar renders with dropdown trigger
- [ ] Topbar is responsive (title truncates on small widths)
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T4: Implement Sidebar Collapse/Expand Interaction [P]

**What**: Add collapse/expand toggle button and smooth transition animation to the Sidebar.
**Where**: `src/components/layout/Sidebar.tsx` (modify)
**Depends on**: T2
**Reuses**: T2 existing Sidebar structure
**Requirement**: REQ-NAV-02

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Toggle button at bottom of sidebar triggers collapse/expand
- [ ] Collapsed state shows 64px width with icon-only items
- [ ] Tooltip appears on hover over collapsed icons showing full label
- [ ] Smooth CSS transition on width change (no layout jump)
- [ ] State persisted in localStorage, restored on mount
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T5: Implement Global Search Modal (Cmd+K) [P]

**What**: Create the `SearchModal` component triggered by Cmd+K that searches songs, members, and schedules with grouped results.
**Where**: `src/components/layout/SearchModal.tsx`
**Depends on**: T3
**Reuses**: B0 Card component for result items
**Requirement**: REQ-NAV-03

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Modal opens on Cmd/Ctrl+K and Escape closes it
- [ ] Search input auto-focuses on open
- [ ] Results are grouped by type (Músicas, Membros, Escalas)
- [ ] Keyboard navigation (arrow keys + Enter) works
- [ ] Click on result navigates to detail page
- [ ] Modal has backdrop blur overlay
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T6: Create Page Pattern Component [P]

**What**: Create the `PageHeader` component (title + description + primary action) and the `DetailPage` component (header + tabs) as reusable page patterns.
**Where**: `src/components/layout/PageHeader.tsx`, `src/components/layout/DetailPage.tsx`
**Depends on**: T1
**Reuses**: B0 Button component for primary action
**Requirement**: REQ-NAV-04

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `PageHeader` renders title (large), description (secondary text), and action button (accent-primary)
- [ ] `DetailPage` renders header section + tab navigation + tab content area
- [ ] Tab switching updates URL (not modal)
- [ ] Both components are composable and accept children
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T7: Create Navigation Hook and Route Definitions [P]

**What**: Create the `useNavigation` hook for active route state and define all route paths as constants.
**Where**: `src/hooks/useNavigation.ts`, `src/config/routes.ts`
**Depends on**: T1
**Reuses**: None (new utilities)
**Requirement**: REQ-NAV-01, REQ-NAV-04

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `routes.ts` exports all route paths as typed constants
- [ ] `useNavigation` returns current active group, active item, and breadcrumb
- [ ] Hook works with React Router v6 `useLocation`
- [ ] All sidebar items map to route constants
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T8: Create Mobile Bottom Nav Pill Component

**What**: Create the `BottomNav` floating pill component with 4 items (Início, Repertório, Escala, Perfil) and active state.
**Where**: `src/components/mobile/BottomNav.tsx`
**Depends on**: T7
**Reuses**: B0 Pill toggle pattern, `accent-primary` for active icon
**Requirement**: REQ-NAV-05

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Renders 4 nav items: Início, Repertório, Escala, Perfil
- [ ] Floating pill design (rounded, elevated, centered at bottom)
- [ ] Active item icon rendered in `accent-primary`
- [ ] Inactive items in `text-secondary`
- [ ] Touch target minimum 44×44px per item
- [ ] Tapping item navigates to route
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T9: Create Mobile Session Takeover Card

**What**: Create the `SessionTakeoverCard` component that displays on Home when a live session is active, with "Entrar na sessão" action.
**Where**: `src/components/mobile/SessionTakeoverCard.tsx`
**Depends on**: T8
**Reuses**: B0 Card component, `accent-primary` styling
**Requirement**: REQ-NAV-06

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Card renders at top of Home screen when session is active
- [ ] Displays "Você está na escala de hoje · Entrar na sessão"
- [ ] Tapping card triggers full-screen takeover (bottom nav hides)
- [ ] Card does NOT render when no active session
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T10: Implement Full-Screen Takeover Mode

**What**: Implement the full-screen takeover mode where bottom nav disappears and user enters the session view, with "Sair da sessão" button and confirmation.
**Where**: `src/components/mobile/TakeoverLayout.tsx`, `src/hooks/useTakeover.ts`
**Depends on**: T9
**Reuses**: T9 SessionTakeoverCard trigger
**Requirement**: REQ-NAV-06, REQ-NAV-07

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Takeover mode hides bottom nav completely
- [ ] Full-screen container renders session content (Modo Operador/Letra/Cifra based on role)
- [ ] "Sair da sessão" button renders in top-right corner (discreet styling)
- [ ] Clicking "Sair da sessão" shows confirmation dialog ("Tem certeza que deseja sair?")
- [ ] Confirming exits takeover, restores bottom nav
- [ ] Canceling confirmation keeps takeover active
- [ ] No other navigation paths exist within takeover (no back button, no bottom nav)
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T11: Add Study Mode Route and Integration

**What**: Add the study mode route hierarchy (Repertório → Detalhe da Música → Estudar) and wire it to the mobile bottom nav.
**Where**: `src/config/routes.ts` (modify), `src/pages/mobile/StudyEntry.tsx`
**Depends on**: T7, T8
**Reuses**: T7 route constants, T6 DetailPage tab pattern
**Requirement**: REQ-NAV-08

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Route path `/repertorio/:songId/estudar` is defined
- [ ] Study entry page renders within the detail page tab pattern
- [ ] Mobile Repertório tab links to song list → song detail → study
- [ ] Study mode is accessed outside of live session (no state machine, no sync)
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

## Parallel Execution Map

Visual representation of task ordering within phases (`[P]` = order-free, no inter-task dependency):

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3

Phase 2 (Parallel):
  T3 complete, then:
    ├── T4 [P]
    ├── T5 [P]  } Can run simultaneously
    ├── T6 [P]
    └── T7 [P]

Phase 3 (Sequential):
  T7 complete, then:
    T8 ──→ T9

Phase 4 (Sequential):
  T9 complete, then:
    T10 ──→ T11
```

**Parallelism constraint:** A task marked `[P]` must have ALL of these:

- No unfinished dependencies
- Required test type is parallel-safe (per the **Parallelism Assessment** generated above)
- No shared mutable state with other `[P]` tasks in the same phase

If a task's tests are NOT parallel-safe, it MUST run sequentially even if its
implementation code has no dependencies. The test execution is the bottleneck.

`[P]` is ordering information — it tells the executing agent (or phase worker) that these
tasks have no inter-task dependency and can be done in any order within the phase. It is
NOT a directive to spawn a sub-agent per task.

**How phase-based execution works:**

When a feature has more than 3 phases, the agent offers to dispatch one sub-agent per phase
(sequential). Each phase worker executes ALL tasks in its assigned phase in order, then reports
a compact summary back to the orchestrator. See [sub-agents.md](sub-agents.md) for the
full model — trigger threshold, offer-then-confirm rule, worker payload, compact summary
contract, failure handling, and context sizing guidance.

For features with 3 or fewer phases, execution happens inline in the main window with no
sub-agents spawned.

`[P]` marks tasks that have no inter-task dependency within a phase (order-free). It is
informational — it tells the worker (or the main agent) those tasks can be done in any order.
It is NOT a directive to spawn a sub-agent per task.

**The orchestrating agent's role during Execute:**
1. Assess phase count — offer sub-agents if >3 phases and user accepts
2. Dispatch the next phase (to a worker, or execute inline)
3. Receive the compact phase summary
4. Update tasks.md with results
5. If the phase summary shows all tasks complete: proceed to the next phase
6. If a task failed: decide fix/escalate before dispatching the next phase

---

## Task Granularity Check

Before approving tasks, verify they are granular enough:

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Create Web Layout Shell | 1 component | ✅ Granular |
| T2: Create Sidebar Component | 1 component | ✅ Granular |
| T3: Create Topbar Component | 1 component | ✅ Granular |
| T4: Implement Sidebar Collapse | 1 interaction | ✅ Granular |
| T5: Implement Search Modal | 1 component | ✅ Granular |
| T6: Create Page Pattern | 2 components (cohesive) | ⚠️ OK — same pattern |
| T7: Create Nav Hook + Routes | 1 hook + 1 config | ⚠️ OK — tightly coupled |
| T8: Create Bottom Nav Pill | 1 component | ✅ Granular |
| T9: Create Session Takeover Card | 1 component | ✅ Granular |
| T10: Implement Takeover Mode | 1 layout + 1 hook | ⚠️ OK — same feature |
| T11: Add Study Route | 1 route + 1 page | ⚠️ OK — same feature |

**Granularity check**:

- ✅ 1 component / 1 function / 1 endpoint = Good
- ⚠️ 2-3 related things in same file = OK if cohesive
- ❌ Multiple components or files = MUST split

---

## Diagram-Definition Cross-Check

Before approving tasks, verify the execution diagram is consistent with the task definitions. These are independent artifacts that can drift — the diagram is drawn for visual clarity while task bodies are written for precision. Both must agree.

For each task, check:

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | T1 starts Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T1 → ... → T3 (sequential) | ✅ Match |
| T4 | T2 | T3 → T4 [P] | ✅ Match |
| T5 | T3 | T3 → T5 [P] | ✅ Match |
| T6 | T1 | T3 → T6 [P] (T6 depends only on T1, T3 is ancestor) | ✅ Match |
| T7 | T1 | T3 → T7 [P] (T7 depends only on T1, T3 is ancestor) | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T7, T8 | T10 → T11 (T11 depends on T7+T8, both complete before T10) | ✅ Match |

**Rules:**

- Every `Depends on` in a task body must have a corresponding arrow in the diagram.
- Every arrow in the diagram must correspond to a `Depends on` in the target task's body.
- Tasks shown as parallel (`[P]`) in the diagram must not depend on each other.
- If a task depends on another task in the same parallel phase, they are NOT parallel — fix the diagram or remove the `[P]` flag.

---

## Test Co-location Validation

Before approving tasks, verify EVERY task's `Tests` field is consistent with the **Test Coverage Matrix** generated above. This is a hard gate — tasks that fail this check MUST be fixed.

For each task, check: does the task create or modify a code layer that has a required test type in the coverage matrix? If yes, the task's `Tests` field MUST match.

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Create Web Layout Shell | Component (Shell/Web) | unit | unit | ✅ OK |
| T2: Create Sidebar Component | Component (Shell/Web) | unit | unit | ✅ OK |
| T3: Create Topbar Component | Component (Shell/Web) | unit | unit | ✅ OK |
| T4: Implement Sidebar Collapse | Component (Shell/Web) | unit | unit | ✅ OK |
| T5: Implement Search Modal | Component (Shell/Web) | unit | unit | ✅ OK |
| T6: Create Page Pattern | Component (Page Pattern) | unit | unit | ✅ OK |
| T7: Create Nav Hook + Routes | Hook (useNavigation) | unit | unit | ✅ OK |
| T8: Create Bottom Nav Pill | Component (Mobile Nav) | unit | unit | ✅ OK |
| T9: Create Session Takeover Card | Component (Mobile Nav) | unit | unit | ✅ OK |
| T10: Implement Takeover Mode | Component (Mobile Nav) + Hook | unit | unit | ✅ OK |
| T11: Add Study Route | Route definitions + Component | none + unit | unit | ✅ OK |

**Rules:**

- "Tested in another task" is NOT a valid justification for `Tests: none`. That is test deferral — the exact anti-pattern this validation prevents.
- `Tests: none` is only valid when the coverage matrix says "none" for that code layer.
- If a task creates MULTIPLE code layers (e.g., service + controller), use the HIGHEST test type required by any of them.
- Any ❌ VIOLATION → restructure the task to include its required tests before proceeding.

**Resolving compilation dependencies:**

When a task creates code that can't be tested until a later task completes (e.g., a controller that needs module wiring before its e2e tests can run), do NOT defer the tests to a separate task. Instead, restructure:

1. **Merge forward:** Move the untestable task's tests into the earliest task where they become runnable (e.g., the wiring task includes wiring + e2e tests for the controller it enables).
2. **Merge backward:** Absorb the blocking dependency into the current task so it becomes self-testable (e.g., controller task includes its own module registration).

Pick whichever option keeps tasks atomic and cohesive. The goal: no task produces unverified code. If code can't be tested in the task that creates it, the task boundaries are wrong.

---

## Tips

- **[P] = Order-free** — Mark tasks with no inter-task dependency (can run in any order within the phase)
- **Reuses = Token saver** — Always reference existing code
- **Tools per task** — MCPs and Skills prevent wrong approaches
- **Dependencies are gates** — Clear what blocks what
- **Done when = Testable** — If you can't verify it, rewrite it
- **Requirement ID = Traceable** — Every task traces back to a spec requirement
- **One commit per task** — Plan the commit message format in advance

---

## Task Verification Standards

Every task MUST follow the `Done when` + `Tests` + `Gate` fields defined in the **Task Breakdown** template above. Each `Done when` entry must be specific, testable (binary pass/fail), and reference the gate check command from the `Gate Check Commands` section. Include the expected test count to prevent silent deletions.
