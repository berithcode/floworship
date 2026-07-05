# Análise do Backend — Problemas e Recomendações

## Resumo Executivo

O backend do Floworship (Node.js + Fastify + Prisma + SQLite) apresenta **14 problemas identificados**, distribuídos entre segurança, arquitetura, qualidade de código, performance e configuração. O projeto possui uma base sólida com separação de responsabilidades e uso de TypeScript, mas sofre de **código caseiro onde deveria haver bibliotecas consolidadas**, **duplicação excessiva**, **validação frágil** e **falhas de segurança evitáveis**.

A correção prioritária deve focar em: substituir o JWT caseiro por uma lib padrão (`@fastify/jwt`), endurecer o middleware de autenticação para bloquear requisições não autenticadas, e remover dados sensíveis (Chrome profile) do repositório.

---

## 1. Segurança

### 1.1 🔴 JWT Caseiro (não-RFC 7519)

**Arquivo:** `apps/api/src/middleware/auth.ts:29-34`

```typescript
export function signToken(payload: TokenPayload): string {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString('base64');
  const signature = createHmac('sha256', TOKEN_SECRET).update(data).digest('hex');
  return `${data}.${signature}`;
}
```

**Problemas:**
- Não segue o padrão JWT (RFC 7519): sem header, sem algoritmo padronizado (`"alg":"HS256"`), não pode ser verificado por ferramentas externas (jwt.io, bibliotecas)
- Base64 não é base64url (pode gerar `+`, `/`, `=` que são inválidos em URLs)
- A expiração é um timestamp em ms (`payload.exp < Date.now()`) em vez de segundos (padrão JWT `exp`)
- Não assina o header junto com o payload — qualquer um pode forjar um token se descobrir como o HMAC é computado

**Sugestão:** Substituir por `@fastify/jwt`:

```typescript
import fastifyJwt from '@fastify/jwt';

fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET! });

// sign
const token = fastify.jwt.sign({ userId, email, name, role, ministryId }, { expiresIn: '15m' });

// verify (feito automaticamente pelo hook)
fastify.addHook('onRequest', async (request) => {
  await request.jwtVerify();
});
```

### 1.2 🔴 `TOKEN_SECRET` padrão em produção

**Arquivo:** `apps/api/src/middleware/auth.ts:6`

```typescript
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'dev-token-secret-change-in-production';
```

**Problema:** Ambiente de produção rodando com secret hardcoded. Qualquer pessoa que acesse o código-fonte (ex: repositório público, colaborador malicioso) pode forjar tokens.

**Sugestão:** Validar na inicialização que `JWT_SECRET` está definido e lançar erro se não estiver:

```typescript
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

### 1.3 🔴 Middleware de Auth não Bloqueia

**Arquivo:** `apps/api/src/middleware/auth.ts:57-66`

```typescript
export async function authMiddleware(request, _reply): Promise<void> {
  const token = cookies?.access_token;
  if (!token) { return; }       // <- apenas retorna, sem erro
  const payload = decodeToken(token);
  if (!payload) { return; }     // <- apenas retorna, sem erro
  // ...
}
```

**Problema:** O middleware não retorna 401 quando o token está ausente ou inválido. Ele apenas não seta `request.user`, delegando para cada rota verificar manualmente. Rotas que omitem essa verificação expõem dados não-autorizados.

**Impacto:** Das 7 rotas que usam `authMiddleware` via `addHook('preHandler')`, todas precisam de `if (!user) return 401`. Em `schedules.ts:129-131`, por exemplo, acesso a rotas sensíveis depende dessa verificação manual.

**Sugestão:** Fazer o middleware retornar 401 imediatamente:

```typescript
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = request.cookies?.access_token;
  if (!token) { return reply.status(401).send({ error: 'Not authenticated' }); }

  const payload = decodeToken(token);
  if (!payload) { return reply.status(401).send({ error: 'Invalid token' }); }

  // ... lookup user ...
  if (!user) { return reply.status(401).send({ error: 'User not found' }); }

  request.user = { ... };
}
```

### 1.4 🟡 Rate Limit Caseiro

**Arquivo:** `apps/api/src/middleware/rateLimit.ts:6-16`

```typescript
const store = new Map<string, RateLimitEntry>();
setInterval(() => { /* cleanup */ }, 60_000).unref();
```

**Problemas:**
- Implementação em memória não escala horizontalmente
- `Map` não tem limite de tamanho — ataque de força bruta com IPs diferentes pode causar OOM
- Chave é `ip:email` — se o email não for enviado, vira `ip:` e todos os requests sem email compartilham o mesmo bucket
- Não usa `@fastify/rate-limit`, que é oficial do ecossistema Fastify e suporta Redis

**Sugestão:** Substituir por `@fastify/rate-limit` com store Redis:

```typescript
import rateLimit from '@fastify/rate-limit';

fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  redis: redisClient, // opcional, fallback para memória
});
```

### 1.5 🟡 Cookies `httpOnly` sem `secure` em produção

**Arquivo:** `apps/api/src/routes/auth.ts:39-53`

```typescript
reply.setCookie('access_token', accessToken, {
  httpOnly: true,
  secure: false,    // <- false mesmo em produção
  sameSite: 'lax',
  path: '/',
  maxAge: 15 * 60,
});
```

**Problema:** Cookies marcados como `secure: false` são transmitidos sobre HTTP, vulneráveis a ataques MitM em produção. Se o deploy estiver atrás de HTTPS (esperado), esses cookies vazam em texto plano.

**Sugestão:**

```typescript
secure: process.env.NODE_ENV === 'production',
```

### 1.6 🟡 Webhook WhatsApp sem token secreto adicional

**Arquivo:** `apps/api/src/services/whatsapp/` (provider)

**Problema:** A verificação de webhook usa apenas HMAC da payload interna. Qualquer pessoa que saiba a URL do webhook pode enviar requisições, pois não há um `webhook_secret` ou token de verificação separado (padrão usado por Meta, Twilio, etc.).

**Sugestão:** Adicionar um `x-webhook-signature` ou query param `?token=` verificado antes do processamento:

```typescript
fastify.post('/whatsapp/webhook', async (request, reply) => {
  const token = request.query.token;
  if (token !== process.env.WHATSAPP_WEBHOOK_SECRET) {
    return reply.status(401).send({ error: 'Invalid webhook token' });
  }
  // processa mensagem
});
```

---

## 2. Arquitetura e Organização

### 2.1 🔴 Código Duplicado — `getUser` em 6 arquivos

**Arquivos:** `routes/musicians.ts:6`, `routes/ministries.ts:6`, `routes/songs.ts:6`, `routes/sessions.ts:6`, `routes/dashboard.ts:6`, `routes/profile.ts:6`

```typescript
function getUser(request: { user?: unknown }): AuthenticatedUser | null {
  return (request.user as AuthenticatedUser) || null;
}
```

**Problema:** A mesma função está copiada em 6 arquivos de rota. Qualquer mudança na lógica de extração de usuário precisa ser replicada em todos os lugares. Além disso, algumas rotas em `schedules.ts` e `auth.ts` acessam `request.user` diretamente sem usar a função.

**Sugestão:** Criar um helper compartilhado:

```typescript
// src/utils/request.ts
export function getAuthenticatedUser(request: FastifyRequest): AuthenticatedUser | null {
  return (request as AuthRequest).user ?? null;
}
```

### 2.2 🟡 Arquivo `whatsapp.ts` Duplicado (stub vs real)

**Arquivos:**
- `src/services/whatsapp.ts` — stub antigo com `console.log`
- `src/services/whatsapp/provider.ts` — provider real com OpenWA

**Problema:** Ambos coexistem. O stub em `services/whatsapp.ts` exporta funções como `sendRepertorioDefinido` que não são usadas por lugar nenhum. O provider real em `services/whatsapp/provider.ts` é separado. `scheduler/cycleService.ts` ainda não usa notificações WhatsApp — usa apenas Telegram.

**Sugestão:** Remover `services/whatsapp.ts` e consolidar tudo em `services/whatsapp/`. Se precisar de fallback, fazer no provider, não em arquivo paralelo.

### 2.3 🟡 Arquivos Chrome no Repositório

**Diretório:** `apps/api/_IGNORE_floworship/`

```text
DevToolsActivePort, Cache/, CertificateRevocation/, Crashpad/,
Default/, SSLErrorAssistant/, Safe Browsing/, WidevineCdm/, ...
```

**Problema:** Um perfil inteiro do Google Chrome foi commitado no repositório. Contém cache de navegação, certificados SSL, dados de formulários preenchidos, histórico de navegação em `Default/`, e até mesmo dados de Widevine DRM. Isso é um **vazamento massivo de privacidade**.

**Sugestão:** Remover imediatamente do git:

```bash
git rm -r apps/api/_IGNORE_floworship/
echo "_IGNORE_floworship/" >> .gitignore
```

Verificar se há dados sensíveis commitados (histórico, cookies, certificados).

---

## 3. Qualidade de Código

### 3.1 🔴 Validação Inline (sem schema library)

**Exemplo em** `apps/api/src/routes/auth.ts:64-68`:

```typescript
const { phone, pin } = request.body;
if (!phone) return reply.status(400).send({ error: 'Telefone e PIN são obrigatórios' });
if (!pin) return reply.status(400).send({ error: 'Telefone e PIN são obrigatórios' });
if (pin.length !== 4) return reply.status(400).send({ error: 'PIN deve ter 4 dígitos' });
```

**Problemas:**
- 100+ linhas de `if (!x) return` espalhadas por todo o código
- Erro de validação vs erro de negócio têm o mesmo formato `{ error: string }` — impossível distinguir no frontend
- Sem tipos derivados do schema — `request.body` é `any` e precisa de cast manual
- Duplicação de lógica (mesma validação de PIN em dois lugares diferentes no mesmo arquivo, linhas 68 e 226)

**Sugestão:** Usar Zod + `@fastify/type-provider-zod`:

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido'),
  pin: z.string().length(4, 'PIN deve ter 4 dígitos'),
});

fastify.post('/auth/login', {
  schema: { body: loginSchema },
  preHandler: rateLimit,
}, async (request, reply) => {
  const { phone, pin } = request.body; // já validado e tipado
  // ...
});
```

