# Fase 5 — Tasks

## Execution Protocol

Implement these tasks with the `tlc-spec-driven` skill. Each task = one atomic change. Sequential execution.

---

## Test Coverage Matrix

Guidelines found: none — strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|-----------|-------------------|---------------------|-----------------|-------------|
| Service | unit | All branches; 1:1 to spec ACs | `api/src/services/**/*.ts` | `npm run build:api` (tsc) |
| Route | build | Build gate only | `api/src/routes/**/*.ts` | `npm run build:api` |
| Schema | none | Build gate only | `prisma/schema.prisma` | `prisma db push` |
| Component | build | Build gate only | `web/src/**/*.tsx` | `npm run build:web` |

## Gate Check Commands

| Gate Level | When | Command |
|------------|------|---------|
| Build API | After backend tasks | `npm run build:api` (from root) |
| Build Web | After frontend tasks | `npm run build:web` (from root) |

---

## Execution Plan

### Phase 1: Foundation (no deps)
```
T1 → T2
```

### Phase 2: Schema Migration
```
T2 → T3 → T4 → T5 → T6
```

### Phase 3: Backend Services
```
T6 → T7 → T8 → T9 → T10 → T11 → T12
```

### Phase 4: Routes Cleanup & Fixes
```
T12 → T13 → T14 → T15
```

### Phase 5: Frontend
```
T15 → T16 → T17 → T18 → T19 → T20
```

### Phase 6: Review
```
T20 → Review
```

---

## Task Breakdown

### T1: Create WORSHIP_ROLES shared constant

**What**: Create shared constant with all worship roles (key + label in Portuguese)
**Where**: `apps/web/src/constants/worshipRoles.ts`
**Depends on**: None
**Done when**:
- [ ] File created with all 8 roles
- [ ] Types exported correctly
- [ ] Build passes

### T2: Update both schema.prisma files — MinistryMember

**What**: Add worshipRoles, instrument, isActiveInSchedule, timesServedThisMonth, lastServedAt to MinistryMember
**Where**: `apps/api/prisma/schema.prisma` + `prisma/schema.prisma`
**Depends on**: None
**Done when**:
- [ ] Both schema files updated identically
- [ ] Fields match design.md

### T3: Update schema — ServiceAssignment

**What**: Replace userId + musicianId with ministryMemberId in ServiceAssignment
**Where**: Both schema.prisma files
**Depends on**: T2
**Done when**:
- [ ] ministryMemberId field added
- [ ] userId and musicianId removed
- [ ] Relation to MinistryMember added
- [ ] Indexes updated

### T4: Update schema — AvailabilityResponse relations

**What**: Add proper @relation to MonthlyScheduleCycle and MinistryMember
**Where**: Both schema.prisma files
**Depends on**: T2
**Done when**:
- [ ] Relations added
- [ ] musicianId → ministryMemberId renamed
- [ ] Fields align with design.md

### T5: Remove Musician model from schema

**What**: Drop the Musician model entirely
**Where**: Both schema.prisma files
**Depends on**: T2, T3, T4
**Done when**:
- [ ] Musician model removed
- [ ] All references to Musician removed from schema
- [ ] User.ministryMembers relation updated

### T6: Run prisma db push + update seed

**What**: Push schema to database, update seed.ts to use new MinistryMember fields and WORSHIP_ROLES
**Where**: Both api/ and web/ prisma directories + `apps/api/prisma/seed.ts`
**Depends on**: T5
**Done when**:
- [ ] `prisma db push` succeeds for both schemas
- [ ] Seed compiles and uses new schema

### T7: Update fairness.ts types

**What**: Change MusicianCandidate to read from ministryMember fields
**Where**: `apps/api/src/services/scheduler/fairness.ts`
**Depends on**: T6
**Done when**:
- [ ] Interface updated (use ministryMember field names)
- [ ] Build passes

### T8: Update engine.ts types

**What**: Change Assignment.musicianId → Assignment.ministryMemberId
**Where**: `apps/api/src/services/scheduler/engine.ts`
**Depends on**: T7
**Done when**:
- [ ] Assignment interface updated
- [ ] Build passes

### T9: Update cycleService.ts

**What**: Replace all prisma.musician references with prisma.ministryMember, filter by isActiveInSchedule
**Where**: `apps/api/src/services/scheduler/cycleService.ts`
**Depends on**: T8
**Done when**:
- [ ] All musician.findMany → ministryMember.findMany
- [ ] Added isActiveInSchedule filter
- [ ] Fixed FK bug (createdById/userId receiving ministryId)
- [ ] Fixed GET /schedules/cycles/:cycleId/sundays filter
- [ ] Build passes

