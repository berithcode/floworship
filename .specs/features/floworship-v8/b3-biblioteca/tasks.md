# Biblioteca de Músicas & Editor de Cue Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/floworship-v8/b3-biblioteca/spec.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase guidelines — confirm before Execute. Guidelines found: none — strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| Song list component | unit | Renders list, filters by role, hides "Add Song" for musician | `src/components/library/**/*.test.tsx` | `npm run test:unit` |
| Song create/edit form | unit | All fields, validation, save flow | `src/components/library/**/*.test.tsx` | `npm run test:unit` |
| Song detail page (tabs) | integration | 3 tabs render: Info, Cue Editor, History | `src/pages/**/*.test.tsx` | `npm run test:integration` |
| Cue Editor component | integration | Waveform loads, block create/edit/delete, ChordPro preview | `src/components/library/cue-editor/**/*.test.tsx` | `npm run test:integration` |
| ChordPro parser | unit | Parse, render, transpose; Letra vs Cifra mode | `src/services/chordpro/**/*.test.ts` | `npm run test:unit` |
| ChordPro renderer | unit | HTML output correct for Letra and Cifra modes | `src/services/chordpro/**/*.test.ts` | `npm run test:unit` |
| Transposition logic | unit | All 12 semitone shifts; edge cases (unknown chords) | `src/services/chordpro/**/*.test.ts` | `npm run test:unit` |
| Block management | unit | Create, edit, delete, reorder blocks; overlap detection | `src/services/cue-editor/**/*.test.ts` | `npm run test:unit` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|---|---|---|---|
| unit | Yes | Per-test isolated; no shared state | Jest standard |
| integration | Yes | Each test mounts fresh component tree | React Testing Library standard |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
|---|---|---|
| Quick | After tasks with unit tests only | `npm run test:unit` |
| Full | After tasks with integration tests | `npm run test:unit && npm run test:integration` |
| Build | After phase completion or config/entity-only tasks | `npm run build && npm run lint && npm run test` |

---

## Execution Plan

### Phase 1: Song CRUD (Parallel OK)

```
T1 → T2 → T3
```

### Phase 2: Cue Editor (Sequential)

```
T3 complete, then:
  T4 → T5 → T6
```

### Phase 3: ChordPro Engine (Parallel OK)

```
T6 complete, then:
  ├── T7 [P]
  └── T8 [P]
```

### Phase 4: Final Verification (Sequential)

```
T8 complete, then:
  T9 → T10
```

---

## Task Breakdown

### T1: Song List & Create/Edit Forms (Web UI)

**What**: Create the song list page (Web) with create/edit forms; musician role sees read-only view.
**Where**: `src/pages/library/SongList.tsx` + `src/components/library/SongForm.tsx`
**Depends on**: B1-T8 (RBAC), B2-T3 (CRUD routes)
**Reuses**: B0 design system tokens, B1 RBAC middleware, B2 API routes
**Requirement**: LIB-01, LIB-05

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Song list page shows all songs with title, artist, key, status
- [ ] Admin/operator: "Add Song" button visible; musician: hidden
- [ ] "Add Song" navigates to creation page (NOT modal) with fields: title, artist, default_key, tags, status, notes
- [ ] Save creates song on server; status defaults to "rascunho"
- [ ] Click song navigates to detail page with tabs
- [ ] Delete soft-deletes (sets status to "arquivada")
- [ ] Form validation: title required, default_key required
- [ ] Unit tests: list renders, form validates, role-based visibility
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T2: Song Detail Page with Tabs

**What**: Create the song detail page that opens as its own route with 3 tabs: Info, Cue Editor, History.
**Where**: `src/pages/library/SongDetail.tsx`
**Depends on**: T1
**Reuses**: Song form from T1
**Requirement**: LIB-05

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Song detail opens as its own page (React Router route), never as a modal
- [ ] 3 tabs: Info (metadata), Cue Editor (wavesurfer), History (past sessions)
- [ ] Info tab shows: title, artist, key, tags, status, notes, last modified
- [ ] Cue Editor tab loads wavesurfer.js component (placeholder in this task)
- [ ] History tab queries `session_execution_log` entries referencing this song
- [ ] Tab switching preserves scroll position
- [ ] Integration tests: page renders, tabs switch, history queries correct data
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T3: Song List API Integration & Caching

