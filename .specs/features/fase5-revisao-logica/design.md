# Fase 5 — Revisão de Lógica: Design

## Architecture Overview

### Migration Strategy (Dev/Test — Destructive)

Since this is a development/test environment with no real data, we will:
1. Modify both `schema.prisma` files in-place
2. Run `prisma db push` (not migrate) to sync the database
3. Update seed to use new schema
4. No backfill needed — tables are empty

### Schema Changes

**MinistryMember** (add fields from Musician):
```prisma
model MinistryMember {
  id                  String   @id @default(cuid())
  userId              String
  ministryId          String
  role                String   @default("musician")
  worshipRoles        String   @default("[]")
  instrument          String?
  isActiveInSchedule  Boolean  @default(true)
  timesServedThisMonth Int     @default(0)
  lastServedAt        String   @default("{}")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ministry Ministry @relation(fields: [ministryId], references: [id], onDelete: Cascade)
  assignments ServiceAssignment[]

  @@unique([userId, ministryId])
  @@index([ministryId, role])
}
```

**ServiceAssignment** (replace userId/musicianId with ministryMemberId):
```prisma
model ServiceAssignment {
  id               String   @id @default(cuid())
  scheduleId       String
  ministryMemberId String?
  role             String
  status           String   @default("confirmado")
  substitutionOf   String?
  confirmed        Boolean  @default(false)
  confirmedAt      DateTime?

  schedule       ServiceSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  ministryMember MinistryMember? @relation(fields: [ministryMemberId], references: [id])

  @@index([ministryMemberId, status])
  @@index([scheduleId, status])
}
```

**AvailabilityResponse** (add proper relations):
```prisma
model AvailabilityResponse {
  id          String   @id @default(cuid())
  cycleId     String
  ministryMemberId String
  sundayDate  DateTime
  available   Boolean
  respondedAt DateTime @default(now())

  cycle          MonthlyScheduleCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  ministryMember MinistryMember       @relation(fields: [ministryMemberId], references: [id], onDelete: Cascade)

  @@unique([cycleId, ministryMemberId, sundayDate])
}
```

**Musician** (remove entirely — drop model)

### Service Layer Changes

**cycleService.ts**: Replace `prisma.musician.findMany()` with `prisma.ministryMember.findMany()` filtered by `isActiveInSchedule: true`. The `MusicianCandidate` interface adapts to read from `ministryMember` fields.

**engine.ts**: Input type `Assignment` changes `musicianId` → `ministryMemberId`.

**substitutionService.ts**: Same pattern — read from `MinistryMember`, write `ministryMemberId` to `ServiceAssignment`.

**fairness.ts**: Input type `MusicianCandidate` reads from same field names (they're now on `MinistryMember`).

### API Route Changes

**ministries.ts**: Remove `schedulesRoutes` (the legacy manual schedule CRUD + assignments). Keep `ministriesRoutes` only (member listing, config).

**schedules.ts**: Already the real engine — update to reference `ministryMemberId` on `ServiceAssignment`.

### Frontend Architecture

```
/team -> TeamPage (new)
  └── TeamMemberList (list all MinistryMember)
      └── TeamMemberRow (inline editing: role, worshipRoles, isActiveInSchedule)
      └── TeamInviteButton (opens existing InviteManager)

/schedules -> ScheduleDashboard (existing, add button)
  └── GenerateCycleButton (new: POST /schedules/cycles)

/my-schedule -> MySchedule (existing, fix date + role display)

/settings -> SettingsPage (existing, add "Config. de Escala" tab)
  └── ScheduleConfigForm (new: MinistryConfig CRUD)

/layout -> Sidebar (existing, conditional by role)
```

All frontend components should use `impeccable` design skill for consistent styling matching the existing glassmorphism design system (bg `#0a0a0f`, accent `#3A86FF`/`#8338EC`, `bg-white/5`, `backdrop-filter`).

---

## Code Reuse Analysis

| Component | Location | How to Use |
|-----------|----------|------------|
| Input, Button, Select | `components/ui/` | Reuse existing UI primitives |
| MemberManagement | `components/settings/MemberManagement.tsx` | Reference for member listing pattern |
| InviteManager | `components/InviteManager.tsx` | Reuse as-is for invite flow |
| ScheduleDashboard | `pages/schedule/ScheduleDashboard.tsx` | Add GenerateCycleButton |
| Sidebar | `components/layout/Sidebar.tsx` | Add role filtering |
| MySchedule | `pages/schedule/MySchedule.tsx` | Fix date + role display |
| SettingsPage | `pages/settings/SettingsPage.tsx` | Add ScheduleConfigForm tab |

---

## WORSHIP_ROLES Shared Constant

Location: `apps/web/src/constants/worshipRoles.ts` (also imported by API seed)

```typescript
export const WORSHIP_ROLES = [
  { key: 'ministro_de_louvor', label: 'Ministro de Louvor' },
  { key: 'guitarra', label: 'Guitarra' },
  { key: 'baixo', label: 'Baixo' },
  { key: 'bateria', label: 'Bateria' },
  { key: 'teclado', label: 'Teclado' },
  { key: 'violao', label: 'Violão' },
  { key: 'vocalista', label: 'Vocalista' },
  { key: 'apoio_voz', label: 'Apoio de Voz' },
] as const;
```

---

## Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Migration tool | `prisma db push` | Dev/test env — no migration history needed |
| Schema source of truth | `apps/web/prisma/schema.prisma` | This is where prisma client generates from (check existing config) — both files identical, update both |
| Frontend constant location | `apps/web/src/constants/` | Shared between FE seed and API import — web is the consumer |
| Team page route | `/team` under Escalas group in sidebar | Per plan doc section 4 |
| Edit panel | Inline slide-over panel (not modal) | Per plan doc section 4.1 — painel lateral |
