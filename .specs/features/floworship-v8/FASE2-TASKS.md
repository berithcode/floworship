# Fase 2 - Plano de Implementação Detalhado

## Visão Geral

**Objetivo:** Completar todas as funcionalidades principais do Floworship V8 que estão faltando desde a especificação original.

**Duração Estimada:** 9 semanas (44 tasks)  
**Prioridade:** Alta  
**Status:** Especificação Completa

---

## Fase 2.1: Fundação - Navegação e Estudo (2 semanas)

### B7-T1: Criar WebLayout Component
**Semana:** 1  
**Dependências:** Nenhuma  
**Entregáveis:** `apps/web/src/components/layout/WebLayout.tsx`

**Done when:**
- [ ] Layout com Sidebar (240px) + Topbar + Content area
- [ ] Grupos de navegação definidos no sidebar
- [ ] Footer com avatar do usuário
- [ ] Build passa sem erros

---

### B7-T2: Criar Sidebar Component
**Semana:** 1  
**Dependências:** B7-T1  
**Entregáveis:** `apps/web/src/components/layout/Sidebar.tsx`

**Done when:**
- [ ] 6 grupos de navegação: Visão Geral, Repertório, Escalas, Ao Vivo, Comunicação, Configurações
- [ ] Item ativo com highlight (bg-card-elevated + barra 3px accent-primary)
- [ ] Sidebar colapsável para 64px (ícones apenas)
- [ ] Collapse persiste no localStorage
- [ ] Dropdown de usuário no footer (Perfil, Trocar Ministério, Sair)

---

### B7-T3: Criar Topbar Component
**Semana:** 1  
**Dependências:** B7-T1  
**Entregáveis:** `apps/web/src/components/layout/Topbar.tsx`

**Done when:**
- [ ] Título da rota atual (reativo ao router)
- [ ] Cmd/Ctrl+K trigger para busca
- [ ] Ícone de notificações com badge
- [ ] Avatar com dropdown
- [ ] Responsivo (título trunca em larguras pequenas)

---

### B7-T4: Sidebar Collapse/Expand
**Semana:** 1  
**Dependências:** B7-T2  
**Entregáveis:** `apps/web/src/components/layout/Sidebar.tsx` (modify)

**Done when:**
- [ ] Toggle button no final do sidebar
- [ ] Estado colapsado: 64px com ícones
- [ ] Tooltip no hover sobre ícones
- [ ] Transição CSS smooth
- [ ] Persistência localStorage

---

### B7-T5: Search Modal (Cmd+K)
**Semana:** 1  
**Dependências:** B7-T3  
**Entregáveis:** `apps/web/src/components/layout/SearchModal.tsx`

**Done when:**
- [ ] Abre com Cmd/Ctrl+K, fecha com Escape
- [ ] Auto-focus no input
- [ ] Resultados agrupados: Músicas, Membros, Escalas
- [ ] Navegação por teclado (setas + Enter)
- [ ] Click navega para página de detalhe
- [ ] Backdrop blur overlay

---

### B7-T6: Page Pattern Components
**Semana:** 1  
**Dependências:** B7-T1  
**Entregáveis:** 
- `apps/web/src/components/layout/PageHeader.tsx`
- `apps/web/src/components/layout/DetailPage.tsx`

**Done when:**
- [ ] PageHeader: título, descrição, botão de ação
- [ ] DetailPage: header + tabs navigation + content area
- [ ] Tabs atualizam URL (não modais)
- [ ] Componentes composáveis

---

### B7-T7: Navigation Hook & Routes
**Semana:** 1  
**Dependências:** B7-T1  
**Entregáveis:**
- `apps/web/src/hooks/useNavigation.ts`
- `apps/web/src/config/routes.ts`

**Done when:**
- [ ] routes.ts: todas as rotas como constantes tipadas
- [ ] useNavigation: active group, active item, breadcrumb
- [ ] Integração com React Router v6 useLocation
- [ ] Sidebar items mapeiam para route constants

