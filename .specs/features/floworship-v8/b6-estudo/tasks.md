# Modo Estudo — Páginas & Caminhos Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/floworship-v8/b6-estudo/spec.md`
**Status**: Draft

---

**Engines de áudio (pitchy, @chordbook/tuner, Web Audio metronome) estão ADIADAS.** Foco atual: rotas, componentes de UI, e integração com B7. Engines serão implementadas posteriormente.

---

## Test Coverage Matrix

> Generated from codebase guidelines — confirm before Execute. Guidelines found: none — strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| Study Mode page | integration | Route loads, sections render correctly | `src/pages/**/*.test.tsx` | `npm run test:integration` |
| Tuner placeholder | unit | Renders Dial Circular with static values, no audio | `src/components/study/**/*.test.tsx` | `npm run test:unit` |
| Metronome placeholder | unit | Renders Slider + Play/Pause, no audio | `src/components/study/**/*.test.tsx` | `npm run test:unit` |
| Song detail integration | integration | "Estudar" button navigates correctly | `src/pages/**/*.test.tsx` | `npm run test:integration` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|---|---|---|---|
| unit | Yes | Per-test isolated; no shared state | React Testing Library standard |
| integration | Yes | Each test mounts fresh component tree | React Testing Library standard |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
|---|---|---|
| Quick | After tasks with unit tests only | `npm run test:unit` |
| Full | After tasks with integration tests | `npm run test:unit && npm run test:integration` |
| Build | After phase completion | `npm run build && npm run lint && npm run test` |

---

## Execution Plan

### Phase 1: Route & Page Structure (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Placeholders (Parallel OK)

```
T3 complete, then:
  ├── T4 [P]
  └── T5 [P]
```

### Phase 3: Integration & Verification (Sequential)

```
T4 + T5 complete, then:
  T6 → T7
```

---

## Task Breakdown

### T1: Study Mode Route Definition

**What**: Define the `/repertoire/:songId/study` route in the routing configuration.
**Where**: `src/routes.tsx` (or routing config file)
**Depends on**: None
**Reuses**: Existing routing patterns from the project
**Requirement**: STUDY-07, NAV-08

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Route `/repertoire/:songId/study` defined and loads StudyMode component
- [ ] Route is accessible (no auth guard blocking it for musicians)
- [ ] No TypeScript errors
- [ ] Gate check passes: `npm run build`

**Tests**: none (route config)
**Gate**: build

---

### T2: Study Mode Page Layout

**What**: Create the Study Mode page with header (song name) and two sections (Afinador placeholder, Metrônomo placeholder).
**Where**: `src/pages/study/StudyMode.tsx`
**Depends on**: T1
**Reuses**: B0 design tokens
**Requirement**: STUDY-07

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Page loads with header showing song name (fetched from route params)
- [ ] Two sections visible: "Afinador" and "Metrônomo"
- [ ] Each section has a title and placeholder content area
- [ ] Page is responsive (single column on mobile, two-column on desktop optional)
- [ ] No live session connection (independent mode)
- [ ] Unit tests: page renders, sections visible, song name displayed
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T3: "Estudar" Button on Song Detail

**What**: Add an "Estudar" button/tab to the song detail page that navigates to the study mode.
**Where**: `src/pages/songs/SongDetail.tsx` (or song detail component)
**Depends on**: T1, T2
**Reuses**: Existing song detail page patterns
**Requirement**: NAV-08

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] "Estudar" button/tab visible on song detail page
- [ ] Tapping "Estudar" navigates to `/repertoire/:songId/study`
- [ ] Button is styled consistently with design system (pill or tab style)
- [ ] Integration test: navigate to song detail → tap "Estudar" → study page loads
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T4: Tuner Placeholder Component [P]

