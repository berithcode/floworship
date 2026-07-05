# Documentação do Banco de Dados

## Visão Geral

Floworship utiliza **SQLite** como banco de dados principal, gerenciado através do **Prisma ORM**. O schema está localizado em `apps/api/prisma/schema.prisma`.

## Modelos de Dados

### 1. User (Usuário)

**Finalidade:** Representa os usuários do sistema (músicos, administradores, operadores).

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `email` | String | Email ou telefone (único) |
| `passwordHash` | String | Hash da senha/PIN |
| `name` | String | Nome completo |
| `googleId` | String? | ID do Google (login social) |
| `whatsappPhone` | String? | Telefone WhatsApp |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

**Relacionamentos:**
- `ministryMembers`: Membros de ministérios vinculados
- `refreshTokens`: Tokens de refresh ativos
- `sessions`: Sessões ativas
- `sentInvites`: Convites enviados
- `passwordResets`: Tokens de recuperação de senha
- `createdSongs`: Músicas criadas
- `sessionLogs`: Logs de execução de sessão
- `whatsappLogs`: Logs de mensagens WhatsApp
- `createdSchedules`: Escalas criadas

**Regras de Negócio:**
- Primeiro usuário a se cadastrar torna-se admin automaticamente
- Login pode ser feito via phone+PIN (músicos) ou email+senha (admin/operator)
- Usuário pode pertencer a múltiplos ministérios

---

### 2. Ministry (Ministério)

**Finalidade:** Representa um ministério de música (igreja/organização).

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `name` | String | Nome do ministério |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

**Relacionamentos:**
- `members`: Membros do ministério
- `invites`: Convites pendentes
- `songs`: Músicas do repertório
- `schedules`: Escalas de serviço
- `notificationLogs`: Logs de notificações
- `whatsappLogs`: Logs de WhatsApp
- `cycles`: Ciclos mensais de escala
- `config`: Configurações do ministério

**Regras de Negócio:**
- Cada usuário pertence a pelo menos um ministério
- Primeiro cadastro cria automaticamente um ministério
- Ministérios são isolados entre si (multi-tenant)

---

### 3. MinistryMember (Membro do Ministério)

**Finalidade:** Representa a associação de um usuário a um ministério específico.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `userId` | String | ID do usuário |
| `ministryId` | String | ID do ministério |
| `role` | String | Cargo (admin, operator, leader, musician) |
| `worshipRoles` | String | JSON array de funções musicais |
| `instrument` | String? | Instrumento principal |
| `isActiveInSchedule` | Boolean | Se participa das escalas |
| `timesServedThisMonth` | Int | Contador de participações no mês |
| `lastServedAt` | String | JSON com datas da última vez por função |
| `telegramChatId` | String? | ID do Telegram |
| `telegramUsername` | String? | Username do Telegram |
| `telegramLinkToken` | String? | Token para vincular Telegram |
| `whatsappPhone` | String? | Telefone WhatsApp |
| `whatsappOptIn` | Boolean | Se aceitou receber mensagens |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

**Índices:**
- `userId_ministryId`: Único por par usuário-ministério
- `ministryId_role`: Para filtrar por cargo
- `ministryId_isActiveInSchedule`: Para filtrar membros ativos

**Relacionamentos:**
- `user`: Dados do usuário
- `ministry`: Ministério pertencente
- `assignments`: Escalações
- `notificationLogs`: Logs de notificações
- `availabilityResponses`: Respostas de disponibilidade

**Regras de Negócio:**
- Um usuário pode ter múltiplos MinistryMembers (um por ministério)
- `worshipRoles` armazena funções como ["vocalista", "guitarrista", etc.]
- `timesServedThisMonth` é usado pelo algoritmo de fairness

---

### 4. Song (Música)

**Finalidade:** Armazena o repertório musical do ministério.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `title` | String | Título da música |
| `artist` | String? | Artista/banda |
| `defaultKey` | String? | Tom original |
| `tags` | String | JSON array de tags |
| `status` | String | Status (rascunho, publicada, arquivada) |
| `notes` | String? | Notas internas |
| `ministryId` | String | ID do ministério |
| `createdById` | String | ID do criador |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

**Índices:**
- `ministryId_status`: Para filtrar músicas por status

**Relacionamentos:**
- `ministry`: Ministério dono da música
- `createdBy`: Usuário que criou
- `cueSheet`: Cue sheet (blocos de tempo)
- `repertoireItems`: Itens de repertório em escalas

