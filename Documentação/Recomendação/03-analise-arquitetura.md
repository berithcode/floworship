# Análise da Arquitetura — Problemas Estruturais e Recomendações

## Resumo Executivo

A arquitetura do Floworship sofre de 4 problemas críticos que bloqueiam evolução segura:

1. **Monorepo híbrido não finalizado** — código legado (`src/`, `prisma/` raiz) convive com novo (`apps/`, `packages/`) sem workspaces, sem plano de migração, com duplicação de schema e componentes
2. **Monólito sem camadas** — routes chamam Prisma diretamente, services acumulam responsabilidades (banco + notificação), sem repository layer
3. **Vazamento de segurança grave** — 17MB+ de dados de perfil Chrome commitados em `apps/api/_IGNORE_floworship/` (cookies, cache, databases de sessão)
4. **Zero testes no backend e sem CI/CD** — impossível refatorar com confiança

Este documento detalha cada problema, cita arquivos e linhas específicos, e propõe um roadmap de refatoração em 4 fases.

---

## 1. Estrutura do Monorepo

### 1.1 Código Legado vs Novo em Paralelo

O projeto tem **duas bases de código** coexistindo:

- **Legado** (`src/`, `prisma/` raiz) — contém App.tsx, rotas, componentes compartilhados, server, engine
- **Novo** (`apps/api/`, `apps/web/`, `packages/`) — migração em andamento

**Evidências de duplicação:**

| O quê | Legado | Novo |
|-------|--------|------|
| Componentes UI | `src/components/shared/BottomNavPill.tsx` | `apps/web/src/components/mobile/BottomNav.tsx` |
| App principal | `src/App.tsx` | `apps/web/src/App.tsx` |
| Schema Prisma | `prisma/schema.prisma` | `apps/api/prisma/schema.prisma` |
| Seed | `prisma/seed.ts` | (usa o mesmo via `../../prisma/seed.ts`) |
| Tests | `src/components/shared/*.test.tsx` (7 arquivos) | `packages/ui/src/*.test.tsx` (7 arquivos equivalentes) |

Os testes estão **duplicados** — os mesmos 7 arquivos existem em `packages/ui/src/` e `src/components/shared/`.

### 1.2 Schema Prisma Duplicado

Dois diretórios `prisma/` com schemas idênticos:
- `prisma/schema.prisma` (raiz)
- `apps/api/prisma/schema.prisma`

Isso significa que qualquer alteração no schema precisa ser replicada manualmente em dois lugares. O risco de divergência é alto.

### 1.3 Sem Workspaces Consistentes

O `package.json` raiz declara workspaces (`apps/*`, `packages/*`), mas:

- **Scripts de dev apontam para caminhos diferentes** — `turbo run dev --filter=@floworship/api` vs scripts legados em `src/`
- **Sem script de build em ordem** — `turbo.json` define `"dependsOn": ["^build"]`, mas os pacotes `@floworship/types` e `@floworship/tokens` não têm dependências explícitas que garantam tokens → types → ui → api/web
- **Express vs Fastify** — legado usa Express (`src/server/`), novo usa Fastify (`apps/api/`)

### 1.4 Cache Chrome Commitado

`apps/api/_IGNORE_floworship/` contém **232 arquivos/diretórios** (17MB+) do perfil Chrome Puppeteer:
- `Default/` — cookies, localStorage, IndexedDB
- `Safe Browsing`, `CertificateRevocation`, `OriginTrials` — dados de navegação
- `Crashpad/` — relatórios de crash
- `BrowserMetrics-spare.pma` — 4MB

Isso é **extremanente grave**: dados de sessão do navegador foram commitados no repositório Git.

### 1.5 Recomendações — Estrutura

