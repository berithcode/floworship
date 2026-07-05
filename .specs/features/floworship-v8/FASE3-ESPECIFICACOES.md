# Fase 3 — Estruturação e Correção de Páginas

**Data:** 2026-07-02  
**Objetivo:** Estruturar páginas vazias (Chat, Perfil, Configurações, Sessão Landing) e corrigir integrações pendentes sem retrabalho.

---

## 🔍 Auditoria de Retrabalho

### O que NÃO precisa ser refeito (já existe e funciona):

| Componente | Local | Status | Observação |
|------------|-------|--------|------------|
| **Sidebar** | `components/layout/Sidebar.tsx` | ✅ Limpo | Navegação real (Dashboard, Músicas, Escalas, Sessão, Chat, Perfil, Config) |
| **SundayCard** | `components/schedule/SundayCard.tsx` | ✅ Funcional | Com SwapDialog integrado |
| **CycleStatus** | `components/schedule/CycleStatus.tsx` | ✅ Funcional | Badge de status do ciclo |
| **AvailabilityForm** | `components/schedule/AvailabilityForm.tsx` | ✅ Funcional | Formulário de disponibilidade |
| **SwapDialog** | `components/schedule/SwapDialog.tsx` | ✅ Funcional | Modal de troca de músico |
| **RepertoireList** | `components/repertoire/RepertoireList.tsx` | ✅ Funcional | Drag-and-drop + busca |
| **ModoOperador/Letra/Cifra/TV** | `pages/performance/` | ✅ Funcional | Modos de sessão ao vivo |
| **StudyMode** | `pages/study/StudyMode.tsx` | ⚠️ Placeholder | Tuner/Metronome são placeholders |
| **InviteManager** | `components/InviteManager.tsx` | ✅ Funcional | Mas não tem página que o use |
| **SessionTakeoverCard** | `components/mobile/` | ✅ Funcional | Card de sessão ativa |
| **BottomNav** | `components/mobile/` | ✅ Funcional | Navegação mobile |

---

### O que PRECISA ser criado (sem retrabalho):

| Página | Rota | Componentes Novos Necessários | Prioridade |
|--------|------|-------------------------------|------------|
| **Chat** | `/chat` | `pages/chat/ChatPage.tsx` + `components/chat/` | 🔴 Alta |
| **Perfil** | `/profile` | `pages/profile/ProfilePage.tsx` + `components/profile/` | 🟡 Média |
| **Configurações** | `/settings` | `pages/settings/SettingsPage.tsx` (reusa InviteManager) | 🟡 Média |
| **Sessão Landing** | `/session` | `pages/session/SessionLanding.tsx` | 🟡 Média |
| **Meus Horários** | `/my-schedule` | `pages/schedule/MySchedule.tsx` (visão do músico) | 🟡 Média |

---

## 📋 Especificações por Página

### 1. Chat `/chat` — 🔴 PRIORIDADE ALTA

**Contexto:** Integração com WhatsApp (B10) para comunicação com músicos.

**Componentes a criar:**

```
pages/chat/
└── ChatPage.tsx              — Página principal com lista de conversas

components/chat/
├── ConversationList.tsx      — Lista de conversas (grupos/canais)
├── ConversationItem.tsx      — Item individual da lista
├── MessageBubble.tsx         — Bolha de mensagem (enviada/recebida)
├── MessageInput.tsx          — Input de texto + botão enviar
└── ChatHeader.tsx            — Cabeçalho com nome do canal e participantes
```

**Funcionalidades:**