**Regras de Negócio:**
- Apenas admin/operator/leader podem criar/editar músicas
- Delete é soft delete (muda status para "arquivada")
- Tags permitem categorização (ex: ["adoracao", "animacao"])

---

### 5. SongCueSheet & CueBlock

**Finalidade:** Estrutura de blocos temporais para execução de músicas.

**SongCueSheet Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `songId` | String | ID da música (único) |
| `referenceTrackUrl` | String? | URL de referência (Spotify/YouTube) |
| `totalDurationSeconds` | Float? | Duração total |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

**CueBlock Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `cueSheetId` | String | ID do cue sheet |
| `label` | String | Nome do bloco (ex: "Verso 1", "Refrão") |
| `startTime` | Float | Tempo inicial em segundos |
| `endTime` | Float | Tempo final em segundos |
| `duration` | Float | Duração em segundos |
| `chordproContent` | String? | Cifra no formato ChordPro |
| `order` | Int | Ordem de exibição |

**Relacionamentos:**
- CueBlock → CueSheet (muitos-para-um)
- CueBlock → SessionExecutionLog (logs de execução)

**Regras de Negócio:**
- Cada música tem no máximo 1 cue sheet
- Blocos são usados no modo de execução (TV/Operador)
- chordproContent permite mostrar cifra durante execução

---

### 6. MonthlyScheduleCycle (Ciclo Mensal)

**Finalidade:** Gerencia o processo mensal de criação de escalas.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `ministryId` | String | ID do ministério |
| `month` | Int | Mês (1-12) |
| `year` | Int | Ano |
| `status` | String | Status do ciclo |
| `availabilityDeadline` | DateTime | Prazo para disponibilidade |

**Status Possíveis:**
- `coletando_disponibilidade`: Membros respondem disponibilidade
- `gerando`: Algoritmo está gerando escala
- `aguardando_aprovacao`: Escala gerada, aguarda aprovação
- `publicada`: Escala publicada e notificada

**Índices:**
- `ministryId_status`: Para filtrar ciclos ativos

**Relacionamentos:**
- `ministry`: Ministério dono do ciclo
- `schedules`: Domingos do ciclo
- `availabilityResponses`: Respostas de disponibilidade

**Regras de Negócio:**
- Um ciclo por mês por ministério
- Deadline padrão: dia 15 do mês
- Notifica membros via Telegram quando inicia coleta

---

### 7. ServiceSchedule (Escala de Serviço)

**Finalidade:** Representa um serviço/domingo específico.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `ministryId` | String | ID do ministério |
| `cycleId` | String? | ID do ciclo mensal |
| `date` | DateTime | Data do serviço |
| `createdById` | String | ID do criador |
| `sessionType` | String | Tipo (ensaio, culto) |
| `createdAt` | DateTime | Data de criação |

**Índices:**
- `ministryId_date`: Para buscar serviços por data
- `cycleId`: Para agrupar por ciclo

**Relacionamentos:**
- `ministry`: Ministério dono
- `createdBy`: Usuário criador
- `cycle`: Ciclo mensal (se aplicável)
- `assignments`: Músicos escalados
- `repertoire`: Repertório do serviço

**Regras de Negócio:**
- Pode existir independente de ciclo (escala avulsa)
- sessionType define se é ensaio ou culto
- Cada domingo tem múltiplos assignments (um por função)

---

### 8. ServiceAssignment (Escalação)

**Finalidade:** Representa um músico escalado para uma função específica.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `scheduleId` | String | ID da escala |
| `ministryMemberId` | String? | ID do membro escalado |
| `role` | String | Função (vocalista, guitarrista, etc.) |
| `status` | String | Status (vago, confirmado, recusado) |
| `substitutionOf` | String? | ID de quem está substituindo |
| `confirmed` | Boolean | Se o músico confirmou |
| `confirmedAt` | DateTime? | Data da confirmação |

**Índices:**
- `ministryMemberId_status`: Para buscar confirmações pendentes
- `scheduleId_status`: Para ver vagas por escala

**Relacionamentos:**
- `schedule`: Escala do serviço
- `ministryMember`: Membro escalado (pode ser null se vago)

**Regras de Negócio:**
- ministryMemberId null = vaga aberta
- status "vago" pode ter ministryMemberId preenchido (aguardando confirmação)
- Músico pode confirmar/recusar via Telegram/WhatsApp

