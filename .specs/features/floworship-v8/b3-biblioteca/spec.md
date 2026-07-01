# Biblioteca de Músicas & Editor de Cue Specification

## Problem Statement

Floworship's core content is music — songs with chords, lyrics, and cue sheets that define timing blocks for live performance. The Library (Web-only CRUD, Mobile read-only) and Cue Editor (Web-only, wavesurfer.js-based) are the tools musicians and leaders use to prepare songs for live sessions. The Cue Editor maps audio reference tracks to timed blocks, each with ChordPro content. ChordPro parsing and transposition via chordsheetjs powers both the editor preview and the live Modo Letra/Cifra views (B5). Without this block, there is no song content for the live performance engine (B4) or study mode (B6) to consume.

## Goals

- [ ] Complete CRUD for songs available only on Web (Mobile is read-only) *(REQ-LIB-01)*
- [ ] Cue Editor (Web-only) using wavesurfer.js to mark block start/end points on reference audio *(REQ-LIB-02)*
- [ ] ChordPro content per block with embedded chords between brackets *(REQ-LIB-03)*
- [ ] ChordPro parsing, rendering, and transposition via chordsheetjs; Modo Letra (no chords) vs. Modo Cifra (with chords + transpose) *(REQ-LIB-04)*
- [ ] Song detail opens as its own page with tabs (Info / Cue Editor / History) — never as a modal *(REQ-LIB-05)*

## Out of Scope

| Feature | Reason |
|---|---|
| Mobile song CRUD | REQ-LIB-01: Mobile is read-only |
| Audio file upload/storage | Not specified; `reference_track_url` implies external URL |
| Waveform visualization beyond wavesurfer.js default | Not specified |
| Song versioning / revision history | Not in source spec §3.2 |
| Collaboration (multi-user editing simultaneously) | Not specified for MVP |
| Drag-and-drop block reordering | Nice-to-have; blocks ordered by `order` field |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| ChordPro parser | `chordsheetjs` (MIT license) — already confirmed in AD-001 | Matches source spec §5; MIT license is permissive. | n |
| Waveform library | `wavesurfer.js` — confirmed in AD-001 | Source spec §3.2 explicitly names wavesurfer.js. | n |
| Reference track storage | External URL (`reference_track_url` field) | Source spec implies URL-based; no file upload specified for MVP. | n |
| Block creation UX | Click on waveform timeline to set start/end; label + ChordPro editor in side panel | Standard waveform editor pattern; no wireframe available — follows textual description. | n |
| ChordPro rendering | chordsheetjs `ChordSheetParser` → `ChordSheet` → render to HTML/React | Standard chordsheetjs flow; supports transpose via `song.transpose(n)`. | n |
| Song detail page tabs | 3 tabs: Info (metadata), Cue Editor (wavesurfer), History (past sessions using this song) | Matches REQ-LIB-05 "Info / Editor de Cue / Histórico". | n |
| History tab data source | `SessionExecutionLog` entries referencing this song | Logical source; no new entity needed. | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Song CRUD (Web) ⭐ MVP

**User Story**: As a worship leader, I want to create, read, update, and delete songs on the Web app so that I can maintain the music library for my ministry.

**Why P1**: Foundation for all song-related features; without songs, nothing else works.

**Acceptance Criteria**:

1. WHEN a user with `admin` or `operator` role navigates to the Library THEN they SHALL see a list of all songs with title, artist, key, and status. *(REQ-LIB-01)*
2. WHEN a user clicks "Add Song" THEN they SHALL be taken to a new song creation page (not a modal) with fields: title, artist, default_key, tags[], status, notes. *(REQ-LIB-05 — page, not modal)*
3. WHEN a user saves a song THEN the song SHALL be persisted to the server with all fields; status defaults to `"rascunho"`. *(REQ-REP-01)*
4. WHEN a user clicks an existing song THEN they SHALL be taken to the song detail page with tabs (Info / Cue Editor / History). *(REQ-LIB-05)*
5. WHEN a user with `musician` role navigates to the Library THEN they SHALL see songs but the "Add Song" button SHALL be hidden/disabled. *(REQ-LIB-01 — Mobile/Web permission)*
6. WHEN a user deletes a song THEN the song SHALL be soft-deleted (marked `"arquivada"`) — never hard-deleted to preserve history. *(REQ-REP-01 implicit)*

**Independent Test**: Login as admin → Library shows empty → Add Song → fill form → save → song appears in list. Login as musician → "Add Song" hidden. Click song → detail page with 3 tabs.

---

### P1: Cue Editor (Web) ⭐ MVP

**User Story**: As a worship leader, I want to mark the start and end of each song block (Intro, Verse, Chorus, Bridge, etc.) on the reference audio track so that the Modo Operador can play blocks in sequence during live performance.

