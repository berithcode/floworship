# Fase 5 — Revisão de Lógica: Gerenciamento de Músicos, Equipe e Geração de Escalas

## Especificação de Revisão e Correção

> Este documento audita o estado real do código (`web/` + `api/`) contra o que foi especificado nos documentos de design (v1-v9) e nas fases já planejadas (`b1-autenticacao`, `b9-escalas`). Todos os achados abaixo foram confirmados lendo o código-fonte, não inferidos — cada um aponta o arquivo e a linha exata.

---

## 1. Resumo Executivo

O convite e o login (telefone + PIN) estão genuinamente funcionando — essa parte está correta e não precisa de retrabalho. O problema não é ali.

**A causa raiz de tudo que você descreveu — músico convidado que não aparece no grupo, dúvida sobre o que é "Equipe", algoritmo de escala sem regras claras, interfaces espalhadas — é uma só: existem três representações diferentes e desconectadas de "quem faz parte do ministério" no banco de dados, e a geração de escala só enxerga uma delas, que hoje **nunca é preenchida por nenhum fluxo do sistema**.**

Não é um conjunto de bugs soltos — é uma decisão de modelagem que precisa ser desfeita antes de qualquer novo recurso de escala fazer sentido.

---

## 2. Diagnóstico — Os Três Modelos de "Equipe"

```
Convite aceito (telefone + PIN) ──► User + MinistryMember
                                          │
                                          │  (relação de ACESSO: admin/operador/músico —
                                          │   isso já funciona, é RBAC, seção 7.3)
                                          │
                                          ▼
                              ❌ NUNCA gera automaticamente:

                                    Musician
                          (instrumento, funções de louvor,
                           histórico de escalação — é isso
                           que o algoritmo de geração lê)

                                          ▲
                                          │  só é criado manualmente,
                                          │  em algum outro lugar — mas
                                          │  não existe NENHUM prisma.musician.create()
                                          │  em todo o código da API
                                          │
                              ⚠️ E existe ainda um TERCEIRO caminho:

                          ServiceAssignment.userId
                    (referência direta a User, ignorando
                     Musician por completo — usada só pela
                     rota legada de ministries.ts)
```

**Evidência 1 — `Musician` nunca é criado:**
```bash
$ grep -rn "musician\.\(create\|update\|upsert\)" api/src
services/whatsapp/optInService.ts:19:  prisma.musician.update({ ... })
services/whatsapp/optInService.ts:26:  prisma.musician.update({ ... })
```
Só existem `.update()` — que pressupõem que a linha já existe. Não há um único `.create()`. O fluxo de convite (`routes/auth.ts`, `/auth/invite/accept`) cria `User` + `MinistryMember` e para por aí.

**Evidência 2 — o gerador de escala só lê de `Musician`:**
```ts
// api/src/services/scheduler/cycleService.ts:72
const musicians = await prisma.musician.findMany({ where: { ministryId } });
```
Como `Musician` nunca é populado, `musicians` é **sempre um array vazio** pra qualquer ministério real. O algoritmo de fairness (`engine.ts`) até está bem implementado — mas roda sobre uma lista de candidatos vazia, então toda vaga sai `"vago"`. Isso é mais grave do que o gap de disponibilidade que já tínhamos mapeado antes (seção 9 da auditoria anterior): mesmo sem esse segundo problema, a geração hoje não produz nenhuma escala de verdade.