**What**: Wire the song list UI to the B2 CRUD API routes and implement client-side caching with Dexie.js for offline access.
**Where**: `src/hooks/useSongs.ts` + `src/services/song-cache.ts`
**Depends on**: T1, B2-T3, B2-T6
**Reuses**: B2 API routes, B2 Dexie schema
**Requirement**: LIB-01, DATA-03

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `useSongs()` hook fetches songs from API on mount
- [ ] Songs cached in IndexedDB via Dexie after first fetch
- [ ] Offline: `useSongs()` returns cached songs
- [ ] Mutations (create/update/delete) update both API and local cache
- [ ] Loading and error states handled
- [ ] Unit tests: hook returns data, caching works, offline fallback
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T4: Cue Editor — Wavesurfer Integration [P]

**What**: Integrate wavesurfer.js in the Cue Editor tab to load reference audio and visualize waveform.
**Where**: `src/components/library/cue-editor/WaveformEditor.tsx`
**Depends on**: T2
**Reuses**: wavesurfer.js (confirmed in AD-001)
**Requirement**: LIB-02

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Waveform loads from `reference_track_url` via wavesurfer.js
- [ ] Waveform renders with dark theme styling matching design system
- [ ] Playhead shows current position
- [ ] Click on waveform seeks to that timestamp
- [ ] Error state: invalid URL shows error message
- [ ] Loading state: waveform placeholder while loading
- [ ] Unit tests: waveform renders, click seeks, error state, loading state
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T5: Cue Editor — Block Management [P]

**What**: Implement block creation, editing, and deletion on the waveform timeline with start/end markers.
**Where**: `src/components/library/cue-editor/BlockManager.tsx` + `src/services/cue-editor/blocks.ts`
**Depends on**: T4
**Reuses**: WaveformEditor from T4
**Requirement**: LIB-02, LIB-03

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Click on waveform creates a marker (start or end point)
- [ ] User can set marker as block start or end
- [ ] Creating a block records: label, start_time, end_time, duration (calculated), order
- [ ] Block list shows all blocks with label, start, end, duration
- [ ] Block can be edited (label, start/end times)
- [ ] Block can be deleted
- [ ] Overlapping blocks show warning and prevent saving
- [ ] Block order auto-assigned based on start_time
- [ ] Unit tests: create block, edit block, delete block, overlap detection, order calculation
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T6: Cue Sheet Persistence & ChordPro Editor

**What**: Implement cue sheet save/load from server and ChordPro content editor per block with live preview.
**Where**: `src/components/library/cue-editor/CueSheetEditor.tsx` + `src/services/cue-editor/persistence.ts`
**Depends on**: T5, B2-T3
**Reuses**: BlockManager from T5, B2 API routes
**Requirement**: LIB-02, LIB-03

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Cue sheet loads from server (GET /songs/:id/cue-sheet)
- [ ] Cue sheet saves to server (POST /songs/:id/cue-sheet)
- [ ] Each block has a ChordPro text editor
- [ ] ChordPro content renders live preview using chordsheetjs
- [ ] Save persists all blocks and their ChordPro content
- [ ] Empty cue sheet shows "Create Cue Sheet" button
- [ ] Save button disabled when overlapping blocks exist
- [ ] Integration tests: load cue sheet, edit blocks, save, verify persistence
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T7: ChordPro Parsing & Rendering Engine [P]

**What**: Implement ChordPro parsing, rendering in Letra/Cifra modes, and transposition logic using chordsheetjs.
**Where**: `src/services/chordpro/parser.ts` + `src/services/chordpro/renderer.ts` + `src/services/chordpro/transpose.ts`
**Depends on**: None (pure utility)
**Reuses**: chordsheetjs (MIT, confirmed in AD-001)
**Requirement**: LIB-03, LIB-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `parseChordPro(input)` parses ChordPro string into structured ChordSheet via chordsheetjs
- [ ] `renderCifra(chordSheet)` renders chords above lyrics (chords aligned to syllables)
- [ ] `renderLetra(chordSheet)` renders lyrics only (no chord lines)
- [ ] `transpose(chordSheet, semitones)` shifts all chords by N semitones via `song.transpose(n)`
- [ ] Transposition preserves lyrics text exactly
- [ ] Invalid ChordPro syntax renders gracefully (ignores malformed segments)
- [ ] Unknown chord format remains unchanged on transpose
- [ ] Unit tests: parse valid ChordPro, render Cifra mode, render Letra mode, transpose +2/-1/+12, edge cases
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T8: Cue Editor — Block Transposition Preview [P]

