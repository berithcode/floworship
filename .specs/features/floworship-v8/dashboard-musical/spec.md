# Feature: Dashboard de Ministério de Música

## 1. Contexto e Problema

### Situação Atual
O `DashboardNew.tsx` foi implementado com layout visual moderno (aurora effects, glassmorphism, 2-card structure) mas está exibindo dados genéricos de aplicação financeira:
- "My balance: $28,520.30"
- "Savings account: $24,800.45"
- "Investment portfolio: $70,120.78"
- "Cash Flow" chart com valores em USD

### Problema
O dashboard não reflete o domínio do Floworship - um SaaS para **ministérios de música de igrejas**. Os usuários (líderes de louvor, operadores, músicos) precisam ver métricas relevantes para sua rotina:
- Próximos cultos/escala
- Confirmações pendentes
- Músicos disponíveis
- Repertório em dia
- Status do ciclo mensal

### Oportunidade
O sistema já tem dados ricos que podem ser visualizados:
- `ServiceSchedule` - datas dos cultos
- `ServiceAssignment` - confirmações dos músicos
- `Musician` - distribution por instrumento
- `Song` - status do repertório
- `MonthlyScheduleCycle` - workflow de escalas
- `SessionExecutionLog` - execuções das sessões
- `WhatsAppMessageLog` - comunicações enviadas

---

## 2. Objetivos

### Objetivo Principal
Transformar o dashboard de "financial template" para "music ministry dashboard" mantendo o design system moderno já implementado.

### Objetivos Específicos
1. **Métricas relevantes** - Substituir dados financeiros por dados do ministério
2. **Ações rápidas** - Atalhos para tarefas do dia-a-dia
3. **Alertas proativos** - Mostrar o que precisa de atenção (confirmações pendentes, vagas)
4. **Navegação contextual** - Links diretos para as principais features
5. **Personalização por role** - Dashboard diferente para Admin, Operador, Músico

---

## 3. Requisitos Funcionais

### RF-01: Cards de Métricas do Ministério

**RF-01.1: Próximo Culto**
- Exibir data/hora do próximo `ServiceSchedule`
- Status de confirmação do usuário
- Link para confirmar/recusar
- Link para ver repertório completo

**RF-01.2: Confirmações Pendentes**
- Contagem de `ServiceAssignment` com status "pending" para o usuário
- Lista com data do culto e função
- Ações rápidas: Confirmar / Recusar

**RF-01.3: Músicos Disponíveis**
- Total de músicos ativos no ministério
- Breakdown por instrumento (vocal, guitarra, teclado, bateria, baixo)
- % de opt-in no WhatsApp

**RF-01.4: Status do Repertório**
- Total de músicas na biblioteca
- Breakdown por status: Pronta / Em revisão / Arquivada
- % de músicas com cifra completa (cue sheets)

---

### RF-02: Seção de Escala Mensal

**RF-02.1: Status do Ciclo**
- Indicador visual da fase atual:
  - 📝 Coletando disponibilidade
  - ⚙️ Gerando escala
  - ⏳ Aguardando aprovação
  - ✅ Publicada
- Countdown para deadline de disponibilidade
- Botão de ação contextual (ex: "Preencher disponibilidade", "Aprovar escala")

**RF-02.2: Próximos Cultos do Mês**
- Lista dos próximos 4-6 `ServiceSchedule`
- Para cada culto:
  - Data/hora
  - Status das confirmações (ex: "8/12 confirmados")
  - Vagas pendentes (ex: "2 vagas: Baixista, Vocalista")
  - Link para ver detalhes

**RF-02.3: Calendário Visual**
- Mini calendário do mês atual
- Dias com culto destacados
- Click para ver detalhes do culto

---

### RF-03: Seção de Repertório

**RF-03.1: Músicas Mais Usadas**
- Top 5 músicas mais escaladas nos últimos 30 dias
- Contagem de vezes por música
- Link para cifra/letra