**What**: Create a TunerPlaceholder component that renders the Dial Circular from B0 with static values (no audio engine).
**Where**: `src/components/study/TunerPlaceholder.tsx`
**Depends on**: B0 (DialCircular)
**Reuses**: B0 DialCircular component
**Requirement**: STUDY-03, STUDY-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Renders DialCircular from B0 with static value (e.g., 50% = "A4, 0 cents")
- [ ] Displays static note name (e.g., "A4") prominently
- [ ] Shows instrument preset selector (Violão, Baixo, Cavaquinho) — visual only
- [ ] Shows placeholder message: "Motor de detecção em breve"
- [ ] No microphone access requested (no getUserMedia call)
- [ ] Unit tests: renders dial, shows static values, preset selector visible, placeholder message
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T5: Metronome Placeholder Component [P]

**What**: Create a MetronomePlaceholder component that renders a BPM slider and play/pause button (no audio engine).
**Where**: `src/components/study/MetronomePlaceholder.tsx`
**Depends on**: B0 (SliderHorizontal)
**Reuses**: B0 SliderHorizontal component
**Requirement**: STUDY-05

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Renders SliderHorizontal from B0 for BPM (range 30–300, default 120)
- [ ] Displays current BPM value as text
- [ ] Shows Play/Pause button (visual only, no audio)
- [ ] Shows placeholder message: "Motor de áudio em breve"
- [ ] No Web Audio API calls (no AudioContext creation)
- [ ] BPM slider updates displayed value visually
- [ ] Unit tests: renders slider, shows BPM, play/pause visible, placeholder message
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T6: Study Mode Page Assembly

**What**: Integrate TunerPlaceholder and MetronomePlaceholder into the StudyMode page.
**Where**: `src/pages/study/StudyMode.tsx` (update from T2)
**Depends on**: T2, T4, T5
**Reuses**: TunerPlaceholder from T4, MetronomePlaceholder from T5
**Requirement**: STUDY-07

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] StudyMode page renders TunerPlaceholder in the "Afinador" section
- [ ] StudyMode page renders MetronomePlaceholder in the "Metrônomo" section
- [ ] Both sections are visually distinct and well-spaced
- [ ] Page layout is clean and matches design system patterns
- [ ] Integration test: study page loads → both placeholders visible → no audio
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T7: Final Build Verification

**What**: Run full build + lint + all tests to verify B6 page structure is complete.
**Where**: N/A (project root)
**Depends on**: T6
**Reuses**: None
**Requirement**: STUDY-07, NAV-08

**Tools**:
- MCP: NONE
- Skill: `lint-and-validate`

**Done when**:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (no errors)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Route `/repertoire/:songId/study` loads correctly
- [ ] "Estudar" button on song detail navigates to study page
- [ ] Tuner placeholder renders with Dial Circular (no audio)
- [ ] Metronome placeholder renders with Slider + Play/Pause (no audio)
- [ ] No microphone/audio API calls anywhere in study mode code

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
  T4 + T5 complete, then:
    T6 ──→ T7
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: Route definition | 1 config change | ✅ Granular |
| T2: Study Mode page layout | 1 page component | ✅ Granular |
| T3: "Estudar" button | 1 component modification | ✅ Granular |
| T4: Tuner placeholder | 1 component | ✅ Granular |
| T5: Metronome placeholder | 1 component | ✅ Granular |
| T6: Page assembly | 1 page update | ✅ Granular |
| T7: Final build verification | Build gate | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T1, T2 | T1, T2 | ✅ Match |
| T4 | B0 | B0 | ✅ Match |
| T5 | B0 | B0 | ✅ Match |
| T6 | T2, T4, T5 | T2, T4, T5 | ✅ Match |
| T7 | T6 | T6 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Route config | none | build | ✅ OK |
| T2 | Page component | unit | unit | ✅ OK |
| T3 | Song detail integration | integration | integration | ✅ OK |
| T4 | Tuner placeholder | unit | unit | ✅ OK |
| T5 | Metronome placeholder | unit | unit | ✅ OK |
| T6 | Page assembly | integration | integration | ✅ OK |
| T7 | Build gate | none | build | ✅ OK |
