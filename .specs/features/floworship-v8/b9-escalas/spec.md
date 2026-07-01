# Motor de Geração de Escalas Specification

## Problem Statement

The scheduling engine automates monthly roster generation for worship services. It uses a greedy algorithm with fairness scoring (not CSP/ILP) to assign musicians to Sundays, processing chronologically to ensure intra-month fairness. The admin panel allows monitoring the cycle (Coletando → Gerando → Aguardando aprovação → Publicada), manual adjustments, and post-publication substitution with sequential invite flow. Rules are configurable per ministry (formation, response deadlines, cycle trigger day). The engine runs as an async job, never in a synchronous API request.

## Goals

- [ ] `worship_role` as extensible tag per person/song *(REQ-SCHED-01)*
- [ ] Greedy algorithm with fairness score (not CSP/ILP) *(REQ-SCHED-02)*
- [ ] Strictly chronological processing of Sundays *(REQ-SCHED-03)*
- [ ] Admin panel: "Escalas do Mês" with cycle status, expandable Sunday cards, vago highlighting, manual swap, approve/publish *(REQ-SCHED-04)*
- [ ] Post-publication substitution: sequential invite flow (one candidate at a time, short response window) *(REQ-SCHED-05)*
- [ ] Configurable rules per ministry *(REQ-SCHED-06)*
- [ ] Async job execution (cron + event-driven) *(REQ-SCHED-07)*
- [ ] BLOCKED: Final tiebreaker rule for identical fairness scores *(REQ-SCHED-08)*

## Out of Scope

| Feature | Reason |
|---|---|
| Machine learning / preference-based assignment | Greedy algorithm per REQ-SCHED-02 |
| Multi-month lookahead | Monthly cycles per REQ-SCHED-07 |
| External calendar integration (Google Calendar) | Not specified |
| Automatic schedule publication (without admin approval) | REQ-SCHED-04 requires explicit approval |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Fairness score formula | `score = times_served_this_month * 100 + days_since_last_served[role]` (lower is better) | Balances frequency (primary) with recency (tiebreaker). Weighting ensures frequency dominates. | n |
| Sequential invite flow | One candidate at a time; 4h response window; on timeout/decline, move to next candidate | REQ-SCHED-05: "convite sequencial (um candidato por vez, janela de resposta curta ex. 4h)". | n |
| Optimistic locking for substitution | `version` field on `service_assignment`; update checks version matches; on conflict, retry with latest version | REQ-SCHED-05 AC: "lock otimista em service_assignment evita dupla aceitação". | n |
| Cycle statuses | `coletando → gerando → aguardando_aprovacao → publicada` | REQ-SCHED-04: status flow. | n |
| Minimum viable slots per Sunday | Defined by `ministry.formation` config (e.g., ministro_de_louvor: 1, guitarra: 1, bateria: 1) | REQ-SCHED-06: "formação padrão obrigatória/opcional por culto". | n |
| **TIEBREAKER RULE** | BLOCKED — must be resolved before B9 can pass review | REQ-SCHED-08: "Não implementar sem essa regra explicitamente definida e registrada em .specs/STATE.md". | ⛔ BLOCKED |

**Open questions:**

| Question | Options | Recommendation | Status |
|---|---|---|---|
| How to break ties when two candidates have identical fairness scores? | (a) Deterministic by user ID (lowest wins); (b) Random with seeded PRNG; (c) Last-served-first (most senior) | Option (a) deterministic by user ID — reproducible, auditable, simple | ⛔ MUST RESOLVE before B9 PASS |

---

## User Stories

### P1: Greedy Assignment Algorithm ⭐ MVP

**User Story**: As an admin, I want the scheduling engine to automatically assign musicians to Sundays using a fairness-based algorithm so that everyone serves equitably without manual calculation.

**Why P1**: Core scheduling logic; the reason the engine exists.

**Acceptance Criteria**:

1. WHEN the cycle runs THEN it SHALL process Sundays in strict chronological order (not parallel). *(REQ-SCHED-03)*
2. WHEN assigning a slot for a Sunday THEN the engine SHALL: (1) filter candidates with the required `worship_role`, available (not marked unavailable), and not already assigned to another slot on the same Sunday; (2) sort by `times_served_this_month` ascending (lowest first); (3) break ties by `last_served_at[role]` oldest first; (4) assign the first candidate. *(REQ-SCHED-02)*
3. WHEN no candidate is available for a slot THEN the slot SHALL be marked `"vago"` and the engine SHALL continue processing other slots/Sundays. *(REQ-SCHED-02)*
4. WHEN the engine assigns a candidate THEN the `times_served_this_month` counter SHALL increment in memory for subsequent assignments in the same cycle. *(REQ-SCHED-02)*
5. When two candidates have identical fairness scores THEN [BLOCKED — awaiting tiebreaker rule per REQ-SCHED-08]. *(REQ-SCHED-08)*

**Independent Test**: Create 3 musicians with different `times_served_this_month` → run cycle → verify assignment order follows fairness score (lowest served first).

---

### P1: Admin Panel — Escalas do Mês ⭐ MVP

**User Story**: As an admin, I want a dashboard showing the monthly scheduling cycle status with expandable Sunday cards so that I can monitor, adjust, and publish the schedule.

**Why P1**: REQ-SCHED-04; primary UI for schedule management.

**Acceptance Criteria**:

1. WHEN the admin opens "Escalas do Mês" THEN they SHALL see the cycle status (Coletando → Gerando → Aguardando aprovação → Publicada). *(REQ-SCHED-04)*
2. WHEN the cycle is in "Coletando" THEN availability responses are being collected from musicians. *(REQ-SCHED-04)*
3. WHEN the cycle is in "Gerando" THEN the engine is processing assignments. *(REQ-SCHED-04)*
4. WHEN the cycle is in "Aguardando aprovação" THEN the admin can review assignments, make manual swaps, and approve/publish. *(REQ-SCHED-04)*
5. WHEN the admin expands a Sunday card THEN they SHALL see all slots with assigned musicians; `"vago"` slots SHALL be highlighted in `danger` color. *(REQ-SCHED-04)*
6. WHEN the admin manually swaps a musician THEN the system SHALL use the same fairness-score ordering for the replacement selector. *(REQ-SCHED-04)*
7. WHEN all slots are filled (or admin confirms publishing with open slots) THEN the "Aprovar e Publicar" button SHALL be enabled. *(REQ-SCHED-04)*
8. WHEN the admin clicks "Aprovar e Publicar" THEN the cycle status SHALL change to "Publicada" and the schedule SHALL be visible to all ministry members. *(REQ-SCHED-04)*

**Independent Test**: Start cycle → status "Coletando" → collect responses → status "Gerando" → assignments complete → status "Aguardando aprovação" → expand Sunday card → see assignments + vago highlights → manual swap → publish → status "Publicada".

---

### P1: Post-Publication Substitution ⭐ MVP

**User Story**: As an admin, when a musician reports unavailability after publication, I want the system to automatically find a substitute using the same fairness algorithm and send sequential invites so that the slot is filled without manual coordination.

**Why P1**: REQ-SCHED-05; critical for handling last-minute cancellations.

**Acceptance Criteria**:

1. WHEN a musician reports unavailability on a published Sunday THEN their `service_assignment.status` SHALL change to `"recusado"`. *(REQ-SCHED-05)*
2. WHEN a slot becomes unfilled THEN the engine SHALL search for substitutes using the same filtering/fairness algorithm (excluding musicians already assigned to that Sunday). *(REQ-SCHED-05)*
3. WHEN a substitute is found THEN the engine SHALL send an invite to ONE candidate at a time (sequential, not broadcast). *(REQ-SCHED-05)*
4. WHEN the candidate responds "aceite" THEN `musician_id` SHALL update, `status` SHALL become `"confirmado"`, and `substitution_of` SHALL reference the original musician. *(REQ-SCHED-05)*
5. WHEN the candidate responds "recusa" or the 4h window expires THEN the next candidate SHALL be invited. *(REQ-SCHED-05)*
6. WHEN no candidates are available (list exhausted) THEN `status` SHALL become `"vago"` and the admin SHALL receive an urgent notification. *(REQ-SCHED-05)*
7. When two candidates accept simultaneously THEN optimistic locking (version field) SHALL prevent double-assignment. *(REQ-SCHED-05 AC)*

**Independent Test**: Publish schedule → musician A reports unavailable → system finds substitute B → sends invite → B accepts → assignment updated → verify `substitution_of` references A.

---

### P1: Configurable Rules Per Ministry ⭐ MVP

**User Story**: As an admin, I want to configure the formation requirements, response deadlines, and cycle trigger day for my ministry so that the scheduling engine follows our specific rules.

**Why P1**: REQ-SCHED-06; different ministries have different needs.

**Acceptance Criteria**:

1. WHEN the admin opens ministry settings THEN they SHALL see configurable fields: default formation (required/optional roles per service), availability response deadline (days before Sunday), substitution response window (hours), cycle trigger day (day of month). *(REQ-SCHED-06)*
2. WHEN the cycle runs THEN it SHALL use the ministry's configured formation to determine required slots. *(REQ-SCHED-06)*
3. WHEN the availability collection starts THEN it SHALL respect the configured response deadline. *(REQ-SCHED-06)*

**Independent Test**: Set formation to require 2 guitarists → cycle creates 2 guitar slots per Sunday → set response deadline to 7 days → availability collection starts 7 days before.

---

## Edge Cases

- WHEN a musician has multiple `worship_role` tags THEN they SHALL be eligible for any of those roles in the same cycle.
- WHEN a musician is already assigned to slot A on a Sunday AND slot B needs filling THEN they SHALL NOT be assigned to slot B (one slot per musician per Sunday).
- WHEN the cycle runs and a Sunday has no available musicians for ANY slot THEN all slots SHALL be `"vago"` and the admin is notified.
- WHEN the admin manually assigns a musician to a slot during "Aguardando aprovação" THEN the engine SHALL respect the manual assignment in subsequent operations.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| SCHED-01 | P1: Assignment Algorithm | Roles | Pending |
| SCHED-02 | P1: Assignment Algorithm | Algorithm | Pending |
| SCHED-03 | P1: Assignment Algorithm | Algorithm | Pending |
| SCHED-04 | P1: Admin Panel | UI | Pending |
| SCHED-05 | P1: Post-Publication Substitution | Substitution | Pending |
| SCHED-06 | P1: Configurable Rules | Config | Pending |
| SCHED-07 | P1: Async Job Execution | Infrastructure | Pending |
| SCHED-08 | BLOCKED — Tiebreaker rule | Algorithm | ⛔ BLOCKED |

**Coverage:** 8 total, 7 mapped to tasks, 1 BLOCKED (SCHED-08)

---

## Success Criteria

- [ ] Greedy algorithm assigns musicians fairly (lowest times_served first, oldest last_served as tiebreaker)
- [ ] Sundays processed chronologically; intra-month fairness guaranteed
- [ ] Admin panel shows cycle status, expandable Sunday cards, vago highlighting, manual swap
- [ ] "Aprovar e Publicar" enabled only when all slots filled or admin confirms open slots
- [ ] Post-publication substitution: sequential invite, 4h window, optimistic locking
- [ ] Configurable rules per ministry (formation, deadlines, cycle day)
- [ ] Engine runs as async job, never blocks API requests
- [ ] BLOCKED: Tiebreaker rule registered in STATE.md before PASS