---

### B7-T8: Mobile Bottom Nav
**Semana:** 2  
**Dependências:** B7-T7  
**Entregáveis:** `apps/web/src/components/mobile/BottomNav.tsx`

**Done when:**
- [ ] 4 items: Início, Repertório, Escala, Perfil
- [ ] Design floating pill (rounded, elevated)
- [ ] Ícone ativo em accent-primary
- [ ] Touch target 44×44px mínimo
- [ ] Tap navega para rota

---

### B7-T9: Session Takeover Card
**Semana:** 2  
**Dependências:** B7-T8  
**Entregáveis:** `apps/web/src/components/mobile/SessionTakeoverCard.tsx`

**Done when:**
- [ ] Card no topo do Home quando sessão ativa
- [ ] Texto: "Você está na escala de hoje · Entrar na sessão"
- [ ] Tap trigger full-screen takeover
- [ ] Não renderiza quando sem sessão ativa

---

### B7-T10: Full-Screen Takeover Mode
**Semana:** 2  
**Dependências:** B7-T9  
**Entregáveis:**
- `apps/web/src/components/mobile/TakeoverLayout.tsx`
- `apps/web/src/hooks/useTakeover.ts`

**Done when:**
- [ ] Takeover esconde bottom nav completamente
- [ ] Full-screen container com session content
- [ ] Botão "Sair da sessão" no top-right
- [ ] Confirmação ao sair ("Tem certeza?")
- [ ] Confirmar: sai, Cancelar: mantém
- [ ] Sem outras navegações no takeover

---

### B7-T11: Study Route Integration
**Semana:** 2  
**Dependências:** B7-T7, B7-T8  
**Entregáveis:** `apps/web/src/config/routes.ts` (modify)

**Done when:**
- [ ] Rota `/repertorio/:songId/estudar` definida
- [ ] Study entry page no pattern de tabs
- [ ] Mobile Repertório tab linka para song list → detail → study
- [ ] Study mode fora da sessão (sem state machine)

---

### B6-T1: Study Mode Route
**Semana:** 2  
**Dependências:** B7-T1  
**Entregáveis:** `apps/web/src/routes.tsx` (modify)

**Done when:**
- [ ] Route `/repertoire/:songId/study` definida
- [ ] Carrega componente StudyMode
- [ ] Sem auth guard bloqueando músicos
- [ ] Build passa

---

### B6-T2: Study Mode Page Layout
**Semana:** 2  
**Dependências:** B6-T1  
**Entregáveis:** `apps/web/src/pages/study/StudyMode.tsx`

**Done when:**
- [ ] Header com nome da música (route params)
- [ ] Duas seções: "Afinador" e "Metrônomo"
- [ ] Responsivo (single column mobile)
- [ ] Sem conexão com sessão live
- [ ] Tests: page renders, sections visible

---

### B6-T3: "Estudar" Button
**Semana:** 2  
**Dependências:** B6-T2  
**Entregáveis:** `apps/web/src/pages/library/SongDetail.tsx` (modify)

**Done when:**
- [ ] Botão/tab "Estudar" visível
- [ ] Tap navega para `/repertoire/:songId/study`
- [ ] Estilo consistente (pill ou tab)
- [ ] Integration test: navigate → tap → study loads

---

### B6-T4: Tuner Placeholder
**Semana:** 2  
**Dependências:** B0 DialCircular  
**Entregáveis:** `apps/web/src/components/study/TunerPlaceholder.tsx`

**Done when:**
- [ ] DialCircular com valor estático (50% = "A4, 0 cents")
- [ ] Nome da nota ("A4") visível
- [ ] Seletor de preset (Violão, Baixo, Cavaquinho)
- [ ] Mensagem: "Motor de detecção em breve"
- [ ] Sem getUserMedia call

---

