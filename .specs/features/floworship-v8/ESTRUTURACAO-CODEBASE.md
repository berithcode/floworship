# Estruturação do Codebase — Floworship V8

## Árvore Genealógica do Projeto

Documento gerado em 2026-07-02 após varredura completa do codebase contra as specs originais (b0-b10, dashboard-musical).

---

## 1. Design System (B0) — ✅ COMPLETO

```
components/ui/
├── AuroraBackground.tsx    (78 linhas) — Imutável
├── Button.tsx              (116 linhas) — Imutável
├── Card.tsx                (105 linhas) — Imutável
├── Input.tsx               (94 linhas) — Imutável
└── SidebarItem.tsx         (26 linhas) — Imutável
```

**Status:** Nenhum componente base precisa ser criado ou modificado.

---

## 2. Autenticação (B1) — ✅ COMPLETO

```
pages/auth/
└── LoginPage.tsx (218 linhas) — Split-screen com AuroraBackground

api/routes/auth.ts     (363 linhas) — Login, register, refresh, logout
api/services/auth/     — service.ts, helpers.ts, utils.ts
api/middleware/auth.ts (79 linhas) — JWT middleware
api/middleware/rbac.ts (35 linhas) — Role-based access
```

**Status:** Login funcional com Google OAuth, toggle login/register, RBAC middleware.

---

## 3. Navegação (B7) — ✅ COMPLETO

```
components/layout/
├── WebLayout.tsx      (17 linhas) — Shell: Sidebar + Topbar + Content
├── Sidebar.tsx        (104 linhas) — 6 grupos de navegação + collapse
├── Topbar.tsx         (23 linhas) — Título reativo + busca + notificações
├── SearchModal.tsx    (55 linhas) — Cmd+K com resultados agrupados
└── PageHeader.tsx     (22 linhas) — Título + descrição + ação

components/mobile/
├── BottomNav.tsx          (81 linhas) — Floating pill 4 itens
├── SessionTakeoverCard.tsx (14 linhas) — Card de sessão ativa
├── TakeoverLayout.tsx     (28 linhas) — Full-screen takeover
├── MusicCard.tsx          (46 linhas) — Card de música
└── PlayerBar.tsx          (116 linhas) — Player de áudio

config/routes.ts       (60 linhas) — 20 rotas definidas como constantes
hooks/useNavigation.ts (16 linhas) — Hook de navegação ativa
```

**Status:** Navegação web e mobile completa.

---

## 4. Biblioteca de Músicas (B3) — ⚠️ PARCIAL

### Páginas — ✅ COMPLETO

```
pages/library/
├── SongList.tsx     (98 linhas) — Lista com search/filter/status
├── SongDetail.tsx   (132 linhas) — 4 tabs: Info, Cue Editor, History, Estudar
└── NewSong.tsx      (32 linhas) — Formulário de criação

hooks/useSongs.ts    (75 linhas) — Hook com CRUD + estado
components/library/
└── SongForm.tsx     (122 linhas) — Form com validação
```

### Componentes Faltantes — ❌ 5 itens

```
components/library/cue-editor/
├── WaveformEditor.tsx    ❌ — Placeholder "coming in T4-T6" no SongDetail
├── BlockManager.tsx      ❌ — Placeholder inline
├── CueSheetEditor.tsx    ❌ — Placeholder inline
└── ChordProPreview.tsx   ❌ — Placeholder inline

components/library/
└── SongHistory.tsx       ❌ — Placeholder "coming in T9" no SongDetail
```

### Serviços — ✅ COMPLETO (unificado)

```
services/chordpro/parser.ts (72 linhas) — parseChordPro + renderCifra + renderLetra + transpose
```

**API Backend — ✅ COMPLETO**

```
api/routes/songs.ts (188 linhas)
├── GET  /songs               — Listar (filtro por ministry)
├── GET  /songs/:id           — Buscar por ID
├── POST /songs               — Criar (403 se musician)
├── PUT  /songs/:id           — Atualizar (403 se musician)
├── DELETE /songs/:id         — Soft-delete (arquivar)
├── POST /songs/:id/cue-sheet — Upsert cue sheet com blocks
└── GET  /songs/:id/cue-sheet — Buscar cue sheet

api/middleware/rbac.ts        — Role-based access control
```

---

## 5. Repertório (B8) — ⚠️ PARCIAL

### API — ✅ COMPLETO

```
api/routes/repertoire.ts (62 linhas)
├── GET    /schedules/:id/repertoire          — Listar itens
├── POST   /schedules/:id/repertoire          — Adicionar música
├── DELETE /schedules/:id/repertoire/:itemId  — Remover
├── PATCH  /schedules/:id/repertoire/reorder  — Reordenar
└── PATCH  /schedules/:id/repertoire/:itemId  — Atualizar metadata

api/services/repertoire.ts  (66 linhas) — CRUD service
api/services/permission.ts  (20 linhas) — Scoped permissions
```

### Componentes Faltantes — ❌ 1 item

```
components/repertoire/
└── RepertoireList.tsx ❌ — Drag-and-drop reorder UI
```