**Evidência 3 — duas rotas de "schedules" registradas ao mesmo tempo:**
```ts
// api/src/index.ts
await fastify.register(ministriesRoutes, { prefix: '/api' });   // linha 36 — exporta TAMBÉM um schedulesRoutes
await fastify.register(schedulesRoutes,  { prefix: '/api' });   // linha 37 — versão legada/manual
...
await fastify.register(scheduleRoutes,   { prefix: '/api' });   // linha 39 — motor real (ciclo + fairness)
```
`routes/ministries.ts` exporta uma **segunda implementação completa** de escala (`POST /schedules`, `POST /schedules/:id/assignments`, `PUT /schedules/:id/assignments/:id/confirm`) — manual, sem algoritmo, sem conceito de ciclo mensal, escrevendo direto em `ServiceAssignment.userId`. Ela roda **em paralelo** com `routes/schedules.ts` (o motor de verdade, com `MonthlyScheduleCycle`, fairness score, substituição automática). As duas estão registradas no servidor simultaneamente. Isso explica exatamente a sensação de "interfaces espalhadas": não é só a tela, é o **backend que tem dois sistemas competindo pelo mesmo conceito**.

### Respondendo diretamente à sua pergunta — "a Equipe é geral ou só de um serviço?"

Pela intenção original (documento v6-v8, seção 9.1-9.2) e pela forma como o algoritmo foi desenhado: **a Equipe é sempre global ao ministério.** Não existe "equipe do culto de domingo" como conceito à parte — existe **um quadro único de músicos do ministério**, e cada domingo apenas *seleciona* pessoas desse quadro único pras vagas daquele culto. O algoritmo de rotação justa (seção 9.4) só faz sentido em cima de um quadro global — ele compara "quem serviu menos essa função no mês inteiro", o que exige uma lista única e estável de pessoas, não uma por serviço.

Se hoje existe alguma tela ou fluxo que dá a impressão de "equipe por serviço", isso é sintoma do mesmo problema: gente sendo adicionada direto num `ServiceAssignment` (via `userId`, a rota legada) sem nunca passar pelo quadro global (`Musician`). Corrigir a modelagem (seção 3 abaixo) elimina essa ambiguidade — vai passar a existir literalmente só um lugar onde a pessoa "existe" como músico.

---

## 3. Decisão de Arquitetura — Unificar em Uma Única Fonte de Verdade

Em vez de manter `MinistryMember` (acesso) e `Musician` (perfil de escalação) como duas tabelas que precisam ficar sincronizadas manualmente — o que é exatamente o que quebrou — a recomendação é **fundir os campos de `Musician` dentro de `MinistryMember`**. Uma pessoa no ministério já é uma linha em `MinistryMember`; não faz sentido precisar de uma segunda tabela pra saber que instrumento ela toca.

```prisma
model MinistryMember {
  id         String   @id @default(cuid())
  userId     String
  ministryId String
  role       String   @default("musician")   // papel de ACESSO (admin/operador/músico — seção 7.3)

  // --- campos que hoje vivem (sem uso) em Musician — migrar pra cá ---
  worshipRoles      String   @default("[]")   // funções de louvor: ["guitarra","baixo",...]
  instrument        String?
  isActiveInSchedule Boolean @default(true)    // pausar temporariamente sem remover o vínculo
  timesServedThisMonth Int   @default(0)
  lastServedAt      String  @default("{}")     // JSON: { [role]: date }

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ministry Ministry @relation(fields: [ministryId], references: [id], onDelete: Cascade)
  assignments ServiceAssignment[]

  @@unique([userId, ministryId])
}
```

E em `ServiceAssignment`, eliminar o campo `userId` e ficar só com a referência única:

```prisma
model ServiceAssignment {
  id             String   @id @default(cuid())
  scheduleId     String
  role           String
  ministryMemberId String?     // era musicianId — agora aponta pro MinistryMember unificado
  status         String   @default("vago")
  substitutionOf String?

  schedule       ServiceSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  ministryMember MinistryMember? @relation(fields: [ministryMemberId], references: [id])
}
```

**Consequência direta:** o momento em que alguém aceita o convite (`/auth/invite/accept`) já é o momento em que ela existe como músico escalável — não tem uma segunda etapa de "adicionar à equipe" separada. Se o líder quiser convidar alguém só com acesso administrativo e sem entrar no quadro de escalação (ex: um segundo admin que não toca), isso vira só um campo (`isActiveInSchedule = false`), não uma tabela ausente.