### B6-T5: Metronome Placeholder
**Semana:** 2  
**Dependências:** B0 SliderHorizontal  
**Entregáveis:** `apps/web/src/components/study/MetronomePlaceholder.tsx`

**Done when:**
- [ ] SliderHorizontal BPM (30-300, default 120)
- [ ] Valor BPM visível
- [ ] Botão Play/Pause (visual only)
- [ ] Mensagem: "Motor de áudio em breve"
- [ ] Sem AudioContext creation

---

### B6-T6: Study Mode Assembly
**Semana:** 2  
**Dependências:** B6-T2, B6-T4, B6-T5  
**Entregáveis:** `apps/web/src/pages/study/StudyMode.tsx` (update)

**Done when:**
- [ ] TunerPlaceholder na seção "Afinador"
- [ ] MetronomePlaceholder na seção "Metrônomo"
- [ ] Layout limpo, bem espaçado
- [ ] Integration test: both placeholders visible

---

### B6-T7: Final Build Verification
**Semana:** 2  
**Dependências:** B6-T6  
**Entregáveis:** N/A

**Done when:**
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] All tests pass
- [ ] Route `/repertoire/:songId/study` loads
- [ ] "Estudar" button funciona
- [ ] Tuner/Metronome placeholders renderizam

---

## Fase 2.2: Biblioteca de Músicas (3 semanas)

### B3-T1: Song List & Forms
**Semana:** 3  
**Dependências:** B1-T8 (RBAC), B2-T3 (CRUD routes)  
**Entregáveis:**
- `apps/web/src/pages/library/SongList.tsx`
- `apps/web/src/components/library/SongForm.tsx`

**Done when:**
- [ ] Lista mostra: title, artist, key, status
- [ ] Admin/operator: "Add Song" visível; musician: hidden
- [ ] "Add Song" → página de criação (não modal)
- [ ] Campos: title, artist, default_key, tags, status, notes
- [ ] Save cria song, status="rascunho"
- [ ] Click → SongDetail page
- [ ] Delete → soft-delete (status="arquivada")
- [ ] Validação: title required, default_key required

---

### B3-T2: Song Detail Page with Tabs
**Semana:** 3  
**Dependências:** B3-T1  
**Entregáveis:** `apps/web/src/pages/library/SongDetail.tsx`

**Done when:**
- [ ] Song detail como página própria (rota), não modal
- [ ] 3 tabs: Info, Cue Editor, History
- [ ] Info tab: title, artist, key, tags, status, notes, last modified
- [ ] Cue Editor tab: wavesurfer placeholder
- [ ] History tab: session execution logs
- [ ] Tab switching preserva scroll
- [ ] Integration tests: page renders, tabs switch

---

### B3-T3: Song API Integration & Caching
**Semana:** 3  
**Dependências:** B3-T1, B2-T3, B2-T6  
**Entregáveis:**
- `apps/web/src/hooks/useSongs.ts` (update)
- `apps/web/src/services/song-cache.ts`

**Done when:**
- [ ] useSongs() fetch da API on mount
- [ ] Cache no IndexedDB via Dexie
- [ ] Offline: retorna cached songs
- [ ] Mutations atualizam API + cache
- [ ] Loading e error states
- [ ] Unit tests: hook returns data, caching works

---

### B3-T4: Cue Editor - Wavesurfer
**Semana:** 4  
**Dependências:** B3-T2  
**Entregáveis:** `apps/web/src/components/library/cue-editor/WaveformEditor.tsx`

**Done when:**
- [ ] Waveform carrega de reference_track_url
- [ ] Dark theme styling (design system)
- [ ] Playhead mostra posição atual
- [ ] Click no waveform seek
- [ ] Error state: invalid URL
- [ ] Loading state: placeholder

---

### B3-T5: Cue Editor - Block Management
**Semana:** 4  
**Dependências:** B3-T4  
**Entregáveis:**
- `apps/web/src/components/library/cue-editor/BlockManager.tsx`
- `apps/web/src/services/cue-editor/blocks.ts`

