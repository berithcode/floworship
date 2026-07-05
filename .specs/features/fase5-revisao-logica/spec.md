# Fase 5 — Revisão de Lógica: Gerenciamento de Músicos, Equipe e Geração de Escalas

## Problem Statement

Existem três representações desconectadas de "quem faz parte do ministério" no banco de dados (`User`+`MinistryMember`, `Musician`, `ServiceAssignment.userId`). O algoritmo de escala só lê de `Musician`, que nunca é populado por nenhum fluxo — resultando em listas de candidatos sempre vazias. Além disso, duas implementações concorrentes de schedules rodam simultaneamente, e a interface do admin não distingue papel de acesso.

## Goals

- [ ] Unificar a representação de músico em `MinistryMember`, eliminando o modelo `Musician`
- [ ] Fazer o algoritmo de escala ler da fonte unificada e considerar disponibilidade real
- [ ] Remover a rota legada de schedules concorrente
- [ ] Construir tela única `/team` para gestão de equipe
- [ ] Adicionar botão "Gerar escala do mês" na UI
- [ ] Corrigir "Invalid Date" e display de funções cruas
- [ ] Condicionar sidebar por papel de acesso
- [ ] Adicionar configurações de escala (`MinistryConfig`) com rota e tela

## Out of Scope

| Item | Reason |
|------|--------|
| Fluxo de convite (InviteManager) | Já funciona — não precisa de mudança |
| Chat / notificações em tempo real | Escopo separado |
| Tema/design system visual | Já definido — usar skills de design para consistência |

---

## User Stories

### P1: Unificação do Modelo de Músico ⭐ MVP

**User Story**: Como administrador, quero que quando um músico aceita o convite, ele já apareça como candidato escalável, sem etapa manual adicional.

**Acceptance Criteria**:

1. WHEN um usuário aceita um convite (`/auth/invite/accept`) THEN o sistema SHALL criar `MinistryMember` com campos `worshipRoles`, `instrument`, `isActiveInSchedule` preenchidos com defaults
2. WHEN `cycleService` gera escala THEN candidates SHALL vir de `MinistryMember` (não de `Musician`)
3. WHEN um `MinistryMember` tem `isActiveInSchedule = false` THEN o algoritmo SHALL excluí-lo dos candidatos
4. WHEN `Musician` é removido do schema THEN todos os dados existentes SHALL ser preservados em `MinistryMember`

### P1: Tela de Equipe (/team) ⭐ MVP

**User Story**: Como administrador, quero uma única tela para ver e editar todos os membros da equipe, suas funções e status.

**Acceptance Criteria**:

1. WHEN admin acessa `/team` THEN sistema SHALL mostrar lista de todos `MinistryMember` do ministério
2. WHEN admin edita um membro THEN sistema SHALL permitir alterar `worshipRoles` (multi-select chips), `role` (select), `isActiveInSchedule` (toggle)
3. WHEN um membro está pausado THEN sistema SHALL mostrar com opacidade reduzida e rótulo "Pausado"
4. WHEN admin clica "Convidar" THEN sistema SHALL abrir o fluxo existente de `InviteManager`

### P1: Gerar Escala do Mês ⭐ MVP

**User Story**: Como administrador, quero um botão na tela de escalas para gerar a escala do mês atual.

**Acceptance Criteria**:

1. WHEN admin está no `ScheduleDashboard` THEN sistema SHALL mostrar botão "Gerar escala do mês"
2. WHEN admin clica no botão THEN sistema SHALL chamar `POST /schedules/cycles` e redirecionar para o ciclo criado
3. WHEN já existe um ciclo em andamento THEN sistema SHALL mostrar botão desabilitado com tooltip

### P2: Sidebar Condicional por Papel

**User Story**: Como administrador, quero ver itens de gestão de escalas; como músico, quero ver apenas "Minha Escala".

**Acceptance Criteria**:

1. WHEN usuário é admin/operator THEN sidebar SHALL mostrar "Escalas" (gestão)
2. WHEN usuário é musician THEN sidebar SHALL mostrar "Minha Escala"
3. WHEN admin também é músico THEN sidebar SHALL mostrar ambos (gestão como principal, "Minha Escala" como secundário)