1. **Remover imediatamente** `apps/api/_IGNORE_floworship/` do Git com `git filter-branch` ou `git filter-repo` (não basta deletar, o histórico contém os dados)
2. **Adicionar** `_IGNORE_*` ao `.gitignore`
3. **Escolher schema canônico** — manter apenas `apps/api/prisma/schema.prisma`, remover `prisma/schema.prisma`
4. **Script de migração de legado** — criar `plan/MIGRATION_TRACKER.md` listando cada arquivo de `src/` e seu destino em `apps/` ou `packages/`
5. **CI que bloqueie duplicação** — script que compare `src/` vs `apps/` em busca de arquivos equivalentes

---

## 2. Separação de Camadas

### 2.1 Routes Chamam Prisma Diretamente

Os arquivos de rota acessam o banco sem nenhuma camada intermediária:

```typescript
// apps/api/src/routes/auth.ts:2
import { prisma } from '../db';
```

Cada arquivo de rota importa `prisma` e faz queries diretamente. Exemplos:
- `routes/auth.ts` (653 linhas) — `prisma.user.findFirst`, `prisma.session.create`, `prisma.refreshToken.create` espalhados por handlers de login, registro, refresh
- `routes/schedules.ts` (474 linhas) — `prisma.serviceSchedule.findMany`, `prisma.ministryMember.findMany`
- `routes/telegram-webhook.ts` (424 linhas) — `prisma.ministryMember.findFirst`, `prisma.ministryMember.update`

**Problema:** testar qualquer handler requer banco real. Não há como mockar a camada de dados.

### 2.2 Services Misturam Responsabilidades

O `cycleService.ts` (283 linhas) exemplifica o anti-padrão **god service**:

| Função | Responsabilidades |
|--------|------------------|
| `createCycle` | 1. Cria ciclo no banco 2. Cria ServiceSchedules 3. Busca membros 4. Envia notificações em lote |
| `publishCycle` | 1. Valida status 2. Atualiza status no banco 3. Busca schedules + assignments 4. Envia notificações individuais |
| `cancelCycle` | 1. Busca schedules 2. Deleta assignments 3. Deleta repertoireItems 4. Deleta schedules 5. Deleta availabilityResponses 6. Deleta ciclo |

A função `createCycle` (linhas 7-79) executa **4 operações distintas** em sequência: criação no banco → criação de agenda → query de membros → notificações. Se a notificação falhar, o ciclo já foi criado — sem rollback.

### 2.3 Serviço de Notificação com Acoplamento Forte

`services/notifications/index.ts` (145 linhas) tem:
- Provedor concreto `TelegramNotificationProvider` acoplado ao Prisma (linha 31: `prisma.ministryMember.findUnique`)
- `sendBulkNotifications` (linhas 130-144) — loop sequencial com `await` + `setTimeout` de 100ms entre cada notificação
- Log de notificação misturado com o envio (linhas 64-74)

### 2.4 Falta de Camada de Repositório

Não existe nenhum arquivo de repositório no projeto. `prisma` é importado diretamente por:
- Routes (13 arquivos)
- Services (9 arquivos)
- Middleware (4 arquivos)
- WebSocket (indiretamente via services)

**Impacto:** migrar de SQLite para PostgreSQL, ou de Prisma para Drizzle, exigiria reescrever cada arquivo que importa `prisma`.

### 2.5 Recomendações — Camadas

1. **Repository Pattern**: criar `apps/api/src/repositories/` com um arquivo por entidade:
   ```
   repositories/
   ├── userRepository.ts
   ├── ministryMemberRepository.ts
   ├── scheduleRepository.ts
   ├── cycleRepository.ts
   └── notificationLogRepository.ts
   ```
   Cada repositório encapsula queries do Prisma e retorna tipos de domínio.

2. **Service Layer enxuta**: services devem orquestrar repositórios, não acessar Prisma. Notificações devem ser desacopladas via eventos ou fila.

3. **Controller Layer**: routes devem ter no máximo 50 linhas cada — apenas validação de input + chamada de service + serialização de resposta.

