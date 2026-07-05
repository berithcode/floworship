# Correções do Banco de Dados — Versão Revisada

> Este documento substitui as seções de correção do relatório original `01-analise-banco-dados.md`.
> Os diagnósticos do relatório original permanecem válidos — apenas as **correções propostas** foram revisadas abaixo, onde continham risco de quebra ou mudança de comportamento não intencional.

---

## ⚠️ Pré-requisito obrigatório antes de qualquer correção

**Verificar a versão do Prisma instalada:**

```bash
cat apps/api/package.json | grep '"prisma"'
```

- Se `< 6.2.0`: **não aplicar enums nem o tipo `Json` nativo** (Seções 1.5, 3.3 do relatório original) — o `prisma generate` falhará com erro de validação de schema (`Error validating: You defined the enum... But the current connector does not support enums`).
- Se `>= 6.2.0`: enums e `Json` funcionam, mas com uma ressalva importante — **SQLite não impõe o enum no nível do banco**. Um valor inválido inserido via SQL bruto ou migração manual não é rejeitado pelo SQLite; a validação continua ocorrendo apenas na camada do Prisma Client. Trate os enums como ganho de tipagem/autocomplete, não como garantia de integridade no banco.

Se a versão for antiga, atualizar o Prisma **é a Fase 0**, antes de tudo mais.

---

## 1. Correção do algoritmo de fairness (`timesServedThisMonth`) — CORRIGIDO

### Problema na correção original
A sugestão original substituía o campo manual por:

```typescript
// ❌ ERRADO — conta todo o histórico do músico, não o ciclo/mês atual
const timesServed = await prisma.serviceAssignment.count({
  where: { ministryMemberId, status: "confirmado" }
});
```

Isso quebra a premissa (documentada na decisão de arquitetura 9.7) de que a contagem é **resetada mensalmente**. Um músico que serviu muito há um ano nunca mais seria priorizado, mesmo estando livre há meses.

### Correção real

```typescript
// ✅ CORRETO — conta apenas dentro do ciclo/mês vigente
const timesServed = await prisma.serviceAssignment.count({
  where: {
    ministryMemberId,
    status: "confirmado",
    schedule: {
      cycleId: currentCycleId, // ciclo mensal atual
    },
  },
});
```

Se a query de geração de escala precisar disso para **todos os membros de uma vez** (evitando N+1), usar `groupBy`:

```typescript
const counts = await prisma.serviceAssignment.groupBy({
  by: ['ministryMemberId'],
  where: {
    status: 'confirmado',
    schedule: { cycleId: currentCycleId },
  },
  _count: { ministryMemberId: true },
});
// Mapear counts para um Map<ministryMemberId, number> antes de rodar o algoritmo de fairness
```

**Ação:** remover completamente o campo `timesServedThisMonth` do schema (ele nunca é atualizado hoje) e usar a query acima em `cycleService.ts`, substituindo a leitura de `m.assignments.length` (linha 224 do código original) por este `groupBy`.

---

## 2. Ordem de eliminação do schema raiz duplicado — CORRIGIDO

### Problema na correção original
A Fase 1 do roadmap original propunha eliminar `prisma/schema.prisma` (raiz) em 30 minutos, isoladamente. Mas o relatório de arquitetura mostra que o **código legado** (`src/`, e o `prisma/seed.ts` compartilhado) ainda depende desse schema, e só está previsto para remoção na Fase 4 (2–3 meses).

### Sequência corrigida

| Passo | Ação | Depende de |
|-------|------|------------|
| 1 | Mapear todos os pontos que importam o Prisma Client gerado a partir do schema raiz (`grep -r "from '../../prisma"` e equivalentes em `src/`) | — |
| 2 | Redirecionar `prisma/seed.ts` e qualquer script legado para usar o schema de `apps/api/prisma/schema.prisma` | Passo 1 |
| 3 | Rodar `apps/api` e `src/` (legado) apontando para o mesmo schema por pelo menos 1 ciclo de teste completo | Passo 2 |
| 4 | **Só então** apagar `prisma/schema.prisma` da raiz | Passo 3 |

Não fazer esse passo isoladamente às vésperas de outras mudanças de schema (enums, JSON, `sessionType`) — aplicar o `sessionType` que falta primeiro no schema da API, testar, e só depois remover o schema raiz.

---

## 3. Rename de `Session` → `UserSession` — CORRIGIDO

### Problema na correção original
Tratado como uma tarefa de "2h" sem alertar que é uma migration em uma tabela **com sessões de login ativas em produção**.

### Procedimento correto

