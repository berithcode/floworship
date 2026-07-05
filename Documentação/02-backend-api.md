# Backend/API — Documentação Completa

## Stack Tecnológica

| Componente | Tecnologia |
|------------|------------|
| Framework | Fastify (Node.js) |
| ORM | Prisma |
| Banco | SQLite |
| Autenticação | JWT + Refresh Tokens + Cookies httpOnly |
| WebSocket | ws (biblioteca) |
| Bot Telegram | API nativa via fetch |
| WhatsApp | Meta Cloud API / Evolution API |

## Estrutura do Projeto

```
apps/api/src/
├── routes/           # Rotas HTTP (Fastify)
│   ├── auth.ts              # Autenticação (login, register, refresh, invite)
│   ├── ministries.ts        # CRUD ministérios e membros
│   ├── songs.ts             # CRUD músicas e cue sheets
│   ├── schedules.ts         # Ciclos, escalas, disponibilidade
│   ├── repertoire.ts        # Gerenciamento de setlists
│   ├── sessions.ts          # Sessões ao vivo
│   ├── sessions/state.ts    # Estado da sessão em tempo real
│   ├── dashboard.ts         # Métricas e estatísticas
│   ├── profile.ts           # Perfil do usuário
│   ├── settings.ts          # Configurações (WhatsApp)
│   ├── musicians.ts         # CRUD músicos
│   ├── whatsappWebhook.ts   # Webhook WhatsApp (Meta)
│   ├── telegram-webhook.ts  # Webhook Telegram
│   └── whatsapp-legacy.ts   # Rota legada WhatsApp
├── services/         # Lógica de negócio
│   ├── auth/                # Tokens, sessões, hash
│   ├── scheduler/           # Engine de escalas, fairness, ciclo
│   ├── notifications/       # Notificações multicanal
│   ├── telegram/            # Serviço Telegram + templates
│   ├── whatsapp/            # Meta Cloud API, opt-in, reply
│   ├── repertoire.ts        # CRUD repertório
│   ├── permission.ts        # Controle de acesso
│   └── logging/             # Session log
├── middleware/       # Interceptadores (auth, rate-limit)
├── websocket/        # Servidor WebSocket em tempo real
└── db.ts             # Instância Prisma
```

---

## Módulo 1: Autenticação e Usuários

### 1.1 Login com Phone + PIN (Músicos)

**Rota:** `POST /auth/login`

**Descrição:** Login para músicos usando telefone como identificador e PIN de 4 dígitos.

**Lógica de Implementação:**
- Valida se phone e PIN foram fornecidos
- PIN deve ter exatamente 4 dígitos numéricos
- Busca usuário por `email` (que armazena o telefone)
- Verifica hash da senha (bcrypt)
- Gera access token (15 min) + refresh token (30 dias)
- Cria sessão (userAgent + IP)
- Busca membership para extrair role e ministryId
- Assina JWT com `signToken` incluindo claims: userId, email, name, role, ministryId, exp
- Seta cookies httpOnly (`access_token`, `refresh_token`)
- Aplica rate limiting (protege contra brute force)

**Rate Limit:** O middleware `createRateLimitMiddleware` é aplicado e resetado após login bem-sucedido.

**Roles:**
- `admin`: Acesso total
- `operator`: Gerenciamento de escalas
- `leader`: Pode editar repertório
- `musician`: Visualização e confirmação

**Conexões com outras funcionalidades:**
- `createTokens` → Service `auth/service.ts`
- `createSession` → Model `Session`
- `signToken` → Middleware `middleware/auth.ts`

---

### 1.2 Login com Email + Senha (Admin/Operator)

**Rota:** `POST /auth/login/admin`

**Descrição:** Login alternativo para administradores e operadores com email e senha tradicional.

**Diferenças do login phone+PIN:**
- Valida email + senha
- Sem validação de formato PIN
- Mesmo fluxo de tokens e sessões

---

### 1.3 Registro Inicial (Admin)

**Rota:** `POST /auth/register/admin` (email+senha)

**Rota:** `POST /auth/register` (phone+PIN — legado)

**Descrição:** Apenas o primeiro cadastro é permitido. Cria o ministry automaticamente.

**Lógica:**
- Verifica se já existe algum ministério (`ministryCount > 0`)
- Se existir, retorna 403 (convite necessário)
- Cria User, Ministry, MinistryMember (role: admin)
- Gera tokens e retorna dados completos