**Done when:**
- [ ] Click no waveform cria marker
- [ ] Set marker como start ou end
- [ ] Criar block: label, start_time, end_time, duration, order
- [ ] Lista de blocks mostra todos
- [ ] Edit block (label, times)
- [ ] Delete block
- [ ] Overlapping blocks: warning, previne save
- [ ] Order auto-assigned por start_time

---

### B3-T6: Cue Sheet Persistence & ChordPro Editor
**Semana:** 4  
**Dependências:** B3-T5, B2-T3  
**Entregáveis:**
- `apps/web/src/components/library/cue-editor/CueSheetEditor.tsx`
- `apps/web/src/services/cue-editor/persistence.ts`

**Done when:**
- [ ] Load cue sheet do server (GET /songs/:id/cue-sheet)
- [ ] Save cue sheet (POST /songs/:id/cue-sheet)
- [ ] ChordPro text editor por block
- [ ] Live preview com chordsheetjs
- [ ] Save persiste todos os blocks
- [ ] Empty state: "Create Cue Sheet" button
- [ ] Save disabled com overlapping blocks

---

### B3-T7: ChordPro Parsing & Rendering Engine
**Semana:** 4-5  
**Dependências:** Nenhuma (pure utility)  
**Entregáveis:**
- `apps/web/src/services/chordpro/parser.ts`
- `apps/web/src/services/chordpro/renderer.ts`
- `apps/web/src/services/chordpro/transpose.ts`

**Done when:**
- [ ] parseChordPro(input): ChordPro → ChordSheet
- [ ] renderCifra(chordSheet): chords acima lyrics
- [ ] renderLetra(chordSheet): lyrics apenas
- [ ] transpose(chordSheet, semitones): shift chords
- [ ] Transposição preserva lyrics
- [ ] Invalid syntax: graceful handling
- [ ] Unknown chords: unchanged on transpose
- [ ] Unit tests: parse, render Cifra/Letra, transpose

---

### B3-T8: Block Transposition Preview
**Semana:** 5  
**Dependências:** B3-T6, B3-T7  
**Entregáveis:** `apps/web/src/components/library/cue-editor/ChordProPreview.tsx`

**Done when:**
- [ ] Preview renderiza com renderCifra()
- [ ] Transpose controls (dropdown ou ±buttons)
- [ ] Preview atualiza em real-time
- [ ] Default key no header
- [ ] Auto-transpose se event key ≠ default_key
- [ ] Unit tests: preview renders, transpose updates

---

### B3-T9: History Tab Integration
**Semana:** 5  
**Dependências:** B3-T2, B2-T1  
**Entregáveis:** `apps/web/src/components/library/SongHistory.tsx`

**Done when:**
- [ ] History tab query session_execution_log
- [ ] Mostra: date, duration, overrides, triggered by
- [ ] Empty state: "No session history yet"
- [ ] Integration tests: history renders, correct data

---

### B3-T10: Final Build Verification
**Semana:** 5  
**Dependências:** B3-T9  
**Entregáveis:** N/A

**Done when:**
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] All tests pass
- [ ] Song CRUD end-to-end
- [ ] Cue Editor: waveform, blocks, ChordPro
- [ ] ChordPro: Letra/Cifra modes, transposition
- [ ] Song detail: 3 tabs (no modals)

---

## Fase 2.3: Repertório (2 semanas)

### B8-T1: Add Song Status Field
**Semana:** 6  
**Dependências:** Nenhuma  
**Entregáveis:** `prisma/schema.prisma` (modify)

**Done when:**
- [ ] status field: `rascunho | pronta | arquivada` default "rascunho"
- [ ] Enum SongStatus definido
- [ ] Migration gerada e aplicável
- [ ] `prisma generate` succeeds
- [ ] Gate: `prisma generate && tsc --noEmit`