**Nota:** Nenhuma página de repertório existe como rota separada — a gestão de repertório é feita via API e integrada ao ScheduleDashboard.

---

## 6. Escalas (B9) — ⚠️ PARCIAL

### Schema — ✅ COMPLETO

```
prisma/schema.prisma
├── MonthlyScheduleCycle — Ciclo mensal (coletando/gerando/aprovando/publicada)
├── ServiceSchedule      — Agenda de cultos
├── ServiceAssignment    — Alocações de músicos
├── Musician             — Músicos com instrumento/worshipRoles
├── MinistryConfig       — Configurações por ministério
└── ServiceRepertoireItem — Itens do repertório
```

### Serviços — ✅ COMPLETO

```
api/services/scheduler/
├── fairness.ts             (23 linhas) — Fairness score
├── engine.ts               (45 linhas) — Algoritmo greedy
├── cycleService.ts         (114 linhas) — Ciclo de vida
├── substitutionService.ts  (83 linhas) — Substituições
└── configService.ts        (39 linhas) — Config por ministério
```

### API — ✅ COMPLETO

```
api/routes/schedules.ts (50 linhas)
├── GET  /schedules/cycles/:cycleId          — Status do ciclo
├── GET  /schedules/cycles/:cycleId/sundays  — Domingos do ciclo
├── POST /schedules/cycles                   — Criar ciclo
├── POST /schedules/cycles/:cycleId/close    — Fechar disponibilidade
├── POST /schedules/cycles/:cycleId/approve  — Aprovar
├── POST /schedules/cycles/:cycleId/publish  — Publicar
├── POST /schedules/swap                     — Troca manual
└── POST /schedules/substitution/:assignmentId — Substituição
```

### Páginas — ✅ COMPLETO

```
pages/admin/
└── ScheduleDashboard.tsx (58 linhas) — Dashboard de escalas

components/schedule/
└── SundayCard.tsx        (48 linhas) — Card expansível com slots
```

### Componentes Faltantes — ❌ 3 itens

```
components/schedule/
├── SwapDialog.tsx        ❌ — Dialog de troca manual
├── AvailabilityForm.tsx  ❌ — Formulário de disponibilidade
└── CycleStatus.tsx       ❌ — Indicador de status do ciclo
```

---

## 7. Dashboard Musical — ⚠️ PARCIAL

### Componentes — ✅ COMPLETO

```
components/dashboard/
├── NextServiceCard.tsx          (103 linhas) — Próximo culto
├── PendingConfirmationsCard.tsx (58 linhas)  — Confirmações pendentes
├── MusiciansCountCard.tsx       (53 linhas)  — Total de músicos
├── RepertoireStatsCard.tsx      (59 linhas)  — Status repertório
├── CycleStatusWidget.tsx        (86 linhas)  — Widget de ciclo
├── UpcomingServicesList.tsx     (88 linhas)  — Lista de cultos
├── QuickActionsGrid.tsx         (46 linhas)  — Ações rápidas
├── RecentActivityTimeline.tsx   (82 linhas)  — Timeline atividade
├── SkeletonCard.tsx             (18 linhas)  — Loading state
├── DashboardHeader.tsx          (41 linhas)  — Header do dashboard
├── MetricsGrid.tsx              (100 linhas) — Grid de métricas (legado)
├── CashFlowChart.tsx            (100 linhas) — Gráfico (legado)
└── RecentActivities.tsx         (126 linhas) — Atividades (legado)
```

### Páginas — ✅ COMPLETO

```
pages/dashboard/
├── DashboardNew.tsx      (115 linhas) — Dashboard principal
├── Dashboard.tsx         (53 linhas)  — Dashboard legado
└── MinistrySelector.tsx  (106 linhas) — Seletor de ministério
```

### API — ✅ COMPLETO

```
api/routes/dashboard.ts (282 linhas)
├── GET /dashboard/metrics             — Métricas agregadas
├── GET /dashboard/upcoming-services   — Próximos cultos
├── GET /dashboard/repertoire-stats    — Stats repertório
└── GET /dashboard/recent-activity     — Timeline atividade
```

### Integração — ❌ CONEXÃO

```
hooks/useDashboardMetrics.ts (126 linhas)
└── USE_MOCKS = true  →  DEVERIA SER false
```

**Nota:** Os componentes financeiros legados (MetricsGrid, CashFlowChart, RecentActivities) não são mais importados em lugar nenhum após a refatoração do DashboardNew.tsx.

---

## 8. Estudo (B6) — ✅ COMPLETO

```
pages/study/
└── StudyMode.tsx (19 linhas) — Página de estudo com afinador + metrônomo

components/study/
├── TunerPlaceholder.tsx      (18 linhas) — DialCircular estático
└── MetronomePlaceholder.tsx  (31 linhas) — Slider BPM + Play/Pause
```

**Nota:** Placeholders visuais — engines de áudio estão ADIADOS conforme spec.

---

## 9. Performance / Ao Vivo — ✅ COMPLETO

