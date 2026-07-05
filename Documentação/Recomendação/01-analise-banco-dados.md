# Análise Crítica do Banco de Dados — Floworship

## Resumo Executivo

O schema Prisma do Floworship (`apps/api/prisma/schema.prisma`, 308 linhas, 17 modelos, SQLite) apresenta **10 problemas estruturais** que comprometem integridade de dados, performance e manutenibilidade. O mais grave é o uso generalizado de `String` para armazenar JSON serializado manualmente (5 campos em 4 modelos), o que inviabiliza queries de banco nativas e força parsing manual vulnerável a erros. Há também **inconsistência crítica entre schemas**: o schema raiz (`prisma/schema.prisma`) difere do schema da API — o raiz possui `sessionType` em `ServiceSchedule` que o da API não tem, mas o código `routes/sessions.ts:25` usa este campo, causando erro em runtime. Abaixo, a análise detalhada com severidade, impacto e sugestões de correção.

---

## 1. Problemas Críticos

### 1.1 JSON em campos `String` — Severidade: **Alta**

| Campo | Arquivo | Linha | Exemplo de Valor |
|-------|---------|-------|------------------|
| `MinistryMember.worshipRoles` | schema.prisma | 52 | `"[\"guitarra\",\"vocal\"]"` |
| `MinistryMember.lastServedAt` | schema.prisma | 56 | `"{\"guitarra\":\"2025-12-01\"}"` |
| `MinistryConfig.defaultFormation` | schema.prisma | 303 | `"[\"teclado\",\"baixo\"]"` |
| `Song.tags` | schema.prisma | 132 | `"[\"lentidao\",\"abertura\"]"` |
| `WhatsAppMessageLog.context` | schema.prisma | 241 | `"{\"name\":\"João\"}"` |
| `NotificationLog.context` | schema.prisma | 259 | `"{\"role\":\"guitarra\"}"` |

**Impacto:**
- Impossível filtrar por valores internos no banco (ex: `WHERE "guitarra" IN worshipRoles`)
- `JSON.parse()` e `JSON.stringify()` manuais espalhados pelo código (ex: `cycleService.ts:250` faz `JSON.parse(m.worshipRoles || '[]')`)
- Sem validação de schema — um valor malformado quebra toda operação
- Sem índices nos campos internos

**Solução:** Migrar para colunas JSON no SQLite (suportado via `String` com validação opcional) ou, idealmente, modelos relacionais:
- `MinistryMemberWorshipRole` (tabela N:N)
- `SongTag` (tabela N:N)
- `ServiceFormationRole` (tabela filha de `MinistryConfig`)
- `NotificationContext` como `Json` no Prisma (com validação em app layer)

---

### 1.2 `timesServedThisMonth` como campo manual — Severidade: **Média**

**Localização:** `schema.prisma:55` — `MinistryMember.timesServedThisMonth Int @default(0)`

**Problema:** O campo é incrementado/decrementado manualmente, mas o código atual **nunca o atualiza**. Em `cycleService.ts:248`, o gerador de escala usa `m.assignments.length` filtrado por `status: "confirmado"` (linha 224), ignorando completamente o campo `timesServedThisMonth`. O campo fica permanentemente em 0 ou defasado.

**Código afetado:** `apps/api/src/services/scheduler/cycleService.ts:205-271`

**Solução:** Substituir por query agregada:
```prisma
// View calculada ou query:
const timesServed = await prisma.serviceAssignment.count({
  where: { ministryMemberId, status: "confirmado" }
});
```

---

### 1.3 Schema duplicado e inconsistente — Severidade: **Alta**

| Schema | `sessionType` em ServiceSchedule | Uso real |
|--------|----------------------------------|----------|
| `prisma/schema.prisma` (raiz) | ✅ `String @default("ensaio")` | — |
| `apps/api/prisma/schema.prisma` (API) | ❌ **Não tem** | Código usa `sessionType` em `routes/sessions.ts:25,30,64` |