---

### B8-T2: Add Song Tags Field
**Semana:** 6  
**Dependências:** Nenhuma  
**Entregáveis:** `prisma/schema.prisma` (modify)

**Done when:**
- [ ] tags field: `String[]` default []
- [ ] Migration gerada e aplicável
- [ ] `prisma generate` succeeds

---

### B8-T3: Status Filtering in Song Service
**Semana:** 6  
**Dependências:** B8-T1  
**Entregáveis:** `apps/api/src/services/songService.ts` (modify)

**Done when:**
- [ ] getSongsForRepertoire(): status = "pronta" apenas
- [ ] searchSongs(): exclui "arquivada"
- [ ] getAllSongs(admin): todos statuses
- [ ] Status filter parameter nas queries
- [ ] Unit tests: 3 filter paths + edge cases

---

### B8-T4: Create service_repertoire_item Entity
**Semana:** 6  
**Dependências:** B8-T1, B8-T2  
**Entregáveis:** `prisma/schema.prisma` (modify)

**Done when:**
- [ ] Model: id, service_schedule_id, song_id, order, key_override, notes
- [ ] Foreign keys definidos
- [ ] Unique constraint: (service_schedule_id, order)
- [ ] Migration gerada e aplicável
- [ ] `prisma generate` succeeds

---

### B8-T5: Repertoire CRUD API
**Semana:** 7  
**Dependências:** B8-T4  
**Entregáveis:** `apps/api/src/routes/repertoire.ts`

**Done when:**
- [ ] GET /schedules/:id/repertoire: items ordered
- [ ] POST /schedules/:id/repertoire: add song (valida status="pronta")
- [ ] DELETE /schedules/:id/repertoire/:itemId: remove
- [ ] PATCH /schedules/:id/repertoire/reorder: bulk reorder
- [ ] PATCH /schedules/:id/repertoire/:itemId: update key_override/notes
- [ ] Valida schedule status: "aprovada" ou "publicada"
- [ ] 403 para unauthorized roles
- [ ] Integration tests: happy path + errors

---

### B8-T6: Drag-and-Drop Reorder UI
**Semana:** 7  
**Dependências:** B8-T5  
**Entregáveis:** `apps/web/src/components/repertoire/RepertoireList.tsx`

**Done when:**
- [ ] Lista: order, title, key, BPM
- [ ] Drag handle → reordering
- [ ] Drop → PATCH /reorder
- [ ] Optimistic UI update
- [ ] Empty state message
- [ ] Unit tests: drag, reorder, optimistic update

---

### B8-T7: Scoped Permission Checks
**Semana:** 7  
**Dependências:** B8-T5  
**Entregáveis:** `apps/api/src/services/permissionService.ts`

**Done when:**
- [ ] canEditRepertoire(user, serviceSchedule): boolean
- [ ] Admin/leader: sempre true
- [ ] Warship_leader: true apenas se assigned como ministro_de_louvor
- [ ] Operator/musician: sempre false
- [ ] Unit tests: 8+ role × assignment combinations

---

### B8-T8: Permission Migration on Substitution
**Semana:** 7  
**Dependências:** B8-T7  
**Entregáveis:** `apps/api/src/services/repertoireService.ts` (modify)

**Done when:**
- [ ] Substitution de warship_leader → substitute herda permissão
- [ ] Original perde permissão
- [ ] Unit tests: original loses, substitute gains
- [ ] Non-warship_leader: no effect

---

### B8-T9: Repertoire Publish + WhatsApp
**Semana:** 7  
**Dependências:** B8-T5, B8-T6  
**Entregáveis:** `apps/api/src/services/repertoireService.ts` (modify)

**Done when:**
- [ ] publishRepertoire(scheduleId) endpoint
- [ ] Query service_assignments do schedule
- [ ] Trigger WhatsApp: repertorio_definido template
- [ ] Template vars: date, song list, study link
- [ ] WhatsApp service: stubbed/mocked
- [ ] Unit tests: correct musicians, correct template vars

