# Estrutura Geral da Aplicação — Floworship

## 1. Visão Geral

Floworship é uma aplicação full-stack para gestão de ministérios de música. Ela gerencia o ciclo completo de escalas musicais: cadastro de músicos, definição de disponibilidade mensal, geração automática de escalas com algoritmo de fairness, confirmação via Telegram/WhatsApp, definição de repertório por serviço e execução ao vivo com modos de performance (operador, letra, cifra, projeção TV).

### Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Backend** | Fastify (Node.js) + TypeScript |
| **ORM** | Prisma |
| **Banco** | SQLite (desenvolvimento), PostgreSQL planejado |
| **Autenticação** | JWT (access 15min) + Refresh Token rotativo (30d) + cookies httpOnly |
| **Tempo Real** | WebSocket (biblioteca `ws`) |
| **Notificações** | Telegram Bot API + Meta WhatsApp Cloud API |
| **Monorepo** | Turborepo |
| **Testes** | Vitest |
| **Design Tokens** | CSS custom properties via `packages/tokens` |
| **Componentes** | `packages/ui` — biblioteca própria de componentes React |

---

## 2. Arquitetura de Diretórios

### Raiz do Projeto

```
E:\BerithCodex\Floworship/
├── Documentação/                # Documentação do projeto
├── apps/
│   ├── api/                     # Backend (Fastify + Prisma + SQLite)
│   └── web/                     # Frontend (React + Vite + Tailwind)
├── packages/
│   ├── ui/                      # Componentes React reutilizáveis
│   ├── types/                   # Tipos TypeScript compartilhados
│   └── tokens/                  # Design tokens (CSS)
├── src/                         # Código legado (sendo migrado para apps/)
├── prisma/                      # Schema Prisma legado
├── plan/                        # Documentos de planejamento
├── .agents/                     # Configuração de agentes
├── .opencode/                   # Configuração opencode
├── .specs/                      # Especificações (TLC)
├── uiref/                       # Referências de UI
├── turbo.json                   # Configuração Turborepo
├── package.json                 # Raiz do monorepo
└── tsconfig.json                # Configuração TypeScript
```

### apps/api/src/

```
apps/api/src/
├── routes/                           # Rotas HTTP (Fastify)
│   ├── auth.ts                       # Login, register, refresh, logout, invite, sessions
│   ├── ministries.ts                 # CRUD ministérios, membros, config
│   ├── songs.ts                      # CRUD músicas, cue sheets com blocos
│   ├── schedules.ts                  # Ciclos, escalas, disponibilidade, substituição
│   ├── repertoire.ts                 # CRUD repertório de escalas
│   ├── sessions.ts                   # Sessões ao vivo (CRUD + import)
│   ├── sessions/
│   │   └── state.ts                  # Estado da sessão e trigger de blocos
│   ├── dashboard.ts                  # Métricas, estatísticas, atividades
│   ├── profile.ts                    # Perfil do usuário
│   ├── settings.ts                   # Configurações WhatsApp
│   ├── musicians.ts                  # CRUD músicos
│   ├── whatsappWebhook.ts            # Webhook Meta WhatsApp
│   ├── telegram-webhook.ts           # Webhook Telegram Bot
│   └── whatsapp-legacy.ts            # Rota legada WhatsApp
├── services/                         # Lógica de negócio
│   ├── auth/
│   │   ├── index.ts                  # Barrel
│   │   ├── service.ts                # createTokens, refreshTokens, createSession
│   │   ├── utils.ts                  # hashPassword, verifyPassword, generateToken
│   │   └── helpers.ts                # Funções auxiliares
│   ├── scheduler/
│   │   ├── engine.ts                 # Algoritmo de geração de escalas
│   │   ├── fairness.ts               # Score de justiça (menos servido primeiro)
│   │   ├── cycleService.ts           # createCycle, close, approve, publish, cancel
│   │   ├── configService.ts          # Configurações do ministério
│   │   └── substitutionService.ts    # Substituição automática
│   ├── notifications/
│   │   └── index.ts                  # TelegramNotificationProvider, sendNotification
│   ├── telegram/
│   │   ├── index.ts                  # TelegramService (sendMessage, webhook, deepLink)
│   │   └── templates.ts             # Templates de mensagens
│   ├── whatsapp/
│   │   ├── provider.ts               # Provedor unificado WhatsApp
│   │   ├── metaCloudApi.ts           # Meta Cloud API
│   │   ├── types.ts                  # Tipos WhatsApp
│   │   ├── templates.ts             # Templates WhatsApp
│   │   ├── replyProcessor.ts         # Processamento de botões
│   │   ├── optInService.ts           # Opt-in/opt-out
│   │   ├── messageLogService.ts      # Log de mensagens
│   │   └── implementations/
│   │       └── openwa.ts             # OpenWA (implementação alternativa)
│   ├── repertoire.ts                 # CRUD repertório + permissões
│   ├── permission.ts                 # Controle de acesso (canEditRepertoire)
│   └── logging/
│       └── session-log.ts            # Log de sessões
├── websocket/
│   └── server.ts                     # SessionWSServer (WebSocket)
├── middleware/
│   ├── auth.ts                       # JWT verification middleware
│   └── rateLimit.ts                  # Rate limiting
├── schemas/                          # Schemas de validação
└── db.ts                             # Instância Prisma
```

