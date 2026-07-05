# Floworship V8 - Fase 2: Análise de Lacunas e Especificação

## Contexto

Após análise completa das especificações originais (b0-b10, dashboard-musical) e do estado atual do código, identificamos o que falta para completar a aplicação.

**Status Atual:**
- ✅ Autenticação (B1): Login page implementada com split-screen layout
- ✅ Dashboard (dashboard-musical): Componentes criados, mas com dados mockados
- ✅ Design System (B0): Componentes UI base implementados
- ⚠️ Navegação (B7): Sidebar e layout existem, mas sem integração completa
- ❌ Biblioteca (B3): Páginas e componentes NÃO implementados
- ❌ Repertório (B8): Componentes NÃO implementados
- ❌ Escalas (B9): Componentes NÃO implementados
- ❌ Estudo (B6): Página StudyMode NÃO implementada
- ❌ WhatsApp (B10): NÃO implementado

---

## 1. Frontend - Componentes e Páginas Faltantes

### 1.1 Biblioteca de Músicas (B3) - LACUNA CRÍTICA

**Páginas Faltantes:**
- `apps/web/src/pages/library/SongList.tsx` - Lista de músicas (NÃO existe)
- `apps/web/src/pages/library/SongDetail.tsx` - Detalhe com 3 tabs (NÃO existe)
- `apps/web/src/pages/library/NewSong.tsx` - Formulário de criação (NÃO existe)

**Componentes Faltantes:**
- `apps/web/src/components/library/SongForm.tsx` - Form create/edit
- `apps/web/src/components/library/cue-editor/WaveformEditor.tsx` - Wavesurfer integration
- `apps/web/src/components/library/cue-editor/BlockManager.tsx` - Block management
- `apps/web/src/components/library/cue-editor/CueSheetEditor.tsx` - ChordPro editor
- `apps/web/src/components/library/cue-editor/ChordProPreview.tsx` - Preview com transposição
- `apps/web/src/components/library/SongHistory.tsx` - Histórico de sessões

**Hooks/Serviços Faltantes:**
- `apps/web/src/services/chordpro/parser.ts` - ChordPro parsing
- `apps/web/src/services/chordpro/renderer.ts` - Render Letra/Cifra
- `apps/web/src/services/chordpro/transpose.ts` - Transposição
- `apps/web/src/services/cue-editor/blocks.ts` - Block operations
- `apps/web/src/services/cue-editor/persistence.ts` - Cue sheet save/load

### 1.2 Repertório (B8) - LACUNA CRÍTICA

**Componentes Faltantes:**
- `apps/web/src/components/repertoire/RepertoireList.tsx` - Lista com drag-and-drop
- `apps/web/src/components/repertoire/RepertoireItem.tsx` - Item individual
- `apps/web/src/components/repertoire/PermissionGate.tsx` - RBAC para edição

**Páginas Faltantes:**
- `apps/web/src/pages/repertoire/RepertoireManagement.tsx` - Gestão de repertório (NÃO existe)

### 1.3 Escalas (B9) - LACUNA CRÍTICA

**Páginas Faltantes:**
- `apps/web/src/pages/admin/ScheduleDashboard.tsx` - Dashboard de escalas (NÃO existe)
- `apps/web/src/pages/schedule/ScheduleDetail.tsx` - Detalhe de domingo (NÃO existe)

**Componentes Faltantes:**
- `apps/web/src/components/schedule/SundayCard.tsx` - Card expansível de domingo
- `apps/web/src/components/schedule/SwapDialog.tsx` - Dialog de troca manual
- `apps/web/src/components/schedule/CycleStatus.tsx` - Status do ciclo
- `apps/web/src/components/schedule/AvailabilityForm.tsx` - Formulário de disponibilidade