**Impacto:** O schema compilado pela API não inclui `sessionType`. A rota `POST /sessions` (`sessions.ts:21-28`) tenta criar um `ServiceSchedule` com `sessionType: type` — Prisma lançará erro de campo desconhecido em produção.

**Solução:** Eliminar `prisma/schema.prisma` (raiz) e manter apenas `apps/api/prisma/schema.prisma`. Adicionar `sessionType String @default("ensaio")` ao schema da API.

---

### 1.4 Nomenclatura conflitante: `Session` vs `ServiceSchedule` — Severidade: **Média**

- `model Session` → sessão de **login do usuário** (`auth/service.ts:97`)
- Rota `/sessions` → cria **`ServiceSchedule`** para cultos/ensaios (`routes/sessions.ts:21`)

**Código afetado:**
- `apps/api/src/services/auth/service.ts:92-105` — `createSession()` cria `prisma.session`
- `apps/api/src/routes/sessions.ts:13-31` — `POST /sessions` cria `prisma.serviceSchedule`

**Impacto:** Confusão cognitiva para novos devs. `SessionExecutionLog` referencia `CueBlock` (modelo de música), não `Session` (login) — nome enganoso.

**Solução:** Renomear `Session` (login) para `LoginSession` ou `UserSession`. Renomear rota `/sessions` para `/service-sessions` ou manter como está mas deixar explícito na doc.

---

### 1.5 Status como strings soltas — Severidade: **Alta**

**Todos os status encontrados no schema:**

| Modelo | Campo | Valores Possíveis |
|--------|-------|-------------------|
| `Song.status` | String | `"rascunho"`, `"pronta"`, `"arquivada"` |
| `MonthlyScheduleCycle.status` | String | `"coletando_disponibilidade"`, `"gerando"`, `"aguardando_aprovacao"`, `"publicada"` |
| `ServiceAssignment.status` | String | `"vago"`, `"confirmado"`, `"recusado"`, `"convidado"` |
| `WhatsAppMessageLog.status` | String | `"enviado"`, `"entregue"`, `"lido"`, `"falhou"` |
| `NotificationLog.status` | String | `"enviado"` |

**Impacto:** Qualquer string pode ser inserida. Sem autocomplete, sem validação em banco. Erros de digitação passam despercebidos até causar falhas em runtime.

**Solução:** Usar enum do Prisma:
```prisma
enum AssignmentStatus {
  vago
  confirmado
  recusado
  convidado
}

model ServiceAssignment {
  status AssignmentStatus @default(vago)
}
```

---

### 1.6 `ServiceAssignment.ministryMemberId` opcional — Severidade: **Média**

**Localização:** `schema.prisma:195`

```prisma
ministryMemberId String?  // opcional
ministryMember MinistryMember? @relation(fields: [ministryMemberId], references: [id])
```

`status: "vago"` com `ministryMemberId: null` faz sentido. Mas **não há validação** de que um assignment com `status: "confirmado"` tenha `ministryMemberId` preenchido. Dados órfãos podem ser criados.

**Solução:** Validação em app layer ou trigger. Alternativamente, schema condicional não é suportado pelo Prisma — usar validação via `$transaction` com verificação.

---

### 1.7 Soft delete ausente — Severidade: **Média**

**Localização:** `apps/api/src/services/scheduler/cycleService.ts:151-186` — `cancelCycle()`

A função deleta fisicamente:
1. `ServiceAssignment.deleteMany()` (linha 165)
2. `ServiceRepertoireItem.deleteMany()` (linha 169)
3. `ServiceSchedule.deleteMany()` (linha 173)
4. `AvailabilityResponse.deleteMany()` (linha 177)
5. `MonthlyScheduleCycle.delete()` (linha 181)

**Impacto:** Histórico de ciclos cancelados é perdido. Impossível auditar ou recuperar.

**Solução:** Adicionar campo `deletedAt DateTime?` e filtrar por ele em todas as queries:
```prisma
model MonthlyScheduleCycle {
  deletedAt DateTime?
  // + @@where na query: { deletedAt: null }
}
```