---

## Fase 2.4: Escalas (3 semanas)

### B9-T1: Add Worship Role Tag Model
**Semana:** 8  
**Dependências:** Nenhuma  
**Entregáveis:** `prisma/schema.prisma` (modify)

**Done when:**
- [ ] worship_roles field: `String[]` no musician model
- [ ] worship_role reference table: id, name, ministry_id
- [ ] Migration gerada e aplicável
- [ ] `prisma generate` succeeds

---

### B9-T2: Create Scheduler Data Models
**Semana:** 8  
**Dependências:** B9-T1  
**Entregáveis:** `prisma/schema.prisma` (modify)

**Done when:**
- [ ] monthly_schedule_cycle: id, ministry_id, month, year, status, availability_deadline
- [ ] availability_response: cycle_id, musician_id, sunday_date, available, responded_at
- [ ] service_schedule: id, cycle_id, service_date, status
- [ ] service_assignment: id, service_schedule_id, role, musician_id, status, substitution_of
- [ ] Foreign keys + indexes
- [ ] Migration gerada e aplicável

---

### B9-T3: Fairness Score Calculation
**Semana:** 8  
**Dependências:** B9-T1  
**Entregáveis:** `apps/api/src/services/scheduler/fairness.ts`

**Done when:**
- [ ] calculateFairnessScore(musicians, role): sorted array
- [ ] Primary sort: times_served_this_month ascending
- [ ] Secondary sort: last_served_at[role] oldest first
- [ ] Handles empty list
- [ ] Handles missing last_served_at
- [ ] Unit tests: normal sort, tie-breaking, empty, missing data

---

### B9-T4: Greedy Assignment Algorithm
**Semana:** 8  
**Dependências:** B9-T3  
**Entregáveis:** `apps/api/src/services/scheduler/engine.ts`

**Done when:**
- [ ] generateSchedule(cycleId, sundays, roles, availabilities)
- [ ] Processa domingos em ordem cronológica
- [ ] Filtra candidatos: worship_role match, available, not assigned elsewhere
- [ ] Sort por fairness score
- [ ] Assign first candidate; none → status="vago"
- [ ] Updates in-memory counters
- [ ] Unit tests: happy path, partial availability, all vago

---

### B9-T5: Cycle Lifecycle Service
**Semana:** 8  
**Dependências:** B9-T4  
**Entregáveis:** `apps/api/src/services/scheduler/cycleService.ts`

**Done when:**
- [ ] createCycle(ministryId, month, year): status="coletando_disponibilidade"
- [ ] closeAvailability(cycleId): → "gerando", triggers engine
- [ ] approveCycle(cycleId): → "aguardando_aprovacao"
- [ ] publishCycle(cycleId): → "publicada", triggers WhatsApp
- [ ] Valida transições (sem backwards)
- [ ] Unit tests: all transitions + invalid attempts

---

### B9-T6: Admin Dashboard API Endpoints
**Semana:** 9  
**Dependências:** B9-T5  
**Entregáveis:** `apps/api/src/routes/schedules.ts`

**Done when:**
- [ ] GET /schedules/cycles/:cycleId: status + progress
- [ ] GET /schedules/cycles/:cycleId/sundays: Sundays com assignments
- [ ] POST /schedules/swap: { assignmentId, newMusicianId }
- [ ] POST /schedules/cycles/:cycleId/approve
- [ ] POST /schedules/cycles/:cycleId/publish
- [ ] Check admin/leader permission (403 others)
- [ ] Swap valida availability
- [ ] Integration tests: all endpoints + errors

---

### B9-T7: Admin Dashboard UI
**Semana:** 9  
**Dependências:** B9-T6  
**Entregáveis:**
- `apps/web/src/pages/admin/ScheduleDashboard.tsx`
- `apps/web/src/components/schedule/SundayCard.tsx`

