# Telas do Modo Performance (Mobile) Specification

## Problem Statement

The Modo Performance is the core mobile experience during live worship sessions. It comprises four views: Modo Operador (block grid + dial + timeline), Modo Letra (lyrics display), Modo Cifra (chords display), and Modo TV (television output). All views are driven by the state machine events from B4 (PERF-CORE) — they are read-only consumers of server-pushed block changes. The operator view is the only interactive one (triggers overrides). This block depends on the design system primitives from B0 and the state machine/sync from B4.

## Goals

- [ ] Modo Operador: header with song name/key/BPM; current block card with Dial Circular progress; timeline pills; block grid (tappable for Override); state badge ("Programado"/"Override ativo"); bottom nav pill *(REQ-UI-01)*
- [ ] Modo Letra: large lyrics font, no chords by default; "Show chords" pill toggle; next block preview in footer; auto-advances on server event *(REQ-UI-02)*
- [ ] Modo Cifra: chords visible by default, aligned above syllables; "Hide lyrics" toggle; key indicator in header; auto-advances *(REQ-UI-03)*
- [ ] Modo TV: television output view with dial circular progress *(REQ-UI-04)*
- [ ] All views (Letra/Cifra/TV) are read-only: change only by server event, never by local navigation *(REQ-UI-05)*

## Out of Scope

| Feature | Reason |
|---|---|
| Operator Override stack visualization | Not specified; override count visible only as state badge |
| Custom themes per view | Dark-only per source spec §1 |
| Landscape-optimized layouts | Not specified for MVP |
| Full TV mode beyond dial progress | REQ-UI-04 says "fora do escopo desta v8" |
| Multi-song session view | Not specified for MVP |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Navigation between views | React Router tabs or bottom sheet within the session takeover; Modo Operador is the default for operators, Modo Letra/Cifra for musicians | Roles determine default view; switching is manual within the takeover. | n |
| Dial Circular component | Reuse from B0 (shared design system) | REQ-DS-04 specifies it as a shared primitive. | n |
| Pill Toggle component | Reuse from B0 (shared design system) | Used for "Show chords" / "Hide lyrics" toggles. | n |
| Timeline pills | Horizontal scroll of block pills; current block highlighted with `accent-primary` | Standard horizontal timeline pattern; no wireframe available. | n |
| Block grid | Grid of tappable cards; each card uses CardItem from B0; on tap, triggers Override (if operator) | Matches REQ-UI-01 "grid de blocos tocáveis". | n |
| Bottom nav in Modo Performance | Pill-shaped, floating; items: Ordem do Culto / Modo Operador / Chat / Encerrar sessão | Per REQ-UI-01 bottom nav spec. | n |
| ChordPro rendering in Letra/Cifra | Use chordsheetjs rendering (from B3) | Reuses B3 parsing/rendering logic. | n |
| Auto-advance mechanism | Client receives `block_changed` WebSocket event → updates displayed block | Client is event-driven, not timer-driven (REQ-CORE-08). | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Modo Operador ⭐ MVP

**User Story**: As an operator, I want a screen showing the current block, a progress dial, a timeline of blocks, and a tappable grid so that I can control the live session with one hand.

**Why P1**: Primary interactive view; all other Modo Performance views are read-only consumers of its state.

**Acceptance Criteria**:

1. WHEN the Modo Operador loads THEN it SHALL display: header (song name, key, BPM), current block card (bg-card-elevated with Dial Circular showing progress), horizontal timeline of pills (current = accent-primary), block grid (tappable cards), state badge. *(REQ-UI-01)*
2. WHEN a block is in Programado state THEN the state badge SHALL show "Programado" in the default accent color. *(REQ-UI-01)*
3. WHEN an Override is active THEN the state badge SHALL show "Override ativo" with `warning` color. *(REQ-UI-01)*
4. WHEN the operator taps a block in the grid THEN it SHALL trigger an Override (if the operator has permission per REQ-CORE-04). *(REQ-UI-01)*
5. WHEN the current block changes (via auto-advance or override) THEN the dial SHALL reset to 0% and begin filling; the timeline SHALL highlight the new current block; the block card SHALL update with the new block's label and timing. *(REQ-CORE-08)*
6. WHEN the operator is in the session takeover THEN the bottom nav pill SHALL show: Ordem do Culto / Modo Operador / Chat / Encerrar sessão. *(REQ-UI-01)*