**Serviços Faltantes:**
- `apps/web/src/services/scheduler/fairness.ts` - Cálculo de fairness score
- `apps/web/src/services/scheduler/engine.ts` - Algoritmo greedy
- `apps/web/src/services/scheduler/cycleService.ts` - Ciclo de vida
- `apps/web/src/services/scheduler/substitutionService.ts` - Substituições
- `apps/web/src/services/scheduler/configService.ts` - Configurações por ministério

**Jobs Faltantes:**
- `apps/web/src/jobs/schedulerJob.ts` - Job de geração mensal
- `apps/web/src/jobs/substitutionJob.ts` - Job de substituição

### 1.4 Estudo (B6) - LACUNA MÉDIA

**Páginas Faltantes:**
- `apps/web/src/pages/study/StudyMode.tsx` - Página já existe mas está vazia/placeholder

**Componentes Faltantes:**
- `apps/web/src/components/study/TunerPlaceholder.tsx` - Afinador (placeholder)
- `apps/web/src/components/study/MetronomePlaceholder.tsx` - Metrônomo (placeholder)

### 1.5 Navegação (B7) - LACUNA MÉDIA

**Componentes Faltantes:**
- `apps/web/src/components/layout/WebLayout.tsx` - Shell principal (parcialmente existe)
- `apps/web/src/components/layout/Topbar.tsx` - Barra superior (NÃO existe)
- `apps/web/src/components/layout/SearchModal.tsx` - Busca global Cmd+K (NÃO existe)
- `apps/web/src/components/layout/PageHeader.tsx` - Header padrão (NÃO existe)
- `apps/web/src/components/layout/DetailPage.tsx` - Pattern de página com tabs (NÃO existe)

**Mobile:**
- `apps/web/src/components/mobile/BottomNav.tsx` - Navegação mobile (NÃO existe)
- `apps/web/src/components/mobile/SessionTakeoverCard.tsx` - Card de sessão (NÃO existe)
- `apps/web/src/components/mobile/TakeoverLayout.tsx` - Layout full-screen (NÃO existe)

**Hooks Faltantes:**
- `apps/web/src/hooks/useNavigation.ts` - Hook de navegação (NÃO existe)
- `apps/web/src/hooks/useTakeover.ts` - Hook de takeover mode (NÃO existe)

**Config Faltante:**
- `apps/web/src/config/routes.ts` - Definição de rotas como constantes (NÃO existe)

### 1.6 WhatsApp (B10) - LACUNA CRÍTICA

**Serviços Faltantes:**
- `apps/web/src/services/whatsappService.ts` - Interface com API WhatsApp (NÃO existe)
- `apps/web/src/services/whatsappWebhook.ts` - Processador de webhooks (NÃO existe)

---

## 2. Backend - API Endpoints Faltantes

### 2.1 Biblioteca (B3)

**Endpoints Faltantes:**
- `GET /songs` - Listar músicas (com filtros: status, tags, search)
- `POST /songs` - Criar música
- `GET /songs/:id` - Buscar música por ID
- `PUT /songs/:id` - Atualizar música
- `DELETE /songs/:id` - Soft-delete (arquivar)
- `GET /songs/:id/cue-sheet` - Buscar cue sheet
- `POST /songs/:id/cue-sheet` - Salvar cue sheet

### 2.2 Repertório (B8)

**Endpoints Faltantes:**
- `GET /schedules/:id/repertoire` - Listar itens do repertório
- `POST /schedules/:id/repertoire` - Adicionar música ao repertório
- `DELETE /schedules/:id/repertoire/:itemId` - Remover item
- `PATCH /schedules/:id/repertoire/reorder` - Reordenar (drag-and-drop)
- `PATCH /schedules/:id/repertoire/:itemId` - Atualizar key_override/notes
- `POST /repertoire/publish` - Publicar repertório (trigger WhatsApp)

### 2.3 Escalas (B9)