### apps/web/src/

```
apps/web/src/
├── App.tsx                           # Rotas, ProtectedRoute, ProtectedShell
├── main.tsx                          # Entry point (ThemeProvider + App)
├── index.css                         # Estilos globais
├── context/
│   ├── AuthContext.tsx               # Contexto de autenticação
│   ├── AuthProvider.tsx              # Provider que busca user de /auth/me
│   └── ThemeContext.tsx              # Contexto de tema
├── hooks/
│   ├── useRole.ts                    # Determina role (admin vs musician)
│   ├── useDashboardMetrics.ts        # Fetch de métricas do dashboard
│   ├── useSessionSocket.ts           # WebSocket + trigger de blocos
│   ├── useSongs.ts                   # Operações de músicas
│   ├── useNavigation.ts              # Navegação entre telas
│   └── useTextColor.ts               # Cores de texto dinâmicas
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx             # Login phone+PIN ou email+senha
│   │   └── InviteAcceptPage.tsx      # Aceitar convite
│   ├── dashboard/
│   │   ├── DashboardNew.tsx          # Dashboard principal
│   │   └── MinistrySelector.tsx      # Seleção de ministério
│   ├── library/
│   │   ├── SongList.tsx              # Lista de músicas
│   │   ├── SongDetail.tsx            # Detalhes + cue sheet editor
│   │   └── NewSong.tsx               # Nova música
│   ├── schedule/
│   │   └── MySchedule.tsx            # Minhas escalas (músico)
│   ├── admin/
│   │   └── ScheduleDashboard.tsx     # Dashboard de escalas (admin)
│   ├── session/
│   │   ├── SessionLanding.tsx        # Landing page de sessões
│   │   └── MySessionToday.tsx        # Sessão de hoje
│   ├── performance/
│   │   ├── ModoOperador.tsx          # Controle maestro (avança blocos)
│   │   ├── ModoLetra.tsx             # Exibição de letra
│   │   ├── ModoCifra.tsx             # Exibição de cifra (ChordPro)
│   │   ├── ModoTV.tsx                # Projeção para telão
│   │   └── SessionEnd.tsx            # Tela de encerramento
│   ├── mobile/
│   │   └── MobileHome.tsx            # Home mobile com bottom nav
│   ├── profile/
│   │   └── ProfilePage.tsx           # Perfil do usuário
│   ├── settings/
│   │   └── SettingsPage.tsx          # Configurações
│   ├── chat/
│   │   └── ChatPage.tsx              # Chat
│   ├── study/
│   │   └── StudyMode.tsx             # Modo de estudo
│   └── team/
│       └── TeamPage.tsx              # Time/equipe
├── components/
│   ├── ui/                           # Componentes base
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── SidebarItem.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── Background.tsx
│   │   ├── AuroraBackground.tsx
│   │   └── index.ts
│   ├── layout/                       # Layout estrutural
│   │   ├── AppShell.tsx              # Shell principal (sidebar + header + content)
│   │   ├── Sidebar.tsx               # Sidebar de navegação
│   │   ├── PageHeader.tsx            # Cabeçalho de página
│   │   ├── PageHeader.css
│   │   ├── SearchModal.tsx           # Modal de busca
│   │   ├── SearchModal.css
│   │   ├── DashboardLayout.tsx       # Layout específico do dashboard
│   │   └── MusicianLayout.tsx        # Layout específico do músico
│   ├── dashboard/                    # Widgets do dashboard
│   ├── schedule/                     # SundayCard, CycleStatus, etc.
│   ├── schedule-user/                # AssignmentCard para músicos
│   ├── library/                      # SongForm, SongHistory, cue-editor/
│   ├── session/                      # SessionCard, WebSocketStatus
│   ├── setlist/                      # SetlistEditor
│   ├── repertoire/                   # RepertoireList
│   ├── mobile/                       # BottomNav, PlayerBar, MusicCard
│   ├── performance/                  # OverrideConfirm, BlockReader
│   ├── settings/                     # Tabs de configuração
│   ├── profile/                      # Componentes de perfil
│   ├── chat/                         # ConversationList, MessageBubble
│   ├── study/                        # TunerPlaceholder, MetronomePlaceholder
│   └── InviteManager.tsx             # Gerenciamento de convites
├── utils/
│   └── getTextColors.ts              # Utilitário de cores
├── platform/
│   ├── wake-lock.ts                  # Wake lock API (PWA)
│   └── standalone.ts                 # Modo standalone (PWA)
└── services/
    ├── chordpro/
    │   └── parser.ts                 # Parser ChordPro (legado)
    └── logging/                      # Logging no frontend
```

