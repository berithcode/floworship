# Floworship — Fase 5: Motor de Escalas + Telegram + Performance Mode UI

## Objetivo

Implementar as peças críticas faltando para o produto funcionar end-to-end:
1. **Substituir WhatsApp por Telegram** como canal primário de notificações
2. **Abstrair o provider de notificações** para canal-agêntrico
3. **Completar o motor de geração de escalas** com algoritmo de fairness
4. **UI do Modo Performance** (Operador/Letra/Cifra) integrada com WebSocket
5. **WebSocket client** completo com reconnection e state sync

---

## 1. Telegram Bot Integration

### 1.1 Criar Bot e Configuração

**Passos:**
1. Criar bot via BotFather (`@BotFather`) → obter `BOT_TOKEN`
2. Configurar webhook endpoint: `POST /api/telegram/webhook`
3. Adicionar `BOT_TOKEN` ao `.env` como `TELEGRAM_BOT_TOKEN`
4. Adicionar campo `telegram_chat_id` ao Prisma schema

**Endpoint webhook:** `apps/api/src/routes/telegram-webhook.ts`

### 1.2 Modelo de Dados (atualizar Prisma)

```prisma
model Musician {
  // ...existing fields...
  telegram_chat_id: String?
  telegram_username: String?
  whatsapp_phone: String?
  whatsapp_opt_in: Boolean?
}

model NotificationLog {
  id              String   @id @default(cuid())
  musician_id     String?
  channel: "telegram" | "push" | "whatsapp"
  template_name   String
  context:        String   @default("{}")
  sent_at         DateTime @default(now())
  status:         String   @default("enviado")
  response_payload String?
}
```

### 1.3 Telegram Service

**Arquivo:** `apps/api/src/services/telegram/index.ts`

```typescript
interface TelegramMessage {
  chat_id: string;
  text: string;
  reply_markup?: {
    inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
  };
}

interface TelegramCallbackQuery {
  id: string;
  from: { id: number; username?: string };
  message?: { chat: { id: number } };
  data?: string;
}
```

**Métodos:**
- `sendMessage(chatId, text, replyMarkup?)` → POST para API Telegram
- `answerCallbackQuery(callbackQueryId)` → acknowledge botão
- `parseCommand(ctx: TelegrafContext)` → handler para `/start`

### 1.4 Fluxo de Vínculo (Deep Link)

```
/start?start=<linking_token>
```

1. Admin cria convite → gera `linking_token` (8 chars, expira 7 dias)
2. No fluxo de aceite, usuário vê botão "Vincular Telegram"
3. Botão abre: `https://t.me/FloworshipBot?start=<linking_token>`
4. Usuário toca → Telegram envia /start com token
5. Backend valida token → associa `telegram_chat_id` ao musician
6. Responde confirmação no Telegram

**Endpoint:** `POST /api/auth/invite/:token/telegram-link`
- Recebe `telegram_chat_id` e `telegram_username`
- Atualiza `Musician`

### 1.5 Templates de Notificação (Telegram)

Os 5 templates necessários (sem aprovação, texto livre):

```typescript
const TEMPLATES = {
  disponibilidade_mensal: {
    text: `🎵 Olá, {name}!\n\nEstamos coletando disponibilidade para {month}.\n\nVocê está disponível nos seguintes domingos?\n\n{buttons}`,
    buttons: [{ text: 'Disponível', callback_data: `disp:yes:{cycleId}` }, { text: 'Indisponível', callback_data: `disp:no:{cycleId}` }]
  },
  
  escala_confirmada: {
    text: `✅ Sua escala para {date} foi confirmada!\n\nMinistério: {ministryName}\nFunção: {role}\n\nToque aqui para ver detalhes.`,
    button: { text: 'Ver escala', url: '{appUrl}/my-schedule/{scheduleId}' }
  },
  
  repertorio_definido: {
    text: `🎶 Repertório do culto de {date}!\n\n{repertoireList}\n\nPrepare-se no Modo Estudo!`,
    button: { text: 'Estudar cifras', url: '{appUrl}/library/{songId}/study' }
  },
  
  substituicao_urgente: {
    text: `🚨 Substituição necessária!\n\nVocê foi convidado para substituir em:\n📅 {date}\n🎵 {songTitle}\n🎯 Função: {role}\n\nPode aceitar?`,
    buttons: [{ text: '✅ Aceito', callback_data: `subst:accept:{assignmentId}` }, { text: '❌ Não posso', callback_data: `subst:decline:{assignmentId}` }]
  },
  
  lembrete_disponibilidade: {
    text: `⏰ Lembrete: falta {days} dia(s) para fechar disponibilidade de {month}.\n\nSua resposta ainda não foi registrada.`
  }
};
```