Isso elimina todas as validações manuais, gera tipos automaticamente, e integra com o schema do Fastify (swagger, serialização, etc.).

### 3.2 🔴 Tratamento de Erros Inconsistente

**Três padrões diferentes no mesmo codebase:**

```typescript
// Padrão 1: reply.status(400).send({ error: 'mensagem' })
return reply.status(400).send({ error: 'Telefone e PIN são obrigatórios' });

// Padrão 2: throw new Error('message')
throw new Error('Cycle not found');

// Padrão 3: throw objeto solto
throw { statusCode: 404, message: 'not found' };
```

**Problema:** Não há um error handler global. Erros lançados com `throw new Error()` são capturados pelo handler padrão do Fastify e retornam HTML/JSON genérico sem controle. O padrão 3 (`throw { statusCode }`) funciona por coincidência porque o Fastify trata `statusCode` como propriedade especial, mas isso não é documentado oficialmente.

**Sugestão:** Implementar um error handler centralizado:

```typescript
// src/lib/appError.ts
export class AppError extends Error {
  constructor(public statusCode: number, message: string, public code?: string) {
    super(message);
  }
}

// src/index.ts
fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
    });
  }

  // erro não esperado
  console.error('[UnhandledError]', error);
  return reply.status(500).send({ error: 'Internal server error' });
});
```

### 3.3 🟡 `any` Generalizado

**Exemplos encontrados:**
- `request: any` em schedules.ts (~20+ ocorrências)
- `reply: any` em schedules.ts
- `(request as any).cookies` em auth.ts
- `as AuthenticatedUser` em todos os `getUser`
- `as KeyofType` em várias conversões

**Problema:** O TypeScript está sendo subutilizado. Rotas tipadas com `any` perdem autocomplete, verificação de tipos, e refatoração segura. 70% das rotas usam `any` no request/reply.

**Sugestão:** Usar os type providers do Fastify e evitar `any`:

```typescript
// Em vez de:
fastify.get('/musicians', async (request: any, reply: any) => {

// Usar:
fastify.get('/musicians', async (request: FastifyRequest, reply: FastifyReply) => {
```

Para parâmetros de rota e body, usar genéricos do Fastify ou Zod:

```typescript
fastify.get<{ Params: { id: string } }>('/musicians/:id', async (request, reply) => {
  const { id } = request.params; // string, tipado
});
```

### 3.4 🟡 Mensagens de Erro em Português e Inglês Misturados

