# Correções do Backend — Versão Revisada

> Substitui as correções de código do relatório original `02-analise-backend.md` onde havia incompatibilidade com SQLite ou lacunas operacionais.

---

## 1. `createMany` com `skipDuplicates` — CORRIGIDO (quebrava em runtime)

### Problema na correção original

```typescript
// ❌ ERRADO — skipDuplicates não é suportado no SQLite, lança erro em runtime
await prisma.serviceAssignment.createMany({
  data: assignments.map(a => ({ ... })),
  skipDuplicates: true,
});
```

Confirmado na documentação oficial do Prisma: **`skipDuplicates` não é suportado por SQLite, SQL Server ou MongoDB.** Como o Floworship roda SQLite, essa chamada falha assim que houver qualquer registro duplicado no lote.

### Correção real

Como o SQLite não tem `ON CONFLICT DO NOTHING` exposto pelo Prisma nessa API, a deduplicação precisa acontecer **antes** de montar o array:

```typescript
// ✅ CORRETO — deduplicar em memória antes do createMany
const seen = new Set<string>();
const dedupedAssignments = assignments.filter(a => {
  const key = `${a.scheduleId}:${a.role}:${a.ministryMemberId}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

await prisma.serviceAssignment.createMany({
  data: dedupedAssignments.map(a => ({
    scheduleId: a.scheduleId,
    role: a.role,
    ministryMemberId: a.ministryMemberId,
    status: a.status,
  })),
  // sem skipDuplicates — não suportado no SQLite
});
```

Se a chave de unicidade real for uma constraint do banco (ex: `@@unique([scheduleId, role, ministryMemberId])`), garanta que a deduplicação em memória usa exatamente os mesmos campos dessa constraint, ou o `createMany` ainda falhará com erro de violação de unicidade em vez de simplesmente pular o duplicado.

**Nota para quando migrarem para PostgreSQL (Fase 9 do roadmap de banco):** nesse ponto, `skipDuplicates: true` volta a ser uma opção válida e pode substituir a deduplicação manual acima.

---

## 2. WebSocket — autenticação sem expor token na URL — CORRIGIDO

### Problema na correção original

```typescript
// ⚠️ Funciona, mas expõe o token em logs de proxy/servidor e no histórico do navegador
const token = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('token');
```

Tokens em query string de URL são registrados em logs de acesso (nginx, load balancers, CDNs) e podem ficar em cache de navegador — prática desaconselhada pela OWASP para dados sensíveis.

### Correção recomendada — token na primeira mensagem, não na URL

```typescript
// Handshake: aceita a conexão, mas não processa nada até autenticar
this.wss.on('connection', (ws, req) => {
  let authenticated = false;
  const authTimeout = setTimeout(() => {
    if (!authenticated) ws.close(4001, 'Auth timeout');
  }, 5000); // 5s para autenticar ou desconecta

  ws.once('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type !== 'auth' || !msg.token) {
      ws.close(4001, 'Auth required');
      return;
    }

    const payload = verifyToken(msg.token); // valida JWT normalmente
    if (!payload) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    authenticated = true;
    clearTimeout(authTimeout);
    ws.data = { userId: payload.userId, ministryId: payload.ministryId };

    // só agora registra os demais handlers (join room, etc.)
    ws.on('message', (raw) => this.handleMessage(ws, raw));
  });
});
```

No cliente, a primeira mensagem após `onopen` deve ser `{ type: 'auth', token: <jwt> }`, lido do cookie httpOnly já existente (o frontend já tem acesso a ele nas rotas HTTP autenticadas — não é necessário reemitir um token novo só para o WebSocket).

Alternativa mais simples, se o WebSocket e a API HTTP estiverem no mesmo domínio: o servidor pode ler o cookie `access_token` diretamente do handshake HTTP (`req.headers.cookie`), sem exigir nenhuma mensagem adicional do cliente — elimina a necessidade de enviar token pela URL ou por mensagem:

```typescript
this.wss.on('connection', (ws, req) => {
  const cookies = parseCookies(req.headers.cookie || '');
  const payload = verifyToken(cookies.access_token);
  if (!payload) { ws.close(4001, 'Unauthorized'); return; }
  ws.data = { userId: payload.userId };
});
```

Essa segunda opção é a recomendada quando front e back estão no mesmo domínio/subdomínio — reaproveita a infraestrutura de cookies httpOnly já implementada para as rotas REST.

---

## 3. `@fastify/rate-limit` — nota de infraestrutura ausente

O relatório original recomenda `@fastify/rate-limit` com store Redis, mas nenhum documento do projeto prevê provisionar Redis. Duas opções, dependendo do orçamento de infraestrutura:

**Opção A (sem Redis, curto prazo):**
```typescript
import rateLimit from '@fastify/rate-limit';

fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  // sem store Redis — ainda em memória, mas usando a lib oficial
  // (resolve o bug de chave "ip:" compartilhada e a falta de limite de tamanho do Map,
  //  mas não resolve escalabilidade horizontal)
});
```

**Opção B (com Redis, se a infra permitir):** manter a sugestão original do relatório. Adicionar ao roadmap de DevOps a tarefa de provisionar Redis (ou usar um serviço gerenciado como Upstash, que tem tier gratuito e não exige infraestrutura própria) **antes** de configurar o `store` no `@fastify/rate-limit`.

Recomendação: aplicar a Opção A primeiro (resolve os bugs de segurança do rate limit caseiro hoje), e migrar para B só se/quando o app precisar rodar em múltiplas instâncias.

---

## 4. Migração de JWT caseiro para `@fastify/jwt` — nota operacional ausente

A correção do relatório original está tecnicamente certa, mas falta um aviso: **tokens emitidos pelo esquema antigo (HMAC caseiro) não serão validados pelo `@fastify/jwt`** após o deploy. Isso significa:

- Todos os usuários com sessão ativa no momento do deploy serão desconectados e precisarão fazer login novamente.
- Se isso for um problema (ex: deploy em horário de culto/ensaio, com músicos logados no app), planejar o deploy para um horário de baixo uso, e considerar exibir uma mensagem de "sessão expirada, faça login novamente" em vez de um erro genérico no frontend.

Não é um bloqueador — é esperado nesse tipo de migração — mas deve estar documentado no plano de deploy, não descoberto em produção.

---

## Roadmap de correções — ajustes de prioridade

Mantém a estrutura original (🔴 imediato / 🟡 1-2 sprints / 🟢 quando houver tempo), com estas mudanças:

| # | Problema | Ajuste |
|---|----------|--------|
| 6 | `createMany` no ciclo | Usar a versão com deduplicação manual (seção 1), não `skipDuplicates` |
| — (nova) | WebSocket: reaproveitar cookie httpOnly no handshake em vez de token na URL | Adicionar como parte do item "Autenticar WebSocket com JWT" do relatório de arquitetura |
| 2 | JWT caseiro → `@fastify/jwt` | Adicionar nota no plano de deploy sobre logout forçado de sessões ativas |
| 10 | Rate limit → `@fastify/rate-limit` | Aplicar Opção A (sem Redis) primeiro; Redis fica condicionado a escala horizontal futura |

Estimativas de esforço do relatório original permanecem válidas para os demais itens.