### 1.6 Handler de Callback Queries

**Arquivo:** `apps/api/src/routes/telegram-webhook.ts`

```typescript
// Callback data patterns:
// disp:yes:{cycleId}    → disponibilidade positiva
// disp:no:{cycleId}     → disponibilidade negativa
// subst:accept:{id}     → aceitar substituição
// subst:decline:{id}     → recusar substituição
```

1. Parsear `callback_query.data`
2. Dispatch para `telegramCallbackHandler`
3. Atualizar `availability_response` ou `service_assignment` conforme padrão
4. Responder `answerCallbackQuery` com confirmação visível no Telegram

---

## 2. Notification Provider Abstraction

### 2.1 Interface Canal-Agnóstica

**Arquivo:** `apps/api/src/services/notifications/provider.ts`

```typescript
interface NotificationProvider {
  send(notification: Notification): Promise<NotificationResult>;
  onReply(handler: (reply: NotificationReply) => void): void;
  status(): Promise<ProviderStatus>;
}

interface Notification {
  recipient: string;          // chat_id, phone, ou push token
  template: string;           // nome do template
  context: Record<string, any>; // variáveis do template
  channel: 'telegram' | 'push' | 'whatsapp';
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

### 2.2 Implementações

**Telegram:** `apps/api/src/services/notifications/telegram.ts`
- Implementa `NotificationProvider`
- Usa `node-telegram-bot-api` ou `telegraf`

**Push (futuro):** `apps/api/src/services/notifications/push.ts`
- Web Push API com service worker

**WhatsApp (legacy):** `apps/api/src/services/notifications/whatsapp.ts`
- Wraps existing OpenWA implementation
- Marca como `legacy` - não mais recomendado

### 2.3 Notification Service

**Arquivo:** `apps/api/src/services/notifications/index.ts`

```typescript
export async function sendNotification(
  musicianId: string,
  template: string,
  context: Record<string, any>,
  preferredChannel: 'telegram' | 'push' = 'telegram'
): Promise<void>
```

1. Busca musician por ID
2. Seleciona canal disponível (telegram > push > nenhum)
3. Renderiza template com context
4. Dispara via provider correto
5. Loga em `notification_log`

---

## 3. Motor de Geração de Escalas

### 3.1 Algoritmo (Greedy + Fairness Score)

**Arquivo:** `apps/api/src/services/scheduler/engine.ts`

```typescript
interface ScheduleGenerationInput {
  cycleId: string;
  month: number;
  year: number;
}

interface FairnessScore {
  musicianId: string;
  role: string;
  timesServedThisMonth: number;
  lastServedAt: Date | null;
}

function calculateFairnessScore(candidate: Musician, role: string, cycleId: string): FairnessScore {
  // Menor timesServedThisMonth = melhor (serve mais quem serviu menos)
  // lastServedAt mais antigo = melhor (prioridade por tempo)
  // Seed determinístico para desempate: sortHash(musicianId + cycleId)
}

