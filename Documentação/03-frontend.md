# Documentação do Frontend — Floworship

---

## 1. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | React | 18 |
| Linguagem | TypeScript | — |
| Bundler | Vite | — |
| Roteamento | React Router | v6 |
| Estilização | Tailwind CSS | v4 |
| Ícones | Lucide React | — |
| Comunicação | WebSocket (nativo) | — |
| Gerenciamento de estado | Context API + hooks | — |
| Monorepo | Turborepo | — |

### Pacotes internos (`packages/`)

| Pacote | Descrição |
|--------|-----------|
| `@floworship/tokens` | Design tokens (cores, spacing, tipografia) |
| `@floworship/ui` | Componentes reutilizáveis atômicos |
| `@floworship/types` | Tipos TypeScript compartilhados |

### Dependências observadas no bundle
- `framer-motion` — animações
- `date-fns` — manipulação de datas
- `sonner` — toasts
- `wavesurfer.js` — waveform de áudio (SongDetail)
- `chordsheetjs` — parser de chordpro

---

## 2. Estrutura de Diretórios

```
apps/web/src/
├── App.tsx                    # Rotas + providers
├── main.tsx                   # Entry point
├── index.css                  # Estilos globais + Tailwind
├── components/
│   ├── ui/                    # Componentes base
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── SidebarItem.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── Background.tsx
│   │   └── AuroraBackground.tsx
│   ├── layout/                # Layout system
│   │   ├── AppShell.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── MusicianLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── PageHeader.tsx
│   │   └── SearchModal.tsx
│   ├── dashboard/             # Componentes do Dashboard
│   ├── library/               # Biblioteca + cue editor
│   ├── session/               # Card de sessão + status
│   ├── schedule/              # Escalas (admin)
│   ├── schedule-user/         # Escalas (músico)
│   ├── setlist/               # Editor de setlist
│   ├── repertoire/            # Estatísticas de repertório
│   ├── mobile/                # BottomNav, PlayerBar, MusicCard
│   ├── performance/           # BlockReader, OverrideConfirm
│   ├── settings/              # Tabs de configuração
│   ├── profile/               # Header, gráficos
│   ├── chat/                  # Conversas, mensagens
│   └── study/                 # TunerPlaceholder, MetronomePlaceholder
├── pages/
│   ├── auth/                  # LoginPage, InviteAcceptPage
│   ├── dashboard/             # DashboardNew, MinistrySelector
│   ├── library/               # SongList, SongDetail, NewSong
│   ├── performance/           # ModoOperador, ModoLetra, ModoCifra, ModoTV, SessionEnd
│   ├── schedule/              # MySchedule
│   ├── admin/                 # ScheduleDashboard
│   ├── session/               # SessionLanding, MySessionToday
│   ├── settings/              # SettingsPage
│   ├── profile/               # ProfilePage
│   ├── chat/                  # ChatPage
│   ├── mobile/                # MobileHome
│   ├── team/                  # TeamPage
│   └── study/                 # StudyMode
├── hooks/
│   ├── useRole.ts
│   ├── useDashboardMetrics.ts
│   ├── useSessionSocket.ts
│   ├── useSongs.ts
│   ├── useNavigation.ts
│   └── useTextColor.ts
├── context/
│   ├── AuthContext.tsx
│   ├── AuthProvider.tsx
│   └── ThemeContext.tsx
├── config/
│   └── routes.ts              # Constantes de rotas
├── constants/
│   └── worshipRoles.ts        # Mapeamento de cargos
├── services/
│   └── chordpro/parser.ts     # Parse + render de chordpro
├── offine/
│   ├── sync/sync.ts           # Sincronização off-line
│   └── queue/queue.ts         # Fila de operações off-line
├── platform/
│   ├── wake-lock.ts           # Wake lock API
│   └── standalone.ts          # PWA standalone detection
├── utils/
│   └── getTextColors.ts
└── tokens/
    └── (design tokens locais)
```

---

## 3. Sistema de Rotas

### 3.1. Diagrama de Navegação

```
/ ─────────────────────────────→ /dashboard (redirect)

── Públicas ── (sem ProtectedRoute)
/login                               → LoginPage
/invite/:token                       → InviteAcceptPage
/select-ministry                     → MinistrySelector (ProtectedRoute)

── Mobile ── (sem AppShell, navegação própria)
/mobile                              → MobileHome

── Performance ── (fullscreen takeover, sem AppShell)
/session/:sessionId/operador         → ModoOperador
/session/:sessionId/letra            → ModoLetra
/session/:sessionId/cifra            → ModoCifra
/session/:sessionId/tv               → ModoTV
/session/end                         → SessionEnd

── Internas ── (dentro de AppShell → ProtectedShell)
/dashboard                           → DashboardNew
/library                             → SongList
/library/new                         → NewSong
/library/:id                         → SongDetail
/library/:songId/study               → StudyMode
/profile                             → ProfilePage
/settings                            → SettingsPage
/chat                                → ChatPage
/session                             → SessionLanding
/service/today                       → ServiceToday (MySessionToday)
/schedules                           → ScheduleDashboard
/my-schedule                         → MySchedule
/team                                → TeamPage
```