### packages/

```
packages/
├── ui/src/                           # Componentes React reutilizáveis
│   ├── AvatarCircular.tsx
│   ├── BottomNavPill.tsx
│   ├── CardItem.tsx
│   ├── CircularIconButton.tsx
│   ├── DialCircular.tsx
│   ├── PillToggle.tsx
│   ├── SliderHorizontal.tsx
│   ├── index.ts                      # Barrel exports
│   └── *.test.tsx                    # Testes por componente
├── types/src/                        # Tipos TypeScript compartilhados
│   ├── index.ts                      # Tipos gerais
│   └── engine.ts                     # TransitionEvent e tipos do scheduler
└── tokens/src/                       # Design tokens CSS
    └── index.ts                      # Variáveis CSS custom properties
```

---

## 3. Mapa de Dependências

### Frontend → Backend

```
apps/web (React)                           apps/api (Fastify)
     │                                           │
     ├── HTTP (fetch) ──────────────────────────┤
     │   GET/POST/PUT/DELETE                     │
     │   /auth/*, /ministries/*, /songs/*, etc.  │
     │                                           │
     ├── WebSocket ────────────────────────────┤
     │   ws://host/ws                            │
     │   join/leave/block_changed                │
     │                                           │
     └── Auth ──────────────────────────────────┤
         Cookies httpOnly (access_token,         │
         refresh_token)                          │
```

### Backend → Banco

```
apps/api (Fastify)
     │
     ├── Prisma ORM ────── SQLite (dev.db)
     │   ├── User, Ministry, MinistryMember
     │   ├── Song, SongCueSheet, CueBlock
     │   ├── ServiceSchedule, ServiceAssignment
     │   ├── MonthlyScheduleCycle, AvailabilityResponse
     │   ├── Session, SessionExecutionLog
     │   ├── Invite, PasswordResetToken, RefreshToken
     │   ├── MinistryConfig
     │   └── WhatsAppMessageLog, NotificationLog
     │
     └── Services ──── Lógica de negócio
         ├── auth/ ────── tokens, hash, sessões
         ├── scheduler/ ─ engine, fairness, ciclo
         ├── notifications/ ─ providers multicanal
         ├── telegram/ ─── Telegram Bot API
         └── whatsapp/ ─── Meta Cloud API
```

### Dependências entre Pacotes

```
packages/tokens ──► apps/web (design tokens CSS)
packages/types ───► apps/api, apps/web (tipos compartilhados)
packages/ui ──────► apps/web (componentes React)
```

### Dependências Externas

```
apps/api:
  ├── fastify ─────────────── Framework HTTP
  ├── @prisma/client ──────── ORM
  ├── jsonwebtoken ────────── JWT
  ├── bcrypt ──────────────── Hash de senha
  ├── ws ──────────────────── WebSocket
  └── node:crypto ─────────── Geração de tokens

apps/web:
  ├── react, react-dom ────── UI
  ├── react-router-dom ────── Rotas
  ├── tailwindcss ─────────── Estilos
  └── @vitejs/plugin-react ── Build
```

---

## 4. Fluxo de Dados

### 4.1 Fluxo Geral

```
[Browser/Navegador]
      │
      ├── Login → POST /auth/login ────────────────────┐
      │                                                 │
      │    ◄── Set-Cookie: access_token (httpOnly)      │
      │    ◄── Set-Cookie: refresh_token (httpOnly)     │
      │                                                 │
      ├── Requisições autenticadas ──────────────────┐  │
      │   Cookie: access_token                        │  │
      │                                               ▼  ▼
      │                                         [Fastify Server]
      │                                              │
      │                                    [Auth Middleware]
      │                                    Verifica JWT, extrai user
      │                                              │
      │                                    [Route Handler]
      │                                              │
      │                                    [Service Layer]
      │                                    Lógica de negócio
      │                                              │
      │                                    [Prisma ORM]
      │                                              │
      │                                         [SQLite]
      │
      └── WebSocket ──── ws://host/ws ───────[SessionWSServer]
                                                      │
                                            [SessionRoom (Map)]
                                                      │
                                            Broadcast TransitionEvent
```

