# B10 — WhatsApp Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/floworship-v8/b10-whatsapp/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase sampling (no existing tests found — strong defaults applied). Confirm before Execute.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Entity/Schema (Prisma) | none | — (build gate only) | `prisma/schema.prisma` | build gate only |
| Service (WhatsApp Provider) | unit | All branches: send with retry, template rendering, error handling, rate limit | `src/services/**/*.test.ts` | `vitest run` |
| Service (Opt-in/Opt-out) | unit | Opt-in collection, opt-out filtering, phone validation (E.164) | `src/services/**/*.test.ts` | `vitest run` |
| API Route (Webhook) | integration | Signature validation, button_reply.id processing, duplicate message handling | `src/api/**/*.test.ts` | `vitest run --project integration` |
| Service (Message Log) | unit | Log creation, status update, delivery tracking | `src/services/**/*.test.ts` | `vitest run` |
| Component (Template Management) | unit | Template list renders, status badges, submission trigger | `src/components/**/*.test.tsx` | `vitest run` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --------- | -------------- | --------------- | -------- |
| unit (Service) | Yes | Each test uses mocked HTTP client; no shared state | Standard vitest mocking pattern |
| unit (Component) | Yes | Each test mounts component in isolation | Standard React Testing Library pattern |
| integration (API) | Yes | Each test spins up isolated Fastify instance with mocked Meta API | No shared state across test files |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `vitest run` |
| Full | After tasks with integration tests | `vitest run --project integration` |
| Build | After phase completion or config/entity-only tasks | `prisma generate && tsc --noEmit && vitest run` |

---

## Execution Plan

### Phase 1: Schema & Provider Foundation (Sequential)

WhatsApp phone, opt-in field, and Meta Cloud API service.

```
T1 → T2 → T3
```

### Phase 2: Webhook & Message Processing (Sequential)

Webhook endpoint, signature validation, button_reply processing.

```
T3 → T4 → T5
```

### Phase 3: Templates (Sequential)

All 5 required templates with Meta Business Manager submission.

```
T5 → T6 → T7
```

### Phase 4: Opt-in & Logging (Sequential)

Opt-in collection, opt-out filtering, message log persistence.

```
T7 → T8 → T9
```

---

## Task Breakdown

### T1: Add WhatsApp Fields to Musician Schema

**What**: Add `whatsapp_phone` (E.164) and `whatsapp_opt_in` (Boolean) fields to the `musician` model in Prisma schema.
**Where**: `prisma/schema.prisma`
**Depends on**: None
**Reuses**: Existing `musician` model
**Requirement**: REQ-WA-07, REQ-WA-08

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `whatsapp_phone` field added as `String?` (E.164 format validated at application layer)
- [ ] `whatsapp_opt_in` field added as `Boolean` with default `false`
- [ ] Migration generated and applyable
- [ ] `prisma generate` succeeds
- [ ] Gate check passes: `prisma generate && tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T2: Create WhatsApp Message Log Schema

**What**: Create the `whatsapp_message_log` Prisma model for tracking all sent messages and their delivery status.
**Where**: `prisma/schema.prisma`
**Depends on**: None
**Reuses**: Existing `musician` model for foreign key
**Requirement**: REQ-WA-07

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `whatsapp_message_log` model created with fields: `id`, `musician_id`, `template_name`, `context` (JSON), `sent_at` (DateTime), `status` (enum: enviado, entregue, lido, respondido, falhou), `response_payload` (JSON?)
- [ ] Foreign key to `musician` defined
- [ ] Index on `musician_id` and `sent_at` for query performance
- [ ] Migration generated and applyable
- [ ] Gate check passes: `prisma generate && tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T3: Implement Meta Cloud API Service

**What**: Create the WhatsApp service that sends template messages via Meta Cloud API with retry logic, rate limiting, and error handling.
**Where**: `src/services/whatsapp/metaCloudApi.ts`
**Depends on**: T1
**Reuses**: None (new external integration)
**Requirement**: REQ-WA-01, REQ-WA-02

**Tools**:

- MCP: `filesystem`, `context7`
- Skill: NONE

**Done when**:

- [ ] `sendTemplateMessage(phoneNumber, templateName, params)` sends POST to Meta Cloud API
- [ ] Authentication uses Bearer token from environment config
- [ ] Retry logic: exponential backoff (3 attempts: 1s, 2s, 4s) on 5xx errors
- [ ] Rate limit: max 80 messages/second (Meta limit) with queue
- [ ] 4xx errors (invalid phone, template not found) logged and not retried
- [ ] Returns `{ success, messageId, error? }` response
- [ ] Unit tests cover: successful send, retry on 5xx, no retry on 4xx, rate limit queue, invalid phone
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T4: Implement Webhook Endpoint with Signature Validation

