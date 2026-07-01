# Navegação Web & Mobile (Shell) Specification

## Problem Statement

Floworship needs platform-specific navigation shells: a Web sidebar + topbar layout and a Mobile bottom nav + takeover pattern. The Web shell organizes all admin and content pages into a collapsible sidebar with a global search topbar. The Mobile shell uses a floating pill bottom nav for daily use, with a full-screen takeover when entering a live session. These shells wrap all content routes and handle the transition between normal browsing and live session mode. Without this block, there is no consistent way for users to navigate the application.

## Goals

- [ ] Web sidebar: fixed, grouped by section (Dashboard, Repertório, Escalas, Ao Vivo, Comunicação, Configurações); active item with accent bar; collapsible to icon-only mode *(REQ-NAV-01, REQ-NAV-02)*
- [ ] Web topbar: route title, global search (Cmd/Ctrl+K), notifications, avatar *(REQ-NAV-03)*
- [ ] Web page pattern: header with title + description + action; detail pages with tabs — never modals *(REQ-NAV-04)*
- [ ] Mobile daily bottom nav: floating pill with 4 items (Início, Repertório, Escala, Perfil); active icon in accent-primary *(REQ-NAV-05)*
- [ ] Mobile live session takeover: card on Home when session active; full-screen takeover on tap; bottom nav hidden *(REQ-NAV-06)*
- [ ] Session takeover: only exit is "sair da sessão" button with confirmation; no bottom nav *(REQ-NAV-07)*
- [ ] Study mode access: Repertório → Detalhe da Música → Estudar *(REQ-NAV-08)*

## Out of Scope

| Feature | Reason |
|---|---|
| Notification center implementation | Topbar shows bell icon; actual notifications handled elsewhere |
| Search results backend | Cmd/Ctrl+K UI shell only; search API belongs to respective feature blocks |
| Responsive breakpoint system | Not specified; layout uses platform detection (Web vs Mobile), not breakpoints |
| Deep linking / URL routing for all pages | Not specified for MVP |
| Keyboard navigation for sidebar | Nice-to-have; not in source spec §6 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Web sidebar component | Custom React component with Tailwind, consuming design tokens from B0 | Standard pattern; tokens ensure visual consistency. | n |
| Sidebar collapse state | Persisted in localStorage; defaults to expanded (240px) on first visit | User preference remembered across sessions. | n |
| Sidebar collapse animation | CSS transition (width + icon scaling) — 200ms ease | Smooth, lightweight, no animation library needed. | n |
| Topbar Cmd/Ctrl+K | `cmdk` library (pallets/cmdk) — composable command palette | Industry-standard for Cmd+K search; lightweight. | n |
| Mobile bottom nav | Fixed position at viewport bottom; pill shape with `bg-card-elevated` | Matches REQ-NAV-05 "pill flutuante". | n |
| Session takeover | React context + route; when session is active, Home shows the takeover card; tapping enters full-screen route | Standard React pattern for conditional UI. | n |
| Takeover exit | Confirmation dialog ("Tem certeza que deseja sair da sessão?"); on confirm, navigate to Home and disconnect from session | REQ-NAV-07: "botão discreto com confirmação". | n |
| Study mode route | `/repertoire/:songId/study` — accessed from song detail page | REQ-NAV-08 hierarchy. | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Web Sidebar ⭐ MVP

**User Story**: As an admin, I want a fixed sidebar grouping all sections (Dashboard, Repertório, Escalas, Ao Vivo, Comunicação, Configurações) so that I can quickly navigate to any part of the app.

**Why P1**: Primary navigation for all Web users; without it, there is no way to reach content pages.

**Acceptance Criteria**:

1. WHEN the Web app loads THEN the sidebar SHALL be visible, fixed on the left side, with grouped navigation items. *(REQ-NAV-01)*
2. WHEN a nav item is active THEN it SHALL have `bg-card-elevated` background + a 3px vertical bar in `accent-primary`. *(REQ-NAV-02)*
3. WHEN the user clicks the collapse toggle THEN the sidebar SHALL collapse to 64px width showing only icons; tooltips SHALL appear on hover. *(REQ-NAV-02)*
4. WHEN the sidebar is collapsed THEN navigation items SHALL show only their icon; when expanded, they SHALL show icon + label. *(REQ-NAV-02)*
5. WHEN the sidebar renders THEN it SHALL include a footer with the user's avatar/menu (profile, logout). *(REQ-NAV-01)*

**Independent Test**: Load Web app → sidebar visible with all sections → click item → active highlight appears → click collapse → sidebar shrinks to icons → hover → tooltip shows.

---

### P1: Web Topbar ⭐ MVP

**User Story**: As a user, I want a topbar showing the current page title, a global search (Cmd/Ctrl+K), notifications bell, and my avatar so that I can search and access notifications from anywhere.

**Why P1**: Persistent header for all Web pages; global search is a key UX feature.

**Acceptance Criteria**:

1. WHEN any page loads THEN the topbar SHALL display the current route title. *(REQ-NAV-03)*
2. WHEN the user presses Cmd+K (Mac) or Ctrl+K (Windows/Linux) THEN a search modal SHALL open with grouped results (songs, members, schedules). *(REQ-NAV-03)*
3. WHEN the topbar renders THEN it SHALL show a notifications bell icon and the user's avatar. *(REQ-NAV-03)*

**Independent Test**: Load Web app → topbar shows page title → press Cmd+K → search modal opens → type query → results grouped by type.

---

### P1: Web Page Pattern ⭐ MVP

**User Story**: As a developer, I want a consistent page layout (header + title + description + action) and detail pages as full pages with tabs so that the UI is predictable and accessible.