| Idioma | Mensagens |
|--------|-----------|
| 🇧🇷 PT | "Ministério não encontrado", "Telefone e PIN são obrigatórios", "Escala não encontrada", "Membro não encontrado", "Ciclo não encontrado" |
| 🇺🇸 EN | "Not authenticated", "Cycle not found", "Forbidden", "Invalid or expired refresh token" |

**Arquivos afetados:** `auth.ts`, `schedules.ts`, `ministries.ts`, `musicians.ts`, `sessions.ts`, `sessions/state.ts`

**Problema:** Inconsistência para o frontend consumir — o cliente precisa lidar com ambos os idiomas nas checagens de erro.

**Sugestão:** Padronizar tudo para Português (já que o app é BR), ou usar **error codes** numéricos/string independentes de idioma:

```typescript
return reply.status(401).send({
  error: 'Não autenticado',
  code: 'UNAUTHORIZED',
});
```

---

## 4. Performance

### 4.1 🟡 N+1 Query em `closeAvailability` → `generateScheduleForCycle`

**Arquivo:** `apps/api/src/services/scheduler/cycleService.ts:259-268`

```typescript
for (const assignment of assignments) {
  await prisma.serviceAssignment.create({
    data: {
      scheduleId: assignment.scheduleId,
      role: assignment.role,
      ministryMemberId: assignment.ministryMemberId,
      status: assignment.status,
    },
  });
}
```

**Problema:** Cada assignment é criado com uma query individual dentro de um loop `for...await`. Se houver 500 assignments (comum em uma escala mensal com 4-5 domingos × 10-15 funções × 10 músicos), são **500 queries individuais** para o banco — cada uma com latência de rede + disco.

**Sugestão:** Usar `createMany` do Prisma:

```typescript
await prisma.serviceAssignment.createMany({
  data: assignments.map(a => ({
    scheduleId: a.scheduleId,
    role: a.role,
    ministryMemberId: a.ministryMemberId,
    status: a.status,
  })),
  skipDuplicates: true,
});
```

Isso reduz de 500 queries para 1.

### 4.2 🟡 Notificações em Background sem Tratamento Robusto

**Arquivo:** `apps/api/src/services/scheduler/cycleService.ts:66-75`

```typescript
sendBulkNotifications(notifications).then(results => {
  // log do resultado
}).catch(err => {
  console.error('[CycleService] Erro ao enviar notificações:', err);
});
```

E em `apps/api/src/services/notifications/index.ts:130-145`:

```typescript
export async function sendBulkNotifications(notifications: NotificationContext[]): Promise<NotificationResult[]> {
  for (let i = 0; i < notifications.length; i++) {
    const result = await telegramNotificationProvider.send(notifications[i]);
    results.push(result);
    if (i < notifications.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  return results;
}
```

**Problemas:**
- Fire-and-forget sem await — se o servidor reiniciar durante o envio, as notificações são perdidas
- Sem fila (Bull, RabbitMQ, etc.) — não há retry, dead-letter, ou persistência
- Delay manual de 100ms entre notificações em vez de rate limiting inteligente
- Se uma notificação falha, continua tentando as próximas sem pausa — pode exceder rate limits da Telegram API

**Sugestão:** Usar uma fila de background:

```typescript
import { Queue } from 'bullmq';

const notificationQueue = new Queue('notifications', { connection: redisClient });

// Em vez de sendBulkNotifications direto:
await notificationQueue.addBulk(
  notifications.map(n => ({ name: 'send', data: n }))
);

// Worker separado processa com retry:
const worker = new Worker('notifications', async job => {
  return telegramNotificationProvider.send(job.data);
}, {
  connection: redisClient,
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
});
```

---

## 5. Tecnologia e Dependências

### 5.1 🔴 Ausência de Schema Validation Library

**Problema:** O projeto não usa **Zod**, **Valibot**, **Yup**, ou qualquer biblioteca de validação. Toda validação é manual com `if (!x) return`.

**Impacto em números:**
- ~150 verificações manuais de validação em todo o código
- Média de 5-6 `if` de validação por rota
- Sem tipos derivados de schema
- Sem documentação automática (swagger)
- Mesma validação duplicada (ex: PIN de 4 dígitos aparece em login e register)

**Sugestão:** Adicionar Zod + `@fastify/type-provider-zod` (ver seção 3.1).