**Isso não é uma migration trivial** — envolve mover dados (se já existir algum `Musician` populado manualmente em ambiente de teste), atualizar `cycleService.ts`, `engine.ts`, `substitutionService.ts` e as duas rotas de schedules pra usar `ministryMemberId`. Vale fazer isso **antes** de continuar construindo em cima da escala, porque cada nova tela feita sobre o modelo atual (dois modelos, três caminhos) é retrabalho garantido depois.

---

## 4. Uma Única Tela de Equipe — "o sistema trabalha pelo administrador"

Concordo com o diagnóstico que você deu — a resposta certa não é criar mais uma tela, é ter **uma única tela administrativa de Equipe**, e fazer o resto do sistema (convite, escala, repertório) *ler* dessa mesma fonte, nunca duplicar.

**`/team` (nova página, dentro do grupo "Escalas" da sidebar — ver seção 6.1 do doc de design):**

- Lista todos os `MinistryMember` do ministério (uma linha por pessoa) — essa é *a* equipe, sempre global, nunca por serviço.
- Cada linha, editável inline pelo admin:
  - Nome (via `User`, somente leitura — vem do convite)
  - Papel de acesso (`admin` / `operador` / `músico`) — RBAC, seção 7.3
  - Funções de louvor (`worshipRoles`) — multi-select: guitarra, baixo, bateria, ministro de louvor, apoio de voz, violão...
  - Ativo na escala (toggle) — em vez de remover alguém, pausa temporariamente
  - Status de vínculo do canal (Telegram vinculado? push habilitado?) — ver seção 9.8 (v9)
  - Estatística rápida: quantas vezes serviu esse mês (`timesServedThisMonth`) — dá visibilidade direta da rotação, sem precisar abrir cada domingo
- Botão "Convidar" no topo — abre o mesmo fluxo que já funciona hoje (`InviteManager.tsx`), sem mudança nenhuma aí.
- **Não existe** uma tela separada de "adicionar músico ao culto de domingo" — a seleção de quem toca em cada domingo continua sendo o algoritmo (seção 9.4) + ajuste manual do líder (seção 9.5), sempre a partir dessa única lista.

Isso também resolve o "isso é um pesadelo de usabilidade": hoje a pessoa provavelmente precisa ir em Configurações pra convidar, e não tem lugar nenhum pra ver/editar quem já está na equipe e com que função — daí a sensação de espalhado. Com uma tela só, o fluxo mental fica: *convidar → a pessoa aparece na lista → editar a função dela ali mesmo → pronto, ela já é candidata em qualquer geração de escala futura*, sem etapa manual escondida no meio.

### 4.1 Layout e interação (mockup validado na conversa)

- **Lista** (não cards grandes — linhas compactas com borda, mais fácil de escanear uma equipe de 15-20 pessoas): avatar com iniciais, nome, badge de papel de acesso, tags coloridas com as funções, contagem de vezes escalado esse mês, botão "Editar" à direita. Pausado (`isActiveInSchedule = false`) aparece com opacidade reduzida e um rótulo "Pausado", sem sumir da lista.
- **Busca + filtro por função** no topo — útil pra responder rápido "quem toca baixo?" sem abrir cada pessoa.
- **Editar abre um painel** (não uma página nova) com:
  - Papel de acesso (select)
  - Funções — **botões de seleção múltipla** (chip toggle), não checkbox tradicional nem dropdown — bate certo com "discriminar o que ele faz ou toca": a pessoa pode acumular mais de uma função (ex: guitarra e violão) só tocando nos botões relevantes
  - Toggle "Ativo na escala"
  - Status do canal de notificação (Telegram vinculado ou não — seção 9.8, v9), só informativo aqui, o vínculo em si acontece no fluxo de convite
  - Um botão "Salvar" só, sem confirmação extra — é uma tela de uso frequente, não deve ter fricção
