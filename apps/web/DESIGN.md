# Design System: Floworship — Light Theme Implementation

## 1. Visual Theme & Atmosphere

**Vibe:** "Clean, modern worship ministry interface. Professional clarity with warm neutrality. The atmosphere is a well-lit studio space — white walls, natural light, lime green accents, zero visual clutter."

**Dials (from design-taste-frontend):**
- **DESIGN_VARIANCE: 7** — Asymmetric dashboard grids, split layouts, varied card elevations
- **MOTION_INTENSITY: 5** — Spring-physics micro-interactions, stagger reveals, no gratuitous loops
- **VISUAL_DENSITY: 5** — Comfortable data density, generous whitespace, monospace for metrics

**Color Strategy: Restrained** — Warm neutrals + single accent ≤10% surface area. Lime (#B8E844) carries all interactive focus.

---

## 2. Color Palette & Roles

### Light Theme (Production)
| Token | Hex | Role | Usage | Contrast WCAG |
|-------|-----|------|-------|---------------|
| **bg-primary** | `#F5F5F0` | Canvas | Body, page backgrounds (off-white warm) | ✓ (19.1:1 vs #0A0A0A) |
| **bg-secondary** | `#FFFFFF` | Elevated | **All cards**, surfaces | ✓ |
| **bg-tertiary** | `#E8E8E3` | Cards base | Inputs, subtle surfaces | ✓ (13.6:1 vs #0A0A0A) |
| **bg-card-white** | `#FFFFFF` | Highlight | Dashboard cards | ✓ |
| **bg-card-gray-light** | `#F0F0EB` | Secondary | Hover states | ✓ |
| **bg-card-gray-dark** | `#FFFFFF` | Standard | White (no dark cards in light theme) | ✓ |
| **bg-card-mint** | `#B8E844` | Accent card | Highlight cards, CTAs | ✓ (4.8:1 vs #0A0A0A) |
| **text-primary** | `#0A0A0A` | Headlines | H1–H3, primary buttons | ✓ (WCAG AAA) |
| **text-secondary** | `#0A0A0A` (70%) | Body | Paragraphs, labels, descriptions | ✓ (14.7:1 vs #FFF) |
| **text-tertiary** | `#0A0A0A` (50%) | Metadata | Timestamps, hints, placeholders | ✓ (10.5:1 vs #FFF) |
| **text-on-mint** | `#0A0A0A` | Inverted | Text on mint (#B8E844) | ✓ (4.8:1) |
| **border-subtle** | `#0A0A0A` (10%) | Dividers | Card borders | ✓ |
| **border-strong** | `#0A0A0A` (20%) | Focus | Active states | ✓ |
| **accent-mint** | `#B8E844` | Primary action | **Sidebar active**, buttons, badges | ✓ |
| **accent-mint-dim** | `rgba(184, 232, 68, 0.15)` | Hover/active | Button hover, card hover | ✓ |
| **success** | `#4CAF50` | Positive | Confirmed states | ✓ |
| **warning** | `#FFC107` | Caution | Pending states | ✓ |
| **danger** | `#F44336` | Destructive | Delete, errors | ✓ |
| **info** | `#2196F3` | Information | Links, info | ✓ |

**Sidebar Styling (Light Theme):**
- **Background**: `#0A0A0A` (preto absoluto)
- **Logo**: `bg-accent-mint` (#B8E844) + `text-[#0A0A0A]`
- **Active nav item**: `bg-white/15` + `text-white` + `border-accent-mint`
- **Inactive nav item**: `text-white/60` → `text-white/80` no hover
- **Border**: `border-white/10` sutil
- **Hover states**: `bg-white/10`

**Text Hierarchy (Light Theme):**
- **Primary**: `#0A0A0A` (100%) — Títulos, headings, texto principal
- **Secondary**: `#0A0A0A` (70% opacity) — Legendas, labels, descrições
- **Tertiary**: `#0A0A0A` (50% opacity) — Metadata, timestamps, hints

**Key Implementation Rules:**
1. Cards são **BRANCOS** (#FFFFFF) com borda sutil `border-[#0A0A0A]/10`
2. Sidebar é **PRETA** (#0A0A0A) com textos **BRANCOS** (opacidades: 60%, 80%, 100%)
3. Accent é **verde lima** (#B8E844) não menta
4. Background é **off-white warm** (#F5F5F0)
5. **Sem textos cinzas** — usar sempre `#0A0A0A` com opacity (50%, 70%, 100%)
  ✅ WCAG AA (body text ≥ 4.5:1, large text ≥ 3:1)
  ✅ WCAG AAA onde viável (≥ 7:1)
  ✅ Functional contrast acima de 1.5:1 para divisores, states
- **Never**: gray text on gray background, `text-text-tertiary` sobre `bg-tertiary` (contrast >= 4.5 sempre garantido)

**Banned:** Pure `#000000` em cards (usar apenas no bg-primary dark), neon glows, purple/blue gradients, glassmorphism as default, oversaturated accents.

---

## 3. Typography Rules

| Role | Font | Size/Weight | Line Height | Tracking |
|------|------|-------------|-------------|----------|
| **Display** | Geist Display / Satoshi | `clamp(2.5rem, 5vw, 4rem)` / 700 | 1.1 | -0.02em |
| **H1** | Geist / Satoshi | `clamp(1.75rem, 3vw, 2.5rem)` / 700 | 1.2 | -0.01em |
| **H2** | Geist / Satoshi | `clamp(1.375rem, 2.5vw, 1.75rem)` / 600 | 1.3 | 0 |
| **H3** | Geist / Satoshi | `1.125rem` / 600 | 1.4 | 0 |
| **Body** | Geist / Satoshi | `1rem` / 400 | 1.6 | 0 |
| **Body-sm** | Geist / Satoshi | `0.875rem` / 400 | 1.5 | 0 |
| **Label** | Geist / Satoshi | `0.875rem` / 500 | 1.4 | 0.01em |
| **Mono** | Geist Mono / JetBrains Mono | `0.875rem` / 400 | 1.5 | 0 |
| **Button** | Geist / Satoshi | `0.875rem` / 500 | 1 | 0.02em |

**Constraints:**
- Max line length: 65ch for body, 45ch for captions
- `text-wrap: balance` on H1–H3
- `text-wrap: pretty` on long prose
- **No Inter** as default (ban from design-taste-frontend)
- **No serif** in dashboard/software UI (ban from stitch-design-taste)

---

## 4. Component Stylings

### Buttons
| Variant | Background | Text | Border | Hover | Active | Focus Ring |
|---------|------------|------|--------|-------|--------|------------|
| **primary** | `accent-mint` | `text-on-mint` | none | `opacity-90` | `scale-[0.97]` | `accent-mint` |
| **ghost** | transparent | `accent-mint` | `1px solid accent-mint` | `accent-mint-dim` | `scale-[0.97]` | `accent-mint` |
| **danger** | `danger/15` | `danger` | `1px solid danger/30` | `danger/25` | `scale-[0.97]` | `danger` |
| **subtle** | `bg-tertiary` | `text-secondary` | `1px solid border-subtle` | `border-strong` | `scale-[0.97]` | `accent-mint` |

**Sizes:** `sm` (px-3 py-1.5), `md` (px-4 py-2), `lg` (px-6 py-3)
**Transition:** `transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 200ms ease-out`

### Cards (4 Variants Only)
| Variant | Background | Border | Use Case |
|---------|------------|--------|----------|
| **white** | `#FFFFFF` | `1px solid #E0E0E0` | Single featured card per view (CTA, hero metric) |
| **gray-light** | `#E0E0E0` | `1px solid #CCCCCC` | Secondary content, empty states |
| **gray-dark** | `#2D2D2D` | `1px solid #333333` | Default — most dashboard cards |
| **mint** | `#21F1A8` | none | **One per view max** — primary highlight |

**Shared:** `rounded-2xl`, `transition: transform 200ms ease-out, box-shadow 200ms ease-out`
**Hover (gray variants):** `translateY(-2px)`, `box-shadow: 0 8px 24px rgba(33,241,168,0.08)`
**No nested cards. No glass/aurora/gradient variants.**

### Inputs & Form Controls
- **Label:** Above input, `text-secondary`, `font-medium`
- **Input bg:** `bg-tertiary`, border `border-subtle`
- **Placeholder:** `text-tertiary` (must pass 4.5:1 on `bg-tertiary`)
- **Focus:** `border-accent-mint`, `ring-2 ring-accent-mint/30`, `outline-none`
- **Error:** `border-danger`, `ring-danger/30`, helper text `text-danger`
- **Checkbox/Radio:** 
  - Unchecked: `bg-tertiary`, `border-border-strong`, `text-transparent`
  - Checked: `bg-accent-mint`, `border-accent-mint`, `check-icon: text-on-mint`
  - Focus: `ring-2 ring-accent-mint/30`
  - **Label text:** `text-secondary` (not white on white)

### Sidebar
- **Background:** `bg-secondary` (`#1A1A1A`)
- **Logo:** Gradient removed → `bg-accent-mint` with `text-on-mint` icon
- **Nav item (inactive):** `text-tertiary`, hover `text-secondary`, `bg-tertiary`
- **Nav item (active):** `bg-accent-mint/15`, `text-accent-mint`, `border-l-2 border-accent-mint`
- **Divider:** `border-subtle`
- **Logout:** Same as inactive, `text-tertiary`

### Dashboard Grid
```css
/* Desktop: 6-col base, auto-fit cards */
.grid-dashboard {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1.5rem; /* 24px */
}

/* Card spans defined per component */
.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.col-span-4 { grid-column: span 4; }
.col-span-6 { grid-column: span 6; }

/* Tablet: 2-col */
@media (max-width: 1024px) {
  .grid-dashboard { grid-template-columns: repeat(2, 1fr); }
  .col-span-* { grid-column: span 2; }
}

/* Mobile: 1-col */
@media (max-width: 640px) {
  .grid-dashboard { grid-template-columns: 1fr; }
  .col-span-* { grid-column: span 1; }
}
```

---

## 5. Layout Principles

- **CSS Grid over Flexbox math** — Never `calc()` percentage hacks
- **Container max-width:** `1400px` centered (`max-w-[1400px] mx-auto`)
- **Full-height sections:** `min-h-[100dvh]` (never `h-screen` — iOS Safari jump)
- **Spacing rhythm:** Base unit `4px` (Tailwind `1` = `4px`). Section gaps: `clamp(1.5rem, 4vw, 3rem)`
- **Z-index scale:** `dropdown: 40`, `sticky: 50`, `modal-backdrop: 60`, `modal: 70`, `toast: 80`, `tooltip: 90`
- **No overlapping elements** — Every element owns its spatial zone

---

## 6. Motion & Interaction (Emil Kowalski Philosophy)

**Easing Curves (CSS Variables):**
```css
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* UI interactions */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* On-screen movement */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* Drawers/sheets */
}
```

**Durations:**
- Button press: `160ms`
- Tooltip/small popover: `125-200ms`
- Dropdown/select: `150-250ms`
- Modal/drawer: `200-500ms`
- **Max UI animation: 300ms**

**Patterns:**
- **Enter:** `transform: scale(0.95); opacity: 0` → `scale(1); opacity: 1` (never `scale(0)`)
- **Popover origin:** `transform-origin: var(--radix-popover-content-transform-origin)` (not center)
- **Checkbox reveal:** `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` (not scale)
- **Stagger:** `30-80ms` delay between items (Motion `staggerChildren`)
- **Hardware acceleration:** Animate ONLY `transform` + `opacity`. Use `transform: "translateX()"` not `x` in Framer Motion.

**Reduced Motion (Mandatory):**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .stagger-item { opacity: 1; transform: none; }
}
```

**Hover Gates:**
```css
@media (hover: hover) and (pointer: fine) {
  .card:hover { transform: translateY(-2px); }
  .btn:hover { background-color: var(--hover-bg); }
}
```

---

## 7. Anti-Patterns (Explicit Bans)

| Pattern | Ban Level | Replacement |
|---------|-----------|-------------|
| `bg-gradient-135` / Aurora backgrounds | **HARD** | Solid `bg-tertiary` or `bg-card-*` variants |
| Glassmorphism (`backdrop-blur`, `bg-white/10`) | **HARD** | Elevated surfaces with borders |
| `scale(0)` enter animations | **HARD** | `scale(0.95) + opacity` |
| `ease-in` on UI elements | **HARD** | `--ease-out` |
| `transition: all` | **HARD** | Explicit properties |
| Centered hero layouts (variance > 4) | **HARD** | Split/asymmetric |
| 3-column equal card grids | **HARD** | Auto-fit grid with varied spans |
| Pure `#000000` backgrounds | **HARD** | `#171717` (`bg-primary`) |
| Neon/outer glows (`shadow-blue-500/40`) | **HARD** | Inner borders, tinted shadows |
| Inter font as default | **HARD** | Geist / Satoshi |
| Generic serif fonts | **HARD** | Sans-only in software UI |
| Placeholder-as-label | **HARD** | Label above input |
| Hardcoded colors in components | **HARD** | Design tokens only |
| `h-screen` for full height | **HARD** | `min-h-[100dvh]` |
| `z-50` / arbitrary z-index | **HARD** | Semantic scale |
| Emojis in UI | **HARD** | Lucide/Phosphor icons |
| AI copy clichés ("Elevate", "Seamless") | **HARD** | Plain functional copy |

---

## 8. Screen Mapping by Role

### Admin Screens (canManage = true)
| Route | Layout | Key Components |
|-------|--------|----------------|
| `/dashboard` | DashboardLayout + Sidebar | DashboardNew (grid-dashboard), all dashboard cards |
| `/library` | DashboardLayout + Sidebar | SongList, SongForm, SongDetail |
| `/library/new` | DashboardLayout + Sidebar | SongForm |
| `/library/:id` | DashboardLayout + Sidebar | SongDetail |
| `/schedules` | DashboardLayout + Sidebar | ScheduleDashboard (admin), SundayCard |
| `/schedules/admin` | DashboardLayout + Sidebar | ScheduleDashboard (admin) |
| `/my-schedule` | DashboardLayout + Sidebar | MySchedule, AssignmentCard |
| `/team` | DashboardLayout + Sidebar | TeamPage |
| `/session` | DashboardLayout + Sidebar | SessionLanding, SessionCard |
| `/session/:id/*` | Performance layouts | ModoOperador, ModoLetra, ModoCifra, ModoTV |
| `/chat` | DashboardLayout + Sidebar | ChatPage |
| `/settings` | DashboardLayout + Sidebar | SettingsPage (all tabs) |
| `/profile` | DashboardLayout + Sidebar | ProfilePage |

### Musician Screens (isMusician = true)
| Route | Layout | Key Components |
|-------|--------|----------------|
| `/dashboard` | MusicianLayout | DashboardNew (mobile-optimized grid) |
| `/library` | MusicianLayout | SongList, SongDetail |
| `/my-schedule` | MusicianLayout | MySchedule, AssignmentCardWithDetails |
| `/session` | MusicianLayout | SessionLanding |
| `/session/:id/*` | Performance layouts | ModoLetra, ModoCifra, ModoTV |
| `/profile` | MusicianLayout | ProfilePage |
| `/mobile` | MobileHome (legacy) | BottomNav, PlayerBar, MusicCard |

### Shared / Auth
| Route | Layout | Notes |
|-------|--------|-------|
| `/login` | Standalone | LoginPage — no sidebar, centered card |
| `/select-ministry` | Standalone | MinistrySelector |
| `/invite/:token` | Standalone | InviteAcceptPage |

---

## 9. Implementation Phases

### Phase 1: Foundation (Tokens + Theme Context)
1. Update `index.css` @theme with new palette
2. Rewrite `ThemeContext.tsx` to apply CSS variables dynamically
3. Create `theme-tokens.ts` for TypeScript access

### Phase 2: Core UI Components
1. `Button.tsx` — New variants, mint accent
2. `Card.tsx` — 4 variants only, remove glass/aurora/gradient
3. `Input.tsx` — Contrast fixes, new tokens, checkbox/radio overhaul
4. `Sidebar.tsx` — New visual, token-based
5. `SettingsTabs.tsx` — Mint active state

### Phase 3: Layout & Background
1. Replace `AuroraBackground.tsx` → `Background.tsx` (solid `bg-primary` + optional subtle pattern)
2. Update `AppShell.tsx` to use new Background
3. Update `DashboardLayout.tsx`, `MusicianLayout.tsx`

### Phase 4: Dashboard Cards (All)
1. `NextServiceCard.tsx` — gradient→mint variant
2. `QuickActionsGrid.tsx` — glass→gray-dark, icon colors via tokens
3. `PendingConfirmationsCard`, `MusiciansCountCard`, `RepertoireStatsCard`
4. `UpcomingServicesList`, `CycleStatusWidget`, `RecentActivityTimeline`
5. `SkeletonCard` — match new card variants

### Phase 5: Settings & Admin Pages
1. All settings components (MemberManagement, MusicianManagement, etc.)
2. `ScheduleDashboard.tsx` + `ScheduleDashboard.css` — full token migration
3. `SundayCard.tsx`, `CycleStatus.tsx`, `AvailabilityForm.tsx`, `SwapDialog.tsx`

### Phase 6: Musician & Mobile
1. `MobileHome.tsx` — remove AuroraBackground
2. `BottomNav.tsx`, `PlayerBar.tsx`, `MusicCard.tsx`
3. Performance modes (ModoOperador, ModoLetra, ModoCifra, ModoTV)

### Phase 7: Profile, Chat, Session
1. Profile components (AvailabilityCycle, DistributionChart, etc.)
2. Chat components (ConversationList, MessageBubble, MessageInput)
3. Session components (SessionCard, WebSocketStatus)

### Phase 8: Polish & Validation
1. Contrast audit (all text ≥4.5:1, placeholders ≥4.5:1)
2. Focus-visible audit (all interactive elements)
3. Reduced-motion audit
4. Mobile viewport audit (`100dvh`, touch targets 44px)
5. Lighthouse CI (LCP, CLS, INP)

---

## 10. Acceptance Criteria

- [ ] Zero hardcoded colors in any `.tsx` file (all via Tailwind tokens)
- [ ] Zero `AuroraBackground` imports
- [ ] Zero `glass`/`aurora`/`gradient` Card variants in use
- [ ] All checkboxes/radios pass WCAG AA contrast in both states
- [ ] Dashboard grid responsive: 6-col → 2-col → 1-col
- [ ] Single mint accent card per dashboard view
- [ ] Theme toggle persists + respects `prefers-color-scheme`
- [ ] All animations ≤300ms, `--ease-out`, respect reduced-motion
- [ ] Lighthouse: Contrast 100, CLS <0.1, LCP <2.5s