4. **Quebrar god files**:
   - `routes/auth.ts` (653 linhas) → `auth/login.ts`, `auth/register.ts`, `auth/refresh.ts`, `auth/sessions.ts`, `auth/invite.ts`
   - `routes/telegram-webhook.ts` (424 linhas) → `telegram/webhook.ts`, `telegram/link.ts`, `telegram/callback.ts`, `telegram/status.ts`
   - `routes/schedules.ts` (474 linhas) → `schedules/crud.ts`, `schedules/assignments.ts`, `schedules/repertoire.ts`

5. **Notificações com fila**: usar `BullMQ` ou `P-Queue` para enviar notificações fora do fluxo síncrono. `sendBulkNotifications` com `setTimeout` serial é frágil e lento.

---

## 3. Segurança e Riscos

### 3.1 Chrome Cache no Repositório (CRÍTICO)

**Local:** `apps/api/_IGNORE_floworship/` (232 itens, 17MB+)
**Risco:** cookies de sessão, tokens de acesso, dados de navegação pessoais expostos no Git. Qualquer um com acesso ao repositório pode extrair dados de sessão do Chrome.
**Ação imediata:** `git filter-repo --path apps/api/_IGNORE_floworship/ --invert-paths` para remover do histórico.
**Ação preventiva:** adicionar `_IGNORE_*` ao `.gitignore` na raiz.

### 3.2 WebSocket Sem Autenticação

`websocket/server.ts` (87 linhas) — análise:

```typescript
// Linha 18: qualquer conexão é aceita
this.wss.on('connection', (ws) => {
  // Linha 35-39: join em qualquer sala com sessionId + ministryId
  if (msg.type === 'join' && msg.sessionId && msg.ministryId) {
    this.joinRoom(ws, msg.ministryId, msg.sessionId);
  }
});
```

**Problema:** qualquer cliente que conheça `sessionId` + `ministryId` pode:
- Entrar em salas arbitrárias
- Receber broadcasts de mudanças de bloco
- Monitorar transições de estado da sessão

**Recomendação:**
- Exigir token JWT na query string: `ws://host/ws?token=...`
- Validar associação do usuário ao `ministryId` no momento do `join`
- Adicionar `authenticateConnection()` no evento `connection` antes de registrar handlers

```typescript
this.wss.on('connection', (ws, req) => {
  const token = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('token');
  const payload = verifyToken(token); // validar JWT
  if (!payload) return ws.close(4001, 'Unauthorized');
  ws.data.userId = payload.userId;
  // ... demais handlers com validação
});
```

### 3.3 Variáveis de Ambiente sem Documentação

O `.env.example` contém apenas 4 variáveis:
```
VITE_API_URL=http://localhost:4001/api
WHATSAPP_PROVIDER=openwa
WHATSAPP_OPENWA_PORT=4002
WHATSAPP_SESSION_NAME=floworship
```

Mas o código referencia pelo menos **10 variáveis obrigatórias** não documentadas:
- `TELEGRAM_BOT_TOKEN` (telegram/index.ts)
- `TELEGRAM_WEBHOOK_SECRET` (routes/telegram-webhook.ts:7)
- `WHATSAPP_ACCESS_TOKEN` (services/whatsapp/)
- `WHATSAPP_APP_SECRET` (services/whatsapp/)
- `WHATSAPP_PHONE_NUMBER_ID` (services/whatsapp/)
- `DATABASE_URL` (db.ts)
- `JWT_SECRET` (middleware/auth.ts)
- `APP_URL` (cycleService.ts:141)
- `PORT` (index.ts)

**Recomendação:** `.env.example` completo com todas as variáveis, descrições e valores default de desenvolvimento.

### 3.4 Recomendações — Segurança

1. **Remover cache Chrome** do Git (com limpeza de histórico)
2. **Autenticar WebSocket** com JWT
3. **Completar `.env.example`** com todas as variáveis
4. **Adicionar `_IGNORE_*` ao `.gitignore`** e criar script de CI que falhe se detectar `_IGNORE_` no working tree

---

## 4. Testes e Qualidade

### 4.1 Cobertura de Testes