- Convidar continua sendo uma ação separada (o fluxo que já funciona), mas a partir do momento em que o convite é aceito, a pessoa já aparece nessa lista pronta pra receber funções — sem etapa manual de "agora adiciona ela na equipe" em outro lugar.

---

## 5. Geração de Escala — o que o algoritmo sabe hoje vs. o que falta

**O que já está certo, não precisa refazer:**
- `engine.ts` implementa fielmente o que especificamos na seção 9.4 (v6): ordena candidatos por `timesServedThisMonth` crescente, desempate por `lastServedAt[role]` mais antigo, atribui o primeiro elegível, marca `"vago"` se não sobrar ninguém. A lógica de rotação justa está correta.
- `substitutionService.ts` (convite sequencial de substituto) também segue o desenho da seção 9.6.

**O que falta pra ele "saber as regras" de verdade:**

| Regra especificada (doc v6-v9) | Estado real hoje |
|---|---|
| Candidato precisa ter a função (`worshipRoles`) | ✅ implementado (`engine.ts`) |
| Candidato precisa estar **disponível** naquele domingo | ❌ não existe — não há tabela de disponibilidade (`AvailabilityResponse` nunca foi migrada), e `cycleService.ts` nunca filtra por isso mesmo que existisse |
| Candidato precisa **existir no quadro** (`Musician`/`MinistryMember` escalável) | ❌ lista de candidatos sempre vazia (seção 2, evidência 2) |
| Rotação justa por função | ✅ implementado |
| Não escalar a mesma pessoa duas vezes no mesmo domingo | ✅ implementado (`assignedToday`) |

Ou seja: a "inteligência" de rotação está pronta, mas ela nunca roda com dado real — nem sabe quem existe, nem sabe quem está disponível. Corrigir a seção 3 (unificação do modelo) resolve a primeira lacuna. A segunda (disponibilidade) precisa da migration que já estava pendente na auditoria anterior — vale fazer as duas migrations juntas, já que mexem no mesmo fluxo (`cycleService.ts`).

---

## 6. Rotas a Eliminar — Limpeza de Backend

Antes de construir a tela de Equipe (seção 4), remover a duplicidade de rotas evita que a UI nova acidentalmente converse com o sistema errado:

- **Remover** `schedulesRoutes` de `api/src/routes/ministries.ts` (a versão manual, sem algoritmo) e sua linha de registro em `index.ts:37`. Manter só `ministriesRoutes` desse arquivo (que cuida de convite/membros, isso está ok) e `scheduleRoutes` de `routes/schedules.ts` (o motor real).
- **Remover** o campo `ServiceAssignment.userId` do schema (depois de confirmar que nada em produção depende dele — provavelmente nada, já que a rota que o escrevia é a que está sendo removida).
- Ponto de atenção: `GET /schedules/cycles/:cycleId/sundays` (`routes/schedules.ts:13-20`) filtra `serviceSchedule` por `ministryId: cycleId` — bug já identificado na auditoria anterior, continua pendente e faz parte do mesmo pacote de correção (precisa do campo `cycleId` em `ServiceSchedule`, que também não existe ainda).

---

## 7. Ordem de Execução Recomendada

Isso não é uma lista de tarefas independentes — cada item destrava o próximo:

1. **Migration de unificação** (seção 3): mover campos de `Musician` pra `MinistryMember`, trocar `ServiceAssignment.musicianId`/`userId` por `ministryMemberId` único, remover model `Musician`.
2. **Migration de disponibilidade** (pendente da auditoria anterior): criar `AvailabilityResponse`, adicionar `cycleId` em `ServiceSchedule`.
3. **Atualizar `cycleService.ts` e `engine.ts`** pra ler de `MinistryMember` em vez de `Musician`, e filtrar candidatos por disponibilidade real.
4. **Remover a rota legada** (`ministries.ts::schedulesRoutes`) e o registro duplicado em `index.ts`.
5. **Construir a tela `/team`** (seção 4) — só faz sentido depois do passo 1, senão ela edita um modelo que vai ser removido em seguida.
6. Corrigir os dois bugs de FK identificados na auditoria anterior (`createdById`/`userId` recebendo `ministryId` por engano em `cycleService.ts`).