### 3.2. Estrutura de Roteamento (App.tsx)

O arquivo `App.tsx` define três camadas de roteamento:

```
BrowserRouter
  └── AuthProvider
       └── Suspense (lazy loading)
            └── Routes
                 ├── Públicas (sem shell)
                 ├── Mobile (sem shell)
                 ├── Performance (sem shell, takeover)
                 ├── Internas (ProtectedShell → AppShell → Outlet)
                 └── Default (/ → /dashboard)
```

**Proteção de rotas** (`ProtectedRoute`):
1. Se `loading` → spinner
2. Se `!user` → redirect `/login`
3. Se `!user.ministries.length` → redirect `/select-ministry`
4. Senão → renderiza children

**ProtectedShell** combina `ProtectedRoute` + `AppShell` (que renderiza `<Outlet />`).

### 3.3. Constantes de Rotas (`config/routes.ts`)

```typescript
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SELECT_MINISTRY: '/select-ministry',
  DASHBOARD: '/dashboard',
  LIBRARY: '/library',
  LIBRARY_NEW: '/library/new',
  LIBRARY_DETAIL: '/library/:songId',
  LIBRARY_STUDY: '/library/:songId/study',
  SESSION_OPERADOR: '/session/:sessionId/operador',
  SESSION_LETRA: '/session/:sessionId/letra',
  SESSION_CIFRA: '/session/:sessionId/cifra',
  SESSION_TV: '/session/:sessionId/tv',
  SESSION_END: '/session/end',
  SCHEDULES: '/schedules',
  SCHEDULES_ADMIN: '/schedules/admin',
  CHAT: '/chat',
  SETTINGS: '/settings',
  PROFILE: '/profile',
};
```

Os `NAV_GROUPS` definem os grupos da sidebar:
- Visão Geral → Dashboard
- Repertório → Músicas
- Escalas → Escalas do Mês
- Ao Vivo → Sessão
- Comunicação → Chat
- Configurações → Configurações, Perfil

---

## 4. Sistema de Layout

### 4.1. AppShell (Dispatcher)

`AppShell.tsx` é o ponto de entrada do layout. Usa `useRole()` para decidir:

```
AppShell
├── isMusician === true → MusicianLayout (BottomNav)
└── isMusician === false → Background + DashboardLayout (Sidebar)
     ├── <Background className="min-h-screen">
     │   └── <DashboardLayout sidebar={<Sidebar/>} main={<Outlet/>} />
```

### 4.2. DashboardLayout (Admin/Operator)

```
+-----------------------------------------------+
|  Background (Aurora)                          |
|  +------------------------------------------+ |
|  | Sidebar (280px)       | Main (flex-1)    | |
|  | Card gray-dark        | Card gray-dark    | |
|  | overflow-auto         | overflow-y-auto   | |
|  | scrollbar-hide        | p-8 scrollbar-hide| |
|  +------------------------------------------+ |
+-----------------------------------------------+
```

- Sidebar fixa à esquerda (280px)
- Conteúdo em Card interno com padding `p-8`
- Background: componente `Background` com efeito aurora

### 4.3. MusicianLayout (Músico)

```
+-----------------------------------------------+
| Header (sticky top, backdrop-blur)            |
| - Logo + saudação "Bem-vindo, [nome]"         |
| - Botão de logout                              |
+-----------------------------------------------+
| Main (flex-1, px-4, pb-24)                   |
| <Outlet />                                     |
|                                                |
+-----------------------------------------------+
| BottomNav (fixed bottom, backdrop-blur)       |
| [Dashboard] [Músicas] [Escala] [Perfil]       |
+-----------------------------------------------+
```

BottomNav com 4 abas:
| Ícone | Label | Rota |
|-------|-------|------|
| LayoutDashboard | Dashboard | `/dashboard` |
| Music | Músicas | `/library` |
| CalendarCheck | Escala | `/my-schedule` |
| User | Perfil | `/profile` |

### 4.4. Performance Layout (Takeover)

Telas de performance são **fullscreen sem sidebar**:
- ModoOperador, ModoLetra, ModoCifra, ModoTV
- Cada um gerencia sua própria navegação (bottom nav inline no ModoOperador)
- Protegidas por `ProtectedRoute` mas sem `AppShell`

### 4.5. Mobile Layout

Rota `/mobile` renderiza `MobileHome` com:
- Background próprio
- BottomNav mobile (home, explore, library, profile)
- PlayerBar flutuante

