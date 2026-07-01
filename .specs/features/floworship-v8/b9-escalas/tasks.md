# B9 — Escalas Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/floworship-v8/b9-escalas/design.md`
**Status**: Draft

**BLOCKER**: REQ-SCHED-08 (tiebreaker rule for identical fairness scores) is NOT yet defined. This requirement MUST be registered in `.specs/STATE.md` with an explicit rule before B9 can PASS validation. All other tasks can proceed; T12 is explicitly blocked.

---

## Test Coverage Matrix

> Generated from codebase sampling (no existing tests found — strong defaults applied). Confirm before Execute.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Entity/Schema (Prisma) | none | — (build gate only) | `prisma/schema.prisma` | build gate only |
| Service (Scheduler Engine) | unit | All branches: greedy assignment, fairness scoring, chronological processing, vago handling, candidate filtering | `src/services/**/*.test.ts` | `vitest run` |
| Service (Availability) | unit | Availability collection, deadline handling, reminder scheduling | `src/services/**/*.test.ts` | `vitest run` |
| Service (Substitution) | unit | Sequential invite, timeout cascade, optimistic locking, vago fallback | `src/services/**/*.test.ts` | `vitest run` |
| Service (Config Rules) | unit | Per-ministry rule loading, default values, override behavior | `src/services/**/*.test.ts` | `vitest run` |
| API Route (cycle management) | integration | Cycle CRUD, status transitions, approve/publish endpoints | `src/api/**/*.test.ts` | `vitest run --project integration` |
| API Route (manual swap) | integration | Swap endpoint, fairness validation, 403 for unauthorized | `src/api/**/*.test.ts` | `vitest run --project integration` |
| Component (Admin Dashboard) | unit | Cycle status display, Sunday card expansion, vago highlight, swap trigger | `src/components/**/*.test.tsx` | `vitest run` |
| Job Runner (Async) | unit | Cron trigger, event-driven trigger, retry logic | `src/jobs/**/*.test.ts` | `vitest run` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --------- | -------------- | --------------- | -------- |
| unit (Service) | Yes | Each test uses in-memory mock; no shared DB | Standard vitest mocking pattern |
| unit (Component) | Yes | Each test mounts component in isolation | Standard React Testing Library pattern |
| integration (API) | Yes | Each test spins up isolated Fastify instance with test DB | No shared state across test files |
| unit (Job Runner) | Yes | Each test uses mocked timers and in-memory state | Standard vitest fake timers |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `vitest run` |
| Full | After tasks with integration tests | `vitest run --project integration` |
| Build | After phase completion or config/entity-only tasks | `prisma generate && tsc --noEmit && vitest run` |

---

## Execution Plan

### Phase 1: Schema & Roles (Sequential)

Worship role extensible tag model and core entities.

```
T1 → T2 → T3
```

### Phase 2: Scheduler Engine (Sequential)

Greedy algorithm with fairness, chronological processing, vago handling.

```
T3 → T4 → T5
```

### Phase 3: Admin Panel (Sequential)

Dashboard, cycle management, manual swap, approve/publish.

```
T5 → T6 → T7 → T8
```

### Phase 4: Substitution Flow (Sequential)

Post-publication substitution, sequential invite, timeout.

```
T8 → T9 → T10
```

### Phase 5: Config & Infrastructure (Sequential)

Configurable rules, async job execution.

```
T10 → T11 → T12 (T12 BLOCKED)
```

---

## Task Breakdown

### T1: Add Worship Role Tag Model to Musician

**What**: Add `worship_roles: String[]` field to the `musician` model and create the `worship_role` reference table for validation.
**Where**: `prisma/schema.prisma`
**Depends on**: None
**Reuses**: Existing `musician` model
**Requirement**: REQ-SCHED-01

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `worship_roles` field added to `musician` model as `String[]`
- [ ] `worship_role` reference table created with `id`, `name`, `ministry_id` (extensible per ministry)
- [ ] Migration generated and applyable
- [ ] `prisma generate` succeeds
- [ ] Gate check passes: `prisma generate && tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T2: Create Scheduler Data Models

**What**: Create Prisma models for `monthly_schedule_cycle`, `availability_response`, `service_schedule`, and `service_assignment` with all fields from the spec.
**Where**: `prisma/schema.prisma`
**Depends on**: T1
**Reuses**: Existing `ministry` model for `ministry_id` foreign key
**Requirement**: REQ-SCHED-02, REQ-SCHED-04

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `monthly_schedule_cycle` model: `id`, `ministry_id`, `month`, `year`, `status` (enum: coletando_disponibilidade, gerando, aguardando_aprovacao, publicada), `availability_deadline`
- [ ] `availability_response` model: `cycle_id`, `musician_id`, `sunday_date`, `available` (Boolean), `responded_at`
- [ ] `service_schedule` model: `id`, `cycle_id`, `service_date`, `status` (enum: rascunho, aprovada, publicada, com_pendencia)
- [ ] `service_assignment` model: `id`, `service_schedule_id`, `role`, `musician_id` (optional), `status` (enum: confirmado, convidado, recusado, vago), `substitution_of` (optional)
- [ ] All foreign keys and indexes defined
- [ ] Migration generated and applyable
- [ ] Gate check passes: `prisma generate && tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T3: Implement Fairness Score Calculation