**Fluxo:**
```
POST /auth/register/admin → Verifica se é o primeiro → Cria User + Ministry + Member → Tokens → Response
```

---

### 1.4 Refresh Token

**Rota:** `POST /auth/refresh`

**Descrição:** Renova o access token usando refresh token rotativo.

**Lógica (arquivo `services/auth/service.ts`):**
1. Busca refresh token no banco
2. Se não existir → retorna null
3. Se `revokedAt` preenchido → revoga TODOS os tokens do usuário (vazamento detectado) → retorna null
4. Se expirado → retorna null
5. Revoga o token atual (uso único)
6. Cria novo par de tokens
7. Assina novo JWT e seta cookies

**Segurança:** Refresh token rotativo com detecção de roubo (se um token já revogado for reusado, todos são revogados).

---

### 1.5 Logout

**Rota:** `POST /auth/logout`

**Descrição:** Revoga o refresh token e limpa cookies.

---

### 1.6 Gerenciamento de Sessões

**Rotas:**
- `GET /auth/sessions` — Lista sessões do usuário
- `DELETE /auth/sessions/:sessionId` — Revoga sessão específica
- `GET /auth/me` — Dados do usuário autenticado com lista de ministérios

---

### 1.7 Recuperação de Senha

**Rotas:**
- `POST /auth/password-reset/request` — Gera token com 30 min de validade
- `POST /auth/password-reset/confirm` — Altera senha, revoga todos os tokens

---

### 1.8 Sistema de Convites

**Rotas:**
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/invite` | Criar convite (admin/operator/leader) |
| `GET` | `/auth/invites` | Listar convites do ministério |
| `DELETE` | `/auth/invites/:id` | Revogar convite |
| `GET` | `/auth/invite/:token` | Informações públicas do convite |
| `POST` | `/auth/invite/accept` | Aceitar convite e criar conta |

**Lógica de Criação de Convite:**
1. Apenas admin/operator/leader podem criar
2. Verifica se telefone já tem convite pendente (reusa se existir)
3. Gera token alfanumérico
4. Expira em 7 dias
5. Associa ao ministério do usuário autenticado

**Lógica de Aceitação:**
1. Valida token, verifica se não foi usado nem expirou
2. Verifica se telefone já não possui cadastro
3. Cria User com phone como email + PIN hasheado
4. Cria MinistryMember com role do convite
5. Marca convite como usado
6. Gera tokens e faz login automático

---

## Módulo 2: Ministérios e Membros

### 2.1 Configurações do Ministério

**Rotas:**
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/ministries/:id/config` | Obter configurações |
| `PUT` | `/ministries/:id/config` | Atualizar configurações (admin) |

**Campos configuráveis:**
- `defaultFormation`: Array de funções padrão (ex: ["vocalista", "guitarrista", "tecladista", "baterista", "baixista"])
- `availabilityDeadlineDays`: Dias de antecedência (default: 5)
- `substitutionWindowHours`: Janela para substituição (default: 4)
- `cycleTriggerDay`: Dia do mês para criar ciclo (default: 20)

**Conexões:**
- Usado pelo `cycleService` para determinar formação
- Usado pelo `configService.ts` para valores padrão
- `MinistryConfig` model é um lookup (ministryId como PK)

---

### 2.2 Listar Ministérios do Usuário

**Rota:** `GET /ministries`

**Descrição:** Retorna a lista de ministérios que o usuário autenticado pertence.

**Lógica:**
- Busca `MinistryMember` onde `userId = user.id`
- Inclui dados do `Ministry`
- Formata na resposta com id, name, role

---

### 2.3 Gerenciamento de Membros

**Rotas:**
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/ministries/:id/members` | Listar membros do ministério |
| `POST` | `/ministries/:id/members` | Adicionar membro (admin) |
| `DELETE` | `/ministries/:id/members/:memberId` | Remover membro (admin) |
| `GET` | `/musicians` | Listar músicos com detalhes |
| `GET` | `/musicians/:id` | Detalhes do músico |
| `PUT` | `/musicians/:id` | Atualizar músico |
| `DELETE` | `/musicians/:id` | Remover músico |

**Lógica de Remoção:**
- Remove assignments, notification logs e o próprio member em transação
- Não deleta o User, apenas a associação ao ministério

**Campos editáveis do músico:**
- `instrument` — Instrumento principal
- `worshipRoles` — Array de funções (ex: ["vocalista", "guitarrista"])
- `isActiveInSchedule` — Se participa das escalas

---

## Módulo 3: Músicas e Cue Sheets

### 3.1 CRUD de Músicas

**Rotas:**
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/songs` | Listar músicas do ministério |
| `GET` | `/songs/:id` | Detalhes da música com cue sheet |
| `POST` | `/songs` | Criar música |
| `PUT` | `/songs/:id` | Atualizar música |
| `DELETE` | `/songs/:id` | Arquivar música (soft delete) |

