# Sequência de Implementação — Correções Floworship

> Ordem de execução direta, sem cronograma. Cada item referencia o documento e a seção onde a correção detalhada está descrita. Seguir a ordem exatamente — há dependências entre os passos.

---

## 1. Segurança crítica (sem dependências, executar primeiro)

1. Remover `apps/api/_IGNORE_floworship/` do Git e do histórico (`git filter-repo`), adicionar `_IGNORE_*` ao `.gitignore`.
   → *03-analise-arquitetura.md, seção 1.4/3.1*
2. `TOKEN_SECRET`/`JWT_SECRET`: remover valor padrão hardcoded, lançar erro no startup se a env var não existir.
   → *02-analise-backend.md, seção 1.2*
3. Cookies: `secure: false` → `secure: process.env.NODE_ENV === 'production'`.
   → *02-analise-backend.md, seção 1.5*
4. Middleware de auth: fazer retornar `401` quando token ausente/inválido, em vez de apenas `return`.
   → *02-analise-backend.md, seção 1.3*
5. Autenticar o WebSocket lendo o cookie `access_token` já existente no handshake HTTP (não usar token na query string).
   → *02-correcoes-backend-REVISADO.md, seção 2 (versão corrigida — substitui a sugestão original de token na URL)*

---

## 2. Preparação de schema (antes de qualquer mudança estrutural no banco)

6. Verificar a versão do Prisma instalada (`apps/api/package.json`). Se `< 6.2.0`, atualizar antes de prosseguir — é pré-requisito para os passos 12 e 17.
   → *01-correcoes-banco-dados-REVISADO.md, seção "Pré-requisito obrigatório"*
7. Adicionar `sessionType String @default("ensaio")` ao `apps/api/prisma/schema.prisma` (sem remover o schema raiz ainda).
   → *01-analise-banco-dados.md, seção 1.3*
8. Mapear todos os imports do Prisma Client gerado a partir de `prisma/schema.prisma` (raiz) dentro de `src/` (incluindo `prisma/seed.ts`).
   → *03-correcoes-arquitetura-REVISADO.md, seção 1, passo 2*
9. Redirecionar esses imports para o client gerado por `apps/api/prisma/schema.prisma`.
   → *03-correcoes-arquitetura-REVISADO.md, seção 1, passo 3*
10. Rodar `src/` (legado) e `apps/api` usando o mesmo schema por um ciclo de teste completo (criação de ciclo → geração de escala → confirmação).
    → *03-correcoes-arquitetura-REVISADO.md, seção 1, passo 4*
11. Remover `prisma/schema.prisma` da raiz. Adicionar checagem de CI para impedir que ele volte a ser criado.
    → *01-analise-banco-dados.md, seção 1.3* + *03-correcoes-arquitetura-REVISADO.md, seção 4*

---

## 3. Autenticação e validação de API

12. Migrar JWT caseiro para `@fastify/jwt`.
    → *02-analise-backend.md, seção 1.1* — nota: invalida sessões ativas no deploy; ao aplicar via LLM/CI, sinalizar essa quebra esperada em vez de tratá-la como bug.
13. Adicionar Zod + `@fastify/type-provider-zod` para validação de entrada, rota por rota.
    → *02-analise-backend.md, seção 3.1*
14. Implementar error handler centralizado (`AppError` + `setErrorHandler`).
    → *02-analise-backend.md, seção 3.2*
15. Criar helper único `getAuthenticatedUser()` e remover as 6 cópias de `getUser()`.
    → *02-analise-backend.md, seção 2.1*
16. Padronizar mensagens de erro (PT-BR + `code` string), remover mistura de idiomas.
    → *02-analise-backend.md, seção 3.4*

---

## 4. Correções de lógica de negócio e performance

17. Corrigir `timesServedThisMonth`: substituir por `groupBy` filtrado por `cycleId` do ciclo vigente (não histórico total).
    → *01-correcoes-banco-dados-REVISADO.md, seção 1* — **crítico**: a versão original do relatório de banco (seção 1.2) está incorreta, usar apenas a versão revisada.
18. Corrigir o `createMany` de `ServiceAssignment`: sem `skipDuplicates` (não suportado no SQLite), deduplicar em memória antes.
    → *02-correcoes-backend-REVISADO.md, seção 1* — substitui a versão original do relatório de backend (seção 4.1), que quebra em runtime.
19. Substituir `sendBulkNotifications` (loop serial com `setTimeout`) por fila (BullMQ) ou `p-limit` com concorrência controlada.
    → *02-analise-backend.md, seção 4.2* / *03-analise-arquitetura.md, seção 5.2*
20. Adicionar `@fastify/rate-limit` (sem Redis por enquanto, versão em memória da lib oficial).
    → *02-correcoes-backend-REVISADO.md, seção 3, Opção A*

---

## 5. Enums e tipos de dados