### 4.2 Fluxo de Autenticação

```
Login ──► POST /auth/login
  ├── Verifica credenciais (bcrypt)
  ├── Gera access_token (JWT, 15min)
  ├── Gera refresh_token (banco, 30d, rotativo)
  ├── Cria Session (userAgent, IP)
  └── Seta cookies httpOnly

Refresh ──► POST /auth/refresh
  ├── Busca refresh_token no banco
  ├── Se revogado → revoga TODOS (detecção de vazamento)
  ├── Revoga token atual
  ├── Cria novo par
  └── Seta novos cookies
```

### 4.3 Fluxo de Criação de Ciclo

```
Admin cria ciclo ──► POST /schedules/cycles
  ├── Cria MonthlyScheduleCycle (status: coletando_disponibilidade)
  ├── Cria ServiceSchedule para cada domingo do mês
  ├── Busca membros ativos com Telegram
  └── Envia notificação "disponibilidade_mensal" (background)

Músico responde ──► POST /schedules/availability
  └── Upsert AvailabilityResponse

Admin fecha coleta ──► POST /schedules/cycles/:id/close
  ├── Status → gerando
  ├── Engine gera escalas (fairness)
  └── Criar ServiceAssignment para cada role

Admin aprova ──► POST /schedules/cycles/:id/approve
  └── Status → aguardando_aprovacao

Admin publica ──► POST /schedules/cycles/:id/publish
  ├── Status → publicada
  └── Notifica músicos via Telegram/WhatsApp
```

### 4.4 Fluxo de Sessão ao Vivo

```
Músico inicia sessão ──► Seleciona ServiceSchedule
  ├── POST /sessions (cria sessão avulsa) ou seleciona escala
  ├── GET /session/:id/state (busca estado completo)
  │     └── Acha todos os blocos de todas as músicas
  │
  ├── Conecta WebSocket ──► ws://host/ws
  │     ├── join: { sessionId, ministryId }
  │     └── Servidor adiciona à SessionRoom
  │
  ├── Modos:
  │     ├── /session/:id/operador ── Controle maestro
  │     ├── /session/:id/letra ───── Exibe letra
  │     ├── /session/:id/cifra ───── Exibe cifra (ChordPro)
  │     └── /session/:id/tv ──────── Projeção telão
  │
  ├── Operador avança bloco ──► POST /sessions/:id/trigger-block
  │     ├── Cria SessionExecutionLog
  │     └── WebSocket broadcast ──► block_changed
  │
  └── Todos os modos recebem block_changed e atualizam
```

---

## 5. Rotas de API (70+ endpoints)

### 5.1 Autenticação (15 rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/register` | Registro inicial phone+PIN (legado) |
| `POST` | `/auth/register/admin` | Registro inicial email+senha |
| `POST` | `/auth/login` | Login phone+PIN (músicos) |
| `POST` | `/auth/login/admin` | Login email+senha (admin/operator) |
| `POST` | `/auth/refresh` | Renovar access token |
| `POST` | `/auth/logout` | Logout |
| `GET` | `/auth/me` | Dados do usuário autenticado |
| `GET` | `/auth/sessions` | Listar sessões ativas |
| `DELETE` | `/auth/sessions/:sessionId` | Revogar sessão |
| `POST` | `/auth/password-reset/request` | Solicitar reset de senha |
| `POST` | `/auth/password-reset/confirm` | Confirmar reset de senha |
| `POST` | `/auth/invite` | Criar convite |
| `GET` | `/auth/invites` | Listar convites |
| `DELETE` | `/auth/invites/:id` | Revogar convite |
| `GET` | `/auth/invite/:token` | Informações públicas do convite |
| `POST` | `/auth/invite/accept` | Aceitar convite |

### 5.2 Ministérios (6 rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/ministries` | Listar ministérios do usuário |
| `GET` | `/ministries/:id/members` | Listar membros |
| `POST` | `/ministries/:id/members` | Adicionar membro |
| `DELETE` | `/ministries/:id/members/:memberId` | Remover membro |
| `GET` | `/ministries/:id/config` | Obter configurações |
| `PUT` | `/ministries/:id/config` | Atualizar configurações |

