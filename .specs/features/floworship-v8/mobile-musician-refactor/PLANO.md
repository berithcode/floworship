# Plano de Refatoração Mobile — Interface do Músico

## Objetivo
Adaptar todas as 8 páginas acessíveis por músicos (`role='musician'`) para 
mobile-first com responsividade, português consistente e dados reais.

## Escopo
Páginas dentro do `MusicianLayout` (bottom nav + header mobile):
- `/dashboard`
- `/library` + `/library/new` + `/library/:id`
- `/library/:songId/study`
- `/my-schedule`
- `/session`
- `/profile`

---

## Fase 1 — Correções Críticas (prioridade máxima)

### TSK-M01: Traduzir SongForm.tsx para português
**Arquivos:** `apps/web/src/components/library/SongForm.tsx`  
**Estimativa:** 1h

**O que fazer:**
- `"Title *"` → `"Título *"`
- `"Artist"` → `"Artista"`
- `"Key *"` → `"Tom *"`
- `"Select key"` → `"Selecione o tom"`
- `"Draft"` / `"Ready"` / `"Archived"` → `"Rascunho"` / `"Pronta"` / `"Arquivada"`
- `"worship, contemporary, slow"` → `"adoração, contemporâneo, lento"`
- `"Notes"` → `"Anotações"`
- `"Additional notes..."` → `"Anotações adicionais..."`
- `"Save"` / `"Saving..."` → `"Salvar"` / `"Salvando..."`
- `'Title is required'` → `'Título é obrigatório'`
- `'Key is required'` → `'Tom é obrigatório'`

**Verificação:** SongForm não contém mais nenhum texto em inglês.

---

### TSK-M02: Traduzir SongDetail.tsx e NewSong.tsx
**Arquivos:**
- `apps/web/src/pages/library/SongDetail.tsx`
- `apps/web/src/pages/library/NewSong.tsx`  
**Estimativa:** 0.5h

**SongDetail:**
- `"<- Back"` → `"← Voltar"`
- `"Loading..."` → `"Carregando..."`
- `"Info"` → `"Informações"`
- `"Cue Editor"` → `"Editor de Cue"` (ou `"Roteiro"`)
- `"History"` → `"Histórico"`
- `"Update Song"` → `"Atualizar Música"`

**NewSong:**
- `"<- Back"` → `"← Voltar"`
- `"New Song"` → `"Nova Música"`
- `"Create Song"` → `"Criar Música"`

**Verificação:** Nenhum texto em inglês visível nas páginas.

---

### TSK-M03: Corrigir hover-only archive em SongList
**Arquivo:** `apps/web/src/pages/library/SongList.tsx`  
**Estimativa:** 0.5h

**Problema:** Botão "Arquivar" usa `opacity-0 group-hover:opacity-100` — 
invisível em dispositivos touch.

**Solução:** Manter o botão visível em mobile. Uma abordagem:
- Em telas < 768px, o botão fica sempre visível (opacity-100)
- Em desktop, mantém hover pattern

```tsx
className={`opacity-0 group-hover:opacity-100 
            md:opacity-0 md:group-hover:opacity-100
            opacity-100 md:opacity-0`}
```

Ou mais simples: usar um ícone permanente de menu (⋮) que revela as ações 
num popover/tooltip — mas para MVP, apenas remover a opacidade condicional 
no mobile resolve.

**Verificação:** Botão "Arquivar" é visível e tocável em viewport < 768px.

---

### TSK-M04: Adicionar scroll horizontal nas tabs do SongDetail
**Arquivo:** `apps/web/src/pages/library/SongDetail.tsx`  
**Estimativa:** 0.5h

**Problema:** 4 tabs (Info, Cue Editor, History, Estudar) em `display: flex` 
sem overflow — quebram em telas estreitas.

**Solução:**
```tsx
// No container das tabs
className="flex gap-1 overflow-x-auto scrollbar-hide"
// Garantir que as tabs não encolham
// Cada tab button:
className="whitespace-nowrap px-4 py-2.5 shrink-0"
```

**Verificação:** Tabs scrollam horizontalmente em viewport < 400px sem 
overflow visual.

---

## Fase 2 — Padding Responsivo

### TSK-M05: Ajustar padding da SongList
**Arquivo:** `apps/web/src/pages/library/SongList.tsx`  
**Estimativa:** 0.5h

**Mudança:** `p-8` → `p-4 md:p-8` (linhas 36, 63, 73)

**Verificação:** Padding reduz em mobile, mantém conforto em desktop.

---

### TSK-M06: Ajustar padding do SongDetail / NewSong
**Arquivos:**
- `apps/web/src/components/library/SongDetail.css`
- `apps/web/src/pages/library/NewSong.tsx`  
**Estimativa:** 0.5h

**SongDetail.css:** Substituir `.song-detail-page { padding: 24px }` por 
`.song-detail-page { padding: 16px } @media (min-width: 768px) { padding: 24px }`

Verificar se NewSong.tsx usa a mesma classe ou padding independente.

**Verificação:** Padding proporcional à tela.

---