21. Criar enums Prisma (`AssignmentStatus`, `CycleStatus`, `SongStatus`, `MessageStatus`) — só executar se o passo 6 confirmou Prisma ≥ 6.2.0.
    → *01-analise-banco-dados.md, seção 3.3*
22. Adicionar `updatedAt` aos 6 modelos que não têm (`Invite`, `PasswordResetToken`, `ServiceAssignment`, `ServiceRepertoireItem`, `AvailabilityResponse`, `WhatsAppMessageLog`).
    → *01-analise-banco-dados.md, seção 3.5*
23. Adicionar os índices faltantes listados no relatório original.
    → *01-analise-banco-dados.md, seção 2.1*

---

## 6. Soft delete e modelagem relacional

24. Adicionar `deletedAt` a `MonthlyScheduleCycle` e `ServiceSchedule`; aplicar filtro automático via Prisma Client Extension (não filtro manual em cada query).
    → *01-correcoes-banco-dados-REVISADO.md, seção 5*
25. Refatorar `cancelCycle()` para usar `update({ deletedAt: new Date() })` em vez de `delete()`/`deleteMany()`.
    → *01-analise-banco-dados.md, seção 1.7*
26. Migrar JSON strings para modelos relacionais: `WorshipRole`, `MinistryMemberWorshipRole`, `ServiceFormationRole`, `SongTag`.
    → *01-analise-banco-dados.md, seção 3.1–3.2*
27. Criar o modelo `MemberRoleLastServed` para substituir `MinistryMember.lastServedAt` (JSON) — modelo ausente no relatório original.
    → *01-correcoes-banco-dados-REVISADO.md, seção 4*
28. Migrar dados existentes dos campos JSON para as novas tabelas relacionais (script de migração de dados, não só de schema).

---

## 7. Camada de arquitetura (depende de todo o schema já estar estável)

29. Criar `repositories/` (User, MinistryMember, Cycle, Schedule, NotificationLog) encapsulando o Prisma — só depois dos passos 17–28, para não reescrever repositórios duas vezes.
    → *03-analise-arquitetura.md, seção 2.5*
30. Quebrar `routes/auth.ts` (653 linhas) em módulos (`login.ts`, `register.ts`, `refresh.ts`, `sessions.ts`, `invite.ts`).
    → *03-analise-arquitetura.md, seção 2.5*
31. Quebrar `routes/telegram-webhook.ts` (424 linhas) em módulos.
    → *03-analise-arquitetura.md, seção 2.5*
32. Quebrar `routes/schedules.ts` (474 linhas) em módulos (`crud.ts`, `assignments.ts`, `repertoire.ts`).
    → *03-analise-arquitetura.md, seção 2.5*
33. Remover stub morto `services/whatsapp.ts`, consolidar em `services/whatsapp/`.
    → *02-analise-backend.md, seção 2.2*

---

## 8. Rename de nomenclatura (maior risco operacional, menor urgência — por último)

34. Renomear model `Session` → `UserSession`: gerar migration com `--create-only`, revisar SQL manualmente (garantir `ALTER TABLE RENAME`, não drop+create), testar em staging antes de aplicar em produção.
    → *01-correcoes-banco-dados-REVISADO.md, seção 3*
35. Revisar `websocket/server.ts` e qualquer referência a `prisma.session` para atualizar ao novo nome do model.
    → *03-correcoes-arquitetura-REVISADO.md, seção 2*

---

## 9. CI, testes e limpeza final

36. Pipeline CI mínimo: lint + typecheck + testes + checagem de `_IGNORE_*`/schema duplicado.
    → *03-analise-arquitetura.md, seção 4.4*
37. Remover testes duplicados de `src/components/shared/` (manter só `packages/ui/src/`).
    → *03-analise-arquitetura.md, seção 4.3*
38. Completar `.env.example` com todas as variáveis referenciadas no código.
    → *02-analise-backend.md, seção 6.2* / *03-analise-arquitetura.md, seção 3.3*
39. Eliminar `any` das rotas, tipar com `FastifyRequest`/`FastifyReply` ou genéricos do Fastify.
    → *02-analise-backend.md, seção 3.3*
40. Remover código legado de `src/` por completo.
    → *03-analise-arquitetura.md, seção 7, Fase 4*
41. Avaliar migração SQLite → PostgreSQL/Turso, se concorrência de escrita virar gargalo real.
    → *01-analise-banco-dados.md, seção 4* / *03-analise-arquitetura.md, seção 5.1*

---

## Regras gerais para quem for executar via LLM

- **Não pular a ordem dentro de cada bloco numerado.** Os blocos 1→9 têm dependência lógica entre si (segurança antes de schema, schema antes de repository pattern, rename por último).
- **Sempre que um passo referenciar "REVISADO", usar essa versão, não a do relatório original** — as versões revisadas corrigem erros técnicos concretos (ex: `skipDuplicates` no SQLite, query de fairness sem filtro de ciclo).
- Após cada bloco, rodar a suíte de testes/typecheck disponível antes de avançar para o próximo, mesmo sem CI formal ainda implementado.