### 5.3 Músicas (7 rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/songs` | Listar músicas do ministério |
| `GET` | `/songs/:id` | Detalhes da música |
| `POST` | `/songs` | Criar música |
| `PUT` | `/songs/:id` | Atualizar música |
| `DELETE` | `/songs/:id` | Arquivar música (soft delete) |
| `POST` | `/songs/:id/cue-sheet` | Criar/atualizar cue sheet com blocos |
| `GET` | `/songs/:id/cue-sheet` | Obter cue sheet com blocos |

### 5.4 Escalas e Ciclos (15 rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/schedules/cycles/current` | Ciclo atual com disponibilidades |
| `GET` | `/schedules/cycles/:cycleId` | Detalhes do ciclo |
| `GET` | `/schedules/cycles/:cycleId/sundays` | Domingos do ciclo |
| `POST` | `/schedules/cycles` | Criar novo ciclo |
| `POST` | `/schedules/cycles/:cycleId/close` | Fechar coleta e gerar escala |
| `POST` | `/schedules/cycles/:cycleId/approve` | Aprovar escala gerada |
| `POST` | `/schedules/cycles/:cycleId/publish` | Publicar e notificar |
| `POST` | `/schedules/cycles/:cycleId/cancel` | Cancelar ciclo |
| `POST` | `/schedules/availability` | Registrar disponibilidade |
| `GET` | `/schedules/my-assignments` | Escalações do músico logado |
| `PUT` | `/schedules/assignments/:id/confirm` | Confirmar/recusar escala |
| `POST` | `/schedules/:scheduleId/setlist` | Definir setlist do serviço |
| `GET` | `/schedules/:scheduleId/setlist` | Obter setlist do serviço |
| `GET` | `/schedules/today` | Escala de hoje |
| `POST` | `/schedules/substitution/:assignmentId` | Solicitar substituição |

### 5.5 Repertório (5 rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/schedules/:id/repertoire` | Listar repertório |
| `POST` | `/schedules/:id/repertoire` | Adicionar música |
| `DELETE` | `/schedules/:id/repertoire/:itemId` | Remover música |
| `PATCH` | `/schedules/:id/repertoire/reorder` | Reordenar setlist |
| `PATCH` | `/schedules/:id/repertoire/:itemId` | Atualizar item |

### 5.6 Sessões (7 rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/sessions` | Criar sessão avulsa |
| `GET` | `/sessions/upcoming` | Próximas 5 sessões |
| `GET` | `/sessions` | Listar sessões |
| `GET` | `/sessions/:id/state` | Estado completo da sessão |
| `POST` | `/sessions/:id/trigger-block` | Avançar bloco |
| `POST` | `/sessions/:scheduleId/import-repertoire` | Importar repertório de escala |

### 5.7 Dashboard (4 rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/dashboard/metrics` | Métricas do dashboard |
| `GET` | `/dashboard/upcoming-services` | Próximos 6 serviços |
| `GET` | `/dashboard/repertoire-stats` | Estatísticas de repertório |
| `GET` | `/dashboard/recent-activity` | Atividade recente |

### 5.8 Perfil e Configurações (3 rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/profile/me` | Perfil completo do usuário |
| `PUT` | `/settings/whatsapp/test` | Enviar mensagem WhatsApp de teste |
| `PUT` | `/settings/whatsapp/phone` | Atualizar telefone WhatsApp |

### 5.9 Músicos (5 rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/musicians` | Listar músicos |
| `GET` | `/musicians/:id` | Detalhes do músico |
| `POST` | `/musicians` | Criar músico |
| `PUT` | `/musicians/:id` | Atualizar músico |
| `DELETE` | `/musicians/:id` | Remover músico |

### 5.10 Telegram (4 rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/telegram/webhook` | Webhook do Telegram Bot |
| `GET` | `/telegram/status` | Status do bot |
| `POST` | `/telegram/test` | Enviar mensagem de teste |
| `POST` | `/telegram/webhook/setup` | Configurar webhook |
| `GET` | `/telegram/link/:memberId` | Link para vincular conta |

### 5.11 WhatsApp Webhook (2 rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/webhook` | Verificação Meta (challenge) |
| `POST` | `/webhook` | Receber mensagens WhatsApp |

---

## 6. Páginas Frontend e Rotas

### 6.1 Páginas Públicas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/login` | `LoginPage` | Login phone+PIN ou email+senha |
| `/invite/:token` | `InviteAcceptPage` | Aceitar convite |