Apenas `Song` tem soft delete (via status `"arquivada"`).

---

## 2. Problemas de Performance

### 2.1 Índices ausentes

| Modelo | Índices Existentes | Índices Faltantes |
|--------|---------------------|-------------------|
| `ServiceSchedule` | `@@index([ministryId, date])`, `@@index([cycleId])` | `@@index([date])` isolado |
| `ServiceAssignment` | `@@index([ministryMemberId, status])`, `@@index([scheduleId, status])` | `@@index([scheduleId, role])` — usado em rotas de lookup por role |
| `SessionExecutionLog` | `@@index([triggeredAt])` | `@@index([sessionId])`, `@@index([blockId])` — queries por sessão/bloco sem índice |
| `AvailabilityResponse` | `@@unique([cycleId, ministryMemberId, sundayDate])` | `@@index([ministryMemberId])` — lookup por membro |
| `NotificationLog` | `@@index([ministryId, sentAt, status])` | `@@index([ministryMemberId])` — lookup por membro |
| `WhatsAppMessageLog` | `@@index([ministryId, sentAt, status])` | `@@index([musicianId])` — lookup por músico |

### 2.2 SQLite com escrita sequencial

**Localização:** `apps/api/src/services/notifications/index.ts:130-145`

```typescript
for (let i = 0; i < notifications.length; i++) {
  const result = await telegramNotificationProvider.send(notifications[i]);
  results.push(result);
  if (i < notifications.length - 1) {
    await new Promise(r => setTimeout(r, 100)); // 100ms delay
  }
}
```

**Problema:** SQLite usa lock de escrita a nível de banco (WAL mode ajuda leitura, mas escrita é serializada). O loop sequencial com 100ms de delay + gravação de log no banco para cada notificação faz com que o banco fique locked por segundos. Em um ciclo com 50 membros × 5 domingos = 250 notificações, seriam ~25 segundos de escrita contínua.

**Solução:** Usar `INSERT` em batch (Prisma `createMany`), ou migrar para PostgreSQL se concorrência for requisito.

---

### 2.3 `ServiceSchedule` sem `updatedAt`

O modelo `ServiceSchedule` (linhas 174-191) tem `createdAt` mas **não tem `updatedAt`**. Quando assignments são modificados (confirmação, substituição), não há registro de quando a mudança ocorreu no schedule.

---

## 3. Sugestões de Modelagem

### 3.1 Modelo `MinistryMemberWorshipRole`

Substituir `worshipRoles String @default("[]")`:

```prisma
model MinistryMember {
  worshipRoles WorshipRole[]  // N:N
}

model WorshipRole {
  id   String @id @default(cuid())
  name String @unique  // "guitarra", "vocal", "teclado"
  
  members MinistryMemberWorshipRole[]
}

model MinistryMemberWorshipRole {
  ministryMemberId String
  worshipRoleId    String
  proficiency      Int @default(5) // 1-10

  @@id([ministryMemberId, worshipRoleId])
  ministryMember MinistryMember @relation(fields: [ministryMemberId], references: [id])
  worshipRole    WorshipRole    @relation(fields: [worshipRoleId], references: [id])
}
```

### 3.2 Modelo `ServiceFormationRole`

Substituir `MinistryConfig.defaultFormation String @default("[]")`:

```prisma
model MinistryConfig {
  formationRoles ServiceFormationRole[]
}

model ServiceFormationRole {
  id         String @id @default(cuid())
  ministryId String
  role       String // "guitarra"
  order      Int

  ministry Ministry @relation(fields: [ministryId], references: [id])
  @@unique([ministryId, role])
}
```

### 3.3 Enums para status

```prisma
enum CycleStatus {
  coletando_disponibilidade
  gerando
  aguardando_aprovacao
  publicada
}

enum AssignmentStatus {
  vago
  confirmado
  recusado
  convidado
}

enum SongStatus {
  rascunho
  pronta
  arquivada
}

enum MessageStatus {
  enviado
  entregue
  lido
  falhou
}
```

