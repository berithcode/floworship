# Design System & Componentes Compartilhados Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/floworship-v8/b0-design-system/spec.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase guidelines — confirm before Execute. Guidelines found: none — strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| Component (shared) | unit | All branches; 1:1 to spec ACs; all listed edge cases | `src/components/shared/**/*.test.tsx` | `npm run test:unit` |
| Token module | unit | All tokens exported with correct values | `src/tokens/**/*.test.ts` | `npm run test:unit` |
| Integration (mount) | integration | Each component renders correctly in a sample page | `src/components/shared/**/*.integration.test.tsx` | `npm run test:integration` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|---|---|---|---|
| unit | Yes | Per-test render in jsdom; no shared state | React Testing Library standard |
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

### Phase 1: Foundation (Sequential)

```
T1 → T2
```

### Phase 2: Shared Components (Parallel OK)

```
T2 complete, then:
  ├── T3 [P]
  ├── T4 [P]
  ├── T5 [P]
  ├── T6 [P]
  ├── T7 [P]
  ├── T8 [P]
  └── T9 [P]
```

### Phase 3: Integration (Sequential)

```
T9 complete, then:
  T10 → T11
```

---

## Task Breakdown

### T1: Create Central Design Tokens

**What**: Create the central tokens file exporting all colors, spacing, radii as CSS custom properties and TypeScript theme object.
**Where**: `src/tokens/index.ts` + `src/tokens/theme.css`
**Depends on**: None
**Reuses**: None (first task)
**Requirement**: DS-01, DS-02

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `src/tokens/index.ts` exports all 10 color tokens with exact hex values: `bg-primary #121214`, `bg-card #1E1E22`, `bg-card-elevated #26262C`, `accent-primary #6C5CE7`, `accent-secondary #4A9EFF`, `text-primary #FFFFFF`, `text-secondary #9A9AA2`, `success #3DDC97`, `warning #FFB648`, `danger #FF5C5C`
- [ ] `src/tokens/index.ts` exports spacing tokens: `{ 1: 8, 2: 16, 3: 24, 4: 32 }` (multiples of 8)
- [ ] `src/tokens/index.ts` exports radius tokens: `{ card: 20, pill: 999 }`
- [ ] `src/tokens/theme.css` registers CSS custom properties for all tokens
- [ ] No TypeScript errors
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T2: Create Circular Icon Button Component

**What**: Create the CircularIconButton reusable primitive component.
**Where**: `src/components/shared/CircularIconButton.tsx`
**Depends on**: T1
**Reuses**: B0 tokens from T1
**Requirement**: DS-03

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Component renders with `bg-card-elevated` background
- [ ] Icon renders in white (`text-primary`)
- [ ] Touch target is minimum 44×44px
- [ ] `onClick` callback fires on tap/click
- [ ] Accepts `icon` (React node) and optional `aria-label` props
- [ ] Accepts optional `disabled` prop (reduced opacity, no callback)
- [ ] Keyboard focus ring visible for accessibility
- [ ] Unit tests covering all ACs
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T3: Create Pill Toggle Component [P]

**What**: Create the PillToggle reusable primitive component.
**Where**: `src/components/shared/PillToggle.tsx`
**Depends on**: T1
**Reuses**: B0 tokens from T1
**Requirement**: DS-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Renders pill-shaped buttons with `border-radius: 999px`
- [ ] Active option: white background, dark text
- [ ] Inactive options: `accent-primary` background, light text
- [ ] Tapping inactive option makes it active, previous active becomes inactive
- [ ] `onChange` callback fires with selected value
- [ ] Accepts `options` array and `value` props
- [ ] Unit tests covering all ACs
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T4: Create Card de Item Component [P]

**What**: Create the CardItem reusable primitive component.
**Where**: `src/components/shared/CardItem.tsx`
**Depends on**: T1, T2
**Reuses**: B0 tokens, CircularIconButton
**Requirement**: DS-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Displays: icon area, circular action button (upper-right), title, subtitle
- [ ] Border-radius: 20px (`card` radius token)
- [ ] Background: `bg-card`
- [ ] Circular action button: `bg-card-elevated`, white icon, 44×44px touch target
- [ ] `onAction` callback fires when action button is tapped
- [ ] Active state: background changes to `bg-card-elevated`
- [ ] Unit tests covering all ACs
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T5: Create Slider Horizontal Component [P]

**What**: Create the SliderHorizontal reusable primitive component.
**Where**: `src/components/shared/SliderHorizontal.tsx`
**Depends on**: T1
**Reuses**: B0 tokens from T1
**Requirement**: DS-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Renders thin horizontal track with `accent-primary` filled indicator
- [ ] Dragging thumb updates value continuously within min/max range
- [ ] `onChange` callback fires with new numeric value
- [ ] Keyboard interaction (arrow keys) works for accessibility
- [ ] Track and thumb use `border-radius: 999px` (pill token)
- [ ] Unit tests covering all ACs
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T6: Create Dial Circular Component [P]

**What**: Create the DialCircular reusable primitive component.
**Where**: `src/components/shared/DialCircular.tsx`
**Depends on**: T1
**Reuses**: B0 tokens from T1
**Requirement**: DS-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Renders SVG arc representing 0–100% value
- [ ] Arc animates/transitions on value change
- [ ] Displays centered numeric value (e.g., "75%")
- [ ] Arc color: `accent-primary`; background track: `bg-card`
- [ ] Accepts optional `size` prop (default 120px)
- [ ] Accepts optional `label` prop
- [ ] Clamps value: below 0 → 0; above 100 → 100
- [ ] Unit tests covering all ACs
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T7: Create Bottom Nav Pill Component [P]

