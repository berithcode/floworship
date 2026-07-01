# Catálogo Oficial & Repertório do Culto Specification

## Problem Statement

The Repertoire block bridges the music library (B3) with the scheduling system (B9). It allows worship leaders to curate a setlist for each Sunday service from the approved song catalog, with per-song key overrides and notes. Songs have a status lifecycle (`rascunho → pronta → arquivada`) and tags for filtering. The repertoire can only be built after the schedule is approved/published, and only the assigned worship leader can edit their Sunday's repertoire. When the repertoire is published, a WhatsApp template is sent to all scheduled musicians.

## Goals

- [ ] Song status field: `rascunho | pronta | arquivada` *(REQ-REP-01)*
- [ ] Song tags for filtering *(REQ-REP-02)*
- [ ] `service_repertoire_item` entity linking songs to service schedules *(REQ-REP-03)*
- [ ] Repertoire creation only after schedule is approved/published *(REQ-REP-04)*
- [ ] Search filters songs by status (`pronta` only), tag, key, tempo *(REQ-REP-05)*
- [ ] Scoped permissions: Admin/Leader edits any Sunday; Worship Leader edits only their assigned Sunday; Operator/Musician read-only *(REQ-REP-06)*
- [ ] Permission auto-migrates on worship leader substitution *(REQ-REP-07)*
- [ ] Web: repertoire tab in Sunday card with drag-and-drop; Mobile: Sunday detail with repertoire links to Study Mode *(REQ-REP-08)*
- [ ] WhatsApp template `repertorio_definido` sent on publish *(REQ-REP-09)*

## Out of Scope

| Feature | Reason |
|---|---|
| Song rating / popularity tracking | Not specified |
| Repertoire templates (reusable setlists) | Not specified for MVP |
| Auto-suggest songs based on theme/season | Not specified |
| Audio preview in repertoire view | Not specified |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Repertoire item ordering | `order` field (integer, 0-based) on `service_repertoire_item` | Matches `song_cue_sheet.blocks[].order` pattern. | n |
| Drag-and-drop library | `@dnd-kit/core` (or HTML5 Drag and Drop API for simplicity) | Lightweight; no heavy deps needed for a simple reorderable list. | n |
| Status transitions | `rascunho → pronta → arquivada` (linear, no reversal for `arquivada`) | REQ-REP-01 defines these three states; `arquivada` is terminal for search but keeps history. | n |
| Tag vocabulary | Free-form string array on song; no separate tag entity | REQ-REP-02: `tags: string[]` on `song`. Simple for MVP. | n |
| Schedule prerequisite check | Before showing repertoire tab, verify `service_schedule.status === "published"` | REQ-REP-04: "repertório só pode ser montado depois que a escala está aprovada/publicada". | n |
| Permission check on repertoire edit | Server-side: compare `ministry_member.role` + `service_assignment.musician_id` against the user | REQ-REP-06 + REQ-REP-07. | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Song Catalog Management ⭐ MVP

**User Story**: As an admin, I want songs to have a status (`rascunho`, `pronta`, `arquivada`) and tags so that I can control which songs are available for repertoire selection and can filter them by theme.

**Why P1**: Foundation for the repertoire workflow; `rascunho` songs must be hidden from repertoire selection.

**Acceptance Criteria**:

1. WHEN a song is created THEN its status SHALL default to `"rascunho"`. *(REQ-REP-01)*
2. WHEN a song's status is `"rascunho"` THEN it SHALL NOT appear in the repertoire song selection (only in admin Library). *(REQ-REP-01)*
3. WHEN a song's status is `"pronta"` THEN it SHALL appear in repertoire selection. *(REQ-REP-01)*
4. WHEN a song's status is `"arquivada"` THEN it SHALL be excluded from daily search but retain its history. *(REQ-REP-01)*
5. WHEN a song has tags (e.g., "adoração", "ceia") THEN those tags SHALL be filterable in the repertoire search. *(REQ-REP-02)*

**Independent Test**: Create song with status `rascunho` → not visible in repertoire selection → change to `pronta` → visible → add tag "ceia" → filter by tag → song appears.

---

### P1: Repertoire Creation ⭐ MVP

**User Story**: As the worship leader assigned to a Sunday, I want to build a setlist by selecting songs and arranging them in order so that the band knows what to play.

**Why P1**: Core repertoire functionality; directly feeds the live session (B4/B5).

**Acceptance Criteria**:

1. WHEN the service schedule for a Sunday is approved/published THEN the repertoire tab SHALL become available for that Sunday. *(REQ-REP-04)*
2. WHEN the schedule is NOT published THEN the repertoire tab SHALL be disabled/hidden. *(REQ-REP-04)*
3. WHEN the worship leader opens the repertoire tab THEN they SHALL see a search panel (songs with `status = "pronta"`, filterable by tag/key/tempo) and an ordered setlist panel. *(REQ-REP-05, REQ-REP-08)*
4. WHEN the worship leader adds a song to the setlist THEN a `service_repertoire_item` SHALL be created with: `service_schedule_id`, `song_id`, `order`, `key_override` (optional), `notes` (optional). *(REQ-REP-03)*
5. WHEN the worship leader reorders the setlist (drag-and-drop) THEN the `order` fields SHALL update accordingly. *(REQ-REP-08)*
6. WHEN the worship leader removes a song from the setlist THEN the `service_repertoire_item` SHALL be deleted. *(Implicit)*

**Independent Test**: Schedule published → repertoire tab enabled → search songs with status `pronta` → add 3 songs → reorder → save → reload → order preserved.

---

### P1: Scoped Permissions ⭐ MVP

**User Story**: As an admin, I want to edit any Sunday's repertoire at any time; as the assigned worship leader, I want to edit only my own Sunday; as an operator/musician, I want read-only access.

**Why P1**: REQ-REP-06 defines the permission model; critical for multi-leader ministries.

**Acceptance Criteria**:

1. WHEN a user with `admin` or `operator` role opens any Sunday's repertoire THEN they SHALL have full edit access. *(REQ-REP-06)*
2. WHEN the worship leader assigned to a specific Sunday opens that Sunday's repertoire THEN they SHALL have edit access. *(REQ-REP-06)*
3. WHEN the worship leader opens a DIFFERENT Sunday's repertoire THEN they SHALL have read-only access. *(REQ-REP-06)*
4. WHEN a user with `musician` role opens any repertoire THEN they SHALL have read-only access. *(REQ-REP-06)*
5. WHEN the assigned worship leader is substituted (REQ-REP-07) THEN the new worship leader SHALL inherit edit permission for that Sunday. *(REQ-REP-07)*

**Independent Test**: Login as admin → edit any Sunday → save. Login as worship leader A → edit Sunday A → save; Sunday B → read-only. Login as musician → all read-only.

---

### P1: WhatsApp Repertoire Notification ⭐ MVP

**User Story**: As a worship leader, I want a WhatsApp message sent to all musicians scheduled for a Sunday when I publish the repertoire so that they know what to prepare.

**Why P1**: REQ-REP-09; integrates with B10 (WhatsApp) to notify the team.

**Acceptance Criteria**:

1. WHEN the worship leader publishes the repertoire THEN a WhatsApp message using template `repertorio_definido` SHALL be sent to all musicians scheduled for that Sunday. *(REQ-REP-09)*
2. WHEN the template is sent THEN it SHALL include a button that opens the Study Mode for the repertoire. *(REQ-REP-09)*
3. WHEN a musician has NOT opted in to WhatsApp (`whatsapp_opt_in = false`) THEN they SHALL NOT receive the message. *(REQ-WA-08)*

**Independent Test**: Publish repertoire → check WhatsApp message log → messages sent to opted-in musicians → template includes study mode link.

---

## Edge Cases

- WHEN a song in the setlist is archived (`arquivada`) after being added THEN the repertoire item SHALL remain (historical record) but the song SHALL not appear in future searches.
- WHEN the schedule is unpublished (reverted to draft) after repertoire was built THEN the repertoire tab SHALL become disabled but the existing items SHALL be preserved.
- WHEN the worship leader is substituted AFTER the repertoire was published THEN the new leader inherits edit access; the old leader loses it.
- WHEN the setlist has 0 songs AND the leader tries to publish THEN the system SHALL warn but allow (empty setlist is valid for some services).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| REP-01 | P1: Song Catalog | Catalog | Pending |
| REP-02 | P1: Song Catalog | Catalog | Pending |
| REP-03 | P1: Repertoire Creation | Repertoire | Pending |
| REP-04 | P1: Repertoire Creation | Repertoire | Pending |
| REP-05 | P1: Repertoire Creation | Search | Pending |
| REP-06 | P1: Scoped Permissions | Security | Pending |
| REP-07 | P1: Scoped Permissions | Security | Pending |
| REP-08 | P1: Repertoire Creation | UI | Pending |
| REP-09 | P1: WhatsApp Notification | Integration | Pending |

**Coverage:** 9 total, 9 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Song status (`rascunho/pronta/arquivada`) controls visibility in repertoire selection
- [ ] Tags filter songs in repertoire search
- [ ] Worship leader can build setlist with drag-and-drop after schedule is published
- [ ] Permissions enforced: admin/leader = full; assigned worship leader = own Sunday; others = read-only
- [ ] Substitution auto-migrates edit permission
- [ ] WhatsApp `repertorio_definido` template sent to opted-in musicians on publish