| Área | Testes |
|------|--------|
| Backend (services) | 1 arquivo: `services/auth.test.ts` |
| Backend (engine) | 1 arquivo: `engine/__tests__/state-machine.integration.test.ts` |
| Backend (routes) | **Zero** |
| Packages/ui | 7 arquivos de teste unitário |
| Frontend (apps/web) | **Zero** |
| Integração | **Zero** |
| E2E | **Zero** |

Os únicos 2 testes no backend são:
- `services/auth.test.ts` — provavelmente unitário
- `engine/state-machine.integration.test.ts` — integration test

Para um projeto com 13 rotas, 9 services, 4 middlewares e lógica de scheduler complexa, isso é insuficiente para qualquer refatoração segura.

### 4.2 Sem CI/CD

- Nenhum arquivo `.github/workflows/` ou `.gitlab-ci.yml`
- Sem lint automático em PRs (apesar de ESLint estar configurado)
- Sem verificação de tipo TypeScript em PRs
- Sem gate de qualidade para merges

### 4.3 Testes Duplicados

```diff
+ packages/ui/src/AvatarCircular.test.tsx
+ packages/ui/src/BottomNavPill.test.tsx
+ packages/ui/src/CardItem.test.tsx
+ packages/ui/src/CircularIconButton.test.tsx
+ packages/ui/src/DialCircular.test.tsx
+ packages/ui/src/index.integration.test.tsx
+ packages/ui/src/PillToggle.test.tsx
+ packages/ui/src/SliderHorizontal.test.tsx
+ src/components/shared/AvatarCircular.test.tsx
+ src/components/shared/BottomNavPill.test.tsx
+ src/components/shared/CardItem.test.tsx
+ src/components/shared/CircularIconButton.test.tsx
+ src/components/shared/DialCircular.test.tsx
+ src/components/shared/index.integration.test.tsx
+ src/components/shared/PillToggle.test.tsx
+ src/components/shared/SliderHorizontal.test.tsx
```

Os mesmos 7 testes existem em ambos os locais. Durante a migração, apenas `packages/ui/` deve manter os testes; os de `src/` devem ser removidos.

### 4.4 Recomendações — Testes e CI

1. **Pipeline CI mínimo** (GitHub Actions):
   ```yaml
   # .github/workflows/ci.yml
   jobs:
     lint: npm run lint
     typecheck: npx tsc --noEmit
     test: npm run test
     security: npx tsx scripts/check-ignore-dirs.ts
   ```

2. **Testar rotas críticas primeiro**: auth, schedules, telegram-webhook
3. **Adicionar `vitest.config.ts`** no workspace `@floworship/api` com cobertura configurada
4. **Testes de integração** para `cycleService` usando banco SQLite de teste
5. **Remover testes duplicados** de `src/components/shared/`

---

## 5. Performance e Escalabilidade

### 5.1 SQLite em Produção

O projeto usa SQLite (`dev.db`) tanto em dev quanto potencialmente em produção. SQLite:
- Não escala com escrita concorrente (apenas uma transação por vez)
- Sem replicação
- Sem backup point-in-time
- Limite de ~10GB prático

**Recomendação:** migrar para PostgreSQL ou Turso (SQLite distribuído) assim que houver mais de 5 usuários simultâneos.

### 5.2 Notificações Bloqueantes

`sendBulkNotifications` (notifications/index.ts:130-144) envia notificações em **loop serial** com `await`:

```typescript
for (let i = 0; i < notifications.length; i++) {
  const result = await telegramNotificationProvider.send(notifications[i]);
  // ...
  await new Promise(r => setTimeout(r, 100)); // delay artificial
}
```

Para 50 membros, isso leva no mínimo 5 segundos (`50 * 100ms`). Se o Telegram API demorar 500ms por requisição, o total sobe para 30 segundos.

**Recomendação:** usar `Promise.allSettled` com concorrência limitada (ex: p-limit com `concurrency: 5`) ou uma fila BullMQ.

### 5.3 WebSocket sem Heartbeat