### 6.2 Páginas sem Sidebar (Fullscreen)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/select-ministry` | `MinistrySelector` | Seleção de ministério (pós-login) |
| `/mobile` | `MobileHome` | Home mobile com bottom nav |
| `/session/:sessionId/operador` | `ModoOperador` | Controle maestro da sessão |
| `/session/:sessionId/letra` | `ModoLetra` | Exibição de letra |
| `/session/:sessionId/cifra` | `ModoCifra` | Exibição de cifra (ChordPro) |
| `/session/:sessionId/tv` | `ModoTV` | Projeção para telão |
| `/session/end` | `SessionEnd` | Tela de encerramento |

### 6.3 Páginas com Sidebar (AppShell)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/dashboard` | `DashboardNew` | Dashboard principal |
| `/library` | `SongList` | Lista de músicas |
| `/library/new` | `NewSong` | Criar nova música |
| `/library/:id` | `SongDetail` | Detalhes + cue sheet editor |
| `/library/:songId/study` | `StudyMode` | Modo de estudo |
| `/profile` | `ProfilePage` | Perfil do usuário |
| `/settings` | `SettingsPage` | Configurações |
| `/chat` | `ChatPage` | Chat |
| `/session` | `SessionLanding` | Landing page de sessões |
| `/service/today` | `MySessionToday` | Sessão de hoje |
| `/schedules` | `ScheduleDashboard` | Dashboard de escalas (admin) |
| `/my-schedule` | `MySchedule` | Minhas escalas (músico) |
| `/team` | `TeamPage` | Time/equipe |

### 6.4 Redirecionamento

| Rota | Destino |
|------|---------|
| `/` | Redireciona para `/dashboard` |

---

## 7. Fluxos de Navegação

### Fluxo Principal (Admin/Operator)

```
/login ───────────────────────────────────────────┐
    │                                              │
    └──► /select-ministry (se múltiplos)           │
         │                                         │
         ▼                                         │
    /dashboard (home principal)                    │
         │                                         │
         ├──► /library          ──► /library/:id   │
         │    └──► /library/new                    │
         │         └──► /library/:id/study         │
         │                                         │
         ├──► /schedules (dashboard de escalas)    │
         │    └── Gerencia ciclos mensais          │
         │         └──► Publica → notifica         │
         │                                         │
         ├──► /session (landing de sessões)        │
         │    ├──► /service/today                  │
         │    └──► /session/:sessionId/operador    │
         │         ├──► /session/:sessionId/letra  │
         │         ├──► /session/:sessionId/cifra  │
         │         ├──► /session/:sessionId/tv     │
         │         └──► /session/end               │
         │                                         │
         ├──► /team                                │
         ├──► /chat                                │
         ├──► /profile                             │
         └──► /settings                            │
                                                   │
    /mobile (experiência mobile alternativa) ──────┘
```

### Fluxo do Músico

```
/login ──► /dashboard (visão resumida)
    ├──► /my-schedule (minhas escalas)
    │    └── Confirma/recusa via app
    ├──► /service/today (sessão de hoje)
    ├──► /library (músicas — somente leitura)
    ├──► /chat
    └──► /profile
```

### Fluxo de Sessão ao Vivo

```
/session ──► Seleciona escala ou cria sessão
    │
    ├──► /session/:id/operador (maestro)
    │    └── Avança blocos →
    │         WebSocket broadcast →
    │         Todas as telas sincronizam
    │
    ├──► /session/:id/letra (músico vê letra)
    ├──► /session/:id/cifra (músico vê cifra)
    ├──► /session/:id/tv (projeção congregação)
    │
    └──► /session/end (encerramento)
```

### Fluxo de Convite

```
Admin cria convite ──► Compartilha link
    │
    └── Convidado abre /invite/:token
         ├── Se já tem conta → faz login → associado ao ministério
         └── Se não tem conta → formulário de cadastro → login automático
```

---

## 8. Interligação entre Funcionalidades

### 8.1 Criação de Ciclo → Notificação

```
POST /schedules/cycles
  │
  ├── cycleService.createCycle()
  │     ├── Cria MonthlyScheduleCycle
  │     ├── Cria ServiceSchedule para cada domingo
  │     └── Retorna ciclo criado
  │
  └── (background) Envia notificações:
        ├── Busca MinistryMember com isActiveInSchedule = true
        ├── Para cada um com telegramChatId:
        │     └── TelegramService.sendMessage(
        │           chatId,
        │           template: "disponibilidade_mensal",
        │           keyboard: [[{ text: "✅ Sim" }, { text: "❌ Não" }]]
        │         )
        └── Log em NotificationLog (status: enviado)
```

### 8.2 Publicação de Ciclo → Confirmação