**Why P1**: REQ-NAV-04 defines the standard pattern; prevents modal-based detail views.

**Acceptance Criteria**:

1. WHEN a list page loads THEN it SHALL display: header with page title, description, and a primary action button (e.g., "Add Song"). *(REQ-NAV-04)*
2. WHEN a detail page loads (e.g., song detail) THEN it SHALL open as its own route/page with tabs — never as a modal. *(REQ-NAV-04)*
3. WHEN a detail page has tabs THEN tabs SHALL be styled as pill-shaped buttons within the page header area. *(Consistent with design system)*

**Independent Test**: Navigate to Library → list page with header + "Add Song" button → click song → navigates to `/songs/:id` (new page, not modal) → tabs visible.

---

### P1: Mobile Bottom Nav ⭐ MVP

**User Story**: As a musician on mobile, I want a floating pill-shaped bottom nav with 4 items so that I can navigate the app with one hand.

**Why P1**: Primary mobile navigation; reuses the BottomNavPill primitive from B0.

**Acceptance Criteria**:

1. WHEN the Mobile app loads (outside session) THEN a floating pill bottom nav SHALL appear at the bottom with 4 items: Início, Repertório, Escala, Perfil. *(REQ-NAV-05)*
2. WHEN an item is active THEN its icon SHALL be highlighted in `accent-primary`. *(REQ-NAV-05)*
3. WHEN a user taps an item THEN the app SHALL navigate to the corresponding route. *(REQ-NAV-05)*
4. WHEN the bottom nav renders THEN it SHALL reuse the BottomNavPill component from B0 (shared design system). *(REQ-DS-04)*

**Independent Test**: Load Mobile app → bottom nav visible with 4 items → tap "Repertório" → navigates to repertoire → "Repertório" icon highlighted.

---

### P1: Mobile Session Takeover ⭐ MVP

**User Story**: As a musician about to enter a live session, I want a card at the top of Home saying "You're scheduled today · Enter session" so that I can join the session with one tap.

**Why P1**: REQ-NAV-06 defines the session entry flow; critical for live performance UX.

**Acceptance Criteria**:

1. WHEN a session is active for the user's schedule today THEN a card SHALL appear at the top of the Home screen: "Você está na escala de hoje · Entrar na sessão". *(REQ-NAV-06)*
2. WHEN the user taps the session card THEN the app SHALL enter full-screen takeover mode (bottom nav disappears). *(REQ-NAV-06)*
3. WHEN in takeover mode THEN the user SHALL be directed to the Modo corresponding to their role (Operator → Modo Operador; Musician → Modo Letra/Cifra). *(REQ-NAV-06)*
4. WHEN in takeover mode THEN the ONLY way to exit is a discreet "sair da sessão" button with a confirmation dialog. *(REQ-NAV-07)*
5. WHEN the user confirms "sair da sessão" THEN the app SHALL return to the Home screen and the bottom nav SHALL reappear. *(REQ-NAV-07)*
6. WHEN in takeover mode THEN no bottom nav SHALL be visible. *(REQ-NAV-07)*

**Independent Test**: Load Mobile Home with active session → card visible → tap card → full-screen takeover → bottom nav hidden → tap "sair da sessão" → confirmation → returns to Home → bottom nav reappears.

---

### P1: Study Mode Access Path ⭐ MVP

**User Story**: As a musician, I want to access the tuner and metronome from a song's detail page so that I can practice that specific song.

**Why P1**: REQ-NAV-08 defines the hierarchy; integrates B6 (Study) into the navigation.

**Acceptance Criteria**:

1. WHEN a musician navigates to a song detail page (Repertório → Detalhe da Música) THEN there SHALL be an "Estudar" button/tab. *(REQ-NAV-08)*
2. WHEN "Estudar" is tapped THEN the Study Mode page SHALL load with tuner and metronome. *(REQ-NAV-08)*

**Independent Test**: Navigate to song detail → tap "Estudar" → Study Mode loads.

---

## Edge Cases

- WHEN the user has no active session today THEN no session card appears on Mobile Home.
- WHEN the user is already in takeover mode AND a new session starts THEN the takeover continues with the new session (no double-takeover).
- WHEN the sidebar is collapsed on Web AND the user navigates via topbar search THEN the sidebar SHALL remain collapsed (state is independent of navigation).
- WHEN the bottom nav covers content on Mobile THEN pages SHALL have bottom padding to prevent overlap.
- WHEN the user presses Cmd+K while in the search modal THEN the modal SHALL close (toggle behavior).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| NAV-01 | P1: Web Sidebar | Web Shell | Pending |
| NAV-02 | P1: Web Sidebar | Web Shell | Pending |
| NAV-03 | P1: Web Topbar | Web Shell | Pending |
| NAV-04 | P1: Web Page Pattern | Web Shell | Pending |
| NAV-05 | P1: Mobile Bottom Nav | Mobile Shell | Pending |
| NAV-06 | P1: Mobile Session Takeover | Mobile Shell | Pending |
| NAV-07 | P1: Mobile Session Takeover | Mobile Shell | Pending |
| NAV-08 | P1: Study Mode Access | Navigation | Pending |

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Web sidebar with grouped nav, active highlight, collapsible to icon-only mode
- [ ] Web topbar with route title, Cmd+K search, notifications, avatar
- [ ] Detail pages open as full pages with tabs — zero modals for content
- [ ] Mobile bottom nav with 4 items, floating pill shape, accent-primary active
- [ ] Session takeover: card on Home → full-screen → exit via discreet button with confirmation
- [ ] Study mode accessible from song detail → Estudar