**What**: Implement the fairness score function that ranks candidates by `times_served_this_month` (ascending) and breaks ties by `last_served_at[role]` (oldest first).
**Where**: `src/services/scheduler/fairness.ts`
**Depends on**: T1
**Reuses**: None (pure function)
**Requirement**: REQ-SCHED-02

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `calculateFairnessScore(musicians, role)` returns sorted array (lowest score first)
- [ ] Primary sort: `times_served_this_month` ascending
- [ ] Secondary sort: `last_served_at[role]` oldest first
- [ ] Handles empty musician list gracefully
- [ ] Handles musicians with no `last_served_at` for the role (treated as oldest)
- [ ] Unit tests cover: normal sort, tie-breaking, empty list, missing role data
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T4: Implement Greedy Assignment Algorithm

**What**: Implement the core greedy scheduling algorithm that processes Sundays chronologically and assigns musicians to roles based on availability and fairness.
**Where**: `src/services/scheduler/engine.ts`
**Depends on**: T3
**Reuses**: T3 `calculateFairnessScore`, T2 schema models
**Requirement**: REQ-SCHED-02, REQ-SCHED-03

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `generateSchedule(cycleId, sundays, roles, availabilities)` returns `service_assignment[]`
- [ ] Processes Sundays in strict chronological order (not parallel)
- [ ] For each Sunday × role: filters candidates with matching `worship_role`, available on that date, not already assigned to another role on same Sunday
- [ ] Sorts candidates by fairness score (via T3 function)
- [ ] Assigns first candidate; if no candidate → `status = "vago"`
- [ ] Updates in-memory counters during generation (fairness reflects earlier assignments in same cycle)
- [ ] Unit tests cover: happy path (all filled), partial availability (some vago), no candidates (all vago), single musician multiple roles
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T5: Implement Cycle Lifecycle Service

**What**: Implement the service for managing the schedule cycle lifecycle: create cycle, collect availability, trigger generation, approve, publish.
**Where**: `src/services/scheduler/cycleService.ts`
**Depends on**: T4
**Reuses**: T4 engine, T2 schema models
**Requirement**: REQ-SCHED-04

**Tools**:

- MCP: `filesystem`
- Skill: `api-patterns`

**Done when**:

- [ ] `createCycle(ministryId, month, year)` creates cycle in `coletando_disponibilidade` status
- [ ] `closeAvailability(cycleId)` transitions to `gerando` and triggers T4 engine
- [ ] `approveCycle(cycleId)` transitions to `aguardando_aprovacao`
- [ ] `publishCycle(cycleId)` transitions to `publicada` and triggers WhatsApp notifications
- [ ] Status transitions are validated (can't go backwards)
- [ ] Unit tests cover all valid transitions + invalid transition attempts
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T6: Implement Admin Dashboard API Endpoints

**What**: Create API endpoints for the admin "Escalas do Mês" dashboard: get cycle status, list Sundays with assignments, manual swap, approve/publish.
**Where**: `src/api/routes/schedules.ts`
**Depends on**: T5
**Reuses**: T5 cycle service
**Requirement**: REQ-SCHED-04

**Tools**:

- MCP: `filesystem`
- Skill: `api-patterns`

**Done when**:

- [ ] `GET /schedules/cycles/:cycleId` returns cycle status + progress
- [ ] `GET /schedules/cycles/:cycleId/sundays` returns Sundays with assignments (expandable)
- [ ] `POST /schedules/swap` accepts `{ assignmentId, newMusicianId }` and performs manual swap
- [ ] `POST /schedules/cycles/:cycleId/approve` transitions to approval state
- [ ] `POST /schedules/cycles/:cycleId/publica` transitions to published
- [ ] All endpoints check admin/leader permission (403 for others)
- [ ] Swap validates new musician is available and not assigned elsewhere on same Sunday
- [ ] Integration tests cover all endpoints + error paths
- [ ] Gate check passes: `vitest run --project integration`

**Tests**: integration
**Gate**: full

---

### T7: Implement Admin Dashboard UI Component

**What**: Create the "Escalas do Mês" dashboard UI with cycle status indicator, expandable Sunday cards, vago highlighting, and manual swap trigger.
**Where**: `src/pages/admin/ScheduleDashboard.tsx`, `src/components/schedule/SundayCard.tsx`
**Depends on**: T6
**Reuses**: B0 Card component, `danger` token for vago highlight
**Requirement**: REQ-SCHED-04

**Tools**:

- MCP: `filesystem`
- Skill: `frontend-design`

**Done when**:

- [ ] Dashboard renders cycle status at top (Coletando → Gerando → Aguardando aprovação → Publicada)
- [ ] List of Sundays rendered as expandable cards
- [ ] Each card shows: date, assigned musicians per role, vago slots highlighted in `danger`
- [ ] Expanding card shows full assignment details + swap button per slot
- [ ] "Aprovar e Publicar" button enabled only when all slots filled or explicit confirmation for open slots
- [ ] Substitution history displayed per Sunday
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T8: Implement Manual Swap UI Interaction

**What**: Add the manual swap interaction to the Sunday card: clicking a slot opens a musician selector ordered by fairness score.
**Where**: `src/components/schedule/SwapDialog.tsx`
**Depends on**: T7
**Reuses**: T3 fairness score sorting, T7 SundayCard
**Requirement**: REQ-SCHED-04

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Clicking a filled slot opens swap dialog with current musician info
- [ ] Selector lists available musicians for that role, sorted by fairness score
- [ ] Selecting a musician and confirming calls POST /schedules/swap
- [ ] Optimistic UI update on successful swap
- [ ] Cancel button closes dialog without changes
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T9: Implement Substitution Flow Service

**What**: Implement the post-publication substitution flow: musician reports unavailability, system finds substitute via sequential invite with timeout cascade.
**Where**: `src/services/scheduler/substitutionService.ts`
**Depends on**: T5
**Reuses**: T3 fairness score, T4 candidate filtering logic
**Requirement**: REQ-SCHED-05

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `reportUnavailability(assignmentId)` marks assignment as `recusado`
- [ ] `findSubstitute(assignmentId)` queries available musicians (same role, not assigned elsewhere on Sunday, excluding already assigned)
- [ ] Candidates sorted by fairness score
- [ ] Sequential invite: notifies first candidate, waits for response window (configurable, default 4h)
- [ ] On accept: updates `musician_id`, `status = "confirmado"`, `substitution_of = original`
- [ ] On decline/timeout: advances to next candidate
- [ ] On empty list: `status = "vago"`, sends urgency notification to leader
- [ ] Optimistic locking on `service_assignment` prevents double-acceptance
- [ ] Unit tests cover: accept on first try, decline cascade, timeout cascade, all candidates exhausted, concurrent acceptance attempt (lock conflict)
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T10: Implement Sequential Invite with WhatsApp Integration

**What**: Wire the substitution flow to send WhatsApp template messages (`substituicao_urgente`) for sequential invites and handle `button_reply.id` responses.
**Where**: `src/services/scheduler/substitutionService.ts` (modify), `src/services/whatsappService.ts` (interface)
**Depends on**: T9
**Reuses**: T9 substitution logic, B10 WhatsApp service interface
**Requirement**: REQ-SCHED-05, REQ-WA-03

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] On sequential invite, sends `substituicao_urgente` template via WhatsApp service
- [ ] Template includes: Sunday date, role, response deadline
- [ ] Reply buttons: "Aceito" / "Não posso"
- [ ] Webhook response processing updates assignment status
- [ ] Timeout (no response within window) triggers next candidate
- [ ] WhatsApp service calls are stubbed/mocked (actual B10 integration is separate)
- [ ] Unit tests verify: correct template sent, response handling, timeout behavior
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T11: Implement Configurable Rules Per Ministry

**What**: Implement a config service that loads per-ministry scheduling rules: default formation, availability deadline, substitution window, cycle trigger day.
**Where**: `src/services/scheduler/configService.ts`, `prisma/schema.prisma` (add `ministry_config` model)
**Depends on**: T5
**Reuses**: T5 cycle service for rule consumption
**Requirement**: REQ-SCHED-06

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `ministry_config` model: `ministry_id` (unique), `default_formation` (JSON), `availability_deadline_days` (Int, default 5), `substitution_window_hours` (Int, default 4), `cycle_trigger_day` (Int, default 20)
- [ ] `getConfig(ministryId)` returns config with defaults when not set
- [ ] `updateConfig(ministryId, partial)` upserts config
- [ ] Cycle creation uses `cycle_trigger_day` to determine when to auto-trigger
- [ ] Substitution uses `substitution_window_hours` for invite timeout
- [ ] Unit tests cover: default loading, override, partial update
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T12: Implement Async Job Execution (BLOCKED)