---

## 5. Páginas — Detalhamento

### 5.1. LoginPage (`/login`)

**Propósito**: Autenticação de usuários (músicos e administradores).

**Funcionalidades**:
- Modo músico: login com telefone + PIN de 4 dígitos
- Modo admin: login com email + senha
- Modo admin: cadastro de nova conta (name, email, password)
- Alternância entre modos via botão
- Tratamento de erros inline

**API calls**:
- `POST /auth/login` — músico (phone, pin)
- `POST /auth/login/admin` — admin (email, password)
- `POST /auth/register/admin` — registro (name, email, password)

**Componentes usados**: Button, Input, Lucide (Phone, Lock, Mail, Eye, EyeOff)

### 5.2. InviteAcceptPage (`/invite/:token`)

**Propósito**: Aceitar convite de ministério por músico.

**Funcionalidades**:
- Valida token de convite via API
- Exibe nome do ministério que convidou
- Formulário: nome + PIN (4 dígitos) + confirmação de PIN
- Feedback com toast via sonner

**API calls**:
- `GET /auth/invite/:token` — valida convite
- `POST /auth/invite/accept` — aceita convite (token, name, pin)

**Componentes usados**: Card, Button, Input, Lucide

### 5.3. MinistrySelector (`/select-ministry`)

**Propósito**: Seleção de ministério quando usuário pertence a múltiplos.

**Funcionalidades**:
- Lista ministérios do usuário
- Seleção persiste em cookie (`ministry_id`)
- Criação de novo ministério

**API calls**:
- `GET /auth/me` — obtém lista de ministérios

### 5.4. DashboardNew (`/dashboard`)

**Propósito**: Página inicial com visão geral do ministério.

**Funcionalidades**:
- Cards de métricas:
  - **NextServiceCard**: próximo culto (data, status, repertório)
  - **PendingConfirmationsCard**: confirmações pendentes
  - **MusiciansCountCard**: total de músicos + novos este mês
  - **RepertoireStatsCard**: total de músicas + prontas
- **UpcomingServicesList**: lista de próximos cultos com vagas
- **CycleStatusWidget**: status do ciclo de escalas
- **QuickActionsGrid**: ações rápidas (nova música, nova sessão, etc.)
- **RecentActivityTimeline**: linha do tempo de atividades recentes
- Skeleton loading + estado de erro com retry

**API calls** (via `useDashboardMetrics`):
- `GET /dashboard/metrics` — métricas agregadas
- `GET /dashboard/upcoming-services` — próximos cultos
- `GET /dashboard/repertoire-stats` — estatísticas de repertório
- `GET /dashboard/recent-activity` — atividades recentes

Polling automático a cada 60s.

**Componentes**: DashboardHeader, NextServiceCard, PendingConfirmationsCard, MusiciansCountCard, RepertoireStatsCard, UpcomingServicesList, CycleStatusWidget, QuickActionsGrid, RecentActivityTimeline, SkeletonCard

### 5.5. ScheduleDashboard (`/schedules`)

**Propósito**: Gerenciamento de ciclos de escalas (admin).

**Funcionalidades**:
- **Criação de ciclo**: POST /schedules/cycles (mês, ano)
- **Fechar coleta**: POST /schedules/cycles/:id/close
- **Aprovar escalas**: POST /schedules/cycles/:id/approve
- **Publicar e notificar**: POST /schedules/cycles/:id/publish
- **Cancelar ciclo**: POST /schedules/cycles/:id/cancel
- **Botão de teste**: Confirma disponibilidade de todos os músicos
- **Lista de domingos**: SundayCard com atribuições por domingo
- **Status do ciclo**: CycleStatus badge + descrição
- Estados: sem ciclo (empty state), carregando, erro com retry

**API calls**:
- `GET /schedules/cycles/current` — ciclo atual + domingos
- `POST /schedules/cycles` — criar ciclo
- `POST /schedules/cycles/:id/close` — fechar coleta
- `POST /schedules/cycles/:id/approve` — aprovar
- `POST /schedules/cycles/:id/publish` — publicar
- `POST /schedules/cycles/:id/cancel` — cancelar
- `POST /schedules/cycles/:id/confirm-all` — teste

**Componentes**: SundayCard, CycleStatus, Button, Lucide

### 5.6. MySchedule (`/my-schedule`)

**Propósito**: Visualização e confirmação de escalas pelo músico.

**Funcionalidades**:
- Lista de assignments com status (pendente/confirmado/recusado)
- Filtros por status com contagem
- Ação: confirmar ou recusar presença
- Formulário de disponibilidade (AvailabilityForm)
- Resumo: contagem de pendentes e confirmados
- Estado informativo quando não há ciclo ativo