```
pages/performance/
├── ModoOperador.tsx (66 linhas) — Operador de sessão
├── ModoLetra.tsx    (38 linhas) — Letra mode
├── ModoCifra.tsx    (32 linhas) — Cifra mode
├── ModoTV.tsx       (26 linhas) — TV mode
└── SessionEnd.tsx   (16 linhas) — Fim de sessão

api/engine/          — State machine (programado, override, retomada, cancel-override)
api/routes/sessions/state.ts — Estado da sessão via WebSocket
api/websocket/server.ts — WebSocket server
```

---

## 10. WhatsApp (B10) — ✅ COMPLETO

```
api/routes/whatsappWebhook.ts (45 linhas) — Webhook handler
api/services/whatsapp/
├── metaCloudApi.ts      (76 linhas) — Meta Cloud API client
├── messageLogService.ts (39 linhas) — Log de mensagens
├── optInService.ts      (26 linhas) — Opt-in management
├── replyProcessor.ts    (40 linhas) — Processador de respostas
└── templates.ts         (56 linhas) — Templates
```

---

## 11. Offline / PWA — ✅ COMPLETO

```
src/offline/
├── dexie/db.ts   (64 linhas) — IndexedDB schema
├── queue/queue.ts (76 linhas) — Fila de operações offline
└── sync/sync.ts  (59 linhas) — Sincronização

src/platform/
├── standalone.ts  (10 linhas) — PWA standalone detection
└── wake-lock.ts   (28 linhas) — Screen wake lock
```

---

## 12. Galhos Desconectados — RESUMO

### Itens que EXISTEM mas não são integrados:

| Item | Localização | Problema |
|------|-------------|----------|
| `useDashboardMetrics` | `hooks/` | `USE_MOCKS = true` — dados mockados |
| `QuickActionsGrid` | `components/dashboard/` | Links para rotas que existem mas navegação não foi testada |
| `SongDetail → Cue Editor tab` | `pages/library/SongDetail.tsx` | Placeholder inline — sem componentes reais |
| `SongDetail → History tab` | `pages/library/SongDetail.tsx` | Placeholder inline — sem componente real |
| `SundayCard → Trocar btn` | `components/schedule/SundayCard.tsx` | Botão existe mas sem SwapDialog |

### Itens que NÃO EXISTEM (precisam ser criados):

| Item | Prioridade | Depende de | Estimativa |
|------|------------|------------|------------|
| `WaveformEditor.tsx` | Alta | `unionlib` wavesurfer.js | 4h |
| `BlockManager.tsx` | Alta | WaveformEditor | 3h |
| `CueSheetEditor.tsx` | Alta | BlockManager | 3h |
| `ChordProPreview.tsx` | Média | chordpro/parser.ts | 2h |
| `SongHistory.tsx` | Média | API pronta | 2h |
| `RepertoireList.tsx` | Média | `@dnd-kit/core` | 3h |
| `SwapDialog.tsx` | Média | SundayCard | 2h |
| `AvailabilityForm.tsx` | Baixa | — | 2h |
| `CycleStatus.tsx` | Baixa | — | 1h |
| `USE_MOCKS → false` | Média | — | 30min |

### Itens que SÃO SEGUROS (não tocar):

- `components/ui/*` — Design system (imutável)
- `components/layout/*` — Layout componentes (já funcionais)
- `api/routes/*` — Todas as rotas implementadas
- `api/services/*` — Todos os serviços implementados
- `prisma/schema.prisma` — Schema completo
- `pages/auth/*` — Login funcional
- `pages/performance/*` — Modos de sessão funcionais
- `pages/mobile/*` — Mobile navegação funcional

---

## 13. Plano de Ação

### Prioridade 1: Cue Editor (bloqueia funcionalidade de Biblioteca)
1. Criar `WaveformEditor.tsx` — integração wavesurfer.js
2. Criar `BlockManager.tsx` — gerenciamento de blocos
3. Criar `CueSheetEditor.tsx` — editor ChordPro + save
4. Atualizar `SongDetail.tsx` — remover placeholders

### Prioridade 2: Componentes de Escalas
5. Criar `SwapDialog.tsx` — troca manual de músicos
6. (Opcional) `CycleStatus.tsx`, `AvailabilityForm.tsx`

### Prioridade 3: Repertório
7. Criar `RepertoireList.tsx` — drag-and-drop

### Prioridade 4: Integração
8. `USE_MOCKS = false` no dashboard
9. Verificar navegação do QuickActionsGrid

---

## 14. Arquivos Órfãos (Legado)

| Arquivo | Status | Ação |
|---------|--------|------|
| `components/dashboard/MetricsGrid.tsx` | Não importado | Manter (pode ser útil) |
| `components/dashboard/CashFlowChart.tsx` | Não importado | Manter |
| `components/dashboard/RecentActivities.tsx` | Não importado | Manter |
| `pages/dashboard/Dashboard.tsx` | Possível entrada alternativa | Manter |
| `components/dashboard/DashboardHeader.tsx` | Importado no DashboardNew | Manter |

---

**Gerado em:** 2026-07-02  
**Próxima ação:** Iniciar implementação dos itens de Prioridade 1