**RF-03.2: Músicas Novas**
- Últimas 3 músicas adicionadas
- Data de criação
- Status (nova = ainda não escalada)

**RF-03.3: Saúde do Repertório**
- Gráfico de pizza: Pronta / Rascunho / Arquivada
- Alerta: Músicas sem cifra completa
- Sugestão: Músicas que precisam de revisão

---

### RF-04: Seção de Ações Rápidas

**RF-04.1: Ações para Admin/Operador**
- 👥 Convidar novo membro
- 📅 Criar novo ciclo mensal
- 🎵 Adicionar nova música
- 📊 Aprovar escala pendente
- 📱 Enviar broadcast WhatsApp

**RF-04.2: Ações para Músico**
- 🎤 Preencher disponibilidade
- ✅ Confirmar presença no culto
- 🎸 Estudar músicas do próximo culto
- 📱 Ver comunicações

**RF-04.3: Ações para Todos**
- 🎛️ Iniciar modo operador (se houver sessão ativa)
- 📖 Abrir biblioteca de músicas
- 👤 Ver meu perfil
- ⚙️ Configurações

---

### RF-05: Seção de Atividade Recente

**RF-05.1: Últimas Sessões**
- Lista das últimas `SessionExecutionLog`
- Duração da sessão
- Se houve override manual
- Link para ver detalhes

**RF-05.2: Mensagens WhatsApp**
- Status das últimas mensagens enviadas
- Taxa de entrega (sent / delivered / failed)
- Link para reenviar falhas

**RF-05.3: Novos Membros**
- Membros que entraram este mês
- Convites pendentes
- Link para gerenciar convites

---

### RF-06: Filtros e Personalização

**RF-06.1: Filtro por Período**
- Toggle: Esta semana / Este mês / Últimos 30 dias
- Atualiza todas as métricas do dashboard

**RF-06.2: Filtro por Ministério**
- Para usuários com múltiplas membresias
- Dropdown para selecionar ministério ativo
- Atualiza dashboard para o ministério selecionado

**RF-06.3: Widgets Personalizáveis (Futuro)**
- Arrastar e soltar widgets
- Escolher quais métricas exibir
- Salvar layout preferido

---

## 4. Requisitos Não Funcionais

**RNF-01: Performance**
- Dashboard carrega em < 2s
- Métricas são cached por 5 minutos
- Lazy loading para gráficos e listas longas

**RNF-02: Dados em Tempo Real**
- WebSocket para atualizações de confirmações
- Polling a cada 60s para métricas críticas
- Indicador de "última atualização: X min atrás"

**RNF-03: Responsividade**
- Dashboard funciona em mobile (stack vertical)
- Tablets (2 colunas)
- Desktop (3-4 colunas)

**RNF-04: Acessibilidade**
- Gráficos com descrições textuais
- Cores com contraste WCAG AA
- Navegação por teclado

**RNF-05: Segurança**
- Métricas filtradas por permissão (RBAC)
- Músico vê apenas seus dados
- Admin vê dados do ministério completo

---

## 5. Design System - Adaptação

### 5.1: Manter do Design Atual
✅ Layout de 2 cards (sidebar + main content)
✅ Aurora effects e glassmorphism
✅ Gradientes estilo "fumaça" (laranja/roxo/azul)
✅ Ícones stroke (lucide-react)
✅ Tipografia: Inter + Poppins
✅ Dark theme como default

### 5.2: Adaptações Necessárias

**Sidebar Navigation:**
```
- Dashboard (ativo)
- Escala Mensal
- Repertório
- Músicos
- Configurações
- [Separator]
- Iniciar Modo Operador (se sessão ativa)
```

**Main Content - Seções:**
1. **Quick Stats** (4 cards no topo)
2. **Próximos Cultos** (lista com confirmações)
3. **Status do Ciclo** (workflow indicator)
4. **Métricas de Repertório** (gráficos)
5. **Ações Rápidas** (grid de buttons)
6. **Atividade Recente** (timeline)

