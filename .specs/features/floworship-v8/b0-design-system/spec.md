# Design System & Componentes Compartilhados Specification

## Problem Statement

Floworship runs as a single React/TypeScript codebase serving both Web (admin/desktop) and Mobile (PWA). Without a centralized design token layer and shared primitive component library, every color, spacing value, and UI primitive would be duplicated across web and mobile routes — making the UI inconsistent and token changes (e.g., shifting `accent-primary`) require editing dozens of component files. A single-source-of-truth design system eliminates this duplication, enforces visual coherence, and ensures that a token change propagates everywhere in one edit.

## Goals

- [ ] Centralized design tokens (colors, spacing, radii) consumed by Web and Mobile without duplication — a single token change reflects globally
- [ ] Reusable primitive component library in a shared layer (`components/shared`), consumed by both web and mobile routes
- [ ] Platform-specific shell/layout components (sidebar, bottom nav) isolated from shared content components
- [ ] Every shared primitive visually matches the dark, minimal aesthetic defined in the source spec (§1)

## Out of Scope

| Feature | Reason |
|---|---|
| Sidebar layout (Web) | Shell component — platform-specific, belongs to B7 (NAV) |
| Bottom nav layout (Mobile — daily use) | Shell component — platform-specific, belongs to B7 (NAV) |
| High-fidelity wireframes | Do not exist yet — UI follows textual description from spec until wireframes are approved |
| Typography tokens (font-family, font-size scale) | Not defined in source spec §1; will be added when wireframes provide hierarchy |
| Animation / motion tokens | Not specified in source spec §1 |
| Dark/light theme toggle | Source spec defines dark-only; no light theme requested |
| Elevation / shadow system | Not defined in source spec §1 |
| Responsive breakpoint tokens | Layout concern — belongs to B7 (NAV) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Token storage format | CSS custom properties + TS theme object exported from a single `tokens.ts` file | CSS custom properties enable runtime theming; TS object enables type-safe consumption in JS/TSX. Both generated from the same source of truth. | n |
| Shared component directory | `components/shared/` in the monorepo/src root, barrel-exported via `index.ts` | Matches the convention suggested in source spec §6.3 ("components/shared ou pacote de monorepo"). Keeps imports short and discoverable. | n |
| Styling approach for shared components | Tailwind CSS v4 utility classes consuming design tokens via `@theme` | Stack confirmed (AD-001): React/TS — Tailwind is idiomatic, token-integrated, and avoids runtime CSS-in-JS overhead. Tailwind v4 supports `@theme` for custom tokens natively. | n |
| Component prop API pattern | Compound component pattern where applicable (e.g., PillToggle.Option); single-element otherwise | Keeps APIs composable without over-abstracting. | n |
| Icon system | Lucide React icons | Widely used tree-shakeable icon set; fits the minimal/line-icon aesthetic of the source reference. Decision reversible without touching tokens. | n |
| Dial circular — SVG or Canvas? | Pure SVG with `stroke-dasharray` / `stroke-dashoffset` for the progress arc | SVG is declarative, animatable via CSS/React state, and accessible (ARIA on `<svg>`); Canvas requires imperative redraw and is harder to make accessible. | n |
| Slider horizontal — native `<input type="range">` or custom? | Custom-styled native `<input type="range">` with Tailwind appearance overrides | Native gives keyboard a11y, touch support, and form participation for free; custom visuals via `appearance: none` + Tailwind. | n |
| Avatar circular — image source | Accepts `src` (URL) or `fallback` (initials string) | Standard avatar pattern; shows initials when no image is available. | n |
| Card border radius — exact value | 20px (lower bound of the 20–24px range) | Lower bound leaves room for visual refinement without breaking layout; matches the reference app's feel. Will adjust to 24px if wireframes dictate. | n |
| Circular icon button — icon size | 20px icon within 44px touch target | 20px icon gives ~12px padding inside 44px, meeting the minimum touch area (REQ-DS-03). | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Design Tokens — Single Source of Truth ⭐ MVP

**User Story**: As a developer, I want all color, spacing, and border-radius tokens defined in a single source file so that changing a token once updates both Web and Mobile without editing individual components.

**Why P1**: Without centralized tokens, every subsequent component (pill, card, dial, etc.) would hardcode values, making the entire design system fragile and inconsistent.

**Acceptance Criteria**:

1. WHEN a developer changes a color token value (e.g., `accent-primary` from `#6C5CE7` to `#7C6CF7`) in the central tokens file THEN both Web and Mobile renders SHALL reflect the new color without editing any component file. *(REQ-DS-01 AC)*
2. WHEN a component references `bg-primary` (or any token) THEN it SHALL resolve the value from the central token source — never from a hardcoded value in the component file.
3. WHEN the tokens file is loaded THEN it SHALL export all 10 color tokens with their exact hex values: `bg-primary #121214`, `bg-card #1E1E22`, `bg-card-elevated #26262C`, `accent-primary #6C5CE7`, `accent-secondary #4A9EFF`, `text-primary #FFFFFF`, `text-secondary #9A9AA2`, `success #3DDC97`, `warning #FFB648`, `danger #FF5C5C`. *(REQ-DS-01)*
4. WHEN the tokens file is loaded THEN it SHALL export spacing tokens as multiples of 8: `8, 16, 24, 32`. *(REQ-DS-02)*
5. WHEN the tokens file is loaded THEN it SHALL export border-radius tokens: `card: 20px`, `pill: 999px`. *(REQ-DS-02)*
6. WHEN the token file is loaded THEN CSS custom properties SHALL be registered for each token so thay can be consumed in any CSS/TSX context.

**Independent Test**: Open any page (Web or Mobile), change `accent-primary` hex in the token file, reload — all elements using `accent-primary` now render the new color; no component files were modified.

---

### P1: Pill Toggle ⭐ MVP

**User Story**: As a musician using the Modo Letra, I want to toggle "Mostrar cifra" / "Ocultar cifra" via a pill-shaped switch so that I can control what I see during a live session with a single tap.

**Why P1**: Pill toggle is a core interaction primitive (source spec §1.3), reused in Modo Letra, Modo Cifra, and the admin panel. It must exist before B5 (PERF-UI) can be built.

**Acceptance Criteria**:

1. WHEN the Pill Toggle renders THEN it SHALL display two or more mutually exclusive options as pill-shaped buttons with border-radius `999px` (full-round). *(REQ-DS-02)*
2. WHEN the active option is selected THEN it SHALL display with a white background and dark text; inactive options SHALL display with `accent-primary` background and light text. *(Source spec §1.3 — "opção ativa em branco com texto escuro; opções inativas em roxo/escuro com texto claro")*
3. WHEN a user taps/clicks an inactive option THEN it SHALL become the active option and the previously active option SHALL become inactive.
4. WHEN any option is selected THEN the component SHALL invoke an `onChange` callback with the selected value.

**Independent Test**: Render a PillToggle with options ["Mostrar cifra", "Ocultar cifra"]; click "Ocultar cifra" — it becomes active (white bg, dark text), "Mostrar cifra" becomes inactive (accent-primary bg, light text).

---

### P1: Card de Item (ícone + botão circular + título + subtítulo) ⭐ MVP

**User Story**: As a musician viewing the Modo Operador block grid, I want each block displayed as a card with an icon, a circular action button, a title, and a subtitle so that I can identify and interact with blocks at a glance.

**Why P1**: This card is the primary content unit in the Modo Operador block grid and the device/item pattern from the reference app (source spec §1.3). It is reused across B5, B3, and B8.

**Acceptance Criteria**:

1. WHEN the Card de Item renders THEN it SHALL display an icon area, a circular action button in the upper-right corner, a title, and a subtitle. *(REQ-DS-04 — "Card de item: ícone + botão circular + título + subtítulo")*
2. WHEN the card renders THEN its border-radius SHALL be `20px` (the card radius token). *(REQ-DS-02)*
3. WHEN the card renders THEN its background SHALL be `bg-card`. *(Source spec §1.1)*
4. WHEN the circular action button renders THEN it SHALL have background `bg-card-elevated`, a white icon, and a minimum touch area of `44×44px`. *(REQ-DS-03)*
5. WHEN a user taps/clicks the circular action button THEN it SHALL invoke an `onAction` callback.
6. WHEN the card is selected/active THEN its background SHALL change to `bg-card-elevated`.

**Independent Test**: Render a CardItem with icon, title="Refrão", subtitle="1:30 – 2:10", and an action button; tap the action button — callback fires; verify border-radius, background, and touch target.

---

### P1: Slider Horizontal ⭐ MVP

**User Story**: As a musician, I want a horizontal slider with a thin track and a purple indicator so that I can adjust continuous values (e.g., BPM, volume) with familiar drag interaction.

**Why P1**: Slider is identified as a standard primitive in source spec §1.3 and will be used in B6 (Metrônomo BPM) and B5 (Modo Operador). Must exist before B5/B6.

**Acceptance Criteria**:

1. WHEN the Slider renders THEN it SHALL display a thin horizontal track with a filled indicator segment in `accent-primary`. *(REQ-DS-04 — "Slider horizontal: barra fina, indicador roxo preenchido")*
2. WHEN a user drags the slider thumb THEN it SHALL update its value continuously within the allowed `min`/`max` range.
3. WHEN the slider value changes THEN it SHALL invoke an `onChange` callback with the new numeric value.
4. WHEN the slider renders THEN it SHALL support keyboard interaction (arrow keys) for accessibility.
5. WHEN the slider renders THEN it SHALL use the border-radius `999px` token for the track and thumb. *(REQ-DS-02)*