O `SessionWSServer` não implementa:
- Ping/pong para detectar desconexão
- Reconexão automática no cliente
- Reconciliação de estado após reconexão

**Recomendação:** adicionar heartbeat a cada 30s. No cliente, implementar backoff exponencial para reconexão e solicitar snapshot de estado atual.

### 5.4 Recomendações — Performance

1. **Fila de notificações** com concorrência controlada (substituir `sendBulkNotifications`)
2. **Heartbeat no WebSocket** + reconexão com backoff
3. **Índices no banco** — verificar se as queries frequentes (por `ministryId`, `cycleId`, `userId`) têm índices
4. **Cache de queries** — `ministryMember.findMany` com `telegramChatId` poderia ser cacheado em memória

---

## 6. Dev Experience

### 6.1 Onboarding de Novo Desenvolvedor

Estado atual:
1. Clonar repositório
2. `npm install`
3. ??? (descobrir que `.env.example` está incompleto)
4. Criar banco SQLite (não documentado)
5. Descobrir variáveis faltando olhando código fonte
6. Iniciar com `npm run dev`

**Tempo estimado para configurar ambiente local: 2-4 horas**

### 6.2 Build Order

O monorepo tem dependências entre pacotes:
- `packages/ui` depende de `packages/types`, `packages/tokens`
- `apps/api` depende de `packages/types`
- `apps/web` depende de `packages/ui`, `packages/types`

O `turbo.json` declara `dependsOn: ["^build"]`, que resolve a ordem automaticamente no Turborepo. Porém:
- `packages/tokens` exporta CSS — precisa ser compilado antes de `packages/ui`
- `packages/types` exporta TypeScript — precisa ser compilado antes de `apps/api` e `apps/web`
- Não há verificação de TypeScript no CI para garantir que as interfaces batem entre pacotes

### 6.3 Recomendações — Dev Experience

1. **`.env.example` completo** com todas as variáveis, comentários e valores default
2. **README de setup rápido** com passo-a-passo:
   ```
   1. npm install
   2. cp .env.example .env
   3. npm run db:generate
   4. npm run db:migrate
   5. npm run dev
   ```
3. **Script `npm run setup`** que executa install → generate → migrate em sequência
4. **Adicionar `verify-build-order.sh`** no CI que cheque se todos os pacotes compilam na ordem correta
5. **Adicionar `npm run typecheck`** na raiz que rode `tsc --noEmit` em todos os workspaces

---

## 7. Roadmap de Refatoração Arquitetural

### Fase 1 — Emergencial (1-2 dias)

| # | Ação | Critério de sucesso |
|---|------|---------------------|
| 1.1 | Remover `_IGNORE_floworship/` do Git com `git filter-repo` | Histórico limpo, sem vestígios de dados Chrome |
| 1.2 | Adicionar `_IGNORE_*` ao `.gitignore` | Novo clone não tem pasta `_IGNORE_` |
| 1.3 | Completar `.env.example` com todas as variáveis | Dev consegue configurar ambiente em 10 min |
| 1.4 | Autenticar WebSocket com JWT | Conexão sem token é rejeitada |

### Fase 2 — Curto Prazo (1-2 semanas)

| # | Ação | Critério de sucesso |
|---|------|---------------------|
| 2.1 | Escolher schema canônico e remover duplicado | Apenas `apps/api/prisma/` existe |
| 2.2 | Remover testes duplicados de `src/components/shared/` | CI não encontra arquivos `.test.` duplicados |
| 2.3 | Criar `repositories/` com repositórios para User, MinistryMember, Cycle, Schedule | Routes não importam mais `prisma` diretamente |
| 2.4 | Quebrar `auth.ts` (653 linhas) em módulos | Nenhuma rota > 100 linhas |
| 2.5 | Pipeline CI mínimo (lint + typecheck + test) | PRs não mergeáveis sem CI verde |
| 2.6 | Adicionar `npm run setup` | `npm run setup` executa tudo |

### Fase 3 — Médio Prazo (1 mês)