**Independent Test**: Login as operator → join session → Modo Operador loads → tap block 2 → override triggered → dial resets → timeline updates → badge shows "Override ativo" → after override duration, badge returns to "Programado".

---

### P1: Modo Letra ⭐ MVP

**User Story**: As a musician, I want a lyrics-only view of the current block that auto-advances when the operator changes blocks so that I can sing without distraction.

**Why P1**: Core musician experience; read-only view for vocalists.

**Acceptance Criteria**:

1. WHEN Modo Letra loads THEN it SHALL display the current block's lyrics in large font, without chords. *(REQ-UI-02)*
2. WHEN a "Mostrar cifra" toggle (pill switch) is present THEN tapping it SHALL reveal chords above the lyrics (switching to Cifra-like rendering). *(REQ-UI-02)*
3. WHEN a `block_changed` event is received via WebSocket THEN the view SHALL update to the new block's content without user interaction. *(REQ-UI-02, REQ-CORE-08)*
4. WHEN the current block changes THEN a preview of the next block SHALL appear in the footer. *(REQ-UI-02)*
5. WHEN the musician attempts to manually navigate to a different block THEN it SHALL be prevented (no forward/back controls). *(REQ-UI-05)*

**Independent Test**: Login as musician → join session → Modo Letra shows lyrics only → tap "Mostrar cifra" → chords appear → operator advances block → view updates automatically → next block preview in footer.

---

### P1: Modo Cifra ⭐ MVP

**User Story**: As a guitarist/pianist, I want a chords-first view with chords aligned above syllables and a visible key indicator so that I can play along with the correct chords.

**Why P1**: Core instrumentalist experience; read-only view for chord instrument players.

**Acceptance Criteria**:

1. WHEN Modo Cifra loads THEN it SHALL display the current block's content with chords visible by default, aligned above the corresponding lyric syllables. *(REQ-UI-03)*
2. WHEN a "Ocultar letra" toggle (pill switch) is present THEN tapping it SHALL hide the lyrics, leaving only chords displayed. *(REQ-UI-03)*
3. WHEN the header renders THEN it SHALL always display the current key indicator (e.g., "Key: C"). *(REQ-UI-03)*
4. WHEN a `block_changed` event is received via WebSocket THEN the view SHALL update to the new block's content. *(REQ-UI-03, REQ-CORE-08)*
5. WHEN the musician attempts manual navigation THEN it SHALL be prevented. *(REQ-UI-05)*

**Independent Test**: Login as guitarist → join session → Modo Cifra shows chords above lyrics → tap "Ocultar letra" → only chords visible → key indicator shows "Key: C" → operator advances → view updates.

---

## Edge Cases

- WHEN a block has empty chordpro_content THEN Modo Letra SHALL show "[No content]" placeholder; Modo Cifra SHALL show empty state.
- WHEN the session ends THEN all Modo Performance views SHALL show a "Session ended" screen with a "Return to home" button.
- WHEN the operator leaves the session takeover THEN the session continues running (server-side state machine is independent).
- WHEN a musician is on Modo Letra and the operator triggers an Override → Retomada rapidly THEN the view SHALL update to each block in sequence (no dropped events).
- WHEN the Dial Circular receives a block with duration 0 THEN it SHALL show 100% immediately (no animation).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| UI-01 | P1: Modo Operador | UI | Pending |
| UI-02 | P1: Modo Letra | UI | Pending |
| UI-03 | P1: Modo Cifra | UI | Pending |
| UI-04 | P1: Modo TV | UI | Pending |
| UI-05 | P1: Modo Letra, Cifra (read-only) | State | Pending |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Operator sees block grid, dial progress, timeline, state badge; tapping block triggers Override
- [ ] Musician sees lyrics (Letra) or chords (Cifra) that auto-advance on server events
- [ ] All views update via WebSocket — no manual navigation in Letra/Cifra
- [ ] State badge correctly shows "Programado" vs "Override ativo" with appropriate colors