**Independent Test**: Render a Slider with min=40 max=240, drag to 120 — callback receives 120; use arrow keys to increment/decrement; verify accent-primary fill and pill-shaped track/thumb.

---

### P1: Dial Circular (0–100%) ⭐ MVP

**User Story**: As a musician in the Modo Operador, I want to see a circular dial showing the progress of the current block (0–100%) so that I can see at a glance how much time remains in the block.

**Why P1**: The dial is the primary progress indicator in the Modo Operador (source spec §4.1) and is reused in the Modo TV (§4.4) and the Tuner display (§4.5). It must exist before B5 and B6.

**Acceptance Criteria**:

1. WHEN the Dial Circular renders THEN it SHALL display an SVG arc representing the current value from `0` to `100` (percent). *(REQ-DS-04 — "Dial circular: valor contínuo 0–100%")*
2. WHEN the value prop changes THEN the filled arc SHALL animate/transition to reflect the new value.
3. WHEN the dial renders with a value THEN it SHALL display the numeric value as centered text inside the arc (e.g., `75%`).
4. WHEN the dial renders THEN the arc color SHALL be `accent-primary` and the background track SHALL be `bg-card`. *(Source spec §1.3)*
5. WHEN the dial renders THEN it SHALL accept an optional `size` prop controlling the SVG dimensions (default: a sensible size like `120px`).
6. WHEN the dial renders THEN it SHALL accept an optional `label` prop displayed above the numeric value.

**Independent Test**: Render a DialCircular with value=60; verify the arc fills 60%, the number "60%" is centered, arc is accent-primary, track is bg-card.

---

### P1: Bottom Nav em Pill Flutuante ⭐ MVP

**User Story**: As a musician on the Mobile PWA, I want a floating pill-shaped bottom navigation bar with 4–5 icon items so that I can switch between Início, Repertório, Escala, and Perfil with one hand.

**Why P1**: This is the primary mobile navigation structure (source spec §1.3, §6.2). Although the B7 block owns the full shell/layout, the bottom nav *primitive component* (the pill-shaped container with icon items and active highlighting) belongs in the shared design system because its visual pattern may also be reused within the Modo Operador's nav (§4.1). The layout integration (routing, visibility) stays in B7.

**Acceptance Criteria**:

1. WHEN the Bottom Nav renders THEN it SHALL display as a floating pill-shaped container with `border-radius: 999px` and `bg-card-elevated` background. *(REQ-DS-04 — "Bottom nav em pill flutuante: 4–5 ícones, fundo escuro arredondado")*
2. WHEN an item is active THEN its icon SHALL be highlighted in `accent-primary`; inactive items SHALL use `text-secondary`. *(Source spec §6.2 — "ícone ativo destacado em accent-primary")*
3. WHEN a user taps an item THEN it SHALL invoke an `onSelect` callback with the item's identifier.
4. WHEN the Bottom Nav renders THEN each item SHALL have a minimum touch target of `44×44px`. *(REQ-DS-03)*
5. WHEN the Bottom Nav renders THEN it SHALL accept an `items` prop (array of `{id, icon, label}`) and an `activeId` prop.

**Independent Test**: Render a BottomNavPill with 4 items, activeId="home"; verify home icon is accent-primary, others are text-secondary; tap "repertorio" — callback receives "repertorio"; verify pill shape, bg-card-elevated, touch targets.

---

### P1: Avatar Circular com Badge de Notificação ⭐ MVP

**User Story**: As a leader, I want to see a circular avatar with a colored notification badge so that I can quickly identify who has pending actions.

**Why P1**: Avatar with badge is listed as a standard primitive (source spec §1.3) and is used in B7 (sidebar footer, topbar) and B1 (user profile). Must exist before B1/B7.

**Acceptance Criteria**:

1. WHEN the Avatar renders with an `src` prop (image URL) THEN it SHALL display the image inside a circular container. *(REQ-DS-04 — "Avatar circular com badge de notificação")*
2. WHEN the Avatar renders without an `src` prop but with a `fallback` prop THEN it SHALL display the fallback initials inside the circular container with `accent-primary` background and white text.
3. WHEN the Avatar renders with `badge: true` THEN it SHALL display a small colored dot (badge) positioned at the top-right of the circle. The badge color SHALL default to `danger` and accept an optional `badgeColor` prop. *(Source spec §1.3 — "ponto colorido")*
4. WHEN the Avatar renders THEN its container SHALL be circular (`border-radius: 999px`). *(REQ-DS-02)*
5. WHEN the Avatar renders THEN it SHALL accept a `size` prop (default: `40px`).