**Cores das Métricas:**
- ✅ Success (verde): Confirmações OK, escala publicada
- ⚠️ Warning (laranja): Confirmações pendentes, vagas abertas
- ❌ Error (vermelho): Vagas críticas, escala atrasada
- ℹ️ Info (azul): Informações gerais

---

## 6. Arquitetura Técnica

### 6.1: Novos Endpoints Necessários

**GET /api/dashboard/metrics**
```json
{
  "nextService": {
    "id": "uuid",
    "date": "2026-07-05T19:00:00Z",
    "confirmed": true,
    "repertoireCount": 8
  },
  "pendingConfirmations": 3,
  "totalMusicians": 24,
  "songsReady": 145,
  "cycleStatus": "coletando_disponibilidade",
  "cycleDeadline": "2026-07-10T23:59:59Z"
}
```

**GET /api/dashboard/upcoming-services**
```json
{
  "services": [
    {
      "id": "uuid",
      "date": "2026-07-05T19:00:00Z",
      "confirmedCount": 8,
      "totalCount": 12,
      "vacantRoles": ["Baixista", "Vocalista"],
      "repertoire": [...]
    }
  ]
}
```

**GET /api/dashboard/repertoire-stats**
```json
{
  "totalSongs": 234,
  "byStatus": {
    "pronta": 145,
    "rascunho": 67,
    "arquivada": 22
  },
  "withCueSheets": 189,
  "mostUsed": [
    { "songId": "uuid", "title": "Amazing Grace", "count": 12 }
  ],
  "newThisMonth": 5
}
```

**GET /api/dashboard/recent-activity**
```json
{
  "recentSessions": [...],
  "whatsappStats": {
    "sent": 150,
    "delivered": 142,
    "failed": 8
  },
  "newMembers": [...],
  "pendingInvites": 3
}
```

### 6.2: Componentes Novos

```
apps/web/src/components/dashboard/
├── NextServiceCard.tsx       # Card do próximo culto
├── PendingConfirmationsCard.tsx
├── MusiciansCountCard.tsx
├── RepertoireStatsCard.tsx
├── CycleStatusWidget.tsx     # Status do ciclo mensal
├── UpcomingServicesList.tsx
├── RepertoireChart.tsx       # Pizza chart: status das músicas
├── QuickActionsGrid.tsx
├── RecentActivityTimeline.tsx
└── DashboardNew.tsx          # Refatorar (atual é financial template)
```

### 6.3: Hooks

```typescript
// hooks/useDashboardMetrics.ts
- Fetches all dashboard data
- Polling a cada 60s
- Cache por 5 minutos

// hooks/useCycleStatus.ts
- Status do ciclo mensal
- Countdown para deadlines
- Ações disponíveis

// hooks/useUpcomingServices.ts
- Próximos cultos
- Confirmações
- Vagas
```

---

## 7. Critérios de Aceitação

**CA-01: Quick Stats Cards**
- [ ] 4 cards exibindo: Próximo culto, Confirmações pendentes, Total músicos, Músicas prontas
- [ ] Dados reais do backend (não placeholders)
- [ ] Click nos cards navega para detalhes
- [ ] Loading states durante fetch
- [ ] Error states se API falhar

**CA-02: Seção Próximos Cultos**
- [ ] Lista dos próximos 4-6 cultos
- [ ] Para cada: data, confirmações (ex: "8/12"), vagas pendentes
- [ ] Link para confirmar presença
- [ ] Link para ver repertório
- [ ] Indicador visual se usuário está confirmado

**CA-03: Status do Ciclo**
- [ ] Indicador da fase atual (4 estados)
- [ ] Countdown para deadline (se aplicável)
- [ ] Botão de ação contextual
- [ ] Exemplo: "Coletando disponibilidade - 5 dias restantes" → Botão: "Preencher"

**CA-04: Métricas de Repertório**
- [ ] Gráfico de pizza: Pronta / Rascunho / Arquivada
- [ ] Top 5 músicas mais usadas (lista)
- [ ] Últimas 3 músicas adicionadas
- [ ] % de músicas com cifra completa