Os passos 1-4 são a "revisão de lógica" que você pediu — sem eles, qualquer interface nova de escala continua sendo uma tela bonita em cima de um motor que não tem dado pra trabalhar.

---

## 8. Achados Adicionais — Papel do Usuário e Configuração de Escala

> Confirmados a partir do print de "Minha Escala" mostrado na conversa: `Invalid Date`, função exibida como `worship_leader` cru, e a pergunta em aberto de como o admin efetivamente monta uma escala.

### 9.1 Bug concreto — "Invalid Date" e função crua

```ts
// prisma/schema.prisma
model ServiceAssignment {
  scheduleId String
  role       String   // sem dicionário de rótulos em lugar nenhum
  // NÃO tem campo `date` — a data mora no ServiceSchedule pai
}
```
```ts
// prisma/seed.ts:114-115
{ scheduleId: schedule.id, userId: admin.id, role: 'worship_leader', ... }
{ scheduleId: schedule.id, userId: musician.id, role: 'guitarist', ... }
```
```tsx
// components/schedule-user/AssignmentCard.tsx
const date = new Date(assignment.date);   // undefined → "Invalid Date"
...
<p>{assignment.role}</p>                  // "worship_leader" cru, sem tradução
```

`ServiceAssignment` não tem campo de data — ela vive no `ServiceSchedule` pai. Qualquer endpoint que devolva o assignment sem "achatar" a data do pai junto (`{ ...assignment, date: schedule.date }`) produz exatamente essa tela. E `role` nunca teve um dicionário de rótulos (`worship_leader` → "Ministro de Louvor") em nenhum lugar do front — nem aqui, nem no `SundayCard`, nem em lugar nenhum.

**Consistência com o resto do sistema:** os valores do seed (`worship_leader`, `guitarist`, em inglês) nem batem com as chaves que especificamos nos documentos de design e no mockup da tela de Equipe (`ministro_de_louvor`, `guitarra`, em português) — hoje não existe uma lista canônica única de funções usada em todo lugar (seed, backend, front). Isso precisa virar uma constante compartilhada (`WORSHIP_ROLES`, com `key` + `label`), não strings soltas reinventadas em cada arquivo.

### 9.2 Não existe navegação por papel — admin vê exatamente o que o músico vê

```tsx
// components/layout/Sidebar.tsx
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Music, label: 'Músicas', path: '/library' },
  { icon: Calendar, label: 'Escalas', path: '/schedules' },
  { icon: CalendarCheck, label: 'Minha Escala', path: '/my-schedule' },
  ...
];
```
Lista estática — zero filtro por `user.role`. Um admin loga e vê "Minha Escala" (uma tela pensada pra resposta individual de músico) do mesmo jeito que um músico vê. Não existe hoje nenhuma versão "modo gestão" do menu.

### 9.3 Não existe botão pra criar um novo ciclo de escala

O backend já tem o endpoint (`POST /schedules/cycles`, seção 9.3 do documento de design v6), mas `ScheduleDashboard.tsx` (a tela "Escalas do Mês") só **lê** um ciclo existente — não tem nenhum botão "Gerar escala do mês" que chame esse POST. Resposta direta à sua pergunta: **hoje, literalmente não dá** pra montar uma escala pela interface, mesmo sendo admin — o motor existe, o gatilho na tela não.

### 9.4 Configuração de escala sem lugar fixo

`SettingsPage.tsx` (Configurações) não tem nenhuma menção a escala/ciclo/prazo — e a rota de settings da API só trata número de WhatsApp pessoal, nada de configuração do ministério. O `MinistryConfig` (prazo de resposta, dia do ciclo, formação padrão — seção 9.7 do doc de design) existe no schema, mas não tem rota nem tela nenhuma. O único lugar que hoje toca em "disponibilidade" é o botão dentro de "Minha Escala" — que é a resposta *individual* do músico, um conceito completamente diferente de "regra do ministério inteiro". Daí a sensação de perdido: são duas coisas com nome parecido, sem clareza de qual é qual.