**Lógica de Criação:**
- Apenas admin/operator/leader podem criar (role !== 'musician')
- `tags` é armazenado como JSON stringify
- `status` padrão: "rascunho"
- Associado ao ministério do usuário

**Lógica de Delete:**
- Soft delete: muda status para "arquivada"
- Músicos não podem deletar

**Status possíveis:**
- `rascunho` — Em edição
- `pronta` — Finalizada, pode ser usada em escalas
- `arquivada` — Removida (soft delete)

---

### 3.2 Cue Sheets (Blocos de Execução)

**Rotas:**
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/songs/:id/cue-sheet` | Criar/atualizar cue sheet com blocos |
| `GET` | `/songs/:id/cue-sheet` | Obter cue sheet com blocos |

**Estrutura do Cue Sheet:**
```
SongCueSheet
├── referenceTrackUrl (URL Spotify/YouTube)
├── totalDurationSeconds
└── CueBlocks[]
    ├── label (ex: "Verso 1", "Refrão")
    ├── startTime (segundos)
    ├── endTime (segundos)
    ├── duration (segundos)
    ├── chordproContent (cifra em formato ChordPro)
    └── order (ordem de execução)
```

**Lógica de Upsert:**
- Se não existir cue sheet para a música → cria com blocos
- Se existir → deleta blocos antigos e recria (replace)
- Atualiza referenceTrackUrl e totalDurationSeconds

**Conexões:**
- Blocos são usados nos modos de performance (TV, Operador, Letra, Cifra)
- `SessionExecutionLog` registra cada bloco executado
- ChordPro é renderizado via parser no frontend

---

## Módulo 4: Escalas e Ciclos Mensais

### 4.1 Ciclo Mensal (MonthlyScheduleCycle)

**Fluxo de Status:**
```
coletando_disponibilidade → gerando → aguardando_aprovacao → publicada
         │                      │
         └── cancel             └── cancel
```

**Rotas:**
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/schedules/cycles/current` | Ciclo atual com disponibilidades |
| `GET` | `/schedules/cycles/:cycleId` | Detalhes do ciclo |
| `GET` | `/schedules/cycles/:cycleId/sundays` | Domingos do ciclo com assignments |
| `POST` | `/schedules/cycles` | Criar novo ciclo |
| `POST` | `/schedules/cycles/:cycleId/close` | Fechar coleta e gerar escala |
| `POST` | `/schedules/cycles/:cycleId/approve` | Aprovar escala gerada |
| `POST` | `/schedules/cycles/:cycleId/publish` | Publicar e notificar |
| `POST` | `/schedules/cycles/:cycleId/cancel` | Cancelar ciclo |

---

### 4.2 Criação de Ciclo (createCycle)

**Lógica (arquivo `services/scheduler/cycleService.ts`):**

1. **Criação:**
   - Cria `MonthlyScheduleCycle` com status "coletando_disponibilidade"
   - Deadline padrão: dia 15 do mês
   - Cria um `ServiceSchedule` para cada domingo do mês

2. **Notificação:**
   - Busca membros ativos com Telegram vinculado
   - Envia notificação em background (não bloqueia resposta)
   - Template: "disponibilidade_mensal"

3. **Encontra domingos:** Função `getSundaysInMonth(month, year)` calcula todas as datas.

---

### 4.3 Disponibilidade (AvailabilityResponse)

**Rota:** `POST /schedules/availability`

**Descrição:** Registra disponibilidade do músico para um domingo específico.

**Lógica:**
- Busca `MinistryMember` pelo userId
- Faz upsert por `cycleId + ministryMemberId + sundayDate`
- Músico pode alterar resposta até o deadline

---

### 4.4 Fechamento e Geração (closeAvailability)