**API calls**:
- `GET /schedules/cycles/current` — ciclo ativo
- `GET /schedules/my-assignments` — assignments do usuário
- `PUT /schedules/assignments/:id/confirm` — confirmar/recusar

**Componentes**: AssignmentCardWithDetails, AvailabilityForm, Lucide

### 5.7. SongList (`/library`)

**Propósito**: Biblioteca de músicas do ministério.

**Funcionalidades**:
- Grid de músicas com Card (título, artista, status, tom)
- Barra de busca com filtro
- Filtro por status: Todas, Rascunho, Pronta, Arquivada
- Botão "Nova Música" (admin apenas)
- Skeleton loading + estado de erro
- Contagem total de músicas

**API calls** (via `useSongs`):
- `GET /songs` — lista todas
- `DELETE /songs/:id` — arquivar

**Componentes**: Card, Button, Input, Lucide

### 5.8. SongDetail (`/library/:id`)

**Propósito**: Detalhes e edição de música + roteiro (cue sheet).

**Funcionalidades**:
- **Tab Informações**: SongForm com dados da música
- **Tab Roteiro**: CueSheetEditor com WaveformEditor, BlockManager, ChordProPreview
- **Tab Histórico**: SongHistory
- Botão "Estudar" → `/library/:songId/study`
- Músico redirecionado direto para StudyMode
- Atualização de dados via PUT

**API calls**:
- `GET /songs/:id` — detalhes da música
- `PUT /songs/:id` — atualizar (info, cue sheet, etc.)

**Componentes**: SongForm, CueSheetEditor, SongHistory, Lucide

### 5.9. NewSong (`/library/new`)

**Propósito**: Criação de nova música.

**Funcionalidades**:
- SongForm em modo criação
- Redireciona para SongDetail após sucesso

**API calls**:
- `POST /songs` — criar música

### 5.10. ServiceToday / MySessionToday (`/service/today`)

**Propósito**: Serviço do dia para músicos.

**Funcionalidades**:
- Exibe data formatada
- Mostra função do músico + se é ministro
- Lista da equipe do dia
- Setlist do serviço (editável por ministro)
- Botões: Modo Ensaio, Modo Culto (→ ModoOperador)
- Modal de SetlistEditor

**API calls**:
- `GET /schedules/today` — serviço de hoje

**Componentes**: SetlistEditor, Lucide

### 5.11. SessionLanding (`/session`)

**Propósito**: Gerenciamento de sessões ao vivo.

**Funcionalidades**:
- Lista de sessões agendadas (cultos/ensaios)
- Ações rápidas: Novo Ensaio, Modo Culto, Importar Repertório, Encerrar Sessão
- WebSocketStatus indicator
- Empty state quando não há sessões

**API calls**:
- `GET /sessions/upcoming` — sessões futuras
- `POST /sessions` — criar sessão (ensaio ou culto)
- `POST /schedules/today` — verificar escala de hoje
- `POST /sessions/:scheduleId/import-repertoire` — importar setlist

**Componentes**: SessionCard, WebSocketStatus, Lucide

### 5.12. ProfilePage (`/profile`)

**Propósito**: Perfil do usuário com dados de presença e instrumento.

**Funcionalidades**:
- ProfileHeader: nome, email, role, ministério
- InstrumentSelector: seleção e salvamento de instrumento principal
- AvailabilityCycle: ciclo de disponibilidade
- PresenceChart: gráfico de presenças (confirmados × total)
- DistributionChart: distribuição de atribuições
- ParticipationHistory: histórico de participações

**API calls**:
- `GET /profile/me` — dados do perfil
- `PUT /profile/me` — atualizar instrumento

**Componentes**: ProfileHeader, InstrumentSelector, AvailabilityCycle, PresenceChart, ParticipationHistory, DistributionChart

### 5.13. SettingsPage (`/settings`)

**Propósito**: Configurações do ministério e do sistema.

**Funcionalidades** (via abas):
| Tab | Componente | Descrição |
|-----|-----------|-----------|
| ministry | GeneralSettings | Nome, descrição, cidade, website |
| members | MemberManagement | Gerenciamento de membros |
| musicians | MusicianManagement | Gerenciamento de músicos |
| config | MinistryConfigSettings | Configurações avançadas |
| telegram | TelegramIntegration | Integração com Telegram |
| notifications | NotificationPrefs | Preferências de notificação |
| performance | PerformanceSettings | Transições, ordem de renderização |

- ThemeToggle no header

**API calls**:
- `PUT /settings/ministry` — dados do ministério
- `PUT /settings/notifications` — preferências
- `PUT /settings/performance` — config de performance

**Componentes**: SettingsTabs, GeneralSettings, MemberManagement, MusicianManagement, MinistryConfigSettings, TelegramIntegration, NotificationPrefs, PerformanceSettings, ThemeToggle

### 5.14. ChatPage (`/chat`)