### 9.5 Correção proposta — sistema centrado no papel

- **Sidebar condicionada por `user.role`:** admin/operador veem **"Escalas"** (gestão) como item principal; músico vê **"Minha Escala"** (resposta pessoal). Admin também pode ver "Minha Escala" se ele próprio tocar em algum culto — mas como item secundário, não confundido com a tela de gestão.
- **`ScheduleDashboard.tsx` ganha o botão "Gerar escala do mês"** — chama `POST /schedules/cycles`, único jeito real de o admin iniciar o processo.
- **Nova aba "Configurações de Escala"** (dentro de Configurações, só visível pra admin): prazo de resposta, dia do disparo mensal, formação padrão por culto — lendo/escrevendo `MinistryConfig`. Separada, com nome diferente, do fluxo pessoal de disponibilidade.
- **Endpoint corrigido:** o que hoje serve "minhas atribuições" precisa devolver `date` (herdada do `ServiceSchedule` pai) e `role` já traduzido (ou uma chave que o front sabe mapear via `WORSHIP_ROLES` compartilhado) — não o valor cru do banco.

---

## 9. Checklist — Fase 5 (atualizado)

- [ ] Migration: mover `worshipRoles`, `instrument`, `timesServedThisMonth`, `lastServedAt` de `Musician` pra `MinistryMember`; adicionar `isActiveInSchedule`
- [ ] Migration: trocar `ServiceAssignment.musicianId`/`userId` por `ministryMemberId` único; remover model `Musician`
- [ ] Migration: criar `AvailabilityResponse`; adicionar `cycleId` em `ServiceSchedule` (carry-over da auditoria anterior)
- [ ] Atualizar `cycleService.ts`: candidatos vêm de `MinistryMember` (não `Musician`), filtrados por disponibilidade real
- [ ] Atualizar `engine.ts`, `substitutionService.ts`, `fairness.ts` pros novos nomes de campo
- [ ] Corrigir `GET /schedules/cycles/:cycleId/sundays` pra filtrar por `cycleId` de verdade, não `ministryId`
- [ ] Corrigir os dois bugs de FK (`createdById`/`userId` recebendo `ministryId`) em `cycleService.ts`
- [ ] Remover `schedulesRoutes` de `ministries.ts` e seu registro em `index.ts`
- [ ] Construir a tela única `/team` (seção 4) — substitui qualquer fluxo espalhado de "adicionar músico"
- [ ] Validar ponta a ponta: convidar → aceitar (telefone+PIN) → aparecer em `/team` → editar função → entrar como candidato numa geração de escala → aparecer numa vaga
- [ ] Criar constante compartilhada `WORSHIP_ROLES` (`key` + `label` em português) — usada no seed, no backend e em todo lugar do front que hoje mostra `role` cru (`AssignmentCard`, `SundayCard`, tela de Equipe)
- [ ] Corrigir o endpoint de "minhas atribuições" pra devolver `date` herdada do `ServiceSchedule` pai (hoje ausente em `ServiceAssignment`, causa do "Invalid Date")
- [ ] Condicionar `navItems` do `Sidebar.tsx` por `user.ministries[0].role` — "Escalas" (gestão) só pra admin/operador, "Minha Escala" sempre visível
- [ ] Adicionar botão "Gerar escala do mês" em `ScheduleDashboard.tsx`, chamando `POST /schedules/cycles` — hoje não existe nenhum gatilho de criação de ciclo na UI
- [ ] Construir rota + tela "Configurações de Escala" (prazo, dia do ciclo, formação padrão) lendo/escrevendo `MinistryConfig` — hoje o model existe no schema mas não tem rota nem tela