**Done when:**
- [ ] Dashboard: cycle status no topo
- [ ] Lista de Sundays como cards expansíveis
- [ ] Card: date, assigned musicians, vago slots (danger highlight)
- [ ] Expand: full assignment details + swap button
- [ ] "Aprovar e Publicar" enabled quando slots filled
- [ ] Substitution history por Sunday
- [ ] Unit tests: renders, expand, vago highlight

---

### B9-T8: Manual Swap UI
**Semana:** 9  
**Dependências:** B9-T7  
**Entregáveis:** `apps/web/src/components/schedule/SwapDialog.tsx`

**Done when:**
- [ ] Click slot → swap dialog opens
- [ ] Selector: available musicians por fairness score
- [ ] Select + confirm → POST /schedules/swap
- [ ] Optimistic UI update
- [ ] Cancel button
- [ ] Unit tests: dialog opens, select musician, swap

---

### B9-T9: Substitution Flow Service
**Semana:** 9-10  
**Dependências:** B9-T5  
**Entregáveis:** `apps/api/src/services/scheduler/substitutionService.ts`

**Done when:**
- [ ] reportUnavailability(assignmentId): → status="recusado"
- [ ] findSubstitute(assignmentId): query available musicians
- [ ] Sort por fairness score
- [ ] Sequential invite: first candidate, timeout window (4h default)
- [ ] Accept: update musician_id, status="confirmado", substitution_of
- [ ] Decline/timeout: next candidate
- [ ] Exhausted: status="vago", notify leader
- [ ] Optimistic locking previne double-acceptance
- [ ] Unit tests: accept, decline cascade, timeout, exhausted, lock conflict

---

### B9-T10: Sequential Invite + WhatsApp
**Semana:** 10  
**Dependências:** B9-T9  
**Entregáveis:** `apps/api/src/services/scheduler/substitutionService.ts` (modify)

**Done when:**
- [ ] Sends substituicao_urgente template via WhatsApp
- [ ] Template vars: Sunday date, role, deadline
- [ ] Reply buttons: "Aceito" / "Não posso"
- [ ] Webhook response → update assignment status
- [ ] Timeout → next candidate
- [ ] WhatsApp: stubbed/mocked
- [ ] Unit tests: template sent, response handling, timeout

---

### B9-T11: Configurable Rules Per Ministry
**Semana:** 10  
**Dependências:** B9-T5  
**Entregáveis:**
- `prisma/schema.prisma` (modify)
- `apps/api/src/services/scheduler/configService.ts`

**Done when:**
- [ ] ministry_config model: ministry_id, default_formation, availability_deadline_days, substitution_window_hours, cycle_trigger_day
- [ ] getConfig(ministryId): returns config with defaults
- [ ] updateConfig(ministryId, partial): upsert
- [ ] Cycle creation usa cycle_trigger_day
- [ ] Substitution usa substitution_window_hours
- [ ] Unit tests: default loading, override, partial update

---

### B9-T12: Async Job Execution
**Semana:** 10  
**Dependências:** B9-T5, B9-T9, B9-T11  
**BLOCKER:** REQ-SCHED-08 (tiebreaker rule) precisa ser definida no STATE.md

**Entregáveis:**
- `apps/api/src/jobs/schedulerJob.ts`
- `apps/api/src/jobs/substitutionJob.ts`

**Done when:**
- [ ] Cron job: createCycle no cycle_trigger_day à meia-noite
- [ ] Event listener: findSubstitute on decline/timeout
- [ ] Jobs assíncronos (fora do API request context)
- [ ] Retry logic com exponential backoff
- [ ] Job status logged
- [ ] Unit tests: cron trigger, event trigger, retry
- [ ] REQ-SCHED-08 registered in STATE.md

---

## Fase 2.5: WhatsApp Integration (1 semana)