**Propósito**: Comunicação entre equipe.

**Funcionalidades**:
- ConversationList: grupos por tipo (sunday, instrument, general)
- MessageBubble: mensagens com timestamp e status
- MessageInput: envio de mensagens
- ChatHeader com ícone por tipo de conversa
- Estados: selecione uma conversa (empty state)

**Componentes**: ConversationList, MessageBubble, MessageInput, Lucide

### 5.15. TeamPage (`/team`)

**Propósito**: Gerenciamento da equipe de músicos (admin).

**Funcionalidades**:
- Lista de membros ativos e pausados
- Formulário de adição/edição: usuário, instrumento, funções, status
- Alternar ativo/pausado
- Gerar link de vinculação do Telegram
- Excluir membro com ConfirmDialog (lock de 5s)
- Contagem total: "X ativos • Y pausados"

**API calls**:
- `GET /auth/me` — obter ministryId
- `GET /musicians` — lista de músicos
- `GET /ministries/:id/members` — membros do ministério
- `POST /musicians` — adicionar músico
- `PUT /musicians/:id` — atualizar
- `DELETE /musicians/:id` — remover
- `GET /telegram/link/:memberId` — link do Telegram

**Componentes**: ConfirmDialog, Lucide, worshipRoles

### 5.16. MobileHome (`/mobile`)

**Propósito**: Home mobile-first com experiência estilo player de música.

**Funcionalidades**:
- Header: saudação + notificações + search
- Seção "Featured" com MusicCard
- Seção "Recent Albums" com MusicCard
- PlayerBar: player flutuante no rodapé
- BottomNav: home, explore, library, profile

**Componentes**: Background, BottomNav, PlayerBar, MusicCard, Button, Input

### 5.17. StudyMode (`/library/:songId/study`)

**Propósito**: Modo de estudo com cifra/letra + ferramentas.

**Funcionalidades**:
- BlockReader para navegação entre blocos
- TunerPlaceholder (placeholder para afinador)
- MetronomePlaceholder (placeholder para metrônomo)

**Componentes**: BlockReader, TunerPlaceholder, MetronomePlaceholder

---

## 6. Páginas de Performance (WebSocket)

### 6.1. ModoOperador (`/session/:sessionId/operador`)

**Propósito**: Controle central da sessão ao vivo. O operador navega entre blocos e todos os participantes recebem a atualização via WebSocket.

**Funcionalidades**:
- `useSessionSocket`: conexão WebSocket + snapshot inicial via HTTP
- **DialCircular**: progresso circular da sessão
- **Grid de blocos**: lista todos os blocos, destaca o ativo, clique para trigger
- **Timeline de pílulas**: indicadores compactos de progresso
- **Status de conexão**: indicador ●/○
- **Override ativo**: badge quando operador força um bloco fora da ordem
- **Bottom nav**: Ordem do Culto, Operador, Chat, Encerrar

### 6.2. ModoLetra (`/session/:sessionId/letra`)

**Propósito**: Visualização da letra da música sincronizada com a sessão.

**Funcionalidades**:
- BlockReader modo "letra"
- Controle de sincronia: **Controlado** (segue operador) × **Manual** (navegação própria)
- Botão toggle synced/manual
- Navegação: avançar, voltar, selecionar bloco

### 6.3. ModoCifra (`/session/:sessionId/cifra`)

**Propósito**: Visualização da cifra sincronizada.

**Funcionalidades**:
- BlockReader modo "cifra"
- Transposição de tom (+/-)
- Mesmo controle de sincronia do ModoLetra
- Ao religar Controlado, pula para o bloco atual da sessão

### 6.4. ModoTV (`/session/:sessionId/tv`)

**Propósito**: Tela de projeção para congregação.

**Funcionalidades**:
- DialCircular grande (progresso)
- Nome do bloco atual
- Sequência "Bloco X de Y"
- Sem controles de navegação (apenas exibição)

### 6.5. SessionEnd (`/session/end`)

**Propósito**: Tela de encerramento de sessão.

**Funcionalidades**:
- Mensagem "Sessão encerrada"
- Botão "Voltar ao início"

---

## 7. Árvore de Componentes