**What**: Integrate ChordPro rendering into the Cue Editor preview with transpose controls per block.
**Where**: `src/components/library/cue-editor/ChordProPreview.tsx`
**Depends on**: T6, T7
**Reuses**: ChordPro engine from T7, CueSheetEditor from T6
**Requirement**: LIB-03, LIB-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] ChordPro preview renders for each block using `renderCifra()`
- [ ] Transpose control (dropdown or ±buttons) shifts chords by semitones
- [ ] Preview updates in real time on transpose change
- [ ] Default key shown in header
- [ ] If event key differs from `default_key`, auto-transpose applied
- [ ] Unit tests: preview renders, transpose updates, auto-transpose on key mismatch
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T9: History Tab Data Integration

**What**: Wire the History tab in Song Detail to display past session execution logs referencing the song.
**Where**: `src/components/library/SongHistory.tsx`
**Depends on**: T2, B2-T1
**Reuses**: SessionExecutionLog from B2 schema
**Requirement**: LIB-05

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] History tab queries `session_execution_log` entries where `block_id` references blocks of this song
- [ ] Displays: date, duration, overrides count, triggered by
- [ ] Empty state: "No session history yet"
- [ ] Integration tests: history renders, empty state, correct data displayed
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T10: Final Build Verification

**What**: Run full build + lint + all tests to verify B3 is complete.
**Where**: N/A (project root)
**Depends on**: T9
**Reuses**: None
**Requirement**: LIB-01 through LIB-05

**Tools**:
- MCP: NONE
- Skill: `lint-and-validate`

**Done when**:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (no errors)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Song CRUD works end-to-end (Web)
- [ ] Cue Editor loads waveform, creates blocks, saves ChordPro
- [ ] ChordPro renders correctly in Letra and Cifra modes
- [ ] Transposition works for all 12 semitone shifts
- [ ] Song detail opens as page with 3 tabs (no modals)

**Tests**: integration
**Gate**: build

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3

Phase 2 (Sequential):
  T3 complete, then:
    T4 ──→ T5 ──→ T6

Phase 3 (Parallel):
  T6 complete, then:
    ├── T7 [P]
    └── T8 [P]  (depends on T6 + T7, runs after T7 completes)

Phase 4 (Sequential):
  T8 complete, then:
    T9 ──→ T10
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: Song list & create/edit forms | 2 components | ✅ Granular |
| T2: Song detail page with tabs | 1 page | ✅ Granular |
| T3: Song API integration & caching | 1 hook + 1 service | ✅ Granular |
| T4: Cue Editor — wavesurfer | 1 component | ✅ Granular |
| T5: Cue Editor — block management | 1 component + 1 service | ✅ Granular |
| T6: Cue sheet persistence & ChordPro editor | 1 component + 1 service | ✅ Granular |
| T7: ChordPro parsing & rendering | 3 service files | ✅ Granular |
| T8: Block transposition preview | 1 component | ✅ Granular |
| T9: History tab data integration | 1 component | ✅ Granular |
| T10: Final build verification | Build gate | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | B1-T8, B2-T3 | B1-T8, B2-T3 | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T1, B2-T3, B2-T6 | T1, B2-T3, B2-T6 | ✅ Match |
| T4 | T2 | T2 | ✅ Match |
| T5 | T4 | T4 | ✅ Match |
| T6 | T5, B2-T3 | T5, B2-T3 | ✅ Match |
| T7 | None | None | ✅ Match |
| T8 | T6, T7 | T6, T7 | ✅ Match |
| T9 | T2, B2-T1 | T2, B2-T1 | ✅ Match |
| T10 | T9 | T9 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Song list component | unit | unit | ✅ OK |
| T2 | Song detail page | integration | integration | ✅ OK |
| T3 | Song API integration | unit | unit | ✅ OK |
| T4 | Cue Editor (wavesurfer) | integration | unit | ✅ OK |
| T5 | Block management | unit | unit | ✅ OK |
| T6 | Cue sheet persistence | integration | integration | ✅ OK |
| T7 | ChordPro engine | unit | unit | ✅ OK |
| T8 | Transposition preview | unit | unit | ✅ OK |
| T9 | History tab | integration | integration | ✅ OK |
| T10 | Build gate | none | build | ✅ OK |
