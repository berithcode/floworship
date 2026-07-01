# B8 — Repertório Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/floworship-v8/b8-repertorio/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase sampling (no existing tests found — strong defaults applied). Confirm before Execute.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Entity/Schema (Prisma) | none | — (build gate only) | `prisma/schema.prisma` | build gate only |
| Service (Repertoire) | unit | All branches: create, reorder, permission checks, status filter, tag filter | `src/services/**/*.test.ts` | `vitest run` |
| Service (Permission) | unit | All role × scope combinations: admin, leader, warship_leader, musician; substitution migration | `src/services/**/*.test.ts` | `vitest run` |
| API Route (repertoire) | integration | CRUD endpoints: create, list (filtered), reorder, publish; 403 for unauthorized roles | `src/api/**/*.test.ts` | `vitest run --project integration` |
| API Route (song status) | integration | Status update endpoint; status filter in list query | `src/api/**/*.test.ts` | `vitest run --project integration` |
| Component (Repertoire UI) | unit | Song list renders with status badges, tag filters render, drag-and-drop reorder updates order | `src/components/**/*.test.tsx` | `vitest run` |
| Component (Permission Gate) | unit | Renders children for authorized roles, hides for unauthorized | `src/components/**/*.test.tsx` | `vitest run` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --------- | -------------- | --------------- | -------- |
| unit (Service) | Yes | Each test uses in-memory mock; no shared DB | Standard vitest mocking pattern |
| unit (Component) | Yes | Each test mounts component in isolation | Standard React Testing Library pattern |
| integration (API) | Yes | Each test spins up isolated Fastify instance with test DB | No shared state across test files |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `vitest run` |
| Full | After tasks with integration tests | `vitest run --project integration` |
| Build | After phase completion or config/entity-only tasks | `prisma generate && tsc --noEmit && vitest run` |

---

## Execution Plan

### Phase 1: Catalog Extensions (Sequential)

Song status field, tags, and filtering.

```
T1 → T2 → T3
```

### Phase 2: Repertoire Entity & API (Sequential)

New entity, CRUD API, and drag-and-drop reorder.

```
T3 → T4 → T5 → T6
```

### Phase 3: Permissions (Sequential)

Scoped permission checks and migration on substitution.

```
T6 → T7 → T8
```

### Phase 4: WhatsApp Integration (Sequential)

Publish triggers WhatsApp template.

```
T8 → T9
```

---

## Task Breakdown

### T1: Add Song Status Field to Prisma Schema

**What**: Add the `status` field (`rascunho | pronta | arquivada`) to the `song` model in Prisma schema and generate migration.
**Where**: `prisma/schema.prisma`
**Depends on**: None
**Reuses**: Existing `song` model
**Requirement**: REQ-REP-01

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `status` field added to `song` model with default `"rascunho"`
- [ ] Enum `SongStatus` defined with values: `rascunho`, `pronta`, `arquivada`
- [ ] Migration file generated and applyable
- [ ] `prisma generate` succeeds without errors
- [ ] Gate check passes: `prisma generate && tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T2: Add Song Tags Field to Prisma Schema

**What**: Add the `tags` field (`string[]`) to the `song` model in Prisma schema and generate migration.
**Where**: `prisma/schema.prisma`
**Depends on**: None
**Reuses**: Existing `song` model
**Requirement**: REQ-REP-02

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `tags` field added to `song` model as `String[]` with default `[]`
- [ ] Migration file generated and applyable
- [ ] `prisma generate` succeeds without errors
- [ ] Gate check passes: `prisma generate && tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T3: Implement Song Status Filtering in Song Service