**Lógica:**
1. Muda status para "gerando"
2. Chama `generateScheduleForCycle` que:
   - Busca `ServiceSchedule` existentes (criados no createCycle)
   - Busca membros ativos com último assignment
   - Extrai `worshipRoles` de cada membro
   - Chama `generateSchedule` (engine)

---

### 4.5 Publicação (publishCycle)

**Lógica:**
1. Muda status para "publicada"
2. Para cada assignment confirmado:
   - Se membro tem Telegram vinculado → envia notificação "escala_confirmada"
   - Template inclui data, role, link para o app

---

### 4.6 Algoritmo de Fairness

**Arquivo:** `services/scheduler/fairness.ts`

**Objetivo:** Distribuir equitativamente as escalas entre os músicos.

**Algoritmo:**
1. Filtra músicos elegíveis para a role (baseado em `worshipRoles`)
2. Agrupa por `timesServedThisMonth`
3. Seleciona quem tem **menor** número de participações no mês
4. Entre os empatados, randomiza (sort com `Math.random() - 0.5`)
5. Retorna lista ordenada (prioridade para quem menos serviu)

**Interface:**
```typescript
interface MusicianCandidate {
  id: string;
  userId: string;
  timesServedThisMonth: number;
  lastServedAt: Record<string, Date>;
  worshipRoles: string[];
}
```

---

### 4.7 Engine de Geração (generateSchedule)

**Arquivo:** `services/scheduler/engine.ts`

**Lógica:**
1. Para cada domingo no ciclo:
2. Para cada role na formação:
   - Filtra candidatos elegíveis
   - Exclui quem já está escalado neste domingo
   - Aplica fairness scoring
   - Seleciona o melhor candidato
3. Se não houver candidato → cria assignment com status "vago"

---

### 4.8 Substituição (substitutionService)

**Rota:** `POST /schedules/substitution/:assignmentId`

**Fluxo:**
1. Recebe assignmentId
2. Busca membros já escalados neste domingo (para excluir)
3. Filtra candidatos ativos não escalados com a role necessária
4. Aplica fairness scoring
5. Para cada candidato:
   - Tenta enviar notificação via Telegram
   - Se sucesso → marca assignment como "convidado"
   - Para no primeiro candidato
6. Se ninguém aceitar → marca como "vago"

---

### 4.9 Minhas Escalações

**Rotas de Músico:**
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/schedules/my-assignments` | Escalações do músico logado |
| `PUT` | `/schedules/assignments/:id/confirm` | Confirmar/recusar |
| `GET` | `/schedules/today` | Escala de hoje |

**Lógica de Confirmação:**
- Apenas o próprio músico pode confirmar
- Verifica se `ministryMember.userId === user.id`
- Atualiza `confirmed`, `confirmedAt` e `status`

---

### 4.10 Setlist (Repertório do Serviço)

**Rotas:**
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/schedules/:scheduleId/setlist` | Definir setlist (ministro/admin) |
| `GET` | `/schedules/:scheduleId/setlist` | Obter setlist |

**Lógica:**
- Apenas ministro de louvor escalado ou admin pode definir setlist
- Deleta itens anteriores e recria
- Cada item tem `order` (sequência) e opcional `keyOverride`