### TSK-M07: Ajustar padding MySchedule, SessionLanding, ProfilePage
**Arquivos:**
- `apps/web/src/pages/schedule/MySchedule.tsx`
- `apps/web/src/pages/session/SessionLanding.tsx`
- `apps/web/src/pages/profile/ProfilePage.tsx`  
**Estimativa:** 1h

**Mudança:** `p-6` → `p-4 md:p-6` em cada página.

**Verificação:** Espaçamento consistente em mobile e desktop.

---

### TSK-M08: Responsivizar search input do DashboardHeader
**Arquivo:** `apps/web/src/components/dashboard/DashboardHeader.tsx`  
**Estimativa:** 0.5h

**Problema:** `w-64` fixo no input de busca — estoura em telas < 300px.

**Solução:** Substituir `w-64` por `w-full max-w-[16rem]` ou 
`w-40 md:w-64`.

**Verificação:** Input de busca não ultrapassa a largura da tela.

---

### TSK-M09: Ajustar filtros do MySchedule para wrap
**Arquivo:** `apps/web/src/pages/schedule/MySchedule.tsx`  
**Estimativa:** 0.5h

**Problema:** 4 filter buttons (Todos/Pendentes/Confirmados/Recusados) 
com `px-4 py-2` sem wrap definido — podem quebrar em 2 linhas desalinhadas.

**Solução:** Adicionar `flex-wrap` ao container e reduzir padding dos 
filtros em mobile:

```tsx
className="flex flex-wrap gap-2"
// cada botão:
className="px-3 md:px-4 py-1.5 md:py-2"
```

**Verificação:** Filtros organizados em telas ≤ 360px.

---

## Fase 3 — Dados Reais

### TSK-M10: Remover mock data de MySchedule
**Arquivo:** `apps/web/src/pages/schedule/MySchedule.tsx`  
**Estimativa:** 1h

**O que fazer:**
- Identificar o catch block que popula `setAssignments` com mock data (linhas ~41-70)
- Substituir por estado de erro real (exibir mensagem "Erro ao carregar escalas")
- Ou manter fallback vazio (`setAssignments([])`) em vez de dados falsos

**Verificação:** Sem dados falsos injetados no estado.

---

### TSK-M11: Remover mock data de SessionLanding
**Arquivo:** `apps/web/src/pages/session/SessionLanding.tsx`  
**Estimativa:** 1h

**O que fazer:**
- Remover mock sessions do catch block (linhas ~37-62)
- Substituir `wsConnected = true` hardcoded por estado real ou remover
- Exibir array vazio + empty state "Nenhuma sessão disponível" quando API falhar

**Verificação:** Estado inicial é vazio até API responder. `wsConnected` 
reflete estado real ou é removido.

---

### TSK-M12: Remover mock data de ProfilePage
**Arquivo:** `apps/web/src/pages/profile/ProfilePage.tsx`  
**Estimativa:** 1h

**O que fazer:**
- Remover `Math.floor(Math.random() * 1000)` como ID do usuário (linha ~72)
- Substituir fallback de presence/distribution por empty state
- Garantir que `user?.name` do AuthContext é usado em vez de mock

**Verificação:** Perfil mostra dados reais do usuário autenticado, sem 
números aleatórios.

---

### TSK-M13: Substituir placeholders do StudyMode
**Arquivo:** `apps/web/src/pages/study/StudyMode.tsx`  
**Estimativa:** 2h (ou agendar para fase futura)

**O que fazer:**
- `TunerPlaceholder` e `MetronomePlaceholder` são stubs vazios
- Opção A: Remover as seções vazias e mostrar "Em breve" 
- Opção B: Implementar versão simplificada (apenas visual, sem motor de áudio)
- Opção C: Manter mas com estado visual decente (não quebrado)

**Verificação:** Página de estudo não mostra componentes vazios ou 
quebrados.

---

## Fase 4 — Verificação

### TSK-M14: Build e lint
**Comando:** `npm run build:web`  
**Estimativa:** 0.5h

**Verificação:**
- Build passa sem erros
- Nenhum warning de tipo novo
- Páginas carregam sem erro no navegador

---

## Resumo

| Fase | Tasks | Estimativa | Impacto |
|------|-------|------------|---------|
| 1 — Correções críticas | 4 | 2.5h | Músico consegue usar app em portugês no celular |
| 2 — Padding responsivo | 5 | 3h | Layout adaptável em qualquer tela |
| 3 — Dados reais | 4 | 5h | Sem dados falsos no estado |
| 4 — Verificação | 1 | 0.5h | Build saudável |
| **Total** | **14** | **~11h** | |

## Dependências

```
TSK-M01 ─┐
TSK-M02 ─┤ (paralelo)
TSK-M03 ─┤
TSK-M04 ─┘
          │
TSK-M05 ─┤
TSK-M06 ─┤ (paralelo, após M02)
TSK-M07 ─┤
TSK-M08 ─┤
TSK-M09 ─┘
          │
TSK-M10 ─┤
TSK-M11 ─┤ (paralelo)
TSK-M12 ─┤
TSK-M13 ─┘
          │
TSK-M14 ── (depende de todas)
```