1. Gerar a migration com `npx prisma migrate dev --name rename_session_to_usersession --create-only` (não aplicar ainda).
2. **Abrir o arquivo `.sql` gerado e verificar manualmente** se o Prisma emitiu `ALTER TABLE "Session" RENAME TO "UserSession";` — se em vez disso ele gerar `DROP TABLE` + `CREATE TABLE`, editar a migration manualmente para usar `RENAME TO`, preservando os dados.
3. Rodar em ambiente de staging com uma cópia do banco de produção antes de aplicar.
4. Aplicar em produção em janela de baixo tráfego (ex: madrugada, fora do horário de cultos/ensaios), avisando que usuários logados podem precisar refazer login se algo falhar.
5. Ter um rollback pronto (`ALTER TABLE "UserSession" RENAME TO "Session";`) documentado antes de aplicar.

---

## 4. Migração de JSON strings para modelos relacionais — COMPLEMENTADO

O relatório original (seção 3) cobre `worshipRoles`, `defaultFormation`, `tags` e status, mas **não cobre `MinistryMember.lastServedAt`**, que é um mapa `{ role: data }` — mais complexo que uma relação N:N simples.

### Modelo faltante: `MemberRoleLastServed`

```prisma
model MemberRoleLastServed {
  ministryMemberId String
  role             String
  lastServedAt     DateTime

  ministryMember MinistryMember @relation(fields: [ministryMemberId], references: [id])

  @@id([ministryMemberId, role])
  @@index([ministryMemberId])
}
```

Isso substitui `MinistryMember.lastServedAt String` (JSON manual) por uma tabela filha, permitindo `ORDER BY lastServedAt` diretamente no banco (útil para o algoritmo de fairness, que hoje precisaria fazer `JSON.parse` e ordenar em memória).

**Ajuste no roadmap:** a Fase 4 original estimava 4h para toda a migração de JSON → relacional. Com este modelo adicional, a estimativa realista é **6–8h**, já que exige também migrar os dados existentes (script de migração de dados, não só de schema) e atualizar o algoritmo de fairness para consultar a nova tabela em vez de fazer `JSON.parse`.

---

## 5. Soft delete — CORRIGIDO (evitar regressão de dados "fantasmas")

### Problema na correção original
Adicionar `deletedAt` a `MonthlyScheduleCycle` e `ServiceSchedule` resolve a perda de histórico, mas **só funciona se todas as queries existentes filtrarem por `deletedAt: null`**. O relatório original não lista esses pontos, criando risco de ciclos "cancelados" reaparecerem em dashboards e listagens.

### Correção: aplicar o filtro globalmente, não manualmente

Usar **Prisma Client Extensions** (Prisma ≥ 4.16) para aplicar o filtro automaticamente em todas as queries de leitura, em vez de confiar que cada desenvolvedor lembrará de adicionar `where: { deletedAt: null }`:

```typescript
// apps/api/src/db.ts
import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    monthlyScheduleCycle: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
    serviceSchedule: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});
```

E `cancelCycle()` passa a fazer `update({ data: { deletedAt: new Date() } })` em vez de `delete()`/`deleteMany()`.

**Nota:** essa extensão não cobre `findUnique` por padrão (Prisma não permite interceptar `findUnique` para adicionar filtros compostos da mesma forma) — para buscas por ID único de um registro potencialmente deletado (ex: tela de auditoria), usar uma query explícita separada, sem o filtro.

---

## Roadmap revisado (substitui a tabela original)

| Fase | O que fazer | Depende de | Esforço revisado |
|------|-------------|------------|-------------------|
| **Fase 0** | Verificar/atualizar versão do Prisma (≥ 6.2.0 se for usar enum/Json nativo) | — | 30 min – 2h (se precisar atualizar) |
| **Fase 1** | Adicionar `sessionType` ao schema da API. Mapear e migrar dependências do schema raiz antes de removê-lo (ver seção 2) | Fase 0 | 2h |
| **Fase 2** | Adicionar `updatedAt` nos 6 modelos faltantes | Fase 1 | 30 min |
| **Fase 3** | Criar enums Prisma para status (após confirmar Fase 0) | Fase 0, 1 | 1h |
| **Fase 4** | Substituir JSON strings por modelos relacionais, incluindo `MemberRoleLastServed` (ver seção 4) + script de migração de dados existentes | Fase 3 | 6–8h |
| **Fase 5** | Soft delete via Prisma Client Extension (ver seção 5) + refatorar `cancelCycle()` | Fase 1 | 3h |
| **Fase 6** | Corrigir `timesServedThisMonth` com `groupBy` filtrado por ciclo (ver seção 1) | Fase 3 | 1.5h |
| **Fase 7** | Adicionar índices faltantes | Fase 1 | 30 min |
| **Fase 8** | Renomear `Session` → `UserSession` com procedimento de migration seguro (ver seção 3) | Fase 1 | 3h (inclui staging) |
| **Fase 9** | Migrar SQLite → PostgreSQL, se necessário | Fase 1–8 | 8h |

**Total revisado:** ~26–29h (vs. ~20h estimadas no relatório original) — o aumento reflete o modelo `MemberRoleLastServed` faltante e o teste em staging do rename de `Session`.