### P2: Configurações de Escala

**User Story**: Como administrador, quero configurar prazos de disponibilidade, dia do ciclo e formação padrão.

**Acceptance Criteria**:

1. WHEN admin acessa Configurações > Escala THEN sistema SHALL mostrar formulário de `MinistryConfig`
2. WHEN admin salva THEN sistema SHALL chamar `PUT /ministries/:id/config`
3. WHEN carrega THEN sistema SHALL preencher com valores atuais do backend

### P2: WORSHIP_ROLES Constante Compartilhada

**User Story**: Como desenvolvedor, quero uma única fonte de verdade para funções de louvor, usada em seed, backend e frontend.

**Acceptance Criteria**:

1. WHEN `WORSHIP_ROLES` é importada THEN SHALL conter `key` + `label` em português
2. WHEN seed é executado THEN SHALL usar `WORSHIP_ROLES` em vez de strings em inglês soltas
3. WHEN frontend exibe `role` THEN SHALL traduzir via `WORSHIP_ROLES`

### P3: Correção "Invalid Date" e Role Crua

**User Story**: Como músico, quero ver data formatada e nome da função em português na "Minha Escala".

**Acceptance Criteria**:

1. WHEN `GET /schedules/my-assignments` retorna assignments THEN SHALL incluir `date` do `ServiceSchedule` pai
2. WHEN frontend exibe role THEN SHALL usar label traduzida de `WORSHIP_ROLES`

---

## Requirement Traceability

| ID | Description | Priority | Phase |
|----|------------|----------|-------|
| DB-01 | Migrar campos Musician para MinistryMember | P1 | Schema |
| DB-02 | Adicionar isActiveInSchedule em MinistryMember | P1 | Schema |
| DB-03 | Trocar ServiceAssignment.musicianId/userId por ministryMemberId | P1 | Schema |
| DB-04 | Adicionar relations em AvailabilityResponse | P1 | Schema |
| DB-05 | Adicionar cycleId em ServiceSchedule | P1 | Schema |
| BS-01 | Atualizar cycleService p/ ler MinistryMember | P1 | Backend |
| BS-02 | Atualizar engine p/ MinistryMember | P1 | Backend |
| BS-03 | Atualizar substitutionService p/ MinistryMember | P1 | Backend |
| BS-04 | Remover rota legada de schedules de ministries.ts | P1 | Backend |
| BS-05 | Corrigir bug FK em cycleService (createdById/userId) | P1 | Backend |
| BS-06 | Corrigir GET /schedules/cycles/:cycleId/sundays filter | P1 | Backend |
| WS-01 | Criar constante WORSHIP_ROLES compartilhada | P2 | Shared |
| FE-01 | Criar página /team | P1 | Frontend |
| FE-02 | Adicionar botão "Gerar escala do mês" | P1 | Frontend |
| FE-03 | Sidebar condicional por role | P2 | Frontend |
| FE-04 | Tela de Configurações de Escala (MinistryConfig) | P2 | Frontend |
| FE-05 | Corrigir display de role (WORSHIP_ROLES) | P2 | Frontend |
| FE-06 | Corrigir "Invalid Date" em AssignmentCard | P2 | Frontend |
| CL-01 | Remover registro duplicado de schedulesRoutes em index.ts | P1 | Cleanup |
| CL-02 | Remover model Musician do schema | P1 | Schema |

---

## Edge Cases

- WHEN `Musician` table tem dados THEN migration SHALL fazer backfill para `MinistryMember` antes de dropar
- WHEN `ServiceAssignment` tem `userId` ou `musicianId` populado THEN migration SHALL resolver para `ministryMemberId`
- WHEN `cycleService` encontra candidato sem `worshipRoles` THEN SHALL tratá-lo como elegível apenas para vagas "geral"
- WHEN `/team` tem 0 membros THEN SHALL mostrar empty state com CTA "Convidar primeiro músico"