```
POST /schedules/cycles/:id/publish
  │
  ├── cycleService.publishCycle()
  │     └── Status → publicada
  │
  └── Para cada ServiceAssignment com status "confirmado":
        ├── Busca MinistryMember → telegramChatId
        ├── TelegramService.sendMessage(
        │     template: "escala_confirmada",
        │     variables: { data, role, nome_musica }
        │   )
        └── Log em NotificationLog
```

### 8.3 Substituição → Notificação → Resposta

```
POST /schedules/substitution/:assignmentId
  │
  ├── substitutionService.requestSubstitution()
  │     ├── Busca candidatos elegíveis (fairness)
  │     ├── Envia notificação para cada:
  │     │     TelegramService.sendMessage(
  │     │       template: "substituicao_urgente",
  │     │       keyboard: [[{ text: "✅ Aceito" }, { text: "❌ Não posso" }]]
  │     │     )
  │     └── Marca assignment como "convidado"
  │
  └── Músico responde via Telegram:
        ├── callbackQuery: subst:accept/:assignmentId
        │     └── substitutionService.acceptSubstitution()
        │           ├── Atualiza assignment (status: confirmado)
        │           └── Responde callback: "Você foi escalado!"
        └── callbackQuery: subst:reject/:assignmentId
              └── substitutionService.rejectSubstitution()
                    ├── Marca assignment como "recusado"
                    └── Tenta próximo candidato
```

### 8.4 Sessão ao Vivo → WebSocket → Múltiplos Modos

```
ModoOperador (maestro)
  │
  ├── Conecta WebSocket (join: { sessionId, ministryId })
  ├── Avança bloco → POST /sessions/:id/trigger-block
  │     └── Servidor cria SessionExecutionLog
  │           └── WebSocket broadcast: block_changed
  │                 │
  │                 ├── ModoLetra recebe → atualiza letra
  │                 ├── ModoCifra recebe → atualiza cifra
  │                 └── ModoTV recebe → atualiza projeção
  │
  └── Override (navegação não-linear)
        └── POST /sessions/:id/trigger-block (com blockId específico)
              └── Adiciona à overrideStack
```

### 8.5 Dashboard → Múltiplos Serviços

```
GET /dashboard/metrics
  │
  ├── nextService:
  │     ├── Busca próximo ServiceSchedule (date > now)
  │     ├── Conta assignments com status "confirmed"
  │     └── Conta músicas no repertório
  │
  ├── pendingConfirmations:
  │     └── ServiceAssignment onde userId logado e confirmed = false
  │
  ├── totalMusicians:
  │     └── Count MinistryMember do ministério
  │
  ├── songsReady:
  │     └── Count Song onde status = "pronta"
  │
  └── cycleStatus:
        └── MonthlyScheduleCycle mais recente (status + deadline)
```

### 8.6 Telegram Bot → Callbacks → Banco

```
Músico recebe mensagem com botões
  │
  └── Clica botão → Telegram envia callbackQuery para webhook
        │
        POST /telegram/webhook
          │
          ├── TelegramService.handleCallbackQuery()
          │     ├── disp:yes → upsert AvailabilityResponse (available=true)
          │     ├── disp:no  → upsert AvailabilityResponse (available=false)
          │     ├── disp:toggle:cycleId:index → alterna disponibilidade
          │     ├── disp:confirm → confirma seleção individual
          │     ├── subst:accept/:assignmentId → aceita substituição
          │     └── subst:reject/:assignmentId → recusa substituição
          │
          └── Responde com answerCallbackQuery
```

### 8.7 Estrutura de Permissões

```
canEditRepertoire(user, schedule)
  │
  ├── user.role === 'admin' → true
  ├── user.role === 'leader' → true
  ├── user.role === 'operator' → true
  └── Verifica se user é "ministro_de_louvor" na escala
        └── Busca ServiceAssignment onde
              scheduleId === schedule.id
              ministryMember.userId === user.id
              role === "ministro_de_louvor"
```

---

## 9. Decisões de Arquitetura

### 9.1 Monorepo com Turborepo

**Decisão:** Usar monorepo com Turborepo para gerenciar múltiplos pacotes.

**Motivação:**
- Compartilhamento de tipos entre frontend e backend (`packages/types`)
- Biblioteca de componentes independente (`packages/ui`) que pode ser publicada
- Design tokens centralizados (`packages/tokens`)
- Build cache entre pacotes
- Facilidade para adicionar novos apps no futuro (mobile, admin)

### 9.2 Fastify em vez de Express

**Decisão:** Fastify como framework HTTP.