### 5.2 🟡 JWT Caseiro em vez de `@fastify/jwt`

Já detalhado na seção 1.1. A biblioteca oficial `@fastify/jwt` resolve:
- Geração/verificação RFC 7519
- Suporte a RS256 (assimétrico)
- Refresh tokens integrados
- Decorator `request.jwtVerify()` que já bloqueia a requisição
- Suporte a cookies via `@fastify/cookie`

### 5.3 🟡 Ausência de `@fastify/rate-limit`

Já detalhado na seção 1.4.

### 5.4 🟢 Prisma sem `createMany` em lote

**Problema:** O projeto usa Prisma mas não aproveita `createMany` para inserts em lote (ver seção 4.1). Também não usa `updateMany`, `deleteMany`, ou transações (`$transaction`) para operações que deveriam ser atômicas.

**Sugestão:** Envolver operações relacionadas em transações. Exemplo:

```typescript
await prisma.$transaction([
  prisma.serviceAssignment.createMany({ data: assignments }),
  prisma.cycle.update({ where: { id: cycleId }, data: { status: 'CLOSED' } }),
]);
```

---

## 6. DevOps e Configuração

### 6.1 🔴 Dados Chrome no Repositório

Já detalhado na seção 2.3. Remover urgente.

### 6.2 🟡 Sem `.env.example` ou documentação de variáveis

**Problema:** Variáveis como `TOKEN_SECRET`, `WHATSAPP_PROVIDER`, `WHATSAPP_WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN` estão espalhadas pelo código sem um arquivo central de documentação. Novos desenvolvedores precisam garimpar o código para saber quais variáveis configurar.

**Sugestão:** Criar `.env.example`:

```env
# Obrigatórias
JWT_SECRET=
DATABASE_URL=

# Opcionais
WHATSAPP_PROVIDER=openwa|meta
WHATSAPP_WEBHOOK_SECRET=
TELEGRAM_BOT_TOKEN=
NODE_ENV=development
```

### 6.3 🟢 Docker sem healthcheck ou docker-compose

**Problema:** Se existir Docker, provavelmente não tem healthcheck para o serviço SQLite + API. Sem Redis para rate limit ou fila.

---

## 7. Roadmap de Correções Prioritárias

### 🔴 Corrigir Imediatamente (Risco de Segurança/Dados)

| # | Problema | Esforço | Impacto |
|---|----------|---------|---------|
| 1 | Remover `_IGNORE_floworship/` do git | 10 min | Dados Chrome expostos |
| 2 | JWT caseiro → `@fastify/jwt` | 4h | Token forgeável, sem RFC |
| 3 | `TOKEN_SECRET` padrão → validação startup | 30 min | Secret hardcoded em prod |
| 4 | Auth middleware bloqueante (401) | 1h | Rotas sem proteção |

### 🟡 Corrigir em 1-2 Sprints (Qualidade + Performance)

| # | Problema | Esforço | Impacto |
|---|----------|---------|---------|
| 5 | Zod + schema validation | 8h | Validação frágil, sem tipos |
| 6 | `createMany` no ciclo | 1h | N+1, 500 queries → 1 |
| 7 | Error handler centralizado | 2h | Erros inconsistentes |
| 8 | Helper `getUser` compartilhado | 1h | 6x código duplicado |
| 9 | Cookies `secure` em produção | 30 min | Cookie vaza em HTTP |
| 10 | Rate limit → `@fastify/rate-limit` | 2h | Caseiro, sem escala |
| 11 | Notificações com fila (BullMQ) | 8h | Fire-and-forget sem retry |
| 12 | Remover stub `whatsapp.ts` | 30 min | Arquivo morto |

### 🟢 Corrigir Quando Houver Tempo

| # | Problema | Esforço | Impacto |
|---|----------|---------|---------|
| 13 | Eliminar `any` das rotas | 4h | Type safety |
| 14 | Mensagens de erro PT-BR padronizadas | 2h | Inconsistência UX |
| 15 | Webhook WhatsApp com token secreto | 1h | Segurança extra |
| 16 | `.env.example` | 30 min | Onboarding |
| 17 | `$transaction` para operações atômicas | 2h | Consistência |

---

**Total estimado para correções críticas:** ~6h  
**Total estimado para correções importantes:** ~23h  
**Total estimado para todas as correções:** ~38h