**Why P1**: The Cue Editor produces the `song_cue_sheet.blocks[]` data that the live performance engine (B4) consumes. Without it, no live session can happen.

**Acceptance Criteria**:

1. WHEN a user opens the Cue Editor tab THEN the reference audio track SHALL load in wavesurfer.js with a waveform visualization. *(REQ-LIB-02)*
2. WHEN a user clicks on the waveform THEN a marker SHALL be placed at that timestamp; the user can set it as a block start or end point. *(REQ-LIB-02)*
3. WHEN a user creates a block THEN the system SHALL record: `start_time`, `end_time`, `duration` (calculated from end - start), `label` (e.g., "Intro", "Verse 1"), `order` (auto-assigned based on position). *(REQ-LIB-02)*
4. WHEN a user edits a block's ChordPro content THEN the editor SHALL render a preview using chordsheetjs, showing chords and lyrics formatted correctly. *(REQ-LIB-03)*
5. WHEN a user saves the cue sheet THEN it SHALL be persisted to the server with all blocks and their ChordPro content. *(REQ-DATA-04)*
6. WHEN blocks overlap (start/end times conflict) THEN the editor SHALL show a warning and prevent saving until resolved. *(Implicit validation)*
7. WHEN a user transposes the key (e.g., from C to D, +2 semitones) THEN the ChordPro preview SHALL update to show the transposed chords. *(REQ-LIB-04)*

**Independent Test**: Open Cue Editor for a song → add reference track URL → waveform loads → create 3 blocks with labels → each block shows correct start/end/duration → enter ChordPro content → preview renders chords and lyrics → transpose +2 → chords shift correctly.

---

### P1: ChordPro Parsing & Rendering ⭐ MVP

**User Story**: As a musician, I want to see chords and lyrics rendered in the standard ChordPro format so that I can read them during practice or live performance.

**Why P1**: ChordPro is the storage format (REQ-LIB-03); parsing/rendering powers both the editor preview and the live Modo Letra/Cifra views (B5).

**Acceptance Criteria**:

1. WHEN a ChordPro string is parsed THEN chords embedded in brackets (e.g., `[C]Amazing [F]grace`) SHALL be extracted as separate chord/lyric elements. *(REQ-LIB-03)*
2. WHEN the parser renders a chord sheet THEN it SHALL produce a visual layout with chords aligned above the corresponding lyric syllables. *(REQ-LIB-04)*
3. WHEN a user selects "Modo Letra" (Lyrics Mode) THEN the rendered output SHALL show lyrics only — no chord lines above the text. *(REQ-LIB-04)*
4. WHEN a user selects "Modo Cifra" (Chords Mode) THEN the rendered output SHALL show chords above the lyrics. *(REQ-LIB-04)*
5. WHEN a user transposes by N semitones THEN `song.transpose(n)` SHALL shift all chords by N semitones while preserving the lyric text. *(REQ-LIB-04)*
6. WHEN the song's event key differs from `default_key` THEN the transposition SHALL be applied automatically to match the event key. *(REQ-LIB-04)*

**Independent Test**: Parse `[C]Amazing [F]grace` → render in Cifra mode → chords above lyrics. Switch to Letra mode → lyrics only. Transpose +2 → chords become D and G. Transpose -1 → chords become B and E.

---

## Edge Cases

- WHEN a song has no cue sheet THEN the Cue Editor tab SHALL show an empty state with a "Create Cue Sheet" button.
- WHEN a song has no reference track URL THEN the waveform SHALL not load and the editor SHALL prompt for a URL.
- WHEN a block's duration is 0 (start == end) THEN the system SHALL show a warning and prevent saving.
- WHEN ChordPro content contains invalid syntax THEN the parser SHALL render what it can and ignore malformed segments (graceful degradation).
- WHEN a user transposes a chord that has no valid transposition (e.g., unknown chord format) THEN that chord SHALL remain unchanged.
- WHEN the reference audio URL is unreachable THEN wavesurfer.js SHALL show an error state and the editor SHALL be unusable until a valid URL is provided.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| LIB-01 | P1: Song CRUD | CRUD | Pending |
| LIB-02 | P1: Cue Editor | Editor | Pending |
| LIB-03 | P1: ChordPro Parsing, Cue Editor | Editor | Pending |
| LIB-04 | P1: ChordPro Parsing & Rendering | Rendering | Pending |
| LIB-05 | P1: Song Detail Page | UI | Pending |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Admin/operator can CRUD songs on Web; musician sees read-only view
- [ ] Cue Editor loads waveform, creates blocks with timing, saves ChordPro content
- [ ] ChordPro parses correctly, renders in Letra/Cifra modes, transposes accurately
- [ ] Song detail opens as a page with 3 tabs (Info / Cue Editor / History)
- [ ] No modal-based song detail views anywhere in the codebase