**Motivação:**
- Performance superior (2x+ mais rápido que Express)
- Schema-based validation nativa (via JSON Schema)
- Plugin system mais limpo
- TypeScript-first
- Middleware compatível com Express ecosystem
- Menor overhead de parsing

### 9.3 SQLite com Prisma

**Decisão:** SQLite em desenvolvimento, PostgreSQL planejado para produção.

**Motivação:**
- Zero-config para desenvolvimento local
- Prisma abstrai diferenças entre SQLite e PostgreSQL
- Schema único que funciona em ambos
- Migrations versionadas
- Type safety do Prisma Client
- SQLite adequado para escala de igreja local (~100k registros)

### 9.4 JWT com Refresh Token Rotativo

**Decisão:** Access token curto (15min) + refresh token longo (30d) com rotação.

**Motivação:**
- Access token stateless (JWT) → sem consulta a banco por requisição
- Refresh token rotativo → detecção de vazamento (se token revogado for reusado, revoga todos)
- Cookies httpOnly → proteção contra XSS
- Sessões rastreáveis → usuário pode ver/revogar sessões ativas
- Não depende de sessão server-side → escala horizontalmente

### 9.5 Notificações Multicanal com Provedores

**Decisão:** Interface de provedor de notificação com implementações específicas.

**Motivação:**
- `TelegramNotificationProvider` é o canal principal (gratuito, interativo)
- `WhatsAppNotificationProvider` como fallback/alternativa
- Arquitetura permite adicionar Push Notification, SMS, Email no futuro
- Todos os provedores compartilham o mesmo sistema de logging (`NotificationLog`)
- Templates centralizados por canal

### 9.6 WebSocket para Sessão ao Vivo

**Decisão:** WebSocket dedicado para sincronização em tempo real.

**Motivação:**
- Baixa latência necessária para execução musical (mudanças de bloco)
- Broadcast para múltiplos clientes (operador, letra, cifra, TV)
- Rooms por sessão: `ministry:{id}:session:{id}`
- Polling HTTP seria inadequado para sincronização de blocos
- WebSocket é desconectado quando não há sessão ativa (eficiência)

### 9.7 Algoritmo de Fairness

**Decisão:** Algoritmo próprio de justiça baseado em contador de serviços.

**Motivação:**
- Distribuição equitativa: quem serviu menos tem prioridade
- Roles separadas: guitarrista compete com guitarrista
- Randomização entre empatados evita viés
- `timesServedThisMonth` é resetado mensalmente
- Substituições consideram quem já serviu menos

### 9.8 Soft Delete em vez de Hard Delete

**Decisão:** Músicas usam campo `status` para "deleção".

**Motivação:**
- Auditoria: músicas arquivadas podem ser restauradas
- Integridade referencial: repertórios passados mantêm referência
- Simplicidade: sem triggers de cascade complexos
- Performance: índice por status filtra dados "deletados"

### 9.9 Cookies httpOnly em vez de localStorage

**Decisão:** Tokens armazenados em cookies httpOnly.

**Motivação:**
- Imune a XSS (código JS não acessa o cookie)
- Enviado automaticamente em requisições
- Refresh token rotativo com detecção de roubo
- CSRF mitigado por SameSite e rotas com verbos mutantes

### 9.10 Multi-tenancy por Ministry

**Decisão:** Isolamento de dados por `ministryId`.

**Motivação:**
- Cada igreja/ministério é um tenant isolado
- Usuários podem pertencer a múltiplos ministérios
- Todas as queries filtram por `ministryId`
- Sem necessidade de tabela `tenant` separada
- Prisma middleware pode injetar filtro automaticamente

### 9.11 Modos de Performance Separados

**Decisão:** Quatro modos distintos (operador, letra, cifra, TV) em vez de um único modo configurável.

**Motivação:**
- Cada modo tem requisitos de UI drasticamente diferentes
- Operador precisa de controles, TV precisa de fullscreen limpo
- Letra precisa de scroll suave, cifra precisa de formatação ChordPro
- Compartilham estado via WebSocket (mesma sala)
- Podem ser abertos em dispositivos diferentes simultaneamente

### 9.12 PWA sem Service Worker Complexo

**Decisão:** Funcionalidades PWA mínimas (standalone, wake-lock).

**Motivação:**
- App usado principalmente em contexto de igreja (conectividade confiável)
- Wake lock essencial para manter tela ligada durante execução
- Modo standalone permite "instalar" como app no celular
- Cache off-line não é prioridade (repertório é pequeno)
- `platform/standalone.ts` e `platform/wake-lock.ts` isolam lógica de plataforma