**What**: Implement the async job runner for the monthly scheduling cycle (cron trigger) and event-driven substitution triggers.
**Where**: `src/jobs/schedulerJob.ts`, `src/jobs/substitutionJob.ts`
**Depends on**: T5, T9, T11
**Reuses**: T5 cycle service, T9 substitution service, T11 config service
**Requirement**: REQ-SCHED-07

**BLOCKED**: This task requires REQ-SCHED-08 (tiebreaker rule) to be defined and registered in `.specs/STATE.md` before it can PASS validation. The tiebreaker rule affects how the engine resolves identical fairness scores, which must be deterministic and documented.

**Tools**:

- MCP: `filesystem`
- Skill: `server-management`

**Done when**:

- [ ] Cron job triggers `createCycle` on configured `cycle_trigger_day` at midnight
- [ ] Event listener triggers `findSubstitute` on `availability_response` decline/timeout
- [ ] Jobs run asynchronously (not in API request context)
- [ ] Retry logic with exponential backoff for failed job executions
- [ ] Job status logged for observability
- [ ] Unit tests cover: cron trigger, event trigger, retry behavior
- [ ] REQ-SCHED-08 tiebreaker rule registered in STATE.md
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

## Parallel Execution Map

Visual representation of task ordering within phases (`[P]` = order-free, no inter-task dependency):

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3

Phase 2 (Sequential):
  T3 ──→ T4 ──→ T5

Phase 3 (Sequential):
  T5 ──→ T6 ──→ T7 ──→ T8

Phase 4 (Sequential):
  T8 ──→ T9 ──→ T10

Phase 5 (Sequential):
  T10 ──→ T11 ──→ T12 [BLOCKED]
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
| T1: Add Worship Role Tag Model | 1 schema change | ✅ Granular |
| T2: Create Scheduler Data Models | 1 schema change (multiple models, cohesive) | ⚠️ OK — same migration |
| T3: Implement Fairness Score | 1 pure function | ✅ Granular |
| T4: Implement Greedy Algorithm | 1 service function | ✅ Granular |
| T5: Implement Cycle Lifecycle | 1 service | ✅ Granular |
| T6: Implement Admin API | 1 route file | ✅ Granular |
| T7: Implement Admin Dashboard UI | 2 components (cohesive) | ⚠️ OK — same page |
| T8: Implement Manual Swap UI | 1 dialog component | ✅ Granular |
| T9: Implement Substitution Flow | 1 service | ✅ Granular |
| T10: Implement WhatsApp Integration | 1 service modification | ✅ Granular |
| T11: Implement Config Rules | 1 service + 1 schema | ⚠️ OK — same feature |
| T12: Implement Async Jobs | 2 job files (cohesive) | ⚠️ OK — same pattern |

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
| T3 | T1 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 (Phase 2) | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 (Phase 3) | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T5 | T8 → T9 (Phase 4) | ✅ Match (T5 complete by T8) |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T5 | T10 → T11 (Phase 5) | ✅ Match (T5 complete by T10) |
| T12 | T5, T9, T11 | T11 → T12 [BLOCKED] | ✅ Match |

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
| T1: Add Worship Role Tag Model | Entity/Schema (Prisma) | none | none | ✅ OK |
| T2: Create Scheduler Data Models | Entity/Schema (Prisma) | none | none | ✅ OK |
| T3: Implement Fairness Score | Service (Scheduler Engine) | unit | unit | ✅ OK |
| T4: Implement Greedy Algorithm | Service (Scheduler Engine) | unit | unit | ✅ OK |
| T5: Implement Cycle Lifecycle | Service (Scheduler Engine) | unit | unit | ✅ OK |
| T6: Implement Admin API | API Route (cycle management) | integration | integration | ✅ OK |
| T7: Implement Admin Dashboard UI | Component (Admin Dashboard) | unit | unit | ✅ OK |
| T8: Implement Manual Swap UI | Component (Admin Dashboard) | unit | unit | ✅ OK |
| T9: Implement Substitution Flow | Service (Substitution) | unit | unit | ✅ OK |
| T10: Implement WhatsApp Integration | Service (Substitution) | unit | unit | ✅ OK |
| T11: Implement Config Rules | Service (Config Rules) | unit | unit | ✅ OK |
| T12: Implement Async Jobs | Job Runner (Async) | unit | unit | ✅ OK |

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