**What**: Add status-based filtering logic to the song service so `rascunho` songs are excluded from repertoire selection and `arquivada` songs are excluded from daily search.
**Where**: `src/services/songService.ts`
**Depends on**: T1
**Reuses**: Existing song service patterns
**Requirement**: REQ-REP-01, REQ-REP-05

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `getSongsForRepertoire()` filters only `status = "pronta"`
- [ ] `searchSongs()` excludes `status = "arquivada"` by default
- [ ] `getAllSongs()` (admin) returns all statuses
- [ ] Status filter parameter accepted in list queries
- [ ] Unit tests cover all 3 filter paths + edge cases (empty status, invalid status)
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T4: Create service_repertoire_item Entity

**What**: Create the `service_repertoire_item` Prisma model linked to `service_schedule` and `song`, with fields for order, key_override, and notes.
**Where**: `prisma/schema.prisma`
**Depends on**: T1, T2
**Reuses**: Existing `service_schedule` and `song` models
**Requirement**: REQ-REP-03

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `service_repertoire_item` model created with fields: `id`, `service_schedule_id`, `song_id`, `order` (Int), `key_override` (String?), `notes` (String?)
- [ ] Foreign keys to `service_schedule` and `song` defined
- [ ] Unique constraint on `(service_schedule_id, order)` to prevent duplicate positions
- [ ] Migration generated and applyable
- [ ] `prisma generate` succeeds
- [ ] Gate check passes: `prisma generate && tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T5: Implement Repertoire CRUD API

**What**: Create API endpoints for repertoire management: list items by schedule, add song to repertoire, remove song, update order, update key_override/notes.
**Where**: `src/api/routes/repertoire.ts`
**Depends on**: T4
**Reuses**: T3 song filtering logic
**Requirement**: REQ-REP-03, REQ-REP-04

**Tools**:

- MCP: `filesystem`
- Skill: `api-patterns`

**Done when**:

- [ ] `GET /schedules/:id/repertoire` returns items ordered by `order` with song details
- [ ] `POST /schedules/:id/repertoire` adds a song (validates `status = "pronta"`)
- [ ] `DELETE /schedules/:id/repertoire/:itemId` removes an item
- [ ] `PATCH /schedules/:id/repertoire/reorder` accepts array of `{ itemId, order }` for bulk reorder
- [ ] `PATCH /schedules/:id/repertoire/:itemId` updates key_override or notes
- [ ] All endpoints check that schedule status is `aprovada` or `publicada` before allowing edits
- [ ] 403 returned for unauthorized roles (tested)
- [ ] Integration tests cover happy path + error paths
- [ ] Gate check passes: `vitest run --project integration`

**Tests**: integration
**Gate**: full

---

### T6: Implement Drag-and-Drop Reorder UI

**What**: Create the repertoire reorder UI component using drag-and-drop to reorder songs within a Sunday's repertoire.
**Where**: `src/components/repertoire/RepertoireList.tsx`
**Depends on**: T5
**Reuses**: B0 Card component, `@dnd-kit/core` (or similar) for drag-and-drop
**Requirement**: REQ-REP-08

**Tools**:

- MCP: `filesystem`, `context7`
- Skill: NONE

**Done when**:

- [ ] Renders list of songs in repertoire with order number, title, key, BPM
- [ ] Drag handle on each item enables reordering
- [ ] Drop updates `order` field via PATCH /reorder endpoint
- [ ] Optimistic UI update (instant reorder, rollback on error)
- [ ] Empty state message when no songs in repertoire
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T7: Implement Scoped Permission Checks

**What**: Implement repertoire editing permission logic: admin/leader can edit any Sunday; warship_leader can edit only their assigned Sunday; operator/musician are read-only.
**Where**: `src/services/permissionService.ts`
**Depends on**: T5
**Reuses**: B1 RBAC model (`ministry_member.role`)
**Requirement**: REQ-REP-06

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `canEditRepertoire(user, serviceSchedule)` returns boolean
- [ ] Admin/leader role → always true
- [ ] Warship_leader role → true only if assigned to that `service_schedule` as `ministro_de_louvor`
- [ ] Operator/musician role → always false
- [ ] Unit tests cover all role × assignment combinations (8+ cases)
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T8: Implement Permission Migration on Substitution

**What**: When a warship_leader is substituted (via B9 substitution flow), automatically migrate repertoire editing permission to the substitute.
**Where**: `src/services/repertoireService.ts` (modify)
**Depends on**: T7
**Reuses**: T7 `canEditRepertoire` logic, B9 `service_assignment.substitution_of` field
**Requirement**: REQ-REP-07

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] When `service_assignment` for `ministro_de_louvor` is updated with `substitution_of`, the new musician inherits edit permission for that Sunday's repertoire
- [ ] Original warship_leader loses edit permission for that Sunday
- [ ] Unit tests verify permission migration: original loses, substitute gains
- [ ] Unit tests verify non-warship_leader substitutions don't affect repertoire permissions
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T9: Implement Repertoire Publish with WhatsApp Template Trigger

**What**: When repertoire is published (finalized), trigger the `repertorio_definido` WhatsApp template to all musicians assigned to that Sunday.
**Where**: `src/services/repertoireService.ts` (modify), `src/services/whatsappService.ts` (new — stub for B10)
**Depends on**: T5, T6
**Reuses**: T5 repertoire API, B10 WhatsApp service interface
**Requirement**: REQ-REP-09

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `publishRepertoire(scheduleId)` endpoint/mutation defined
- [ ] On publish, queries all `service_assignment` records for that schedule
- [ ] Calls WhatsApp service to send `repertorio_definido` template to each assigned musician
- [ ] Template variables include: date, song list, study mode link
- [ ] WhatsApp service call is stubbed/mocked (actual B10 integration is separate)
- [ ] Unit tests verify correct musicians are notified and template variables are correct
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
  T3 ──→ T4 ──→ T5 ──→ T6

Phase 3 (Sequential):
  T6 ──→ T7 ──→ T8

Phase 4 (Sequential):
  T8 ──→ T9
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
| T1: Add Song Status Field | 1 schema change | ✅ Granular |
| T2: Add Song Tags Field | 1 schema change | ✅ Granular |
| T3: Implement Status Filtering | 1 service method set | ✅ Granular |
| T4: Create Repertoire Entity | 1 schema change | ✅ Granular |
| T5: Implement Repertoire API | 1 route file | ✅ Granular |
| T6: Implement Reorder UI | 1 component | ✅ Granular |
| T7: Implement Permission Checks | 1 service method | ✅ Granular |
| T8: Implement Permission Migration | 1 service modification | ✅ Granular |
| T9: Implement Publish + WhatsApp | 1 service method | ✅ Granular |

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
| T2 | None | T1 → T2 (sequential in Phase 1) | ✅ Match |
| T3 | T1 | T2 → T3 | ✅ Match |
| T4 | T1, T2 | T3 → T4 | ✅ Match (T1,T2 complete by T3) |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T5 | T6 → T7 | ✅ Match (T5 complete by T6) |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T5, T6 | T8 → T9 | ✅ Match (T5,T6 complete by T8) |

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
| T1: Add Song Status Field | Entity/Schema (Prisma) | none | none | ✅ OK |
| T2: Add Song Tags Field | Entity/Schema (Prisma) | none | none | ✅ OK |
| T3: Implement Status Filtering | Service (Repertoire) | unit | unit | ✅ OK |
| T4: Create Repertoire Entity | Entity/Schema (Prisma) | none | none | ✅ OK |
| T5: Implement Repertoire API | API Route (repertoire) | integration | integration | ✅ OK |
| T6: Implement Reorder UI | Component (Repertoire UI) | unit | unit | ✅ OK |
| T7: Implement Permission Checks | Service (Permission) | unit | unit | ✅ OK |
| T8: Implement Permission Migration | Service (Permission) | unit | unit | ✅ OK |
| T9: Implement Publish + WhatsApp | Service (Repertoire) | unit | unit | ✅ OK |

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