**CA-05: Ações Rápidas**
- [ ] Grid de 6-8 botões com ícones
- [ ] Ações variam por role (Admin vs Músico)
- [ ] Links funcionais para cada ação
- [ ] Tooltip explicando cada ação

**CA-06: Atividade Recente**
- [ ] Timeline com últimas 5-10 atividades
- [ ] Tipos: Sessão executada, Mensagem WhatsApp, Novo membro
- [ ] Ícones diferentes por tipo
- [ ] Timestamp relativo ("há 2 horas")

**CA-07: Responsividade**
- [ ] Mobile: 1 coluna, cards stackados
- [ ] Tablet: 2 colunas
- [ ] Desktop: 3-4 colunas
- [ ] Testar em 360px, 768px, 1024px, 1920px

**CA-08: Performance**
- [ ] Dashboard carrega em < 2s
- [ ] Lighthouse score > 90
- [ ] Métricas cached (5 min)
- [ ] Polling não causa re-renders desnecessários

---

## 8. Dependências do Backend

### 8.1: Endpoints Existentes (Reutilizar)
- ✅ `GET /schedules` - Lista de cultos
- ✅ `GET /schedules/:id/assignments` - Confirmações
- ✅ `GET /songs` - Biblioteca de músicas
- ✅ `GET /ministries/:id/members` - Músicos
- ✅ `GET /schedules/cycles/:id` - Ciclo mensal

### 8.2: Endpoints Novos (Criar)
- ⭕ `GET /dashboard/metrics` - Agregado de todas as métricas
- ⭕ `GET /dashboard/upcoming-services` - Próximos cultos formatados
- ⭕ `GET /dashboard/repertoire-stats` - Estatísticas de repertório
- ⭕ `GET /dashboard/recent-activity` - Timeline de atividade
- ⭕ `POST /dashboard/confirm-attendance` - Confirmar presença rápida

### 8.3: WebSocket (Opcional/Futuro)
- 🟡 Atualização em tempo real de confirmações
- 🟡 Notificação de nova mensagem WhatsApp
- 🟡 Alerta de sessão iniciando

---