function generateSchedule(input: ScheduleGenerationInput): Promise<ServiceSchedule[]> {
  // 1. Buscar todos os músicos ativos do ministry
  // 2. Buscar todos os domingos do mês
  // 3. Para cada domingo:
  //   - Para cada vaga (formação padrão):
  //     - Filtrar candidatos (mesmo role, disponíveis, não escalados nesse domingo)
  //     - Ordenar por FairnessScore
  //     - Atribuir primeiro ou marcar "vago"
  // 4. Persistir ServiceSchedule + ServiceAssignment
  // 5. Retornar resultado
}
```

### 3.2 Regras de Negócio Configuráveis

**Arquivo:** `apps/api/src/services/scheduler/config.ts`

```typescript
interface MinistryScheduleConfig {
  formation: WorshipRole[];  // padrão: [ministro, apoio, guitarra, baixo, bateria]
  optionalRoles: WorshipRole[]; // violino, violão, teclas...
  availabilityDeadlineDays: number; // default: 5
  substitutionWindowHours: number; // default: 4
  cycleTriggerDay: number; // default: 20
}
```

Lidos de `MinistryConfig` ou valores default.

### 3.3 Fluxo de Ciclo Mensal

**Estados:** `coletando_disponibilidade` → `gerando` → `aguardando_aprovacao` → `publicada`

**Endpoints:**

```
POST /api/schedules/cycles
  - Cria MonthlyScheduleCycle
  - Calcula domingos do mês
  - Dispara notificações de disponibilidade

GET /api/schedules/cycles/:cycleId
  - Retorna ciclo com domingos e status

POST /api/schedules/cycles/:cycleId/close
  - Fecha coleta de disponibilidade
  - Trigger: generateSchedule()

POST /api/schedules/cycles/:cycleId/approve
  - Líder aprova rascunho
  - Ciclo → aguardando_aprovacao

POST /api/schedules/cycles/:cycleId/publish
  - Publica escala
  - Dispara notificações para músicos escalados

GET /api/schedules/cycles/:cycleId/sundays
  - Lista ServiceSchedules do ciclo com assignments
```

### 3.4 Painel de Aprovação (Web)

**Página:** `/schedules/cycles/[cycleId]`

**Componentes:**
- `CycleStatusBanner` — mostra estado atual + botão de ação
- `SundaysGrid` — cards por domingo, cada um com:
  - Data + status (rascunho/publicada)
  - Lista de vagas (`AssignmentCard`)
  - Botão de editar/trocar vaga
- `VacancyModal` — seletor de músico substituto (ordenado por fairness)
- `PublishConfirmation` — diálogo antes de publicar

**Permissão:** apenas `admin` pode criar/fechar/publcar ciclos.

---

## 4. WebSocket Client para Modo Performance

### 4.1 Cliente Hook

**Arquivo:** `apps/web/src/hooks/usePerformanceSocket.ts`

```typescript
interface UsePerformanceSocketOptions {
  sessionId: string;
  onBlockChange: (block: Block) => void;
  onOverride: (override: OverrideAction) => void;
  onSessionEnd: () => void;
}

function usePerformanceSocket(options: UsePerformanceSocketOptions): {
  isConnected: boolean;
  currentState: EngineState;
  triggerOverride: (blockId: string) => void;
  cancelOverride: () => void;
}
```

**Fluxo de conexão:**
1. Connect ao WS: `ws://localhost:3001/ws?session={sessionId}&token={accessToken}`
2. Auth no handshake (middleware no server)
3. Receber `session_state` inicial (snapshot)
4. Escutar eventos: `block_changed`, `override_triggered`, `override_cancelled`, `session_ended`
5. Atualizar estado local com máquina de estados (já existe em `packages/types`)

**Reconnection:**
```typescript
// Se desconectar (iOS background, rede):
// 1. Tentar reconnect com backoff exponencial (1s, 2s, 4s, max 30s)
// 2. Ao reconectar, chamar GET /api/sessions/:id/state
// 3. Aplicar snapshot + continuar escutando eventos
```

### 4.2 Session State Endpoint

**Arquivo:** `apps/api/src/routes/sessions/state.ts`

```typescript
GET /api/sessions/:id/state
Auth: required, must be in session room

Response: {
  sessionId: string;
  songId: string;
  state: 'programado' | 'override';
  currentBlock: Block;
  nextBlock: Block | null;
  overrideStack: OverrideAction[];
  elapsedSeconds: number;
  startedAt: string; // ISO timestamp
}
```

---

## 5. UI do Modo Performance

### 5.1 Modo Operador (Leader)

**Rota:** `/session/:sessionId/operador`