**Endpoints Faltantes:**
- `GET /schedules/cycles/:cycleId` - Status do ciclo
- `GET /schedules/cycles/:cycleId/sundays` - Domingos do ciclo
- `POST /schedules/cycles` - Criar ciclo
- `POST /schedules/cycles/:cycleId/close-availability` - Fechar disponibilidade
- `POST /schedules/cycles/:cycleId/generate` - Gerar escala
- `POST /schedules/cycles/:cycleId/approve` - Aprovar escala
- `POST /schedules/cycles/:cycleId/publish` - Publicar escala
- `POST /schedules/swap` - Troca manual
- `POST /availability` - Responder disponibilidade
- `POST /unavailability/report` - Reportar indisponibilidade

### 2.4 WhatsApp (B10)

**Endpoints Faltantes:**
- `POST /whatsapp/send-template` - Enviar template
- `POST /whatsapp/webhook` - Receber respostas (button_reply)
- `GET /whatsapp/status/:messageId` - Status de envio

---

## 3. Integrações Faltantes

### 3.1 Dashboard - Navegação

**Itens de Menu NÃO linkados:**
- Sidebar do Dashboard tem links mockados para:
  - "Repertório" → `/repertoire` (NÃO existe)
  - "Escalas" → `/schedules` (NÃO existe)
  - "Ao Vivo" → `/performance` (parcialmente existe)
  - "Comunicação" → `/messages` (NÃO existe)
  - "Configurações" → `/settings` (NÃO existe)

**Componentes do Dashboard:**
- `QuickActionsGrid.tsx` - Ações rápidas tem navegação mockada:
  - "Nova Música" → `/songs/new` (NÃO existe)
  - "Agendar Culto" → `/schedule/new` (NÃO existe)
  - "Convidar Músico" → `/members/invite` (NÃO existe)
  - "Enviar Aviso" → `/messages/new` (NÃO existe)
  - "Gerar Escala" → `/schedule/generate` (NÃO existe)

### 3.2 Dados Mockados → API Real

**Componentes com dados mockados:**
- `NextServiceCard.tsx` - Usa dados mockados do hook
- `PendingConfirmationsCard.tsx` - Usa dados mockados
- `MusiciansCountCard.tsx` - Usa dados mockados
- `RepertoireStatsCard.tsx` - Usa dados mockados
- `CycleStatusWidget.tsx` - Usa dados mockados
- `UpcomingServicesList.tsx` - Usa dados mockados
- `RecentActivityTimeline.tsx` - Usa dados mockados

**Hook `useDashboardMetrics.ts`:**
- `USE_MOCKS = true` - Precisa ser mudado para `false`
- Endpoints da API precisam estar implementados primeiro

---

## 4. Banco de Dados - Schema Faltante

### 4.1 Models Não Implementados

Do schema Prisma atual, faltam:

**B3 - Biblioteca:**
- ✅ `song` model já existe
- ❌ `song_cue_sheet` model (NÃO existe)
- ❌ `song_block` model (NÃO existe)

**B8 - Repertório:**
- ❌ `service_repertoire_item` model (NÃO existe)

**B9 - Escalas:**
- ❌ `monthly_schedule_cycle` model (NÃO existe)
- ❌ `availability_response` model (NÃO existe)
- ❌ `service_schedule` model (NÃO existe)
- ❌ `service_assignment` model (NÃO existe)
- ❌ `worship_role` reference table (NÃO existe)

**B10 - WhatsApp:**
- ❌ `whatsapp_message_log` model (NÃO existe)

**B11 - Config:**
- ❌ `ministry_config` model (NÃO existe)

---

## 5. Fase 2 - Plano de Implementação

### Prioridade 1: Fundação (Semana 1-2)

**B7 - Navegação:**
- T1-T3: WebLayout, Sidebar, Topbar
- T6-T7: PageHeader, DetailPage, useNavigation, routes.ts
- T8-T11: Mobile bottom nav, takeover, study route

**B6 - Estudo:**
- T1-T3: StudyMode page, "Estudar" button
- T4-T6: TunerPlaceholder, MetronomePlaceholder