## 9. Exemplo de Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar (280px)        │  Main Content (flex-1)                │
│  ┌─────────────────┐    │  ┌─────────────────────────────────┐  │
│  │ Floworship logo │    │  │  Overview                        │  │
│  ├─────────────────┤    │  │  Here's what's happening today   │  │
│  │ Dashboard       │    │  └─────────────────────────────────┘  │
│  │ Escala Mensal  │    │                                        │
│  │ Repertório     │    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ Músicos        │    │  │Next  │ │Pend. │ │Musc. │ │Songs │ │
│  │ Configurações  │    │  │Culto │ │Conf. │ │Disp. │ │Ready │ │
│  ├─────────────────┤    │  │05/07 │ │  3   │ │  24  │ │ 145  │ │
│  │ [Modo Operador] │    │  └──────┘ └──────┘ └──────┘ └──────┘ │
│  └─────────────────┘    │                                        │
│                         │  ┌──────────────────────────────────┐ │
│                         │  │  Próximos Cultos                 │ │
│                         │  │  ┌────────────────────────────┐  │ │
│                         │  │  │ 05/07 - 19:00              │  │ │
│                         │  │  │ 8/12 confirmados           │  │ │
│                         │  │  │ Vagas: Baixista, Vocalista │  │ │
│                         │  │  └────────────────────────────┘  │ │
│                         │  │  ┌────────────────────────────┐  │ │
│                         │  │  │ 12/07 - 19:00              │  │ │
│                         │  │  │ 10/12 confirmados          │  │ │
│                         │  │  │ Vagas: Tecladista          │  │ │
│                         │  │  └────────────────────────────┘  │ │
│                         │  └──────────────────────────────────┘ │
│                         │                                        │
│                         │  ┌──────────────────────────────────┐ │
│                         │  │  Status do Ciclo                 │ │
│                         │  │  📝 Coletando disponibilidade    │ │
│                         │  │  Deadline: 5 dias restantes      │ │
│                         │  │  [Preencher Disponibilidade]     │ │
│                         │  └──────────────────────────────────┘ │
│                         │                                        │
│                         │  ┌─────────────┐ ┌──────────────────┐ │
│                         │  │ Repertório  │ │ Ações Rápidas    │ │
│                         │  │ [Pizza]     │ │ [🎵] [📅] [👥]  │ │
│                         │  │ 145 Prontas │ │ [📊] [📱] [⚙️]  │ │
│                         │  │ 67 Rascunho │ └──────────────────┘ │
│                         │  │ 22 Arquiv.  │                      │
│                         │  └─────────────┘                      │
│                         └────────────────────────────────────────┘
```

---

## 10. Tasks de Implementação

### Fase 1: Backend (API)
- [ ] TSK-B01: Criar endpoint `GET /dashboard/metrics`
- [ ] TSK-B02: Criar endpoint `GET /dashboard/upcoming-services`
- [ ] TSK-B03: Criar endpoint `GET /dashboard/repertoire-stats`
- [ ] TSK-B04: Criar endpoint `GET /dashboard/recent-activity`
- [ ] TSK-B05: Otimizar queries com indexes

### Fase 2: Componentes do Dashboard
- [ ] TSK-F01: Criar `NextServiceCard.tsx`
- [ ] TSK-F02: Criar `PendingConfirmationsCard.tsx`
- [ ] TSK-F03: Criar `MusiciansCountCard.tsx`
- [ ] TSK-F04: Criar `RepertoireStatsCard.tsx`
- [ ] TSK-F05: Criar `CycleStatusWidget.tsx`
- [ ] TSK-F06: Criar `UpcomingServicesList.tsx`
- [ ] TSK-F07: Criar `RepertoireChart.tsx`
- [ ] TSK-F08: Criar `QuickActionsGrid.tsx`
- [ ] TSK-F09: Criar `RecentActivityTimeline.tsx`

### Fase 3: Integração
- [ ] TSK-I01: Criar hook `useDashboardMetrics`
- [ ] TSK-I02: Refatorar `DashboardNew.tsx` para usar dados reais
- [ ] TSK-I03: Adicionar loading states
- [ ] TSK-I04: Adicionar error states
- [ ] TSK-I05: Adicionar polling (60s)

### Fase 4: Testes
- [ ] TSK-T01: Test unitário dos cards
- [ ] TSK-T02: Test de integração com API
- [ ] TSK-T03: Test de responsividade
- [ ] TSK-T04: Test de acessibilidade

---

## 11. IDs de Rastreabilidade

| ID | Tipo | Descrição |
|----|------|-----------|
| RF-01 a RF-06 | Funcional | Requisitos funcionais |
| RNF-01 a RNF-05 | Não Funcional | Requisitos não funcionais |
| CA-01 a CA-08 | Critério | Critérios de aceitação |
| TSK-B01 a TSK-T04 | Task | Tasks de implementação |

---

## 12. Notas e Considerações

### 12.1: Manter o Design System
- NÃO remover aurora effects, glassmorphism, gradientes
- Manter layout de 2 cards (sidebar + main)
- Manter ícones lucide-react stroke 1.5px
- Manter dark theme como default

### 12.2: Dados Mockados (Transição)
- Durante desenvolvimento, usar dados mockados
- Facilitar frontend development sem backend pronto
- Criar arquivo `mocks/dashboardData.ts`

### 12.3: Internacionalização (Futuro)
- Dashboard deve suportar i18n
- Textos em PT-BR inicialmente
- Estrutura pronta para EN, ES

### 12.4: Performance
- Evitar N+1 queries no backend
- Usar `Promise.all` para fetch paralelo
- Implementar cache (React Query / SWR)

---

**Status**: Espec pronta para implementação
**Prioridade**: Alta (dashboard é a primeira tela que usuários veem)
**Estimativa**: 5-7 dias (backend + frontend + testes)