**Arquivo:** `apps/web/src/pages/PerformanceOperador.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [Voltar]   Nome da Música  |  C#  |  120 BPM        │
├─────────────────────────────────────────────────────┤
│                                                     │
│              ┌─────────────────┐                    │
│              │    REFRÃO       │  ← dial circular  │
│              │    00:45 / 01:30│     mostrando      │
│              └─────────────────┘     progresso     │
│                                                     │
│  [●]──[●]──[●]──[●]──[○]──[○]──[○]──[○]          │
│  Intro  V1  Pre   Ref  V2   Ref   Pon  Fim         │
│                                                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ Intro  │ │ Verso1 │ │PreRefr │ │ Refrão  │ ...   │
│  └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                    │
│              [PROGRAMADO]  ou  [OVERRIDE ATIVO]     │
├─────────────────────────────────────────────────────┤
│  [📋 Ordem]  [🎯 Operador]  [💬 Chat]  [✕ Encerrar] │
└─────────────────────────────────────────────────────┘
```

**Componentes a reutilizar:**
- `DialCircular` (packages/ui) — progresso do bloco
- `BottomNavPill` (packages/ui) — bottom nav
- `PillToggle` — indicador de estado (Programado/Override)

**Dial Circular de Progresso:**
- Input: `progress` (0-1), `label`, `timeRemaining`
- Cor: `accent-primary` quando.programado, `warning` quando override

**Responsabilidades:**
- Mostrar timeline + blocos
- Permitir toque em qualquer bloco → `triggerOverride()`
- Indicar claramente quando está em override
- Botão de cancelar override (volta ao fluxo programado)
- Encerrar sessão (admin/operador only)

### 5.2 Modo Letra (Singer)

**Rota:** `/session/:sessionId/letra`

**Arquivo:** `apps/web/src/pages/PerformanceLetra.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│         Nome da Música  |  Refrão                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│         Amazing grace, how sweet the sound          │
│         That saved a wretch like me                  │
│                                                     │
│                                                     │
│         ─────────────────────────────               │
│         [Mostrar Cifra: OFF]                        │
│                                                     │
│              "Próximo: Ponte"                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Responsabilidades:**
- Renderizar `chordpro_content` sem cifra (só letra)
- Toggle "Mostrar Cifra" (PillToggle) → sobrepõe acordes se ativado
- Mostrar próximo bloco no rodapé
- Atualizar automaticamente quando `onBlockChange` fire
- Não ter controles de navegação (só o operador controla)

**Componente de Letra:** `apps/web/src/components/performance/LyricsDisplay.tsx`
- Props: `chordproContent: string`, `showChords: boolean`
- Usa `chordsheetjs` para renderizar
- Aplica `transpose()` se `keyOverride` existir

### 5.3 Modo Cifra (Musician)

**Rota:** `/session/:sessionId/cifra`

**Arquivo:** `apps/web/src/pages/PerformanceCifra.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│    Nome da Música  |  C#  |  Refrão                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│    [C]Amazing [G]grace, how [C]sweet the [F]sound   │
│    [C]That [G]saved a [F]wretch like [C]me          │
│                                                     │
│         ─────────────────────────────               │
│         [Ocultar Letra: OFF]                        │
│                                                     │
│              "Próximo: Ponte"                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Diferenças do Modo Letra:**
- Cifra sempre visível por padrão
- Toggle inverso: "Ocultar Letra"
- Tom (`keyOverride`) sempre visível no header
- Fonte um pouco menor para caber cifra + letra

### 5.4 Modo TV (Ensaio)

**Rota:** `/session/:sessionId/tv`

Mantém o que existe, adiciona dial circular de progresso.

---

## 6. Integração de Componentes Shared

### 6.1 Componentes a Criar/Verificar em `packages/ui`

| Componente | Status | Observações |
|------------|--------|-------------|
| `DialCircular` | ✅ Existe | Usar para progresso de bloco |
| `PillToggle` | ✅ Existe | Usar para toggles (Mostrar cifra) |
| `BottomNavPill` | ✅ Existe | Usar para bottom nav |
| `CircularIconButton` | ✅ Existe | Botões de ação |
| `AvatarCircular` | ✅ Existe | Badge de notificação |

### 6.2 Componentes de Performance (Web)

Criar em `apps/web/src/components/performance/`:

| Componente | Descrição |
|------------|-----------|
| `Timeline.tsx` | Barra horizontal com blocos, bloco atual destacado |
| `BlockGrid.tsx` | Grid de blocos tocáveis (operador) |
| `StateIndicator.tsx` | Badge "Programado" / "Override" |
| `LyricsDisplay.tsx` | Renderização ChordPro (letra ± cifra) |
| `ProgressDial.tsx` | DialCircular configurado para progresso |

---

## 7. Tarefas e Dependências

### Fase 5.1: Telegram Bot (Semana 1)
- [ ] Criar `apps/api/src/services/telegram/index.ts`
- [ ] Criar `apps/api/src/routes/telegram-webhook.ts`
- [ ] Atualizar Prisma schema (telegram_chat_id)
- [ ] Implementar fluxo de vínculo via `/start`
- [ ] Migrar templates de WhatsApp para Telegram
- [ ] Testar webhook local com ngrok

### Fase 5.2: Notification Abstraction (Semana 1-2)
- [ ] Criar `apps/api/src/services/notifications/provider.ts` (interface)
- [ ] Criar `apps/api/src/services/notifications/telegram.ts`
- [ ] Criar `apps/api/src/services/notifications/index.ts`
- [ ] Deprecar/comentar WhatsApp (manter estrutura, não remover)
- [ ] Migrar `WhatsAppMessageLog` para `NotificationLog`

### Fase 5.3: Schedule Engine (Semana 2-3)
- [ ] Implementar `apps/api/src/services/scheduler/engine.ts` (fairness algorithm)
- [ ] Completar `apps/api/src/services/scheduler/cycleService.ts`
- [ ] Adicionar endpoints de ciclo (close, approve, publish)
- [ ] Criar página Web `/schedules/cycles/[id]` com UI de aprovação
- [ ] Integrar envio de notificações no publish

### Fase 5.4: WebSocket Client (Semana 3)
- [ ] Criar `apps/web/src/hooks/usePerformanceSocket.ts`
- [ ] Implementar reconnection com snapshot fetch
- [ ] Criar `GET /api/sessions/:id/state`
- [ ] Integrar hook nos 4 modos (Operador, Letra, Cifra, TV)

### Fase 5.5: Performance Mode UI (Semana 3-4)
- [ ] Implementar `PerformanceOperador.tsx` completo
- [ ] Implementar `PerformanceLetra.tsx` com toggle de cifra
- [ ] Implementar `PerformanceCifra.tsx` com toggle de letra
- [ ] Criar componentes: `Timeline.tsx`, `BlockGrid.tsx`, `LyricsDisplay.tsx`
- [ ] Integrar Wake Lock API (`apps/web/src/platform/wake-lock.ts`)
- [ ] Testar em PWA standalone mode

### Fase 5.6: Estudos (Semana 4, opcional)
- [ ] Placeholder `TunerPlaceholder` → `@chordbook/tuner` integration
- [ ] Placeholder `MetronomePlaceholder` → Web Audio scheduling
- [ ] Audio context singleton (`AudioEngineProvider`)

---

## 8. Critérios de Verificação

### Telegram
- [ ] Bot responde `/start` com mensagem de boas-vindas
- [ ] Vínculo funciona via deep link `?start=<token>`
- [ ] Callbacks (disponibilidade, substituição) atualizam banco
- [ ] Notificações chegam no Telegram do musician

### Schedule Engine
- [ ] Ciclo cria todos os domingos do mês
- [ ] Algoritmo distribui músicos com fairness
- [ ] Vagas sem candidato ficam como "vago" (destacado em danger)
- [ ] Líder pode trocar manualmente qualquer vaga
- [ ] Publish dispara notificações para escalados

### Performance Mode
- [ ] Operador vê timeline com bloco atual destacado
- [ ] Toque em bloco dispara override
- [ ] Letra/Cifra atualizam automaticamente
- [ ] Cancel override volta ao fluxo programado
- [ ] WebSocket reconnect funciona após perda de rede
- [ ] Wake Lock mantém tela ligada durante execução

### UI/UX
- [ ] Design tokens (cores, espaçamento) seguem spec v9
- [ ] Componentes shared reutilizados (não recriados)
- [ ] Bottom nav em pill flutuante (Mobile)
- [ ] Sidebar + topbar (Web)
- [ ] Dark theme consistente