**Entregáveis:**
- Navegação funcional entre páginas existentes
- Study mode acessível
- Mobile navigation pill

### Prioridade 2: Biblioteca (Semana 3-4)

**B3 - Biblioteca:**
- T1-T3: SongList, SongForm, SongDetail
- T4-T6: Cue Editor (wavesurfer, blocks)
- T7-T8: ChordPro engine (parser, renderer, transpose)
- T9: History tab integration

**API:**
- CRUD de músicas
- Cue sheet persistence

**Entregáveis:**
- CRUD de músicas completo
- Cue editor funcional (sem audio engine)
- ChordPro com transposição

### Prioridade 3: Repertório (Semana 5)

**B8 - Repertório:**
- T1-T4: Schema (song status, tags, service_repertoire_item)
- T5-T6: API de repertório + drag-and-drop UI
- T7-T9: Permissões + WhatsApp publish

**Entregáveis:**
- Gestão de repertório por domingo
- Drag-and-drop para reordenar
- Status de músicas (rascunho/pronta/arquivada)

### Prioridade 4: Escalas (Semana 6-8)

**B9 - Escalas:**
- T1-T2: Schema (worship_role, cycle, availability, schedule, assignment)
- T3-T5: Scheduler engine (fairness, greedy algorithm)
- T6-T8: Admin dashboard UI + swap manual
- T9-T10: Substitution flow + WhatsApp
- T11: Config por ministério
- T12: Jobs assíncronos

**API:**
- Cycle management
- Availability collection
- Schedule generation
- Substitution flow

**Entregáveis:**
- Geração automática de escalas
- Dashboard administrativo
- Substituições com WhatsApp

### Prioridade 5: WhatsApp (Semana 9)

**B10 - WhatsApp:**
- Service interface
- Template sending
- Webhook processing
- Integration with B9 substitution

**Entregáveis:**
- Envio de templates
- Processamento de respostas
- Integration com escalas/repertório

---

## 6. Resumo de Lacunas

| Módulo | Páginas | Componentes | API Endpoints | Services | Priority |
|--------|---------|-------------|---------------|----------|----------|
| B3 Biblioteca | 3 | 6 | 7 | 5 | 🔴 Alta |
| B8 Repertório | 1 | 3 | 6 | 1 | 🔴 Alta |
| B9 Escalas | 2 | 4 | 10 | 5 | 🔴 Alta |
| B6 Estudo | 1 | 2 | 0 | 0 | 🟡 Média |
| B7 Navegação | 0 | 7 | 0 | 2 | 🟡 Média |
| B10 WhatsApp | 0 | 0 | 3 | 2 | 🟢 Baixa |

**Total de Lacunas:**
- **10 páginas** faltantes
- **22 componentes** faltantes
- **26 endpoints** de API faltantes
- **15 serviços/hooks** faltantes
- **7 models** de banco faltantes

---

## 7. Dependências Críticas

**Bloqueadores:**
1. B7 Navegação → Bloqueia acesso a todas as outras páginas
2. B3 Biblioteca → Pré-requisito para B8 Repertório
3. B8 Repertório → Pré-requisito para B9 Escalas (repertório é parte da escala)
4. B9 Escalas → Depende de B10 WhatsApp para substituições

**Recomendação:**
Seguir ordem de implementação: B7 → B6 → B3 → B8 → B9 → B10

---

## 8. Próximos Passos Imediatos

1. **Ativar skill `tlc-spec-driven`** para cada task
2. **Começar com B7-T1** (WebLayout) - Fundação da navegação
3. **Em paralelo B6-T1** (StudyMode route) - Baixa complexidade
4. **Após B7 completo**, migrar para B3 (Biblioteca)
5. **Dashboard integration** só após B3 e B8 estarem funcionais

---

**Documento criado em:** 2026-07-02  
**Status:** Aguardando aprovação para início da Fase 2  
**Estimativa Total:** 9 semanas (44 tasks estimadas)