### 3.4 Soft delete generalizado

Adicionar `deletedAt` aos modelos que podem ser deletados logicamente:

```prisma
model MonthlyScheduleCycle {
  deletedAt DateTime?
}

model ServiceSchedule {
  deletedAt DateTime?
}

model Song {
  // Já tem status "arquivada" — modelo correto
}
```

### 3.5 `updatedAt` faltantes

Adicionar `updatedAt DateTime @updatedAt` a:
- `Invite` (schema.prisma:98)
- `PasswordResetToken` (schema.prisma:116)
- `ServiceAssignment` (schema.prisma:192)
- `ServiceRepertoireItem` (schema.prisma:209)
- `AvailabilityResponse` (schema.prisma:286)
- `WhatsAppMessageLog` (schema.prisma:235)

---

## 4. Roadmap de Refatoração

A ordem proposta segue dependências técnicas: schema primeiro, migração depois, índice por último.

| Fase | O que fazer | Depende de | Esforço |
|------|-------------|------------|---------|
| **Fase 1** | Unificar schemas (eliminar `prisma/schema.prisma` raiz). Adicionar `sessionType` ao schema da API. | — | 30 min |
| **Fase 2** | Adicionar `updatedAt` nos 6 modelos faltantes. | Fase 1 | 30 min |
| **Fase 3** | Criar enums Prisma para todos os status. | Fase 1 | 1h |
| **Fase 4** | Substituir JSON strings por modelos relacionais (`WorshipRole`, `FormationRole`, `SongTag`). | Fase 3 | 4h |
| **Fase 5** | Adicionar `deletedAt` e refatorar `cancelCycle()` para soft delete. | Fase 1 | 2h |
| **Fase 6** | Remover `timesServedThisMonth` e calcular via query agregada. | Fase 3 | 1h |
| **Fase 7** | Adicionar índices faltantes. | Fase 1 | 30 min |
| **Fase 8** | Renomear `Session` para `UserSession`. Separar rota `/sessions` de `ServiceSchedule`. | Fase 1 | 2h |
| **Fase 9** | Migrar de SQLite para PostgreSQL (se requisito de concorrência surgir). | Fase 1-8 | 8h |

---

## 5. Mapa de Arquivos e Linhas

| Problema | Arquivo(s) | Linha(s) |
|----------|-----------|----------|
| JSON em String | `schema.prisma` | 52, 56, 132, 241, 259, 303 |
| JSON parse manual | `cycleService.ts` | 250 |
| Schema duplicado | `prisma/schema.prisma` vs `apps/api/prisma/schema.prisma` | Diff na linha 180 |
| `sessionType` ausente no schema da API | `apps/api/prisma/schema.prisma` | falta linha |
| `sessionType` usado no código | `routes/sessions.ts` | 25, 30, 64 |
| `Session` conflitante | `auth/service.ts:97` / `routes/sessions.ts:21` | 97 / 21 |
| Soft delete ausente | `cycleService.ts` | 151-186 |
| Notificações sequenciais | `notifications/index.ts` | 130-145 |
| `sessionId` sem índice | `schema.prisma` / `SessionExecutionLog` | linha 232 |
| `blockId` sem índice | `schema.prisma` / `SessionExecutionLog` | linha 232 |
| `scheduleId` + `role` sem índice | `schema.prisma` / `ServiceAssignment` | linha 206 |
| `timesServedThisMonth` obsoleto | `schema.prisma:55` / `cycleService.ts:248` | 55 / 248 |
| `MinistryMemberId` opcional sem validação | `schema.prisma:195` | 195 |
| String status sem enum | `schema.prisma` em 5 modelos | 133, 197, 277, 243, 260 |
| Falta `updatedAt` | `Invite`, `PasswordResetToken`, `ServiceAssignment`, `ServiceRepertoireItem`, `AvailabilityResponse`, `WhatsAppMessageLog` | 98, 116, 192, 209, 286, 235 |