**What**: Create the Fastify webhook endpoint that receives Meta's webhook verification challenge and processes incoming messages with signature validation.
**Where**: `src/api/routes/whatsappWebhook.ts`
**Depends on**: T3
**Reuses**: T3 Meta Cloud API service
**Requirement**: REQ-WA-06, REQ-WA-05

**Tools**:

- MCP: `filesystem`
- Skill: `api-patterns`

**Done when**:

- [ ] `GET /webhook` handles Meta's verification challenge (returns `hub.challenge` when `hub.verify_token` matches)
- [ ] `POST /webhook` processes incoming messages
- [ ] Signature validation: `X-Hub-Signature-256` HMAC-SHA256 verification before processing
- [ ] Invalid signature returns 403 and logs security event
- [ ] Duplicate message ID (via `X-Meta-Message-Id` or deduplication) ignored
- [ ] `button_reply.id` extracted and dispatched to appropriate handler
- [ ] Integration tests cover: verification challenge, valid signature processing, invalid signature rejection, duplicate handling, button_reply extraction
- [ ] Gate check passes: `vitest run --project integration`

**Tests**: integration
**Gate**: full

---

### T5: Implement Button Reply Processor

**What**: Create the service that processes `button_reply.id` responses from WhatsApp and updates the corresponding availability/assignment records.
**Where**: `src/services/whatsapp/replyProcessor.ts`
**Depends on**: T4
**Reuses**: T4 webhook endpoint, B9 `availability_response` and `service_assignment` models
**Requirement**: REQ-WA-05

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `processButtonReply(musicianId, buttonId, context)` routes to correct handler
- [ ] Availability reply (`disponivel`/`nao_disponivel`): creates/updates `availability_response` record
- [ ] Substitution reply (`aceito`/`nao_posso`): triggers B9 substitution acceptance/decline
- [ ] Reply logged to `whatsapp_message_log` with `status = "respondido"`
- [ ] Unknown button IDs logged and ignored (no crash)
- [ ] Unit tests cover: availability positive/negative, substitution accept/decline, unknown button, logging
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T6: Define and Submit Availability Monthly Template

**What**: Define the `disponibilidade_mensal` template structure and implement the send function that triggers the monthly availability collection cycle.
**Where**: `src/services/whatsapp/templates.ts`, `src/services/whatsapp/templateSender.ts`
**Depends on**: T3
**Reuses**: T3 `sendTemplateMessage`
**Requirement**: REQ-WA-04

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `disponibilidade_mensal` template defined with variables: `{{nome}}`, `{{mes}}`, list of Sundays
- [ ] Template uses List Message format for multiple Sundays (not individual buttons)
- [ ] `sendAvailabilityTemplate(cycleId, musicianIds)` sends to all active opt-in musicians
- [ ] Each message logged to `whatsapp_message_log`
- [ ] Unit tests cover: template variable rendering, List Message format, logging
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T7: Define Remaining 4 WhatsApp Templates

**What**: Define the template structures for `escala_confirmada`, `substituicao_urgente`, `lembrete_disponibilidade`, and `repertorio_definido`.
**Where**: `src/services/whatsapp/templates.ts` (modify)
**Depends on**: T6
**Reuses**: T6 template definition pattern
**Requirement**: REQ-WA-04

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `escala_confirmada`: variables `{{nome}}`, `{{data}}`, `{{funcao}}`; button "Ver escala completa"
- [ ] `substituicao_urgente`: variables `{{nome}}`, `{{data}}`, `{{funcao}}`, `{{prazo}}`; buttons "Aceito" / "Não posso"
- [ ] `lembrete_disponibilidade`: variables `{{nome}}`, `{{mes}}`, `{{prazo}}`; sent at D-3 and D-1
- [ ] `repertorio_definido`: variables `{{nome}}`, `{{data}}`, `{{lista_de_musicas}}`; button opens study mode link
- [ ] All templates follow Meta template format (body + buttons)
- [ ] Template names match exactly what will be submitted to Meta Business Manager
- [ ] Unit tests cover: each template renders correct variables and button structure
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T8: Implement Opt-in Collection at Invite Acceptance

**What**: Modify the invite acceptance flow to collect WhatsApp phone number and explicit opt-in consent before linking the musician record.
**Where**: `src/services/inviteService.ts` (modify), `src/components/invite/AcceptInvite.tsx` (modify)
**Depends on**: T1
**Reuses**: B1 invite acceptance flow
**Requirement**: REQ-WA-08

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Accept invite form includes WhatsApp phone input (E.164 format with country code)
- [ ] Phone validated with regex: `^\+[1-9]\d{1,14}$`
- [ ] Explicit checkbox: "Consinto em receber notificações do ministério via WhatsApp"
- [ ] Checkbox must be checked to proceed (cannot accept invite without opt-in)
- [ ] On acceptance: `musician.whatsapp_phone` and `musician.whatsapp_opt_in = true` saved
- [ ] If phone provided but opt-in unchecked: number saved as `null`, `opt_in = false`
- [ ] Unit tests cover: valid phone + opt-in, invalid phone rejected, opt-in required, phone without opt-in saves null
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T9: Implement Opt-out Filtering in Message Batches