---

### 9. ServiceRepertoireItem (Item de Repertório)

**Finalidade:** Músicas selecionadas para um serviço específico.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `scheduleId` | String | ID da escala |
| `songId` | String | ID da música |
| `order` | Int | Ordem no setlist |
| `keyOverride` | String? | Tom diferente do original |

**Relacionamentos:**
- `schedule`: Escala do serviço
- `song`: Música selecionada

**Regras de Negócio:**
- Apenas ministro de louvor pode definir setlist
- keyOverride permite transposição
- order define sequência de execução

---

### 10. AvailabilityResponse (Resposta de Disponibilidade)

**Finalidade:** Armazena respostas de disponibilidade dos membros.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `cycleId` | String | ID do ciclo |
| `ministryMemberId` | String | ID do membro |
| `sundayDate` | DateTime | Data do domingo |
| `available` | Boolean | Se está disponível |
| `respondedAt` | DateTime | Data da resposta |

**Índices:**
- Único por cycleId + ministryMemberId + sundayDate

**Relacionamentos:**
- `cycle`: Ciclo mensal
- `ministryMember`: Membro que respondeu

**Regras de Negócio:**
- Um membro responde uma vez por domingo
- Respostas podem ser alteradas até o deadline
- Usado pelo algoritmo de geração de escalas

---

### 11. MinistryConfig (Configurações do Ministério)