```
App
└── BrowserRouter
    └── AuthProvider
        └── ThemeProvider (via App.tsx indiretamente — usado por ThemeToggle)
            └── AppRoutes
                ├── Públicas
                │   ├── LoginPage
                │   │   ├── BrandPanel
                │   │   ├── Input (phone)
                │   │   └── Button
                │   ├── InviteAcceptPage
                │   │   ├── Card
                │   │   └── Button
                │   └── ProtectedRoute
                │       └── MinistrySelector
                │
                ├── /mobile (ProtectedRoute)
                │   └── MobileHome
                │       ├── Background
                │       ├── Input (search)
                │       ├── MusicCard × N
                │       ├── PlayerBar
                │       └── BottomNav
                │
                ├── Performance (ProtectedRoute)
                │   ├── ModoOperador
                │   │   ├── DialCircular (@floworship/ui)
                │   │   ├── Timeline (pílulas)
                │   │   └── Grid de blocos
                │   ├── ModoLetra
                │   │   └── BlockReader
                │   ├── ModoCifra
                │   │   └── BlockReader
                │   ├── ModoTV
                │   │   └── DialCircular (@floworship/ui)
                │   └── SessionEnd
                │
                └── ProtectedShell (ProtectedRoute + AppShell)
                    ├── AppShell
                    │   ├── [isMusician]
                    │   │   → MusicianLayout
                    │   │       ├── Header
                    │   │       ├── Outlet
                    │   │       └── BottomNav (4 tabs)
                    │   │
                    │   └── [admin/operator]
                    │       → Background
                    │         → DashboardLayout
                    │             ├── Sidebar
                    │             └── Outlet
                    │
                    └── Páginas (dentro do Outlet):
                        ├── DashboardNew
                        │   ├── DashboardHeader
                        │   ├── NextServiceCard
                        │   ├── PendingConfirmationsCard
                        │   ├── MusiciansCountCard
                        │   ├── RepertoireStatsCard
                        │   ├── UpcomingServicesList
                        │   ├── CycleStatusWidget
                        │   ├── QuickActionsGrid
                        │   └── RecentActivityTimeline
                        │
                        ├── SongList
                        │   ├── Card × N
                        │   ├── Input (search)
                        │   └── Button
                        │
                        ├── SongDetail
                        │   ├── SongForm
                        │   ├── CueSheetEditor
                        │   │   ├── WaveformEditor
                        │   │   ├── BlockManager
                        │   │   └── ChordProPreview
                        │   └── SongHistory
                        │
                        ├── ScheduleDashboard
                        │   ├── CycleStatus
                        │   ├── Button × N
                        │   └── SundayCard × N
                        │
                        ├── MySchedule
                        │   ├── AssignmentCardWithDetails × N
                        │   └── AvailabilityForm
                        │
                        ├── ServiceToday
                        │   └── SetlistEditor (modal)
                        │
                        ├── SessionLanding
                        │   ├── SessionCard × N
                        │   └── WebSocketStatus
                        │
                        ├── SettingsPage
                        │   ├── ThemeToggle
                        │   ├── SettingsTabs
                        │   └── Tab content:
                        │       ├── GeneralSettings
                        │       ├── MemberManagement
                        │       ├── MusicianManagement
                        │       ├── MinistryConfigSettings
                        │       ├── TelegramIntegration
                        │       ├── NotificationPrefs
                        │       └── PerformanceSettings
                        │
                        ├── ProfilePage
                        │   ├── ProfileHeader
                        │   ├── InstrumentSelector
                        │   ├── AvailabilityCycle
                        │   ├── PresenceChart
                        │   ├── DistributionChart
                        │   └── ParticipationHistory
                        │
                        ├── ChatPage
                        │   ├── ConversationList
                        │   ├── MessageBubble × N
                        │   └── MessageInput
                        │
                        ├── TeamPage
                        │   └── ConfirmDialog
                        │
                        └── StudyMode
                            ├── BlockReader
                            ├── TunerPlaceholder
                            └── MetronomePlaceholder
```

---

## 8. Contextos e Estado Global

### 8.1. AuthContext / AuthProvider

```typescript
interface AuthUser {
  id: string;
  email: string;
  name: string;
  ministries: { ministryId: string; role: string }[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}
```

- `AuthProvider` monta e faz `fetch('/auth/me')` com `credentials: 'include'`
- `useAuth()` hook para acesso
- Cookies httpOnly: `access_token`, `refresh_token`

### 8.2. ThemeContext / ThemeProvider

```typescript
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}
```