### T10: Update substitutionService.ts

**What**: Replace all prisma.musician references with prisma.ministryMember
**Where**: `apps/api/src/services/scheduler/substitutionService.ts`
**Depends on**: T9
**Done when**:
- [ ] All musician.findMany → ministryMember.findMany
- [ ] All musicianId → ministryMemberId in write operations
- [ ] Build passes

### T11: Update all API routes referencing prisma.musician

**What**: Search and replace all remaining prisma.musician.* calls across routes and services
**Where**: `apps/api/src/routes/*.ts`, `apps/api/src/services/*.ts`
**Depends on**: T10
**Done when**:
- [ ] All occurrences of prisma.musician updated to prisma.ministryMember
- [ ] Build passes

### T12: Remove legacy schedulesRoutes from ministries.ts

**What**: Remove schedulesRoutes export from ministries.ts and its registration in index.ts
**Where**: `apps/api/src/routes/ministries.ts`, `apps/api/src/index.ts`
**Depends on**: T11
**Done when**:
- [ ] schedulesRoutes removed from ministries.ts
- [ ] Registration line removed from index.ts
- [ ] Build passes

### T13: Fix my-assignments endpoint

**What**: Add date from ServiceSchedule parent to my-assignments response
**Where**: `apps/api/src/routes/schedules.ts` (my-assignments handler)
**Depends on**: T12
**Done when**:
- [ ] Response includes `date` from parent ServiceSchedule
- [ ] Response includes `roleLabel` from WORSHIP_ROLES
- [ ] Build passes

### T14: Create /team page

**What**: Build TeamPage with member list, inline editing, invite button
**Where**: `apps/web/src/pages/team/TeamPage.tsx` (new)
**Depends on**: T13
**Frontend skill**: Consult `impeccable` design skill for layout consistency
**Done when**:
- [ ] Page renders list of MinistryMember
- [ ] Inline edit for role, worshipRoles (multi-chip), isActiveInSchedule
- [ ] Paused members shown with reduced opacity
- [ ] Invite button opens InviteManager
- [ ] Route added to App router
- [ ] Build passes

### T15: Conditional Sidebar by role

**What**: Filter Sidebar nav items based on user.ministries[0].role
**Where**: `apps/web/src/components/layout/Sidebar.tsx`
**Depends on**: T14 (same scope — can parallel)
**Done when**:
- [ ] Admin/operator sees "Escalas" (gestão)
- [ ] Musician sees "Minha Escala"
- [ ] Build passes

### T16: GenerateCycleButton in ScheduleDashboard

**What**: Add "Gerar escala do mês" button calling POST /schedules/cycles
**Where**: `apps/web/src/pages/schedule/ScheduleDashboard.tsx`
**Depends on**: T14
**Done when**:
- [ ] Button visible for admin/operator
- [ ] Button disabled with tooltip when cycle exists
- [ ] On success, redirects to cycle
- [ ] Build passes

### T17: ScheduleConfigForm in Settings

**What**: Add "Configurações de Escala" tab in SettingsPage with MinistryConfig form
**Where**: `apps/web/src/pages/settings/SettingsPage.tsx` (new tab)
**Depends on**: T14
**Done when**:
- [ ] Tab visible only for admin
- [ ] Form with availabilityDeadlineDays, cycleTriggerDay, defaultFormation
- [ ] Saves via PUT /ministries/:id/config
- [ ] Build passes

### T18: Fix AssignmentCard Invalid Date + role display

**What**: Fix date parsing and role label in AssignmentCard and SundayCard
**Where**: `apps/web/src/components/schedule-user/AssignmentCard.tsx`
**Depends on**: T13, T14
**Done when**:
- [ ] Date displays correctly (from schedule.date)
- [ ] Role displays translated label from WORSHIP_ROLES
- [ ] Build passes

---

## Task Dependencies Summary

```
T1 ───────────────────────────────────────────────────────────────────────────────┐
T2 ─→ T3 ─→ T4 ─→ T5 ─→ T6 ─→ T7 ─→ T8 ─→ T9 ─→ T10 ─→ T11 ─→ T12 ─→ T13 ─→ T14 ─→ T16 ─→ T17
                                                                          └→ T15 ─→┘
                                                                          T14 ─→ T18

Phase 1: T1, T2 (parallel)
Phase 2: T3, T4 (parallel after T2) → T5 → T6
Phase 3: T7 → T8 → T9 → T10 → T11 → T12 → T13 (sequential, each depends on previous)
Phase 4: T14 (FE/team) + T15 (FE/sidebar) — parallel after T13
Phase 5: T16 (after T14), T17 (after T14)
Phase 6: T18 (after T13 + T14)
```