**Independent Test**: Render an Avatar with src="user.jpg" and badge=true; verify circular shape, badge dot at top-right in danger color. Render Avatar with fallback="ML"; verify initials displayed with accent-primary bg.

---

### P1: Circular Icon Button ⭐ MVP

**User Story**: As a developer, I want a reusable circular icon button with a dark elevated background and a white icon so that I can place contextual action buttons throughout the UI consistently.

**Why P1**: Circular icon button is a fundamental building block (REQ-DS-03) used inside the Card de Item and standalone throughout the app. It must exist before the Card de Item.

**Acceptance Criteria**:

1. WHEN the Circular Icon Button renders THEN it SHALL have a circular background of `bg-card-elevated` color. *(REQ-DS-03 — "fundo bg-card-elevated")*
2. WHEN the button renders THEN the icon SHALL be rendered in white (`text-primary`). *(REQ-DS-03 — "ícone branco")*
3. WHEN the button renders THEN its touch target SHALL be at minimum `44×44px`. *(REQ-DS-03 — "área de toque mínima 44×44px")*
4. WHEN a user taps/clicks the button THEN it SHALL invoke an `onClick` callback.
5. WHEN the button renders THEN it SHALL accept an `icon` prop (React node) and an optional `aria-label` prop for accessibility.
6. WHEN the button renders THEN it SHALL accept an optional `disabled` prop; when disabled, the button SHALL reduce opacity and not invoke the callback.

**Independent Test**: Render a CircularIconButton with a settings icon; verify bg-card-elevated background, white icon, 44×44px touch target, and that clicking fires the callback. Render with disabled=true — verify reduced opacity and no callback.

---

### P1: Shared Component Layer — No Duplication ⭐ MVP

**User Story**: As a developer, I want all content components (cards, pills, dial) to live in a shared directory consumed by both web and mobile routes, with shell/layout components isolated by platform, so that the codebase has zero duplication of content components.

**Why P1**: This is the architectural contract of REQ-DS-05. Without it, the shared layer promise is unenforced and components will drift.

**Acceptance Criteria**:

1. WHEN a developer imports a shared content component (PillToggle, CardItem, DialCircular, SliderHorizontal, BottomNavPill, AvatarCircular, CircularIconButton) THEN the import SHALL resolve from `components/shared/` — never from `web/` or `mobile/` directories. *(REQ-DS-05)*
2. WHEN the codebase is searched for component files matching the shared component names under `web/` or `mobile/` directories THEN no duplicates SHALL be found. *(REQ-DS-05 AC — "nenhum componente de card/pill/dial duplicado")*
3. WHEN the barrel export file (`components/shared/index.ts`) is imported THEN it SHALL re-export every shared component.
4. WHEN a new shared component is added to the `components/shared/` directory THEN it SHALL be added to the barrel export within the same task.

**Independent Test**: Run `grep -r "CardItem\|PillToggle\|DialCircular\|SliderHorizontal\|BottomNavPill\|AvatarCircular\|CircularIconButton" web/ mobile/` — returns zero matches (excluding imports that point to `components/shared/`).

---

## Edge Cases

- WHEN a token value is set to an empty string or undefined THEN the component using it SHALL fall back to a sensible default (not crash).
- WHEN the Dial Circular receives a value below 0 THEN it SHALL clamp to 0; WHEN it receives a value above 100 THEN it SHALL clamp to 100.
- WHEN the Slider receives an inverted range (min > max) THEN the component SHALL throw a descriptive error in development mode.
- WHEN the Avatar receives an invalid `src` URL (image fails to load) THEN it SHALL fall back to the `fallback` initials display.
- WHEN the Pill Toggle receives zero options THEN it SHALL render nothing (empty state, no crash).
- WHEN the Bottom Nav is rendered with 0 items THEN it SHALL render nothing (no empty floating pill).
- WHEN the Circular Icon Button is focused via keyboard THEN it SHALL display a visible focus ring for accessibility.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| DS-01 | P1: Design Tokens | Tokens | Pending |
| DS-02 | P1: Design Tokens | Tokens | Pending |
| DS-03 | P1: Circular Icon Button | Components | Pending |
| DS-04 | P1: Pill Toggle, Card de Item, Slider, Dial, Bottom Nav, Avatar | Components | Pending |
| DS-05 | P1: Shared Component Layer | Architecture | Pending |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Changing any token in the central file (e.g., `accent-primary` hex value) updates the rendered UI on both Web and Mobile routes without editing any component
- [ ] All 7 shared primitive components render correctly in isolation (Storybook or unit test) and in a sample page
- [ ] No duplicate content component files exist under `web/` or `mobile/` directories — `grep` confirms zero duplication
- [ ] Every shared component passes its acceptance criteria tests with zero skipped or deleted test cases