- Aplica design tokens via CSS custom properties em `document.documentElement`
- Dark tokens: fundo preto (#000), texto branco, accent mint (#21F1A8)
- Light tokens: fundo off-white (#F5F5F0), texto preto, accent lime (#B8E844)
- Persiste em `localStorage.getItem('theme')`
- Atributo `data-theme` no `<html>` e `<body>`

---

## 9. Hooks Customizados

### 9.1. `useRole()`

```typescript
function useRole(): {
  role: 'admin' | 'operator' | 'musician';
  isAdmin: boolean;
  isOperator: boolean;
  isMusician: boolean;
  canManage: boolean;
}
```

Lê `user.ministries[0].role` do AuthContext. Usado pelo AppShell para decidir o layout.

### 9.2. `useSessionSocket(sessionId, ministryId)`

```typescript
function useSessionSocket(sessionId: string, ministryId: string): {
  currentBlock: Block | undefined;
  blocks: Block[];
  sequence: number;
  isOverrideActive: boolean;
  isConnected: boolean;
  triggerBlock: (blockId: string) => Promise<void>;
}
```

**Fluxo WebSocket**:
1. Monta → faz `fetch(/sessions/:sessionId/state)` para snapshot inicial
2. Conecta WebSocket: `ws://host/ws`
3. Envia `{ type: 'join', sessionId, ministryId }`
4. Recebe `{ type: 'block_changed', blockId, sequence, wasOverride }`
5. Reconexão automática com exponential backoff (1s → 30s max)
6. `triggerBlock(blockId)`: `POST /sessions/:sessionId/trigger-block`

### 9.3. `useDashboardMetrics(ministryId)`

```typescript
function useDashboardMetrics(ministryId: string): {
  metrics: DashboardMetrics | null;
  upcomingServices: any[];
  repertoireStats: any;
  recentActivity: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

**DashboardMetrics**:
- `nextService`: próximo culto
- `pendingConfirmations`: confirmações pendentes
- `totalMusicians`: total de músicos
- `songsReady`: músicas prontas
- `cycleStatus`: status do ciclo
- `cycleDeadline`: prazo

**API calls paralelas**:
- `GET /dashboard/metrics`
- `GET /dashboard/upcoming-services`
- `GET /dashboard/repertoire-stats`
- `GET /dashboard/recent-activity`

Polling automático a cada 60s. Suporte a mock data (`USE_MOCKS`).

### 9.4. `useSongs()`

```typescript
function useSongs(): {
  songs: Song[];
  loading: boolean;
  error: string | null;
  createSong: (data) => Promise<Song>;
  updateSong: (id, data) => Promise<Song>;
  deleteSong: (id) => Promise<void>;
  refetch: () => Promise<void>;
}
```

CRUD completo de músicas via API REST.

### 9.5. `useNavigation()`

Hook de navegação — implementação de navegação entre telas.

### 9.6. `useTextColor()`

Hook utilitário para determinar cor de texto com base no tema.

---

## 10. Fluxo de Performance (WebSocket e Sessões ao Vivo)

### 10.1. Arquitetura

```
                    ┌─────────────┐
                    │   Servidor  │
                    │  WebSocket  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │ Operador  │   │  Músico   │   │  Projeção │
    │ (Controle)│   │ (Letra)   │   │   (TV)    │
    └───────────┘   └───────────┘   └───────────┘
```

### 10.2. Ciclo de uma Sessão

1. **Criação**: SessionLanding → `POST /sessions` → redireciona para `/session/:id/operador`
2. **Entrada**: ModoOperador monta `useSessionSocket` → fetch snapshot → conecta WS
3. **Trigger**: Operador clica em bloco → `POST /sessions/:id/trigger-block`
4. **Broadcast**: Servidor envia `block_changed` para todos na sala
5. **Recepção**: ModoLetra/ModoCifra/ModoTV recebem e atualizam UI
6. **Override**: Operador pode pular para qualquer bloco (fora da ordem programada)
7. **Sincronia**: Músicos podem desativar sync e navegar por conta própria
8. **Encerramento**: Botão "Encerrar sessão" → `/session/end`

### 10.3. Componentes de Performance

| Componente | Input | Output |
|-----------|-------|--------|
| `useSessionSocket` | sessionId, ministryId | currentBlock, blocks, triggerBlock |
| `BlockReader` | blocks, index, mode, locked | Renderiza cifra/letra |
| `DialCircular` | value (progresso 0-100) | Círculo de progresso |
| `OverrideConfirm` | — | Confirmação de override |

### 10.4. WebSocket Status

- Conectado: indicador verde "●"
- Desconectado: indicador vermelho "○"
- Reconexão automática com exponential backoff

---

## 11. Tabela de Rotas Frontend × Rotas API

### 11.1. Autenticação

| Rota Frontend | Método | Rota API | Propósito |
|---------------|--------|----------|-----------|
| /login | POST | /auth/login | Login músico (phone + pin) |
| /login | POST | /auth/login/admin | Login admin (email + password) |
| /login | POST | /auth/register/admin | Registro admin |
| /invite/:token | GET | /auth/invite/:token | Validar convite |
| /invite/:token | POST | /auth/invite/accept | Aceitar convite |
| — | GET | /auth/me | Obter usuário atual (montagem) |

### 11.2. Dashboard

| Rota Frontend | Método | Rota API | Propósito |
|---------------|--------|----------|-----------|
| /dashboard | GET | /dashboard/metrics | Métricas do dashboard |
| /dashboard | GET | /dashboard/upcoming-services | Próximos cultos |
| /dashboard | GET | /dashboard/repertoire-stats | Stats de repertório |
| /dashboard | GET | /dashboard/recent-activity | Atividades recentes |

### 11.3. Biblioteca (Songs)

| Rota Frontend | Método | Rota API | Propósito |
|---------------|--------|----------|-----------|
| /library | GET | /songs | Listar músicas |
| /library | POST | /songs | Criar música |
| /library/:id | GET | /songs/:id | Detalhes da música |
| /library/:id | PUT | /songs/:id | Atualizar música |
| /library/:id | DELETE | /songs/:id | Deletar música |

### 11.4. Escalas (Schedules)

| Rota Frontend | Método | Rota API | Propósito |
|---------------|--------|----------|-----------|
| /schedules | GET | /schedules/cycles/current | Ciclo atual + domingos |
| /schedules | POST | /schedules/cycles | Criar ciclo |
| /schedules | POST | /schedules/cycles/:id/close | Fechar coleta |
| /schedules | POST | /schedules/cycles/:id/approve | Aprovar escalas |
| /schedules | POST | /schedules/cycles/:id/publish | Publicar |
| /schedules | POST | /schedules/cycles/:id/cancel | Cancelar ciclo |
| /schedules | POST | /schedules/cycles/:id/confirm-all | Teste: confirmar todos |
| /my-schedule | GET | /schedules/my-assignments | Escalas do músico |
| /my-schedule | PUT | /schedules/assignments/:id/confirm | Confirmar/recusar |
| /service/today | GET | /schedules/today | Serviço de hoje |

### 11.5. Sessões (WebSocket + HTTP)

| Rota Frontend | Método | Rota API | Propósito |
|---------------|--------|----------|-----------|
| /session | GET | /sessions/upcoming | Sessões futuras |
| /session | POST | /sessions | Criar sessão (culto/ensaio) |
| /session | POST | /sessions/:id/import-repertoire | Importar setlist |
| /session/:id/* | WS | /ws | WebSocket (join, block_changed) |
| /session/:id/* | GET | /sessions/:id/state | Snapshot da sessão |
| /session/:id/* | POST | /sessions/:id/trigger-block | Trigger bloco |

### 11.6. Perfil

| Rota Frontend | Método | Rota API | Propósito |
|---------------|--------|----------|-----------|
| /profile | GET | /profile/me | Dados do perfil |
| /profile | PUT | /profile/me | Atualizar perfil |

### 11.7. Configurações

| Rota Frontend | Método | Rota API | Propósito |
|---------------|--------|----------|-----------|
| /settings | PUT | /settings/ministry | Dados do ministério |
| /settings | PUT | /settings/notifications | Preferências de notificação |
| /settings | PUT | /settings/performance | Config de performance |

### 11.8. Equipe

| Rota Frontend | Método | Rota API | Propósito |
|---------------|--------|----------|-----------|
| /team | GET | /musicians | Listar músicos |
| /team | GET | /ministries/:id/members | Membros do ministério |
| /team | POST | /musicians | Adicionar músico |
| /team | PUT | /musicians/:id | Atualizar músico |
| /team | DELETE | /musicians/:id | Remover músico |
| /team | GET | /telegram/link/:memberId | Link do Telegram |

---

## 12. Design Tokens (Tema Dark)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-bg-primary` | `#000000` | Fundo principal |
| `--color-bg-secondary` | `#0a0a0a` | Fundo secundário |
| `--color-bg-tertiary` | `#121212` | Fundo terciário |
| `--color-bg-card-gray-dark` | `#171717` | Card escuro |
| `--color-text-primary` | `#FFFFFF` | Texto principal |
| `--color-text-secondary` | `#E0E0E0` | Texto secundário |
| `--color-text-tertiary` | `#A3A3A3` | Texto terciário |
| `--color-accent-mint` | `#21F1A8` | Accent mint (verde) |
| `--color-accent-mint-dim` | `rgba(33,241,168,0.15)` | Accent mint dim |
| `--color-border-subtle` | `#262626` | Borda sutil |
| `--color-border-strong` | `#333333` | Borda forte |
| `--color-success` | `#3DDC97` | Sucesso |
| `--color-warning` | `#FFB648` | Aviso |
| `--color-danger` | `#FF5C5C` | Erro |
| `--color-info` | `#4A9EFF` | Informação |

---

## 13. Convenções de Código

- **Lazy loading**: todas as páginas usam `React.lazy()` + `Suspense`
- **Spinner**: componente `spinner-gradient` com classe CSS
- **Fetch**: `fetch` nativo com `credentials: 'include'` para cookies
- **API URL**: `import.meta.env.VITE_API_URL || 'http://localhost:3001/api'`
- **CSS Modules / CSS global**: arquivos `.css` ao lado dos componentes
- **Tema**: classes `text-text-primary`, `bg-bg-dark`, etc. via variáveis CSS
- **Ícones**: Lucide React com `strokeWidth={1.5}`