**Rotas Alternativas (services/repertoire.ts):**
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/schedules/:id/repertoire` | Listar repertório |
| `POST` | `/schedules/:id/repertoire` | Adicionar música |
| `DELETE` | `/schedules/:id/repertoire/:itemId` | Remover música |
| `PATCH` | `/schedules/:id/repertoire/reorder` | Reordenar |
| `PATCH` | `/schedules/:id/repertoire/:itemId` | Atualizar item |

**Permissão:** A função `canEditRepertoire` verifica se o usuário é admin, leader ou ministro_de_louvor da escala.

---

## Módulo 5: Dashboard e Métricas

### 5.1 Métricas do Dashboard

**Rota:** `GET /dashboard/metrics`

**Descrição:** Retorna um resumo do estado atual do ministério.

**Indicadores:**
- `nextService`: Próximo culto/ensaio (data, confirmado, repertório)
- `pendingConfirmations`: Confirmações pendentes do usuário
- `totalMusicians`: Total de membros
- `songsReady`: Músicas com status "pronta"
- `cycleStatus`: Status do ciclo atual
- `cycleDeadline`: Prazo de disponibilidade

---

### 5.2 Próximos Serviços

**Rota:** `GET /dashboard/upcoming-services`

**Descrição:** Lista os próximos 6 serviços com detalhes.

**Retorna por serviço:**
- Data
- Confirmações (count/total)
- Vagas (roles não preenchidas)
- Repertório (músicas selecionadas)
- Status de confirmação do usuário

---

### 5.3 Estatísticas de Repertório

**Rota:** `GET /dashboard/repertoire-stats`

**Métricas:**
- Total de músicas por status (pronta, rascunho, arquivada)
- Músicas com cue sheet
- Músicas mais usadas nos últimos 30 dias
- Músicas novas este mês

---

### 5.4 Atividade Recente

**Rota:** `GET /dashboard/recent-activity`

**Métricas:**
- Últimas sessões executadas
- Estatísticas WhatsApp (enviados, entregues, falhos)
- Novos membros do mês
- Convites pendentes

---

## Módulo 6: Sessões ao Vivo (Performance)

### 6.1 Estado da Sessão

**Rota:** `GET /sessions/:id/state`

**Descrição:** Retorna o estado completo para execução ao vivo.

**Estrutura retornada:**
```json
{
  "currentBlockId": null,
  "blocks": [{ "id", "label", "chordproContent", "order", "songTitle", "songId" }],
  "sequence": 0,
  "timestamp": "ISO",
  "programadoPointer": 0,
  "overrideStack": [],
  "team": [{ "role", "name" }],
  "repertoire": [{ "id", "songId", "title", "artist", "key" }]
}
```

**Lógica:**
- Busca `ServiceSchedule` com repertório e assignments
- Achata todos os blocos de todas as músicas em um array plano

---

### 6.2 Trigger de Bloco

**Rota:** `POST /sessions/:id/trigger-block`

**Descrição:** Avança para o próximo bloco na sessão.

**Lógica:**
- Busca o estado da sessão
- Encontra o bloco pelo ID
- Cria `SessionExecutionLog` com `wasOverride: true` (manual)
- TODO: Broadcast via WebSocket

---

### 6.3 WebSocket em Tempo Real

**Arquivo:** `websocket/server.ts`

**Classe:** `SessionWSServer`

**Funcionamento:**
1. Cliente conecta ao `/ws`
2. Envia mensagem `{ type: "join", sessionId, ministryId }`
3. Servidor adiciona à `SessionRoom`
4. Broadcast envia eventos `TransitionEvent` para todos da sala
5. Cliente sai ao fechar conexão

**Eventos:**
- `join` → Entrar na sala
- `leave` → Sair da sala
- `block_changed` → Bloco atual mudou

**Rooms:**
- Chave: `ministry:{ministryId}:session:{sessionId}`
- Clientes: `Set<WebSocket>`

---

### 6.4 Modos de Performance (Frontend)

| Modo | Descrição | Rota Frontend |
|------|-----------|---------------|
| **Operador** | Controle maestro — avança blocos, vê tudo | `/session/:id/operador` |
| **Letra** | Exibe apenas letra da música atual | `/session/:id/letra` |
| **Cifra** | Exibe cifra (ChordPro) do bloco atual | `/session/:id/cifra` |
| **TV** | Projeção para congregação (fullscreen) | `/session/:id/tv` |

**Comportamento:**
- Todos os modos conectam via WebSocket na mesma sala
- Quando operador avança bloco → todos recebem `block_changed`
- Cada modo renderiza conforme sua função
- Override stack permite navegação não-linear

---

## Módulo 7: Notificações

### 7.1 Telegram

**Serviço:** `services/telegram/index.ts`

**Classe:** `TelegramService`

**Funcionalidades:**
- `sendMessage(chatId, text, keyboard?)` — Envia mensagem com teclado inline
- `answerCallbackQuery(id, text?)` — Responde a callback de botão
- `setWebhook(url)` — Configura webhook do bot
- `editMessageText(chatId, messageId, text, keyboard?)` — Edita mensagem
- `editMessageReplyMarkup(chatId, messageId, keyboard?)` — Edita teclado
- `buildDeepLink(startParam)` — Gera link para vincular conta

**Templates:** `services/telegram/templates.ts`

**Tipos de mensagem:**
| Template | Descrição |
|----------|-----------|
| `disponibilidade_mensal` | Coleta disponibilidade com botões "Sim"/"Não"/"Selecionar" |
| `escala_confirmada` | Escala publicada com detalhes |
| `substituicao_urgente` | Substituição necessária |

**Fluxo de Interação:**
```
Bot envia → Músico clica botão → Webhook recebe callbackQuery
→ handleCallbackQuery processa → Atualiza DB
→ Responde com answerCallbackQuery
```

**Interações Suportadas:**
- `disp:yes` — Disponível todos os domingos
- `disp:no` — Indisponível todos + seleção individual
- `disp:toggle:cycleId:index` — Alterna disponibilidade de domingo específico
- `disp:confirm` — Confirma seleção individual
- `subst:accept/assignmentId` — Aceita substituição
- `subst:reject/assignmentId` — Recusa substituição

**Comando `/start`:**
- `link_{token}` — Vincula conta do Telegram ao member
- Gera/consome `telegramLinkToken` no `MinistryMember`

---

### 7.2 WhatsApp

**Serviços:**
- `services/whatsapp/provider.ts` — Provedor unificado (Meta API ou Evolution API)
- `services/whatsapp/metaCloudApi.ts` — Integração Meta Cloud API
- `services/whatsapp/implementations/openwa.ts` — Implementação OpenWA
- `services/whatsapp/optInService.ts` — Gerenciamento de opt-in
- `services/whatsapp/replyProcessor.ts` — Processamento de respostas

**Webhook:** `routes/whatsappWebhook.ts`
- `GET /webhook` — Verificação (Meta challenge)
- `POST /webhook` — Recebe mensagens
- Verifica assinatura HMAC-SHA256
- Processa `button` replies via `replyProcessor.ts`

**Botões Suportados:**
- `disponivel` / `nao_disponivel` — Resposta de disponibilidade
- `aceito` / `nao_posso` — Resposta de substituição

---

### 7.3 Sistema de Notificações Unificado

**Arquivo:** `services/notifications/index.ts`

**Providers:**
- `TelegramNotificationProvider` (ativo)
- `WhatsAppNotificationProvider` (futuro)
- `PushNotificationProvider` (futuro)

**Funções Principais:**
- `sendNotification(memberId, ministryId, templateName, variables)` — Envia para 1 membro
- `sendBulkNotifications(notifications[])` — Envia em lote com delay de 100ms entre mensagens

**Logging:**
- Toda notificação é registrada em `NotificationLog`
- Status: enviado, entregue, lido, falhou

---

## Módulo 8: Perfil e Configurações

### 8.1 Perfil do Usuário

**Rota:** `GET /profile/me`

**Descrição:** Dados completos do usuário incluindo memberships e dados de músico.

**Retorno:**
```json
{
  "id", "email", "name", "createdAt",
  "ministries": [{ "ministryId", "ministryName", "role" }],
  "musician": { "instrument", "worshipRoles": [] }
}
```

---

### 8.2 Configurações WhatsApp

**Rotas:**
| Método | Rota | Descrição |
|--------|------|-----------|
| `PUT` | `/settings/whatsapp/test` | Envia mensagem de teste |
| `PUT` | `/settings/whatsapp/phone` | Atualiza telefone WhatsApp |

---

## Módulo 9: Sessões Avulsas (Quick Sessions)

### 9.1 Criar Sessão

**Rota:** `POST /sessions`

**Descrição:** Cria uma sessão avulsa (fora de ciclo) para ensaio ou culto.

---

### 9.2 Próximas Sessões

**Rota:** `GET /sessions/upcoming`

**Descrição:** Próximas 5 sessões com status de confirmação do usuário.

---

### 9.3 Importar Repertório

**Rota:** `POST /sessions/:scheduleId/import-repertoire`

**Descrição:** Cria uma nova sessão copiando o repertório de uma escala existente.

**Lógica:**
- Busca schedule com repertório
- Cria novo ServiceSchedule
- Copia todos os itens de repertório (songId, order, keyOverride)

---

## Módulo 10: Tratamento de Erros e Segurança

### 10.1 Middleware de Autenticação

**Arquivo:** `middleware/auth.ts`

**Funcionamento:**
1. Extrai token do cookie `access_token`
2. Verifica assinatura JWT
3. Decodifica claims (userId, email, name, role, ministryId)
4. Injeta `request.user` com dados decodificados
5. Se inválido → 401 Unauthorized

### 10.2 Rate Limiting

**Arquivo:** `middleware/rateLimit.ts`

**Protege:**
- Login (phone+PIN e email+senha)
- Password reset request

### 10.3 Validação de Dados

**Arquivo:** `middleware/auth.ts` + validações inline

**Padrões:**
- PIN deve ser 4 dígitos
- Phone validation via regex
- Roles verificadas em operações sensíveis

---

## Mapa de Rotas Completo

### Rotas Públicas
| Método | Rota |
|--------|------|
| GET | `/webhook` |
| POST | `/webhook` |
| POST | `/telegram/webhook` |

### Rotas com Rate Limit
| Método | Rota |
|--------|------|
| POST | `/auth/login` |
| POST | `/auth/login/admin` |
| POST | `/auth/password-reset/request` |

### Rotas Autenticadas (com AuthMiddleware)

| Módulo | Método | Rota |
|--------|--------|------|
| Auth | GET | `/auth/me` |
| Auth | GET | `/auth/sessions` |
| Auth | DELETE | `/auth/sessions/:sessionId` |
| Auth | POST | `/auth/invite` |
| Auth | GET | `/auth/invites` |
| Auth | DELETE | `/auth/invites/:id` |
| Auth | POST | `/auth/logout` |
| Ministério | GET | `/ministries` |
| Ministério | GET | `/ministries/:id/members` |
| Ministério | POST | `/ministries/:id/members` |
| Ministério | DELETE | `/ministries/:id/members/:memberId` |
| Ministério | GET | `/ministries/:id/config` |
| Ministério | PUT | `/ministries/:id/config` |
| Músicas | GET | `/songs` |
| Músicas | GET | `/songs/:id` |
| Músicas | POST | `/songs` |
| Músicas | PUT | `/songs/:id` |
| Músicas | DELETE | `/songs/:id` |
| Músicas | POST | `/songs/:id/cue-sheet` |
| Músicas | GET | `/songs/:id/cue-sheet` |
| Escalas | GET | `/schedules/cycles/current` |
| Escalas | GET | `/schedules/cycles/:cycleId` |
| Escalas | GET | `/schedules/cycles/:cycleId/sundays` |
| Escalas | POST | `/schedules/cycles` |
| Escalas | POST | `/schedules/cycles/:cycleId/close` |
| Escalas | POST | `/schedules/cycles/:cycleId/approve` |
| Escalas | POST | `/schedules/cycles/:cycleId/publish` |
| Escalas | POST | `/schedules/cycles/:cycleId/cancel` |
| Escalas | POST | `/schedules/availability` |
| Escalas | GET | `/schedules/my-assignments` |
| Escalas | PUT | `/schedules/assignments/:id/confirm` |
| Escalas | POST | `/schedules/:scheduleId/setlist` |
| Escalas | GET | `/schedules/:scheduleId/setlist` |
| Escalas | GET | `/schedules/today` |
| Escalas | POST | `/schedules/swap` |
| Escalas | POST | `/schedules/substitution/:assignmentId` |
| Repertório | GET | `/schedules/:id/repertoire` |
| Repertório | POST | `/schedules/:id/repertoire` |
| Repertório | DELETE | `/schedules/:id/repertoire/:itemId` |
| Repertório | PATCH | `/schedules/:id/repertoire/reorder` |
| Repertório | PATCH | `/schedules/:id/repertoire/:itemId` |
| Dashboard | GET | `/dashboard/metrics` |
| Dashboard | GET | `/dashboard/upcoming-services` |
| Dashboard | GET | `/dashboard/repertoire-stats` |
| Dashboard | GET | `/dashboard/recent-activity` |
| Sessões | POST | `/sessions` |
| Sessões | GET | `/sessions/upcoming` |
| Sessões | GET | `/sessions` |
| Sessões | GET | `/sessions/:id/state` |
| Sessões | POST | `/sessions/:id/trigger-block` |
| Sessões | POST | `/sessions/:scheduleId/import-repertoire` |
| Perfil | GET | `/profile/me` |
| Config | PUT | `/settings/whatsapp/test` |
| Config | PUT | `/settings/whatsapp/phone` |
| Músicos | GET | `/musicians` |
| Músicos | GET | `/musicians/:id` |
| Músicos | POST | `/musicians` |
| Músicos | PUT | `/musicians/:id` |
| Músicos | DELETE | `/musicians/:id` |
| Telegram | GET | `/telegram/status` |
| Telegram | POST | `/telegram/test` |
| Telegram | POST | `/telegram/webhook/setup` |
| Telegram | GET | `/telegram/link/:memberId` |