### B10-T1: WhatsApp Service Interface
**Semana:** 11  
**Dependências:** Nenhuma  
**Entregáveis:** `apps/api/src/services/whatsappService.ts`

**Done when:**
- [ ] sendTemplate(to, templateName, variables)
- [ ] sendMessage(to, text)
- [ ] Interface com API de WhatsApp (stub inicial)
- [ ] Unit tests: interface methods

---

### B10-T2: WhatsApp Webhook Handler
**Semana:** 11  
**Dependências:** B10-T1  
**Entregáveis:** `apps/api/src/routes/whatsapp.ts`

**Done when:**
- [ ] POST /whatsapp/webhook: recebe respostas
- [ ] Processa button_reply.id
- [ ] Roteia para substitution flow se aplicável
- [ ] Integration tests: webhook receives, processes

---

### B10-T3: WhatsApp Status Endpoint
**Semana:** 11  
**Dependências:** B10-T1  
**Entregáveis:** `apps/api/src/routes/whatsapp.ts` (modify)

**Done when:**
- [ ] GET /whatsapp/status/:messageId
- [ ] Retorna: sent, delivered, failed, read
- [ ] Integration tests: status query

---

## Resumo por Semana

| Semana | Tasks | Módulo | Entregáveis Principais |
|--------|-------|--------|------------------------|
| 1 | B7-T1 a B7-T7 | Navegação | WebLayout, Sidebar, Topbar, SearchModal, PageHeader, routes |
| 2 | B7-T8 a B7-T11, B6-T1 a B6-T7 | Navegação + Estudo | Mobile nav, Takeover, StudyMode, Tuner, Metronome |
| 3 | B3-T1 a B3-T3 | Biblioteca | SongList, SongDetail, SongForm, useSongs hook |
| 4 | B3-T4 a B3-T6 | Biblioteca | WaveformEditor, BlockManager, CueSheetEditor |
| 5 | B3-T7 a B3-T10 | Biblioteca | ChordPro engine, Transposition, History tab |
| 6 | B8-T1 a B8-T4 | Repertório | Schema: status, tags, repertoire_item |
| 7 | B8-T5 a B8-T9 | Repertório | Repertoire API, Drag-drop, Permissions, WhatsApp publish |
| 8 | B9-T1 a B9-T5 | Escalas | Schema, Fairness, Greedy engine, Cycle service |
| 9 | B9-T6 a B9-T8 | Escalas | Admin dashboard API + UI, Swap dialog |
| 10 | B9-T9 a B9-T12 | Escalas | Substitution flow, Config rules, Async jobs |
| 11 | B10-T1 a B10-T3 | WhatsApp | WhatsApp service, Webhook, Status endpoint |

---

## Critical Path

```
B7 (Navegação) → Bloqueia todo o resto
  ↓
B6 (Estudo) → Baixa prioridade, pode ser adiada
  ↓
B3 (Biblioteca) → Pré-requisito para B8
  ↓
B8 (Repertório) → Pré-requisito para B9
  ↓
B9 (Escalas) → Depende de B10 para substituições
  ↓
B10 (WhatsApp) → Baixa prioridade inicial
```

---

## Gate Checks por Fase

### Fase 2.1 (B7 + B6)
```bash
npm run build && npm run lint && npm run test
```

### Fase 2.2 (B3)
```bash
prisma generate && tsc --noEmit && vitest run
```

### Fase 2.3 (B8)
```bash
prisma generate && tsc --noEmit && vitest run --project integration
```

### Fase 2.4 (B9)
```bash
prisma generate && tsc --noEmit && vitest run
```

### Fase 2.5 (B10)
```bash
npm run build && npm run lint && vitest run --project integration
```

---

**Documento aprovado em:** 2026-07-02  
**Próxima ação:** Ativar skill `tlc-spec-driven` e iniciar B7-T1  
**Risco principal:** B9-T12 bloqueado por REQ-SCHED-08 indefinida