- [ ] **C1:** Listar conversas por domingo (#14-julho, #28-julho)
- [ ] **C2:** Listar conversas por instrumento (#guitarra, #teclado, #vozes)
- [ ] **C3:** Canal de avisos gerais (admin → músicos)
- [ ] **C4:** Integração com WhatsApp (B10): mensagens enviadas via API Meta
- [ ] **C5:** Webhook recebe respostas (`button_reply.id`) e atualiza UI
- [ ] **C6:** Notificações em tempo real via WebSocket

**API Endpoints necessários:**

```
GET    /api/chat/conversations          — Lista conversas do usuário
GET    /api/chat/conversations/:id      — Mensagens de uma conversa
POST   /api/chat/conversations/:id/messages — Enviar mensagem
WS     /api/chat/ws                     — WebSocket para tempo real
```

**Dependências:** B10 (WhatsApp) concluído

---

### 2. Perfil `/profile` — 🟡 PRIORIDADE MÉDIA

**Contexto:** Usuário vê seus dados, histórico de participações e preferências.

**Componentes a criar:**

```
pages/profile/
└── ProfilePage.tsx           — Página principal de perfil

components/profile/
├── ProfileHeader.tsx         — Avatar + nome + cargo + ministério
├── InstrumentSelector.tsx    — Seleção de instrumento principal
├── AvailabilityCycle.tsx     — Loop de 4 domingos (disponibilidade padrão)
├── ParticipationHistory.tsx  — Tabela das últimas 6 escalas
├── PresenceChart.tsx         — Gráfico de percentual anual
└── DistributionChart.tsx     — Gráfico de instrumentos mais tocados
```

**Funcionalidades:**

- [ ] **P1:** Exibir dados do usuário (nome, email, cargo, ministério) via `AuthContext`
- [ ] **P2:** Avatar circular com efeito AuroraBackground
- [ ] **P3:** Selecionar instrumento principal (guitarra, teclado, bateria, vozes, etc.)
- [ ] **P4:** Definir disponibilidade padrão (loop de 4 domingos)
- [ ] **P5:** Histórico de participações: ✅ confirmado / ⚠️ substituído / ❌ ausente
- [ ] **P6:** Percentual de presença no ano (gráfico de pizza)
- [ ] **P7:** Distribuição de instrumentos (e.g., "12x vocais, 8x guitarra")

**API Endpoints necessários:**

```
GET    /api/profile/me                  — Dados do usuário + histórico
PUT    /api/profile/me                  — Atualizar dados (instrumento, disponibilidade)
GET    /api/profile/participation       — Histórico de participações (últimas 6)
GET    /api/profile/statistics          — Estatísticas anuais (presença, instrumentos)
```

**Dependências:** Nenhuma (usa dados já existentes: `ministryMember`, `serviceAssignment`)

---

### 3. Configurações `/settings` — 🟡 PRIORIDADE MÉDIA

**Contexto:** Admin configura ministério, membros, convites e integrações.

**Componentes a criar:**

```
pages/settings/
└── SettingsPage.tsx        — Página principal com abas

components/settings/
├── SettingsNav.tsx         — Navegação lateral por categorias
├── GeneralSettings.tsx     — Nome, descrição, logo do ministério
├── MemberManagement.tsx    — Lista de membros + cargos + remoção
├── WhatsAppIntegration.tsx — Configuração da API Meta (AppId, Token)
├── NotificationPrefs.tsx   — Preferências de notificação (email, WhatsApp)
└── PerformanceSettings.tsx — Tempo de transição, ordem de renderização
```

**Funcionalidades:**

- [ ] **CONF1:** Editar nome/descrição/logo do ministério
- [ ] **CONF2:** Gerenciar membros (reusa `InviteManager.tsx`):
  - [ ] Lista de membros ativos com cargo
  - [ ] Convidar novo membro (email + cargo)
  - [ ] Reenviar convite pendente
  - [ ] Revogar convite
  - [ ] Remover membro
- [ ] **CONF3:** Configurar integração WhatsApp:
  - [ ] App ID (Meta Developer)
  - [ ] Token de acesso
  - [ ] Testar conexão
- [ ] **CONF4:** Preferências de notificação:
  - [ ] Receber confirmações via WhatsApp
  - [ ] Email backup para convites
  - [ ] Notificações push (futuro)
- [ ] **CONF5:** Configurações de performance:
  - [ ] Tempo padrão de transição entre blocos (segundos)
  - [ ] Ordem de renderização: letra primeiro ou cifra primeiro

**API Endpoints necessários:**

```
GET    /api/settings/ministry             — Dados do ministério
PUT    /api/settings/ministry             — Atualizar ministério
GET    /api/settings/members              — Lista de membros
POST   /api/settings/invites              — Criar convite
GET    /api/settings/invites              — Lista convites pendentes
DELETE /api/settings/invites/:id          — Revogar convite
POST   /api/settings/whatsapp/test        — Testar integração WhatsApp
PUT    /api/settings/notifications        — Preferências de notificação
PUT    /api/settings/performance          — Configurações de performance
```

**Dependências:** `InviteManager.tsx` já existe e é funcional

---

### 4. Sessão Landing `/session` — 🟡 PRIORIDADE MÉDIA

**Contexto:** Página de entrada para sessões ao vivo. Atualmente a sidebar aponta para `/session` mas não há rota registrada.

**Componentes a criar:**

```
pages/session/
└── SessionLanding.tsx      — Landing page de sessão

components/session/
├── SessionCard.tsx         — Card de sessão agendada (data, repertório)
├── StartSessionButton.tsx  — Botão "Iniciar Sessão" com confirmação
├── WebSocketStatus.tsx     — Indicador online/offline do servidor
└── QuickActions.tsx        — Ações rápidas (novo ensaio, importar repertório)
```

**Funcionalidades:**

- [ ] **S1:** Listar próximas sessões agendadas (próximos 7 dias)
- [ ] **S2:** Botão "Iniciar Sessão" → navega para `/session/:id/operador`
- [ ] **S3:** Indicador de status WebSocket (online = verde, offline = vermelho)
- [ ] **S4:** Criar nova sessão de ensaio (sem escala oficial)
- [ ] **S5:** Importar repertório de um domingo para sessão de ensaio
- [ ] **S6:** Histórico de sessões realizadas (últimas 5)

**API Endpoints necessários:**

```
GET    /api/sessions/upcoming             — Próximas sessões (7 dias)
POST   /api/sessions                      — Criar nova sessão (ensaio)
GET    /api/sessions/history              — Histórico de sessões
WS     /api/sessions/ws                   — WebSocket para status em tempo real
```

**Dependências:** `useSessionSocket.ts` já existe e é funcional

---

### 5. Meus Horários `/my-schedule` — 🟡 PRIORIDADE MÉDIA

**Contexto:** Visão do músico (não admin) para suas próprias atribuições. Atualmente só existe `ScheduleDashboard` (admin).

**Componentes a criar:**

```
pages/schedule/
└── MySchedule.tsx          — Página de horários do músico

components/schedule-user/
├── MyAssignmentsList.tsx   — Lista de atribuições do usuário
├── AssignmentCard.tsx      — Card individual (data, role, status)
├── ConfirmButton.tsx       — Botão confirmar/recusar
└── SubstituteRequest.tsx   — Solicitar substituição
```

**Funcionalidades:**

- [ ] **MS1:** Listar todas as atribuições do usuário (próximos 30 dias)
- [ ] **MS2:** Filtrar por status: ✅ confirmado / ⏳ pendente / ❌ recusado
- [ ] **MS3:** Botão "Confirmar" / "Recusar" para atribuições pendentes
- [ ] **MS4:** Solicitar substituição (motivo + mensagem opcional)
- [ ] **MS5:** Ver repertório de cada domingo atribuído
- [ ] **MS6:** Integrar com `AvailabilityForm` para definir disponibilidade

**API Endpoints necessários:**

```
GET    /api/schedules/my-assignments      — Atribuições do usuário atual
PUT    /api/schedules/assignments/:id/confirm — Confirmar/recusar
POST   /api/schedules/assignments/:id/substitute — Solicitar substituição
```

**Dependências:** `AvailabilityForm.tsx` já existe

---

## 🎯 Plano de Implementação (Ordem Sugerida)

### Sprint 1 (Semana 1-2): Fundação
1. **Perfil** (`/profile`) — Mais simples, usa dados existentes
2. **Configurações** (`/settings`) — Reusa `InviteManager`, critical para admin

### Sprint 2 (Semana 3-4): Comunicação
3. **Chat** (`/chat`) — Depende do B10 WhatsApp, mas é core do produto

### Sprint 3 (Semana 5-6): Sessão
4. **Sessão Landing** (`/session`) — Conecta todos os modos de performance
5. **Meus Horários** (`/my-schedule`) — Visão do músico, complementa admin

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| B10 WhatsApp atrasado | Chat não funciona | Implementar chat interno primeiro, WhatsApp como fallback |
| WebSocket instável | Chat/Sessão em tempo real falha | Polling como fallback (30s) |
| InviteManager quebrado | Configurações travam | Testar `InviteManager.tsx` isoladamente antes de integrar |
| AuthContext desatualizado | Perfil mostra dados errados | Adicionar `refresh` no `useAuth()` e chamar após login |

---

## ✅ Critérios de Aceite (Definition of Done)

Cada página deve ter:

- [ ] **Rota registrada** no `App.tsx` como `ProtectedRoute`
- [ ] **Layout consistente** com `AuroraBackground` + `DashboardLayout`
- [ ] **Sidebar** com item ativo (usar `location.pathname.startsWith()`)
- [ ] **Loading state** com `SkeletonCard` ou spinner
- [ ] **Error state** com mensagem amigável + botão "Tentar novamente"
- [ ] **Empty state** com ilustração + CTA (quando aplicável)
- [ ] **TypeScript** sem erros (`npx tsc --noEmit`)
- [ ] **Build** sem erros (`npm run build`)
- [ ] **Teste manual** de todos os fluxos principais

---

## 📊 Matriz de Dependências

```
Perfil ─────────────────────┐
                            ├─── AuthContext (já existe)
Configurações ──────────────┤
                            │
Chat ───────────────────────┼─── B10 WhatsApp (pendente)
                            │
Sessão Landing ─────────────┼─── useSessionSocket (já existe)
                            │
Meus Horários ──────────────┘
```

---

**Próximo passo:** Começar pela **Página de Perfil** (mais simples, menos dependências).