| # | Ação | Critério de sucesso |
|---|------|---------------------|
| 3.1 | Refatorar `cycleService` em módulos: `cycleService.ts`, `availabilityService.ts`, `schedulerService.ts` | Nenhum service > 150 linhas |
| 3.2 | Implementar notification queue (BullMQ ou p-limit) | Notificações em fila sem delay serial |
| 3.3 | Criar `plan/MIGRATION_TRACKER.md` com destino de cada arquivo de `src/` | Toda migração tem destino claro |
| 3.4 | Adicionar testes de integração para `cycleService.createCycle` | Cobertura mínima de 30% no backend |
| 3.5 | Quebrar `telegram-webhook.ts` em módulos | Nenhum webhook handler > 50 linhas |

### Fase 4 — Longo Prazo (2-3 meses)

| # | Ação | Critério de sucesso |
|---|------|---------------------|
| 4.1 | Remover código legado de `src/` | `src/` não existe mais |
| 4.2 | Migrar SQLite → PostgreSQL ou Turso | Zero downtime na migração |
| 4.3 | Testes E2E com Playwright cobrindo fluxo crítico | 3 cenários E2E passando |
| 4.4 | Migrar de `@open-wa/wa-automate` para WhatsApp Cloud API oficial | WhatsAppProvider sem Puppeteer |
| 4.5 | Cobertura de testes > 70% no backend | CI falha se cobertura cair |

---

## 8. ADRs Sugeridos

Os seguintes Architecture Decision Records devem ser criados e mantidos em `Documentação/ADRs/`:

| ID | Título | Decisão-chave |
|----|--------|---------------|
| ADR-001 | Repository Pattern no Backend | Todo acesso a banco será encapsulado em repositórios |
| ADR-002 | Fila de Notificações Assíncrona | Notificações não bloqueiam requisições HTTP |
| ADR-003 | Schema Canônico Único | Apenas `apps/api/prisma/schema.prisma` é fonte da verdade |
| ADR-004 | Autenticação Obrigatória em WebSocket | Toda conexão WebSocket exige JWT válido |
| ADR-005 | Estratégia de Migração de Legado | Ordem de remoção de `src/` por módulo |
| ADR-006 | Banco de Dados em Produção | SQLite vs PostgreSQL vs Turso com critérios de escolha |
| ADR-007 | Testes Obrigatórios em PRs | Threshold mínimo de cobertura por módulo |
| ADR-008 | CI/CD Pipeline | Ferramenta, triggers, stages, gate de qualidade |

---

## Apêndice A — Mapa de Arquivos por Tamanho

Relatórios de arquivos com mais de 200 linhas que precisam de refatoração prioritária:

| Arquivo | Linhas | Problema |
|---------|--------|----------|
| `routes/auth.ts` | 653 | Rotas + lógica de auth + gerenciamento de sessão misturados |
| `routes/schedules.ts` | 474 | CRUD + assignments + lógica de disponibilidade |
| `routes/telegram-webhook.ts` | 424 | Webhook + callback + linking + status |
| `services/scheduler/cycleService.ts` | 283 | Criação + notificação + cancelamento + geração |
| `services/telegram/index.ts` | ~130 | Serviço Telegram com acoplamento + templates |
| `services/notifications/index.ts` | 145 | Provider + bulk sending + logging no mesmo arquivo |
| `websocket/server.ts` | 87 | Pequeno mas sem autenticação |

## Apêndice B — Árvore de Dependências Atual

```
packages/tokens/ ──→ CSS exports
       │
       ▼
packages/types/ ───→ TypeScript interfaces (engine.ts)
       │
       ▼
packages/ui/ ──────→ Componentes React (usa tokens + types)
       │
       ├────────┐
       ▼        ▼
  apps/web/   apps/api/  ←── src/ (legado, paralelo)
```

A seta pontilhada `apps/api/ ←── src/` representa o código legado que deveria ser eliminado.

---

*Documento gerado em 04/07/2026. Baseado em análise estática do código-fonte.*