**What**: Implement filtering logic that excludes musicians without `whatsapp_opt_in = true` from WhatsApp message batches, and add an opt-out mechanism.
**Where**: `src/services/whatsapp/optInService.ts`
**Depends on**: T8
**Reuses**: T8 opt-in model
**Requirement**: REQ-WA-08

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `getOptedInMusicians(ministryId)` returns only musicians with `whatsapp_opt_in = true`
- [ ] `optOut(musicianId)` sets `whatsapp_opt_in = false`
- [ ] `optIn(musicianId, phone)` sets `whatsapp_opt_in = true` and updates phone
- [ ] Message batch functions (T6, T7) use `getOptedInMusicians` to filter recipients
- [ ] Musicians without phone number are also excluded (defensive check)
- [ ] Unit tests cover: opt-in filter, opt-out, opt-in with phone, missing phone exclusion
- [ ] Gate check passes: `vitest run`

**Tests**: unit
**Gate**: quick

---

### T10: Implement Message Log Persistence and Status Tracking

**What**: Implement the message log service that persists all WhatsApp messages sent and tracks their delivery status via webhook status updates.
**Where**: `src/services/whatsapp/messageLogService.ts`
**Depends on**: T2, T4
**Reuses**: T2 schema, T4 webhook endpoint
**Requirement**: REQ-WA-07

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `logMessage(musicianId, templateName, context, messageId)` creates log entry with `status = "enviado"`
- [ ] `updateStatus(messageId, status)` updates delivery status (enviado → entregue → lido)
- [ ] `getMessagesByMusician(musicianId)` returns message history
- [ ] `getMessagesByCycle(cycleId)` returns all messages for a cycle (for observability)
- [ ] Status webhook handler updates log on `delivered`, `read`, `failed` callbacks
- [ ] Unit tests cover: log creation, status update, query by musician, query by cycle, webhook status handling
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
  T5 ──→ T6 ──→ T7

Phase 4 (Sequential):
  T7 ──→ T8 ──→ T9
              T7 ──→ T10
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
| T1: Add WhatsApp Fields to Musician | 1 schema change | ✅ Granular |
| T2: Create Message Log Schema | 1 schema change | ✅ Granular |
| T3: Implement Meta Cloud API Service | 1 service | ✅ Granular |
| T4: Implement Webhook Endpoint | 1 route | ✅ Granular |
| T5: Implement Button Reply Processor | 1 service | ✅ Granular |
| T6: Define Availability Template | 1 template + 1 sender | ⚠️ OK — same feature |
| T7: Define Remaining Templates | 1 template file modification | ✅ Granular |
| T8: Implement Opt-in Collection | 1 service + 1 component | ⚠️ OK — same feature |
| T9: Implement Opt-out Filtering | 1 service | ✅ Granular |
| T10: Implement Message Log Service | 1 service | ✅ Granular |

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
| T2 | None | T1 → T2 | ✅ Match |
| T3 | T1 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 (Phase 2) | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T3 | T5 → T6 (Phase 3) | ✅ Match (T3 complete by T5) |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T1 | T7 → T8 (Phase 4) | ✅ Match (T1 complete by T7) |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T2, T4 | T7 → T10 (parallel with T8-T9) | ✅ Match (T2,T4 complete by T7) |

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
| T1: Add WhatsApp Fields to Musician | Entity/Schema (Prisma) | none | none | ✅ OK |
| T2: Create Message Log Schema | Entity/Schema (Prisma) | none | none | ✅ OK |
| T3: Implement Meta Cloud API Service | Service (WhatsApp Provider) | unit | unit | ✅ OK |
| T4: Implement Webhook Endpoint | API Route (Webhook) | integration | integration | ✅ OK |
| T5: Implement Button Reply Processor | Service (WhatsApp Provider) | unit | unit | ✅ OK |
| T6: Define Availability Template | Service (WhatsApp Provider) | unit | unit | ✅ OK |
| T7: Define Remaining Templates | Service (WhatsApp Provider) | unit | unit | ✅ OK |
| T8: Implement Opt-in Collection | Service (Opt-in/Opt-out) + Component | unit + unit | unit | ✅ OK |
| T9: Implement Opt-out Filtering | Service (Opt-in/Opt-out) | unit | unit | ✅ OK |
| T10: Implement Message Log Service | Service (Message Log) | unit | unit | ✅ OK |

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