**What**: Create the BottomNavPill reusable primitive component.
**Where**: `src/components/shared/BottomNavPill.tsx`
**Depends on**: T1
**Reuses**: B0 tokens from T1
**Requirement**: DS-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Renders floating pill container: `border-radius: 999px`, `bg-card-elevated`
- [ ] Active item: icon highlighted in `accent-primary`; inactive: `text-secondary`
- [ ] `onSelect` callback fires with item identifier
- [ ] Each item has minimum 44×44px touch target
- [ ] Accepts `items` prop (array of `{id, icon, label}`) and `activeId` prop
- [ ] Empty items array renders nothing (no empty pill)
- [ ] Unit tests covering all ACs
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T8: Create Avatar Circular Component [P]

**What**: Create the AvatarCircular reusable primitive component.
**Where**: `src/components/shared/AvatarCircular.tsx`
**Depends on**: T1
**Reuses**: B0 tokens from T1
**Requirement**: DS-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] With `src` prop: displays image inside circular container
- [ ] Without `src`, with `fallback` prop: displays initials with `accent-primary` bg and white text
- [ ] With `badge: true`: small colored dot at top-right (default `danger` color)
- [ ] Accepts optional `badgeColor` prop
- [ ] Circular shape (`border-radius: 999px`)
- [ ] Accepts optional `size` prop (default 40px)
- [ ] Image load failure falls back to initials
- [ ] Unit tests covering all ACs
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T9: Barrel Export & No-Duplication Verification [P]

**What**: Create barrel export file and verify no component duplication across web/mobile directories.
**Where**: `src/components/shared/index.ts`
**Depends on**: T2–T8
**Reuses**: All shared components from T2–T8
**Requirement**: DS-05

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `src/components/shared/index.ts` re-exports every shared component (CircularIconButton, PillToggle, CardItem, SliderHorizontal, DialCircular, BottomNavPill, AvatarCircular)
- [ ] `grep -r "CardItem\|PillToggle\|DialCircular\|SliderHorizontal\|BottomNavPill\|AvatarCircular\|CircularIconButton" src/web/ src/mobile/` returns zero component file matches (only imports from `components/shared/`)
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T10: Integration Smoke Test

**What**: Create an integration test that mounts all shared components in a sample page and verifies they render correctly together.
**Where**: `src/components/shared/__tests__/shared-components.integration.test.tsx`
**Depends on**: T9
**Reuses**: All shared components
**Requirement**: DS-04, DS-05

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Integration test mounts a sample page with all 7 shared components
- [ ] Each component renders without errors
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T11: Final Build Verification

**What**: Run full build + lint + all tests to verify B0 is complete.
**Where**: N/A (project root)
**Depends on**: T10
**Reuses**: None
**Requirement**: DS-01 through DS-05

**Tools**:
- MCP: NONE
- Skill: `lint-and-validate`

**Done when**:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (no errors)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No duplicate components in web/mobile directories

**Tests**: integration
**Gate**: build

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2

Phase 2 (Parallel):
  T2 complete, then:
    ├── T3 [P]
    ├── T4 [P]  } Can run simultaneously
    ├── T5 [P]
    ├── T6 [P]
    ├── T7 [P]
    ├── T8 [P]
    └── T9 [P]  (depends on T2–T8, so runs last in parallel batch)

Phase 3 (Sequential):
  T9 complete, then:
    T10 ──→ T11
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: Create central design tokens | 2 files (ts + css) | ✅ Granular |
| T2: Create Circular Icon Button | 1 component | ✅ Granular |
| T3: Create Pill Toggle | 1 component | ✅ Granular |
| T4: Create Card de Item | 1 component | ✅ Granular |
| T5: Create Slider Horizontal | 1 component | ✅ Granular |
| T6: Create Dial Circular | 1 component | ✅ Granular |
| T7: Create Bottom Nav Pill | 1 component | ✅ Granular |
| T8: Create Avatar Circular | 1 component | ✅ Granular |
| T9: Barrel export + verification | 1 file + grep check | ✅ Granular |
| T10: Integration smoke test | 1 test file | ✅ Granular |
| T11: Final build verification | Build gate | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T1 | T1 | ✅ Match |
| T4 | T1, T2 | T1, T2 | ✅ Match |
| T5 | T1 | T1 | ✅ Match |
| T6 | T1 | T1 | ✅ Match |
| T7 | T1 | T1 | ✅ Match |
| T8 | T1 | T1 | ✅ Match |
| T9 | T2–T8 | T2–T8 | ✅ Match |
| T10 | T9 | T9 | ✅ Match |
| T11 | T10 | T10 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Token module | unit | unit | ✅ OK |
| T2 | Component (shared) | unit | unit | ✅ OK |
| T3 | Component (shared) | unit | unit | ✅ OK |
| T4 | Component (shared) | unit | unit | ✅ OK |
| T5 | Component (shared) | unit | unit | ✅ OK |
| T6 | Component (shared) | unit | unit | ✅ OK |
| T7 | Component (shared) | unit | unit | ✅ OK |
| T8 | Component (shared) | unit | unit | ✅ OK |
| T9 | Barrel export | none | unit (build gate) | ✅ OK |
| T10 | Integration | integration | integration | ✅ OK |
| T11 | Build gate | none | build | ✅ OK |