**Finalidade:** Armazena configurações personalizáveis do ministério.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ministryId` | String | ID do ministério (PK) |
| `defaultFormation` | String | JSON array de funções padrão |
| `availabilityDeadlineDays` | Int | Dias de antecedência para disponibilidade |
| `substitutionWindowHours` | Int | Horas mínimas para substituição |
| `cycleTriggerDay` | Int | Dia do mês para criar novo ciclo |

**Relacionamentos:**
- `ministry`: Ministério configurado

**Regras de Negócio:**
- Um registro por ministério
- defaultFormation define funções padrão (ex: ["vocalista", "guitarrista", "tecladista", "baterista", "baixista"])

---

### 12. RefreshToken & Session

**Finalidade:** Gerenciamento de autenticação.

**RefreshToken Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `token` | String | Token (único) |
| `userId` | String | ID do usuário |
| `expiresAt` | DateTime | Expiração (30 dias) |
| `createdAt` | DateTime | Data de criação |
| `revokedAt` | DateTime? | Data de revogação |

**Session Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `userId` | String | ID do usuário |
| `userAgent` | String? | User agent do browser |
| `ip` | String? | IP do cliente |
| `lastActiveAt` | DateTime | Última atividade |
| `createdAt` | DateTime | Data de criação |

**Regras de Negócio:**
- Access token: 15 minutos
- Refresh token: 30 dias (rotativo)
- Sessão é revogada ao fazer logout

---

### 13. Invite (Convite)

**Finalidade:** Sistema de convites para novos membros.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `token` | String | Token do convite (único) |
| `email` | String? | Email do convidado |
| `phone` | String? | Telefone do convidado |
| `name` | String | Nome do convidado |
| `ministryId` | String | ID do ministério |
| `role` | String | Cargo atribuído |
| `expiresAt` | DateTime | Expiração (7 dias) |
| `usedAt` | DateTime? | Data de uso |
| `usedByUserId` | String? | ID de quem usou |
| `invitedById` | String | ID de quem convidou |
| `createdAt` | DateTime | Data de criação |

**Relacionamentos:**
- `ministry`: Ministério do convite
- `invitedBy`: Usuário que enviou

**Regras de Negócio:**
- Apenas admin/operator/leader podem enviar convites
- Convite expira em 7 dias
- Um convite só pode ser usado uma vez

---

### 14. PasswordResetToken

**Finalidade:** Recuperação de senha.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `token` | String | Token (único) |
| `userId` | String | ID do usuário |
| `expiresAt` | DateTime | Expiração (30 min) |
| `usedAt` | DateTime? | Data de uso |
| `createdAt` | DateTime | Data de criação |

**Regras de Negócio:**
- Token expira em 30 minutos
- Só pode ser usado uma vez
- Revoga todos os refresh tokens do usuário após uso

---

### 15. SessionExecutionLog

**Finalidade:** Log de execução de blocos durante sessões.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `sessionId` | String | ID da sessão |
| `blockId` | String | ID do bloco executado |
| `triggeredAt` | DateTime | Data/hora da execução |
| `wasOverride` | Boolean | Se foi execução manual (override) |
| `triggeredByUserId` | String | ID de quem executou |
| `durationSeconds` | Float? | Duração real |

**Índices:**
- `triggeredAt`: Para ordenar cronologicamente

**Relacionamentos:**
- `block`: Bloco executado
- `triggeredBy`: Usuário que executou

**Regras de Negócio:**
- Usado para analytics e histórico
- wasOverride=true indica ação manual (não automática)

---

### 16. WhatsAppMessageLog & NotificationLog

**Finalidade:** Auditoria de comunicações enviadas.

**WhatsAppMessageLog Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `ministryId` | String | ID do ministério |
| `musicianId` | String? | ID do músico |
| `sentById` | String | ID de quem enviou |
| `templateName` | String | Template usado |
| `context` | String | JSON com variáveis |
| `messageId` | String? | ID da mensagem na API |
| `status` | String | Status (enviado, entregue, lido) |
| `responsePayload` | String? | Resposta recebida |
| `sentAt` | DateTime | Data de envio |

**NotificationLog Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único (cuid) |
| `ministryMemberId` | String? | ID do membro |
| `ministryId` | String | ID do ministério |
| `channel` | String | Canal (telegram, whatsapp) |
| `templateName` | String | Template usado |
| `context` | String | JSON com variáveis |
| `messageId` | String? | ID da mensagem |
| `status` | String | Status |
| `responsePayload` | String? | Resposta recebida |
| `sentAt` | DateTime | Data de envio |

**Índices:**
- `ministryId_sentAt_status`: Para filtrar logs

**Relacionamentos:**
- WhatsAppMessageLog → ministry, sentBy
- NotificationLog → ministry, ministryMember

**Regras de Negócio:**
- Toda comunicação é logada para auditoria
- responsePayload armazena interações (ex: botão clicado)

---

## Diagrama de Relacionamentos

```
User (1) ── (M) MinistryMember (M) ── (1) Ministry
  │                                     │
  ├─ (M) RefreshToken                   ├─ (M) Invite
  ├─ (M) Session                        ├─ (M) Song
  ├─ (M) sentInvites                    │    │
  ├─ (M) passwordResets                 │    └─ (1) SongCueSheet
  ├─ (M) createdSongs                   │         │
  ├─ (M) sessionLogs                    │         └─ (M) CueBlock
  ├─ (M) whatsappLogs                   │              │
  └─ (M) createdSchedules               │              └─ (M) SessionExecutionLog
                                        │
                                        ├─ (M) ServiceSchedule
                                        │    │
                                        │    ├─ (M) ServiceAssignment ── (M) MinistryMember
                                        │    │
                                        │    └─ (M) ServiceRepertoireItem ── (1) Song
                                        │
                                        ├─ (M) MonthlyScheduleCycle
                                        │    │
                                        │    └─ (M) AvailabilityResponse ── (M) MinistryMember
                                        │
                                        ├─ (1) MinistryConfig
                                        │
                                        ├─ (M) NotificationLog
                                        └─ (M) WhatsAppMessageLog
```

---

## Padrões de Projeto

### 1. Multi-tenancy
- Cada ministry é isolado
- Usuários podem pertencer a múltiplos ministérios
- Todas as queries filtram por ministryId

### 2. Soft Delete
- Songs usam campo `status` em vez de delete físico
- Permite recuperação e auditoria

### 3. JSON Fields
- Arrays e objetos complexos armazenados como JSON stringified
- Ex: `tags`, `worshipRoles`, `lastServedAt`, `context`

### 4. Cascade Delete
- Deletar ministry remove todos os dados relacionados
- Deletar user remove memberships, tokens, sessions

### 5. Índices Estratégicos
- Índices compostos para queries frequentes
- Unique constraints para evitar duplicatas

---

## Considerações de Performance

1. **SQLite Limitations:**
   - Adequado para até ~100k registros
   - Write locking pode ser gargalo em alta concorrência

2. **Prisma Benefits:**
   - Type safety
   - Migration management
   - Query optimization

3. **Future Migrations:**
   - PostgreSQL para produção em larga escala
   - Manter schema compatível

---

## Histórico de Migrações

Ver pasta `apps/api/prisma/migrations/` para histórico completo.