# Floworship — Design System, Plataformas e Modo Performance (v10)

## Especificação para Desenvolvimento

> **Nota de versão (v10):** formalizado o Modo Conjunto/Modo Livre (seção 4.3.1) — navegação sincronizada por padrão durante sessão ao vivo, com opção do músico se soltar sem afetar os outros. O Modo Estudo (4.5.1) ganha o mesmo leitor de cifra em blocos, com "seguir áudio" opcional. Referências obsoletas a Capacitor na seção 4.5 corrigidas para PWA/navegador.

---

## 1. Design System — extraído da referência

A referência (app de casa inteligente) define um padrão dark, minimalista e com hierarquia forte. Traduzindo em tokens:

### 1.1 Cores

| Token | Valor aproximado | Uso |
|---|---|---|
| `bg-primary` | `#121214` | Fundo geral das telas |
| `bg-card` | `#1E1E22` | Cards, painéis, blocos |
| `bg-card-elevated` | `#26262C` | Cards em destaque/selecionados |
| `accent-primary` | `#6C5CE7` (roxo) | Botões ativos, bloco atual, destaques |
| `accent-secondary` | `#4A9EFF` | Estados informativos (opcional, uso pontual) |
| `text-primary` | `#FFFFFF` | Títulos, texto principal |
| `text-secondary` | `#9A9AA2` | Legendas, metadados |
| `success` | `#3DDC97` | Confirmações (presença confirmada) |
| `warning` | `#FFB648` | Pendências, alertas |
| `danger` | `#FF5C5C` | Recusas, conflitos |

### 1.2 Formas e Espaçamento

- Raio de borda de cards: **20–24px**
- Raio de borda de botões/pills: **full-round** (999px)
- Ícones em botão circular: fundo `bg-card-elevated`, ícone branco, 44x44px (área de toque mínima)
- Espaçamento base: grid de 8px (8/16/24/32)

### 1.3 Componentes-padrão identificados na referência

- **Pill toggle** (ex: "Awakening" / "Good night"): opção ativa em branco com texto escuro; opções inativas em roxo/escuro com texto claro
- **Card de dispositivo/item**: ícone + botão de ação circular no canto superior direito + título + subtítulo
- **Slider horizontal**: barra fina, indicador roxo preenchido
- **Dial circular** (ex: controle de brilho 75%): usado para valores contínuos — no Floworship, aproveitável para BPM ou progresso do bloco atual
- **Bottom nav em pill flutuante**: 4–5 ícones, fundo escuro arredondado, ícone ativo destacado
- **Avatar circular** com badge de notificação (ponto colorido)

Esses componentes serão reaproveitados 1:1 no Floworship, trocando a semântica (dispositivos → músicas/blocos, cômodos → repertórios).

---

## 2. Divisão de Plataformas

### 2.1 Web (Admin) — "Floworship Web"
**Uso:** líder/administrador organizando o ministério de casa, no computador, com calma.

Módulos disponíveis na Web:
- Gestão completa de escalas (criar, editar, visualizar calendário)
- Cadastro de membros e instrumentos
- Biblioteca de músicas (criação e edição completa)
- **Editor de Cue/Timeline** do Modo Performance (montar os blocos da música com timestamps — tarefa que exige tela grande e precisão, feita melhor no desktop)
- Montagem de repertório e ordem do culto
- Estatísticas e relatórios
- Configurações do ministério/igreja

A Web **não** executa o Modo Performance ao vivo (isso é papel do mobile, que vai para o altar). A Web é ferramenta de preparação, não de palco.

### 2.2 Mobile — "Floworship App"
**Uso:** músico no dia a dia (estudo, confirmação de presença) e execução ao vivo no domingo.

Módulos disponíveis no Mobile:
- Confirmação de presença, visualização de escala
- Estudo de repertório (Modo Estudo, afinador, metrônomo)
- **Execução ao vivo**: Modo Operador (líder), Modo Letra (cantor), Modo Cifra (músico)
- Chat da escala, avisos
- Devocional, plano de leitura, pedidos de oração

O mobile é otimizado para leitura rápida em pé, iluminação de palco variável (por isso o tema dark da referência é ideal) e toque com uma mão.

**Stack confirmada (v4):** o app mobile roda como **PWA** (Progressive Web App instalável), sobre a mesma base React/TypeScript da Web — não Capacitor, React Native nem Flutter. Isso significa que todo o código de UI, lógica de estado e ferramentas de áudio (afinador, metrônomo) são compartilhados entre Web e Mobile como um único codebase JS/TS, sem build nativo separado. Acesso a hardware (microfone, tela sempre ligada) usa APIs padrão do browser (`getUserMedia`, `navigator.wakeLock`) em vez de plugins nativos — ver seção 8 para detalhes técnicos e limitações específicas de iOS/Safari.

### 2.3 Tabela-resumo

| Funcionalidade | Web | Mobile |
|---|---|---|
| Criar escala | ✅ Principal | ⚠️ Visualização/edição rápida |
| Confirmar presença | ⚠️ Possível | ✅ Principal |
| Biblioteca de músicas (CRUD completo) | ✅ Principal | ⚠️ Leitura |
| Editor de blocos/timeline (cue) | ✅ Principal | ❌ |
| Modo Estudo | ⚠️ Possível | ✅ Principal |
| Afinador/Metrônomo | ❌ | ✅ Principal (ver 4.5) |
| Modo Operador/Letra/Cifra (ao vivo) | ❌ | ✅ Exclusivo |
| Estatísticas | ✅ Principal | ⚠️ Resumo |
| Chat/Avisos | ⚠️ Possível | ✅ Principal |
| Devocional | ⚠️ Possível | ✅ Principal |

---

## 3. Modo Performance — Modelo "Estilo VST" (pré-programado)

Esta é a evolução central: o fluxo de blocos deixa de ser um grafo livre e passa a ser um **cue sheet cronometrado**, ancorado na duração real da música original — como uma faixa de VST/backing track com marcadores de tempo.

### 3.1 Conceito

A música original tem uma duração total (ex: 4:00). Ao cadastrar a música, o líder (na Web, no Editor de Cue) marca os pontos de início/fim de cada bloco em cima da faixa de referência:

```
0:00 ────── 0:20 ────── 1:00 ────── 1:30 ────── 2:10 ────── 2:50 ────── 3:20 ── 4:00
  Intro       Verso 1     Pré-Refrão   Refrão      Verso 2     Refrão      Ponte  Fim
```

Cada bloco carrega seu tempo de início e fim reais, extraídos da gravação de referência. Isso define a **duração padrão** de cada bloco no modo automático.

### 3.2 Modelo de dados atualizado

```
song_cue_sheet {
  song_id
  reference_track_url      // áudio de referência usado para marcar os tempos
  total_duration_seconds
  blocks: [
    {
      id
      label                 // "Refrão"
      start_time            // 90 (segundos, na faixa original)
      end_time               // 130
      duration               // end_time - start_time, usado no modo automático
      lyrics
      chords
      order                  // posição no fluxo padrão
    }
  ]
}
```

### 3.3 Máquina de Estados da Sessão ao Vivo

Dois estados possíveis a cada momento:

**Estado PROGRAMADO (padrão)**
- O relógio da sessão avança normalmente.
- Quando o tempo decorrido do bloco atual atinge sua `duration`, o sistema avança automaticamente para o próximo bloco da sequência padrão (`order + 1`).
- Isso simula o comportamento de uma faixa pré-gravada avançando sozinha, no ritmo real da música.

**Estado OVERRIDE (intervenção manual)**
- O líder toca um bloco fora da ordem esperada (ex: tocar "Refrão" novamente enquanto a banda ainda está no "Verso 2").
- O sistema **insere** uma execução extra daquele bloco, com sua própria contagem de `duration`.
- Durante o Override, o "ponteiro" da sequência padrão **não se move** — fica pausado no bloco que seria o próximo.
- Ao terminar a duração do bloco inserido, a sessão **retorna automaticamter ao Estado PROGRAMADO**, continuando exatamente de onde o ponteiro havia parado — sem pular nem repetir os blocos seguintes.

```
Fluxo padrão:      Intro → Verso1 → PréRefrão → Refrão → Verso2 → Refrão → Ponte → Fim
                                                    │
                                        (líder toca "Refrão" de novo,
                                         antes do fluxo chegar lá)
                                                    ▼
                                        OVERRIDE: toca "Refrão" (duração própria)
                                                    │
                                          (ao terminar, retoma o ponteiro)
                                                    ▼
                              Fluxo retoma exatamente em: Verso2 → Refrão → Ponte → Fim
```

> Importante: o Override **não desloca no tempo real da faixa de áudio** (a banda não está tocando junto com um áudio, apenas seguindo o cue); ele desloca a **posição do cue sheet**, então o "atraso" introduzido pela repetição é natural — a banda simplesmente toca mais uma vez aquele trecho antes de seguir.

### 3.4 Regras adicionais

- Apenas o dispositivo com papel **Operador/Líder** pode disparar Override.
- Um Override pode ser cancelado (voltar direto ao fluxo programado) caso o líder toque errado.
- Múltiplos Overrides em sequência são permitidos (repetir o refrão 3x, por exemplo).
- O sistema mantém um **log de execução** da sessão (quais overrides ocorreram, em que timestamp) — útil para o módulo de estatísticas futuramente ("essa música normalmente tem o refrão repetido").

---

## 4. Telas do Modo Performance (Mobile)

### 4.1 Modo Operador (Líder/Maestro)

**Layout (dark, seguindo design system):**

- **Header:** nome da música + tom + BPM (card pequeno, `bg-card`)
- **Bloco atual em destaque:** card grande `bg-card-elevated`, com nome do bloco ("Refrão") e um **dial circular** (reaproveitando o componente da referência) mostrando o progresso do bloco atual (ex: 60% do tempo do bloco decorrido) — substitui o "75%" de brilho por "progresso do bloco"
- **Timeline horizontal:** representação da sequência de blocos como pills na horizontal, com o bloco atual destacado em roxo (`accent-primary`) e os demais em `bg-card`
- **Grid de blocos tocáveis:** abaixo, todos os blocos da música como cards/pills tocáveis — tocar em qualquer um dispara Override imediato
- **Indicador de estado:** badge pequeno "Programado" ou "Override ativo" (cor `warning` quando em override)
- **Bottom nav (pill flutuante, como na referência):** ícones para Ordem do Culto / Modo Operador (ativo) / Chat / Encerrar sessão

### 4.2 Modo Letra (Cantor)

- **Header:** nome da música + indicador do bloco atual (ex: "Refrão")
- **Corpo:** letra do bloco atual em fonte grande, centralizada, sem cifra por padrão
- **Toggle "Mostrar cifra":** pill switch no topo (estilo "Awakening/Good night" da referência) — ao ativar, sobrepõe os acordes acima da letra
- **Prévia do próximo bloco:** faixa fina no rodapé, texto secundário, mostrando "Próximo: Ponte"
- **Sem controles de navegação manual** por padrão (papel de cantor é só acompanhar) — a tela muda sozinha conforme o Operador avança
- *Opcional futuro:* permitir que o cantor "sugira" um override que aparece como notificação para o líder aprovar com um toque, em vez de trocar direto.

### 4.3 Modo Cifra (Músico instrumentista)

- Mesma estrutura do Modo Letra, mas com **cifra sempre visível por padrão** junto à letra, em fonte um pouco menor para caber a notação
- Acordes alinhados sobre a sílaba correspondente (mesmo padrão de cifra tradicional)
- Toggle inverso: "Ocultar letra" (para quem quiser ver só a cifra, tipo baixista/baterista que não canta)
- Indicador de tom no header sempre visível (crítico para quem está tocando)

### 4.3.1 Modo Conjunto vs. Modo Livre — navegação entre blocos

Tanto o Modo Letra quanto o Modo Cifra (ao vivo, dentro de uma sessão) precisam resolver uma tensão: o bloco normalmente é ditado pelo operador (seção 4.1), mas o músico às vezes precisa se adiantar ou voltar sem esperar — por exemplo, pra conferir o acorde de um trecho difícil antes da hora.

- **Modo Conjunto (padrão, ligado):** o bloco exibido é o mesmo que o operador está tocando — navegação bloqueada, sincronizada via WebSocket (seção 8.2). É o comportamento esperado durante a execução normal do culto.
- **Modo Livre (opcional, um toque pra alternar):** o músico assume o controle da navegação por conta própria (toque no bloco pra avançar/voltar), sem afetar os outros — o operador e os demais músicos continuam vendo o que o operador escolher. Um aviso discreto na tela deixa claro que a pessoa está fora de sincronia.
- Ao religar o Modo Conjunto, o app pula direto pro bloco atual da sessão — não faz sentido "sincronizar" e continuar mostrando um bloco antigo.
- O mesmo padrão de blocos (leitura em tela cheia, com o próximo bloco sempre visível numa faixa inferior, e transposição de tom acessível ali mesmo) é compartilhado com o Modo Estudo (seção 4.5.1) — um único componente de leitura, reaproveitado nos dois contextos.

### 4.4 Modo TV (ensaio) — mantém especificação anterior
Sem alteração relevante; passa a exibir também o **dial circular de progresso do bloco atual**, reaproveitando visual da referência.

### 4.5 Modo Estudo — Afinador, Metrônomo e Leitura de Cifra (Mobile, exclusivo)

Ferramentas auxiliares de prática individual, acessadas fora do fluxo de sessão ao vivo (ex: músico afinando o instrumento em casa ou nos bastidores antes do culto). Decisão de arquitetura: **não desenvolver os motores de DSP (processamento de sinal) do zero** — usar bibliotecas open source já testadas, plugadas em componentes de UI próprios do Floworship (dial circular, pills, cores do design system).

### 4.5.1 Leitura de cifra em blocos — resolvendo o problema da "cifra gigante no celular"

Antes de qualquer ferramenta de prática, o Modo Estudo precisa mostrar a música em si — e o problema original que motivou blocos (em vez de uma cifra corrida) é de leitura no celular: uma cifra inteira, tela pequena, é ilegível durante a execução. A solução é o **mesmo leitor em blocos do Modo Cifra ao vivo** (seção 4.3.1), só que sem sessão nem operador por trás:

- **Navegação padrão: manual, por toque** — mesma interação do Modo Cifra/Letra ao vivo (bloco em tela cheia, toque avança, próximo bloco sempre visível numa faixa inferior).
- **"Seguir áudio" (opcional, toggle):** se a música tem faixa de referência cadastrada (seção 8.3), liga a reprodução e o bloco muda sozinho conforme o tempo de áudio cruza o `startTime`/`endTime` de cada bloco — útil pra quem quer praticar no tempo real da música, sem precisar tocar a tela toda hora. Desligado, volta a ser manual.
- Transposição de tom disponível no próprio leitor, não só no editor administrativo (seção 5.4) — o músico pode praticar num tom diferente do original sem precisar que o líder republique a música.

**Afinador cromático:**

- **Motor de detecção de pitch:** [`pitchy`](https://github.com/ianprime0509/pitchy) (algoritmo McLeod/MPM) — ES module puro, leve, sem dependências nativas, roda em qualquer navegador via Web Audio API. Retorna frequência (Hz) e um índice de "clarity" (0–1) que indica confiabilidade da leitura, útil para não mostrar falsos positivos com ruído de fundo/palco.
- **Camada de abstração recomendada:** [`@chordbook/tuner`](https://www.npmjs.com/package/@chordbook/tuner), que já embrulha a `pitchy` com captura de microfone (`getUserMedia`), filtro de frequências fora da faixa de instrumentos de corda e conversão direta para `{ note, cents, octave, clarity }` — reduz a integração a poucas linhas (`tuner.start()` / `onNote` callback).
- **UI:** reaproveitar o **dial circular** do design system (mesmo componente usado no progresso de bloco) para mostrar o desvio em cents (-50 a +50), com cor `success` quando dentro da tolerância (ex: ±5 cents), `warning` fora dela.
- **Modo de afinação:** cromático livre por padrão; oferecer presets rápidos (Violão/Guitarra EADGBE, Baixo EADG, Cavaquinho) que apenas destacam a nota-alvo mais próxima — sem lógica extra de detecção.

**Metrônomo:**

- **Base de implementação:** padrão de *scheduling look-ahead* com Web Audio API (a técnica de referência de Chris Wilson, "Scheduling Web Audio with Precision"), que agenda os cliques com precisão de amostra em vez de depender de `setInterval`/`setTimeout` (que perdem precisão sob carga de renderização).
- **Ponto de partida:** [`react-metronome`](https://github.com/francoischalifour/react-metronome) como referência de implementação em React com Web Worker (evita que o clique atrase quando a thread principal está ocupada renderizando a UI) — pode ser adaptado/forkado para os componentes visuais do Floworship, ou usado como está por trás de uma UI customizada.
- **Funcionalidades:** BPM ajustável (dial ou input numérico), fórmula de compasso (2/4, 3/4, 4/4, 6/8), acento na primeira batida, tap tempo, e **BPM pré-carregado automaticamente do cadastro da música** (campo já existente no header do Modo Operador — ver 4.1) quando o músico abre o metrônomo a partir de uma música específica.

**Considerações específicas de PWA/navegador (substitui a nota anterior de Capacitor, obsoleta desde a v4 — ver seção 2.2):**

1. **Permissão de microfone via `getUserMedia`** — o navegador mostra o prompt nativo de permissão na primeira chamada; diferente de um app nativo, não existe passo de configuração prévia (`Info.plist`/`AndroidManifest`), mas a chamada **exige contexto seguro (HTTPS)**, já coberto na seção 7.4.
2. **Suspensão de áudio em background/tela bloqueada:** mesmo comportamento documentado na seção 8.2 pra iOS Safari — o `AudioContext` pode ser suspenso quando o app perde foco. Vale o mesmo cuidado ali descrito (Screen Wake Lock API) tanto pro afinador/metrônomo quanto pro Modo Operador ao vivo.
3. Afinador, metrônomo e a reprodução do "seguir áudio" (4.5.1) compartilham o mesmo `AudioContext` — vale centralizar sua criação/gestão em um serviço único (`AudioEngineProvider`) para evitar múltiplas instâncias concorrendo pelo hardware de áudio.

**Modelo de dados (preferências locais, não sincronizadas com o backend):**

```
tuner_metronome_prefs {
  user_id
  tuner: {
    reference_pitch          // padrão 440 Hz, ajustável
    instrument_preset        // "chromatic" | "guitar" | "bass" | "cavaquinho"
    tolerance_cents          // padrão 5
  }
  metronome: {
    default_bpm              // último BPM usado
    time_signature            // "4/4", "3/4", etc.
    accent_first_beat         // boolean
    sound_pack                 // variações de clique disponíveis
  }
}
```

---


## 5. Telas da Web (Admin)

### 5.1 Dashboard
- Visão geral: próximo evento, pendências de confirmação, avisos recentes
- Cards no estilo da referência (fundo escuro, cantos arredondados), adaptados para grid de desktop (3–4 colunas)

### 5.2 Editor de Cue/Timeline (tela nova, crítica)
- Player de áudio da faixa de referência com waveform visual
- Linha do tempo abaixo da waveform onde o líder arrasta marcadores de início/fim de cada bloco
- Painel lateral: lista de blocos criados, com label, lyrics e cifra editáveis
- Botão "Testar no Modo Operador" — simula o fluxo programado antes de salvar

**Detalhamento técnico (biblioteca de waveform):**

- **[wavesurfer.js](https://wavesurfer-js.org/)** confirmado como biblioteca de base — é madura, ativamente mantida, e já resolve os pontos mais delicados: renderização de waveform a partir de áudio (arquivo local ou streaming), zoom, região de seleção arrastável (plugin `regions`) e sincronização de playback com a posição visual.
- **Plugin-chave:** `wavesurfer.js/dist/plugins/regions` — permite criar as regiões coloridas de cada bloco diretamente sobre a waveform, com handles arrastáveis nas bordas para ajustar `start_time`/`end_time`. Cada região pode ser rotulada com o nome do bloco (Intro, Verso 1, Refrão...), reduzindo a implementação do editor a um wrapper de UI em cima do plugin em vez de lógica de arrasto customizada.
- **Fluxo sugerido de uso:** líder faz upload/aponta a URL da faixa de referência → wavesurfer renderiza a waveform → líder cria blocos clicando "Adicionar bloco" (cria uma região padrão de alguns segundos na posição atual do player) → arrasta as bordas para ajustar o tempo real → preenche label/lyrics/cifra no painel lateral → cada região gera um objeto do `song_cue_sheet.blocks` (seção 3.2).
- **Persistência incremental:** salvar o estado do cue sheet a cada alteração de região (debounce de ~1s) evita perda de trabalho em sessões longas de edição, já que essa é a tela mais crítica e trabalhosa do produto para o líder.

### 5.3 Gestão de Escalas
- Calendário mensal (visão administrativa)
- Clique em uma data abre painel lateral para montar a escala daquele evento
- Indicadores visuais de confirmação (verde/amarelo/vermelho, usando os tokens `success/warning/danger`)

### 5.4 Biblioteca de Músicas
- Tabela/grid com busca e filtros
- Clique abre o Detalhe da Música, com aba para "Editor de Cue" (seção 5.2)

### 5.5 Estatísticas
- Gráficos de frequência de membros, músicas mais tocadas, tempo médio de culto
- Reaproveita paleta roxo/dark da referência para os gráficos (barras/linhas em `accent-primary`)
- **Análise de Overrides (nova, habilitada pelo log de execução da seção 3.4):** como cada sessão ao vivo já registra quais blocos sofreram Override e em que timestamp, essa tela pode agregar esse histórico por música ao longo do tempo — ex: "Refrão costuma repetir 2x em 80% das execuções desta música", ou "Ponte raramente é tocada". Isso vira insight prático para o líder ajustar a `duration` padrão dos blocos no Editor de Cue (5.2), aproximando o cue sheet automático do que realmente acontece ao vivo.
- Modelo de dados mínimo para essa agregação: reaproveitar o `session_execution_log` (implícito na seção 3.4) com `{ song_id, block_id, session_id, triggered_at, was_override: boolean }`, permitindo consultas de frequência de override por bloco/música sem precisar de uma tabela nova dedicada a estatísticas.

---

## 6. Arquitetura de Navegação e Interface

Referências diretas de design: o padrão de dashboard consolidado por ferramentas como **Linear, Notion, Vercel Dashboard e Cal.com** — sidebar fixa + topbar contextual + área de conteúdo com header de página. Esse padrão encaixa bem no Floworship Web porque a maioria das telas (Escalas, Biblioteca, Editor de Cue) são "workspaces" que o líder revisita com frequência, e a sidebar dá orientação constante sem custo extra de navegação.

### 6.1 Web (Admin) — Sidebar + Topbar

**Estrutura de layout:**
```
┌──────────┬──────────────────────────────────────────┐
│          │  Topbar: título da página · busca · avatar│
│ Sidebar  ├──────────────────────────────────────────┤
│ 240px    │                                            │
│  fixa    │  Conteúdo da página                       │
│          │  (max-width 1200px, padding 32px)         │
│          │                                            │
└──────────┴──────────────────────────────────────────┘
```

**Sidebar — grupos de navegação:**
- Logo/nome do ministério no topo (clicável → seletor de ministério, se o usuário pertencer a mais de um — ver 7.3)
- **Visão Geral** — Dashboard
- **Repertório** — Biblioteca de Músicas, Editor de Cue
- **Escalas** — Calendário de Escalas, Equipe/Membros
- **Ao Vivo** — Histórico de Sessões, Estatísticas/Overrides (seção 5.5)
- **Comunicação** — Avisos, Devocional
- *separador*
- **Configurações** — Ministério, Papéis e Permissões, Integrações
- Rodapé: avatar + nome do usuário, com menu (Perfil, Trocar Ministério, Sair)

Estado ativo do item de menu: fundo `bg-card-elevated` + barra vertical de 3px em `accent-primary` — reaproveita o mesmo token de destaque já definido no design system (seção 1), sem inventar um estilo de seleção só pra Web. Sidebar colapsável para ícone-only (64px) em telas menores, com tooltip do nome ao passar o mouse — comportamento padrão em Notion/Linear.

**Topbar:**
- Título da página atual (muda conforme a rota)
- Busca global com atalho `Cmd/Ctrl+K` — busca músicas, membros e escalas num campo único, resultados agrupados por tipo (padrão consolidado por Linear/Notion/Raycast)
- Notificações (avisos/pendências) + avatar com dropdown

**Padrão de página (Biblioteca, Escalas, Membros etc.):**
- Header: título grande + descrição curta + botão de ação primária no canto superior direito (ex: "+ Nova Música"), em `accent-primary`
- Barra de filtros/busca local abaixo do header, quando aplicável
- Conteúdo: tabela (Biblioteca, Membros), calendário (Escalas) ou grid de cards (Dashboard)
- **Detalhe de item abre como página própria com abas** (ex: Detalhe da Música → Info / Editor de Cue / Histórico), nunca como modal — telas de trabalho prolongado como o Editor de Cue não devem ficar presas num modal.

### 6.2 Mobile (PWA) — Navegação e Arquitetura de Informação

O mobile tem dois modos de uso bem distintos, que pedem estruturas de navegação diferentes: **uso cotidiano** (bottom nav padrão) e **execução ao vivo** (tela cheia dedicada, sem chrome de navegação).

**Uso cotidiano — bottom nav (pill flutuante, 4 itens):**
```
[ Início ]   [ Repertório ]   [ Escala ]   [ Perfil ]
```
- **Início** — próximo evento, status de confirmação, avisos recentes, atalho pro Devocional
- **Repertório** — biblioteca em modo leitura, entrada pro Modo Estudo (afinador/metrônomo, seção 4.5)
- **Escala** — calendário de escalas do usuário, confirmação de presença, chat da escala
- **Perfil** — dados pessoais, instrumentos, dispositivos conectados (ver 7.2), logout

Reaproveita o componente de bottom nav em pill flutuante já identificado no design system (seção 1.3); ícone ativo destacado em `accent-primary`.

**Entrada em sessão ao vivo — takeover de tela cheia:**

Quando uma sessão (culto) está "ao vivo", a tela Início exibe um card fixo destacado no topo — *"Você está na escala de hoje · Culto às 19h · Entrar na sessão"*. Ao tocar, o app faz um **takeover completo de tela**: o bottom nav desaparece e o usuário entra direto no Modo Letra/Cifra/Operador, conforme seu papel na escala daquele evento.

Essa é uma decisão de UX deliberada, não só técnica: durante a execução ao vivo, navegação acidental (voltar pro Início sem querer, no meio do culto) é um risco real. Um botão discreto de "sair da sessão" (canto superior, com confirmação) é o único caminho de volta — não existe bottom nav dentro do Modo Operador/Letra/Cifra.

**Hierarquia de entrada no Modo Estudo:** Repertório → Detalhe da Música → Estudar (abre afinador/metrônomo/letra em leitura livre, sem máquina de estados, sem sincronia com outros dispositivos).

### 6.3 Componentes compartilhados entre Web e Mobile

Como o codebase é único (PWA + Web no mesmo React/TypeScript, seção 2.2), os componentes de conteúdo (cards, pills, dial circular) devem viver numa **camada de design system compartilhada** (ex: `components/shared` ou um pacote num monorepo), consumida tanto pelas rotas Web quanto Mobile — evita duplicar botão/card em dois lugares. As diferenças de navegação (sidebar vs. bottom nav) ficam isoladas nos componentes de **shell/layout** de cada plataforma, não nos componentes de conteúdo.

---

## 7. Autenticação e Segurança

### 7.1 Fluxo de Login

- **Login primário: e-mail + senha**, com opção **"Entrar com Google"** (OAuth) — reduz fricção pra músicos que usam o app esporadicamente, e é o padrão mais familiar pra esse público (igrejas costumam já operar em Google Workspace/Gmail).
- Tela de login compartilhada entre Web e Mobile (mesmo componente, muda só o shell): e-mail, senha, "Esqueci minha senha", "Entrar com Google", link para aceitar convite.
- **Convite, não cadastro aberto:** como o Floworship é organizado por ministério, a entrada normal de um músico não é "criar conta livre" — é receber um **convite** (e-mail/link) do líder, que já vincula o usuário ao ministério certo com o papel certo (ver 7.3). Cadastro aberto existe só pro primeiro líder, ao criar o ministério.

### 7.2 Modelo de Sessão e Tokens

- **JWT de curta duração (access token, ~15 min) + refresh token de longa duração (httpOnly cookie, ~30 dias)** — padrão consolidado pra APIs Fastify/Prisma, sem manter sessão em memória no servidor, funcionando igual em Web e PWA.
- Refresh token como **cookie httpOnly, Secure, SameSite=Strict** — nunca em `localStorage`/IndexedDB, reduzindo a superfície de ataque de XSS (risco real num PWA, que roda inteiramente em contexto de browser).
- Access token mantido em memória (não persistido), renovado silenciosamente via `/auth/refresh` antes de expirar.
- **Sessões múltiplas por usuário são esperadas** — o mesmo músico pode estar logado no celular e ocasionalmente na Web; login em um novo dispositivo não deve invalidar os demais.
- Tela de "Dispositivos conectados" (em Perfil) listando sessões ativas, com opção de revogar remotamente — relevante porque celulares e tablets circulam entre pessoas com frequência maior que o normal (ensaios, empréstimo de tablet no altar).

### 7.3 Papéis e Permissões (RBAC)

Modelo simples de papéis por ministério — não permissão granular por funcionalidade (over-engineering pro estágio atual do produto):

| Papel | Pode |
|---|---|
| **Admin/Líder** | Tudo — escalas, biblioteca, membros, convites, configurações do ministério |
| **Operador** | Conduzir o Modo Operador ao vivo; ver/estudar repertório; sem Editor de Cue nem gestão de membros |
| **Músico** | Ver escala, confirmar presença, Modo Estudo, participar da sessão ao vivo (Letra/Cifra); sem acesso administrativo |

Um usuário pode ter papéis diferentes em ministérios diferentes (ex: líder na própria igreja, músico convidado em outra) — por isso o papel fica associado em `ministry_member`, não direto no usuário.

```
user { id, email, password_hash, name, google_id? }
ministry { id, name, ... }
ministry_member { user_id, ministry_id, role: "admin" | "operator" | "musician" }
```

O seletor de ministério (seção 6.1) só aparece na UI se o usuário tiver mais de um vínculo em `ministry_member`.

### 7.4 Segurança — pontos obrigatórios

- **Hash de senha:** `bcrypt` ou `argon2id` — nunca texto plano nem hash reversível.
- **Rate limiting no login** (ex: `@fastify/rate-limit`, 5 tentativas/15min por IP+e-mail) — mitiga força bruta; relevante porque convites geram e-mails previsíveis dentro de um ministério pequeno.
- **HTTPS obrigatório em todo o domínio** — não só por segurança geral: `getUserMedia` (microfone, seção 4.5) e Service Workers **exigem contexto seguro (HTTPS)** pra funcionar; sem isso o PWA nem instala corretamente.
- **Reset de senha via token de uso único, expiração curta** (ex: 30min) por e-mail — nunca reenviar a senha atual nem gerar senha automática por e-mail.
- **CORS restrito** ao domínio do próprio app, já que a API Fastify fica exposta publicamente.
- **Sessão ao vivo (seção 8.2) sem dado trafegando sem autenticação** — a conexão WebSocket valida o token no handshake e confirma que o usuário pertence ao ministério/sessão antes de entrar na room, evitando que alguém de fora escute ou injete eventos numa sessão ao vivo.

---

## 8. Persistência, Sincronia em Tempo Real e Formato de Cifras

> **Premissa de arquitetura (v4):** o mobile roda como **PWA** (Progressive Web App), não Capacitor. Isso simplifica a camada de persistência local (sem plugin nativo de SQLite) mas exige atenção a limitações de browser (especialmente Safari/iOS) em background, wake lock e push notifications.

### 7.1 Banco de Dados

**Backend (fonte da verdade) — PostgreSQL via Neon + Prisma**

Mantém o padrão já usado em Proposta Certa e NF Inteligente: Neon (Postgres serverless) + Prisma como ORM, rodando atrás de uma API Fastify. Guarda `songs`, `song_cue_sheet.blocks`, `escalas`, `membros`, `session_execution_log` etc. — tudo que precisa ser consistente entre múltiplos usuários/dispositivos e sobreviver entre sessões.

**Local (client-side, PWA) — IndexedDB via Dexie.js**

Sem Capacitor não existe acesso a SQLite nativo — e não é necessário. Para PWA, o padrão correto é **IndexedDB**, e a biblioteca recomendada é **[Dexie.js](https://dexie.org/)**: wrapper maduro sobre IndexedDB, TypeScript-first, API baseada em Promises (parecida com Prisma no "feel"), suporta queries, índices e migrações de schema — evita lidar com a API crua do IndexedDB, que é verbosa e cheia de armadilhas de callback.

Uso local:
- Cache offline da biblioteca de músicas, cifras e escalas já confirmadas (para Modo Estudo funcionar sem internet)
- Fila de ações pendentes (ex: confirmação de presença) quando offline, sincronizadas ao reconectar
- **Não** usado para o estado da sessão ao vivo (Modo Operador) — isso é inerentemente online (ver 8.2)

Não recomendo tentar persistir o estado da sessão ao vivo localmente como fonte de verdade — o "estado atual do bloco" deve sempre vir do servidor em tempo real; o IndexedDB local é só para dados de consulta/offline, não para o fluxo síncrono entre dispositivos.

### 7.2 Sincronia em Tempo Real (Live Mode — 4 a 6 dispositivos)

**Padrão de arquitetura:** WebSocket com um "room" por sessão de execução (`session_id`), no modelo **push por evento**, não broadcast do estado inteiro a cada mudança:

```
Operador dispara ação → servidor recebe → servidor emite evento leve
  { event: "block_changed", block_id, session_id, triggered_at, was_override }
→ todos os dispositivos na room da sessão recebem o evento
→ cada dispositivo aplica a transição na sua própria máquina de estados local (seção 3.3)
```

Isso é mais rápido e mais barato que reenviar o `song_cue_sheet` inteiro a cada troca de bloco — cada cliente já tem o cue sheet carregado (via REST, ao entrar na sessão) e só precisa saber *qual* bloco mudou.

**Tecnologia sugerida:**
- **Auto-hospedado:** Fastify + [`ws`](https://github.com/websockets/ws) ou Socket.io, rodando como serviço dedicado — **não** como função serverless do Vercel, já que WebSocket exige conexão persistente e funções serverless (Vercel) matam a conexão após timeout curto. Precisaria de um host separado com processo long-running (Fly.io, Railway ou Render são as opções mais simples de manter perto do resto do stack).
- **Alternativa gerenciada (menos infra pra manter):** [Supabase Realtime](https://supabase.com/realtime) (channels/broadcast) ou [Ably](https://ably.com/) — resolvem a parte de pub/sub, reconexão automática e escala, sem precisar operar um servidor WebSocket próprio. Dado que você já lida com múltiplos produtos simultâneos, isso reduz a superfície de manutenção.

**Reconexão (crítico em PWA):** ao reconectar (ex: dispositivo saiu de background, perdeu WiFi um instante), o cliente deve buscar um **snapshot** do estado atual da sessão via REST (`GET /sessions/:id/state`) antes de voltar a escutar eventos — evita ficar "travado" no último bloco recebido antes da queda.

**Ponto de atenção específico de PWA em iOS (confirmado, 2026):**

- **Instalação na Home Screen é obrigatória**, não opcional. PWA aberto numa aba do Safari perde acesso a Push, Badging e tem comportamento de Wake Lock inconsistente — o app precisa orientar o usuário a "Adicionar à Tela de Início" no primeiro uso, e idealmente detectar se está rodando em modo standalone antes de liberar o fluxo de Modo Operador.
- **Screen Wake Lock** (`navigator.wakeLock.request('screen')`) funciona a partir do iOS 16.4, mas só de forma confiável em app **instalado** a partir do **iOS 18.4** (havia um bug da própria Apple antes disso). Como a base de iPhones em iOS 16+ já passa de 95%, mas nem todos estão em 18.4+, vale ter um fallback visual (ex: aviso "mantenha o app aberto") para dispositivos mais antigos.
- **Sem background sync real.** Se o app for para segundo plano (troca de app, tela bloqueia), o WebSocket cai — não existe "background wake" via push no iOS. Ao voltar ao primeiro plano, o cliente deve reconectar e buscar o snapshot do estado (`GET /sessions/:id/state`, já descrito acima) antes de voltar a escutar eventos. Trate isso como fluxo normal, não como exceção rara.
- **Push notifications** (para avisos/chat, não para o Modo Operador) funcionam desde iOS 16.4, mas exigem app instalado e não suportam "silent push" (não dá pra atualizar dados em background só com push, como se faz em app nativo) — usar push apenas para notificar, sempre buscando o dado real ao abrir o app.
- **IndexedDB/storage** melhorou bastante: Safari 17+ ampliou as cotas de armazenamento por origem, então cache offline da biblioteca/cifras (seção 8.1) não deve esbarrar em limite de espaço no uso normal.

### 7.3 Gerenciamento de Cifras (texto musical estruturado)

**Formato: ChordPro**

Em vez de inventar uma estrutura própria para "letra + acordes posicionados", usar o formato **ChordPro** — padrão de mercado para texto de cifra, onde o acorde fica embutido entre colchetes na posição exata da sílaba:

```
[C]Amazing [F]grace, how [G]sweet the [C]sound
```

Isso resolve exatamente o problema que você descreveu — a estrutura (posição do acorde relativa à letra) fica preservada no próprio texto, sem precisar de um modelo de dados separado tipo `{ chord, position_offset }`. É também um formato text-first, no mesmo espírito do `.apostila.md` que você já usa no Koiné.

**Biblioteca: [chordsheetjs](https://github.com/martijnversluis/ChordSheetJS)**

- Parseia ChordPro e exporta em vários formatos (HTML, texto plano, PDF-ready)
- Faz **transposição de tom** automaticamente (`song.transpose(n)`) — essencial pro indicador de tom sempre visível no Modo Cifra (seção 4.3), já que o tom pode mudar por evento/vocalista
- Licença **MIT** — sem a preocupação de compatibilidade de licenciamento que já existe com `@chordbook/tuner` (GPLv3, seção 4.5)
- Ativamente mantida, TypeScript-friendly, sem dependência de DOM (roda igual em Web e no client PWA)

**Modelo de dados ajustado (`song_cue_sheet.blocks`):**

```
blocks: [
  {
    id
    label
    start_time
    end_time
    duration
    chordpro_content        // texto em formato ChordPro: letra + acordes embutidos
    order
  }
]

song {
  ...
  default_key              // tom original, ex: "C"
}
```

O Modo Letra renderiza `chordpro_content` com cifra oculta (`song.chordsSheet` sem exibir a linha de acorde); o Modo Cifra renderiza com cifra visível e aplica `transpose()` se o tom do evento for diferente do `default_key`.

---

## 9. Motor de Geração Automática de Escalas

Esse é o motor central do produto do ponto de vista de negócio — automatiza o trabalho mais repetitivo e sensível do líder: montar a escala mensal dos 4 (ou 5) domingos, respeitando disponibilidade e distribuindo a carga de forma justa entre o quadro de músicos.

### 9.1 Visão geral do fluxo

**Papéis/funções** (tags cadastradas em cada músico, não hardcoded — extensível pelo líder): `ministro_de_louvor`, `apoio_de_voz`, `guitarra`, `baixo`, `bateria`, `violao`, `teclado`, etc. Uma pessoa pode ter mais de uma função (ex: toca guitarra e baixo).

**Formação padrão por culto** (configurável por ministério, default conforme descrito): 1 Ministro de Louvor (conduz) + 1 Apoio de Voz + 1 Guitarrista + 1 Baixista + 1 Baterista. Violão como vaga opcional, ativável nas configurações do ministério (ver 9.7).

O ciclo se repete mensalmente para todos os domingos do mês-alvo — o sistema calcula automaticamente quantos domingos existem (4 ou 5) e gera uma `service_schedule` por domingo.

**Fluxo em alto nível:**
```
Disparo mensal
  → Coleta de disponibilidade (pergunta por domingo, não "livre ou não geral")
  → Geração automática do rascunho (respeitando disponibilidade + rotação justa)
  → Aprovação/ajuste manual do líder
  → Publicação (notifica cada músico da sua vaga)
  → [pós-publicação] Indisponibilidade de última hora → busca automática de substituto
```

### 9.2 Modelo de Dados

```
musician {
  id
  ministry_member_id          // vínculo de acesso (seção 7.3); nem todo músico
                               //   precisa logar no app pra estar no quadro
  worship_roles: string[]     // ex: ["guitarra", "baixo"]
  is_active                   // pausar temporariamente sem remover cadastro
  last_served_at: { [role]: date }     // pra fairness rotation, por função
  times_served_this_month: number
}

monthly_schedule_cycle {
  id
  ministry_id
  month, year
  status: "coletando_disponibilidade" | "gerando" | "aguardando_aprovacao" | "publicada"
  availability_deadline
}

availability_response {
  cycle_id
  musician_id
  sunday_date
  available: boolean
  responded_at
}

service_schedule {              // uma linha por domingo
  id
  cycle_id
  service_date
  status: "rascunho" | "aprovada" | "publicada" | "com_pendencia"
}

service_assignment {            // uma linha por vaga dentro de um domingo
  id
  service_schedule_id
  role                          // "ministro_de_louvor" | "apoio_de_voz" | "guitarra" | "baixo" | "bateria" | "violao"
  musician_id | null            // null = vaga em aberto
  status: "confirmado" | "convidado" | "recusado" | "vago"
  substitution_of: musician_id? // preenchido se essa vaga é resultado de uma substituição
}
```

### 9.3 Fluxo Passo a Passo

1. **Disparo mensal** (ex: dia 20 do mês anterior, configurável) — sistema cria o `monthly_schedule_cycle`, calcula os domingos do mês-alvo e dispara a pergunta de disponibilidade **via Telegram/push nativo** (ver 9.8) para todo o quadro ativo:
   > "Você está disponível para servir nestes domingos de [mês]?" — com toggle sim/não **por data**, não uma pergunta genérica de "disponível esse mês" (é isso que permite ausências pontuais dentro do mesmo mês).
2. **Janela de resposta** (ex: 5 dias) — lembretes automáticos para quem não respondeu (D-3, D-1 do prazo).
3. **Fechamento da coleta** — ao fim do prazo (ou quando todos já responderam, o que vier primeiro), o ciclo passa para `"gerando"` e o algoritmo roda (ver 9.4).
4. **Geração do rascunho** — o motor monta as `service_schedule` de cada domingo, com as `service_assignment` preenchidas conforme disponibilidade e rotação justa.
5. **Aprovação do líder** — ciclo passa para `"aguardando_aprovacao"`; o líder revisa o rascunho completo na Web (ver 9.5) e pode trocar qualquer vaga manualmente antes de publicar.
6. **Publicação** — ao aprovar, cada `service_schedule` vira `"publicada"` e cada músico escalado recebe a confirmação da sua vaga **via Telegram/push nativo**.
7. **Indisponibilidade pós-publicação** — músico reporta imprevisto para um domingo já publicado → dispara a busca automática de substituto (ver 9.6).

### 9.4 Algoritmo de Geração

Abordagem: **atribuição gulosa com pontuação de rotação (greedy + fairness score)** — não um solver de otimização (CSP/ILP). O volume é pequeno (dezenas de pessoas, 5-6 vagas × 4-5 domingos por mês), então um solver complexo seria over-engineering; um algoritmo guloso bem definido resolve o problema real, que é justiça de rotação, não otimização matemática.

Para cada domingo (em ordem cronológica, do primeiro ao último do mês) e para cada vaga:

1. **Filtra candidatos:** pessoas com aquele `worship_role`, disponíveis naquela data (`availability_response.available = true`), e ainda não escaladas em outra vaga do mesmo domingo.
2. **Ordena por fairness score:** menor `times_served_this_month` primeiro; em empate, `last_served_at[role]` mais antigo primeiro (quem serviu naquela função há mais tempo tem prioridade).
3. **Atribui o primeiro da lista**, atualizando os contadores em memória durante a geração de todo o ciclo — assim o fairness score do segundo domingo já reflete quem serviu no primeiro, e assim por diante.
4. **Sem candidato disponível:** `service_assignment.status = "vago"`, sinalizado no rascunho para o líder — não trava a geração dos outros domingos/vagas.

Processar os domingos em ordem cronológica (não em paralelo) é o que garante que a rotação seja justa *dentro do mesmo mês*, e não só entre meses.

### 9.5 Painel do Administrador — Controle e Aprovação

Nova tela na Web, dentro do grupo **Escalas** da sidebar (seção 6.1): **Escalas do Mês**.

- Status do ciclo no topo (Coletando disponibilidade → Gerando → Aguardando aprovação → Publicada), com indicador de progresso
- Lista dos domingos do mês, cada um como card expansível mostrando as vagas e quem foi escalado
- Vaga em aberto (`"vago"`) destacada em `danger` — chama atenção imediata do líder
- **Troca manual:** clicar numa vaga preenchida abre um seletor com os candidatos disponíveis para aquele domingo/role, ordenados pelo mesmo fairness score do algoritmo — o líder pode sobrescrever a escolha a qualquer momento, antes ou depois da publicação
- Botão **"Aprovar e Publicar"** — habilitado só quando todas as vagas estão preenchidas, ou mediante confirmação explícita do líder de que aceita publicar com vaga(s) em aberto
- Histórico de substituições por domingo (quem trocou com quem, e quando)

### 9.6 Substituição Automática (pós-publicação)

Quando um músico já escalado reporta indisponibilidade para um domingo já publicado:

```
Músico marca "não vou poder" no domingo X, vaga Y
  → service_assignment.status = "recusado"
  → sistema busca substitutos (mesma filtragem + fairness score da 9.4),
    excluindo quem já está escalado em outra vaga daquele domingo
  → convite sequencial: notifica o candidato #1 da lista,
    janela de resposta curta (ex: 4h) antes de tentar o próximo
  → aceitou → service_assignment.musician_id atualizado,
    status = "confirmado", substitution_of = músico original
  → recusou ou não respondeu na janela → tenta o próximo candidato
  → lista esgotada sem ninguém disponível → status = "vago",
    notificação de urgência para o líder: "Domingo X ficará sem [role] confirmado"
```

O convite **sequencial** (um candidato por vez, não broadcast simultâneo) evita o problema clássico de duas pessoas aceitarem a mesma vaga ao mesmo tempo — só precisa de um lock otimista simples no `service_assignment`, já que a natureza do fluxo já é sequencial.

**Canal de notificação: Telegram + push nativo.** O fluxo de disponibilidade/confirmação/substituição roda pelo Telegram (com push nativo como segundo canal em paralelo) — ver arquitetura completa em 9.8. Isso elimina a desculpa de "não vi o app" sem depender de uma API não-oficial ou de um processo de aprovação que hoje não é viável.

### 9.7 Regras de Negócio Configuráveis (por ministério)

- Formação padrão por culto (quais funções são obrigatórias, quais são opcionais)
- Prazo de resposta da disponibilidade mensal (dias)
- Janela de resposta na substituição de última hora (horas)
- Dia do mês em que o ciclo mensal dispara automaticamente

### 9.8 Canal de Notificação — Telegram + Notificações Nativas (revisado)

> **Decisão revisada:** WhatsApp fica de fora por enquanto. Na prática, dois problemas reais bateram de frente com o que documentamos na v7: soluções não-oficiais (o tipo que o código já usa como padrão, ver auditoria do código) trazem risco de banimento, e a API oficial da Meta não é viável agora (verificação de negócio, custo, burocracia de aprovação de template). Pra essa fase de testes, o canal primário passa a ser o **Telegram Bot API** (oficial, gratuito, sem aprovação prévia), complementado por **notificações nativas via PWA** (seção 8.2) — os dois rodando em paralelo, não um substituindo o outro.

**Por que Telegram resolve o impasse:** é uma API de bot oficial da própria Telegram, gratuita, sem processo de verificação de negócio e **sem janela de 24h nem template pré-aprovado** — depois que o músico dá `/start` no bot uma vez, o backend pode mandar mensagem de texto livre a qualquer momento, formatada, com botões. Isso elimina de uma vez as duas maiores fontes de atrito que tínhamos documentado pro WhatsApp (aprovação de template e janela de sessão).

**Vínculo (opt-in):** como não existe verificação por número de telefone, o vínculo é feito por **deep link com token único**: no fluxo de aceite de convite (seção 7.1), a tela mostra um botão "Vincular Telegram" (`https://t.me/FloworshipBot?start=<linking_token>`). Ao tocar, o músico abre o Telegram, aperta *Start*, e o bot recebe o token no comando `/start` — o backend associa o `telegram_chat_id` retornado ao `musician_id` correspondente. Diferente do opt-in do WhatsApp, isso **não trava** o cadastro do músico se ele não vincular — só significa que ele depende do push nativo (ou de aviso manual do líder) até vincular.

**Botões interativos:** Telegram usa `inline_keyboard` (equivalente ao *Reply Buttons* do WhatsApp) — cada botão carrega um `callback_data` (ex: `disponivel:{{sunday_date}}`), e a resposta chega via webhook como `callback_query`, do mesmo jeito estrutural que já documentamos pro fluxo de disponibilidade/substituição (9.3, 9.6).

**Arquitetura do fluxo:**
```
Backend dispara mensagem via Telegram Bot API (sendMessage + inline_keyboard)
  → músico responde tocando no botão
  → Telegram envia callback_query pro webhook do backend
  → backend confirma o toque (answerCallbackQuery) e atualiza
    availability_response / service_assignment
  → segue o fluxo normal já definido (9.3, 9.6) — só muda o adapter de canal
```

**Modelo de dados atualizado:**
```
musician {
  ...
  telegram_chat_id: string?      // preenchido após vincular via /start
  telegram_username: string?     // opcional, só pra exibição no painel
  // whatsapp_phone / whatsapp_opt_in ficam sem uso por enquanto — não
  // precisa remover do schema, só parar de gravar/ler (ver nota abaixo)
}

notification_log {               // substitui whatsapp_message_log — canal-agnóstico
  id
  musician_id
  channel: "telegram" | "push"   // extensível pra "whatsapp" no futuro
  template_name
  context: { cycle_id?, service_schedule_id?, service_assignment_id? }
  sent_at
  status: "enviado" | "entregue" | "lido" | "respondido" | "falhou"
  response_payload?
}
```

**Notificações nativas (push via PWA) como segundo canal, não backup secundário:** nessa fase de testes, os dois canais coexistem de propósito — Telegram pra quem vinculou o bot, push nativo (seção 8.2) pra quem tem o app instalado com notificação habilitada. Isso reduz o risco de depender de um canal só enquanto a equipe se acostuma com o Telegram. Se um músico não tem nenhum dos dois configurado, isso aparece destacado no painel do líder (seção 9.5) como pendência de contato — nesse caso, a confirmação vira manual (WhatsApp pessoal do líder, por exemplo), fora do motor.

**Reaproveitando a abstração que já existe no código:** o backend já tem um padrão de *provider* isolado (`services/whatsapp/provider.ts`, com implementações trocáveis) — vale generalizar essa interface pra um `NotificationProvider` canal-agnóstico (`send`, `onReply`, `status`) em vez de reescrever do zero. Isso também deixa a porta aberta pra reativar WhatsApp oficial mais adiante como canal adicional, sem mexer no motor de escalas em si — só adiciona mais um adapter.

**Templates necessários (sem processo de aprovação — só precisam existir no código):**
1. `disponibilidade_mensal` — pergunta de disponibilidade por domingo, um botão por domingo
2. `escala_confirmada` — aviso de escala publicada, com botão "Ver escala completa" (abre o app)
3. `substituicao_urgente` — convite de substituição de última hora, botões "Aceito" / "Não posso"
4. `lembrete_disponibilidade` — lembrete pra quem não respondeu (D-3/D-1 do prazo)

**Papel do app com Telegram + push como canais primários:** o app (PWA) continua sendo o lugar de **consulta e execução** — escala detalhada, Modo Estudo, e sobretudo o Modo Operador/Letra/Cifra ao vivo, que segue exclusivo do app. A confirmação/resposta acontece no Telegram (ou, na ausência dele, via push nativo com deep link pro app).

---

## 10. Catálogo de Músicas e Repertório do Culto

Duas coisas distintas que precisam ficar claras no modelo: o **catálogo oficial** (todas as músicas cadastradas, com cifra e cue sheet prontos — seções 3.2 e 8.3) e o **repertório do culto** (o subconjunto de músicas escolhidas, em ordem, para um domingo específico). A escala (seção 9) define **quem** toca; o repertório define **o quê** se toca — são fluxos separados, mas o segundo só se abre depois do primeiro.

### 10.1 Catálogo Oficial — o que muda no cadastro de música

O cadastro de música (Biblioteca, seção 5.4) ganha um **status de preparo**, pra separar músicas prontas pra uso de músicas ainda em preparação:

```
song {
  ...                          // campos já existentes (3.2, 8.3): default_key,
                                //   song_cue_sheet.blocks, chordpro_content
  status: "rascunho" | "pronta" | "arquivada"
  tags: string[]                // ex: ["adoração", "louvor", "ceia", "natal", "batismo"]
  tempo_bpm                     // já existente (4.5), reaproveitado aqui pra filtro
}
```

- **`rascunho`** — música sendo cadastrada (cue sheet incompleto, cifra pendente); **não aparece** na seleção de repertório do líder, só na Biblioteca administrativa.
- **`pronta`** — cue sheet e cifra completos, liberada pra entrar em qualquer repertório.
- **`arquivada`** — música que saiu de uso ativo, mas mantém histórico (estatísticas, seção 5.5) sem poluir a busca do dia a dia.

Isso resolve exatamente o "que pode compor" que você descreveu: o filtro de status é o que garante que o líder só veja, na hora de montar o repertório, músicas de fato prontas pra execução ao vivo — cifra estruturada e blocos cronometrados, sem isso o Modo Operador não teria o que exibir.

### 10.2 Modelo de Dados — Repertório do Culto

```
service_repertoire_item {
  id
  service_schedule_id          // vínculo com o domingo específico (seção 9.2)
  song_id
  order                        // posição na sequência do culto
  key_override                 // tom específico pra esse culto, se diferente do default_key da música
  notes                        // observação do líder só pra essa execução (ex: "repetir refrão 2x hoje")
}
```

Reaproveita a mesma `service_schedule` já usada pra escala (seção 9.2) — cada domingo carrega tanto quem vai tocar (`service_assignment`) quanto o que vai ser tocado (`service_repertoire_item`), sem precisar de uma nova entidade de "evento".

### 10.3 Fluxo — Definição do Repertório

```
Escala do domingo aprovada/publicada (seção 9.3, passo 5-6)
  → Ministro de Louvor escalado naquele domingo ganha acesso
    a montar o repertório daquele service_schedule específico
  → busca na Biblioteca (só músicas com status "pronta"), filtra por tag/tom/tempo
  → adiciona músicas, define ordem, ajusta tom se necessário (key_override)
  → adiciona notas de execução, se houver
  → publica o repertório
  → banda escalada naquele domingo recebe o repertório via Telegram/push nativo
    (template novo, ver 10.6) e passa a poder estudar via Modo Estudo (seção 4.5)
```

A dependência é deliberada: **repertório só se define depois da escala**, porque faz pouco sentido montar setlist antes de saber quem vai tocar — em ministérios pequenos, a formação disponível pode influenciar a escolha de músicas (ex: sem tecladista naquele domingo, evitar música que depende de teclado).

### 10.4 Permissões — quem pode editar o quê

Estende o RBAC da seção 7.3 com uma regra de **escopo por atribuição**, não só por papel global:

- **Admin/Líder** (papel global) pode editar o repertório de qualquer domingo, a qualquer momento.
- **Quem foi escalado como `ministro_de_louvor`** naquele `service_schedule` específico ganha permissão de editar *só aquele* repertório — não os demais domingos do mês, e não depois que a escala daquele domingo for trocada (se o Ministro de Louvor for substituído via seção 9.6, a permissão de editar o repertório migra automaticamente pro substituto).
- Os demais papéis (`operador`, `musico`) têm acesso de leitura ao repertório, nunca de edição.

### 10.5 Telas

**Web:** dentro do card de cada domingo em "Escalas do Mês" (seção 9.5), uma segunda aba **"Repertório"** — só habilitada quando a escala daquele domingo já está aprovada/publicada. Busca com os mesmos filtros da Biblioteca (5.4) num painel lateral, lista ordenável por drag-and-drop à direita, com o tom e BPM de cada música visíveis inline.

**Mobile:** dentro de "Escala" (bottom nav, seção 6.2), o detalhe de um domingo específico passa a mostrar duas seções — "Equipe escalada" e "Repertório" — antes reservado só pra confirmação de presença. Cada música do repertório linka direto pro Modo Estudo daquela música específica (seção 4.5).

### 10.6 Integração com Telegram / Push Nativo

Novo template (adicionar à lista da seção 9.8): `repertorio_definido` — disparado quando o Ministro de Louvor publica o repertório, enviado só pra quem está escalado naquele domingo:

> "O repertório do culto de {{data}} já está definido: {{lista_de_musicas}}. Toque aqui pra estudar as cifras no app." (botão que abre o link do Modo Estudo daquele repertório)

---

## 11. Próximos Passos Técnicos

- [x] ~~Definir biblioteca de waveform/áudio para o Editor de Cue~~ — **wavesurfer.js** confirmado (ver 5.2)
- [x] ~~Definir stack de Mobile~~ — **PWA** confirmado (v4), codebase único React/TypeScript compartilhado com a Web, sem build nativo (ver 2.2)
- [x] ~~Definir biblioteca de afinador/metrônomo~~ — **pitchy + @chordbook/tuner** (afinador) e padrão de scheduling look-ahead inspirado em **react-metronome** (metrônomo), ver 4.5
- [x] ~~Definir banco de dados~~ — **PostgreSQL/Neon + Prisma** no backend (fonte da verdade) e **IndexedDB via Dexie.js** no client para cache offline (ver 8.1)
- [x] ~~Definir tecnologia de sincronia ao vivo~~ — WebSocket com **push por evento** (não broadcast do estado inteiro), room por `session_id`; avaliar Fastify+ws auto-hospedado vs. Supabase Realtime/Ably gerenciado (ver 8.2)
- [x] ~~Definir formato de cifras~~ — **ChordPro** + biblioteca **chordsheetjs** (MIT), com transposição de tom nativa (ver 8.3)
- [x] ~~Definir estrutura de navegação Web~~ — sidebar fixa + topbar, agrupada por Visão Geral/Repertório/Escalas/Ao Vivo/Configurações (ver 6.1)
- [x] ~~Definir estrutura de navegação Mobile~~ — bottom nav de 4 itens no uso cotidiano + takeover de tela cheia na sessão ao vivo, sem chrome de navegação (ver 6.2)
- [x] ~~Definir modelo de autenticação~~ — e-mail/senha + Google OAuth, fluxo de convite (não cadastro aberto), JWT curto + refresh token httpOnly (ver 7.1, 7.2)
- [x] ~~Definir modelo de papéis~~ — Admin/Operador/Músico por `ministry_member`, suportando múltiplos ministérios por usuário (ver 7.3)
- [ ] Prototipar a Máquina de Estados (Programado/Override) em código antes de desenhar todas as telas, para validar a lógica de "retomada do ponteiro"
- [ ] Wireframes de alta fidelidade do Modo Operador (tela mais crítica do produto)
- [ ] Wireframes da sidebar Web e do fluxo de takeover de sessão ao vivo no Mobile (ver 6.1, 6.2)
- [ ] Implementar fluxo de convite (geração de link/e-mail, expiração, vínculo automático a `ministry_member` no aceite)
- [ ] Configurar OAuth do Google (client ID/secret, tela de consentimento) e testar o fluxo completo em PWA instalado no iOS
- [ ] Implementar o motor de geração de escalas como job assíncrono (cron mensal + reação a eventos de indisponibilidade) — não deve rodar em request síncrono da API (ver 9.3, 9.4)
- [ ] Wireframes do painel "Escalas do Mês" (status do ciclo, cards por domingo, troca manual de vaga) — ver 9.5
- [x] ~~Decidir canal de notificação do motor de escalas~~ — **Telegram Bot API + push nativo em paralelo**, revisado após problemas com API não-oficial e inviabilidade da API oficial da Meta no momento; WhatsApp fica pausado, não removido (ver 9.8)
- [ ] Criar bot no Telegram via BotFather, obter token e configurar webhook
- [ ] Implementar fluxo de vínculo por deep link (`/start` com token único) e endpoint que associa `telegram_chat_id` ao `musician_id`
- [ ] Redigir os 4 templates (`disponibilidade_mensal`, `escala_confirmada`, `substituicao_urgente`, `lembrete_disponibilidade`) — sem processo de aprovação externo, só precisam existir no código
- [ ] Implementar endpoint de webhook para receber `callback_query` do Telegram e responder com `answerCallbackQuery`
- [ ] Generalizar a interface `services/whatsapp/provider.ts` já existente no código pra um `NotificationProvider` canal-agnóstico, com o Telegram como primeira implementação real (ver nota em 9.8)
- [ ] Adicionar botão "Vincular Telegram" ao fluxo de aceite de convite (seção 7.1), sem bloquear o cadastro se o músico não vincular
- [x] ~~Definir separação entre catálogo oficial e repertório do culto~~ — campo `status` na música (rascunho/pronta/arquivada) + `service_repertoire_item` vinculado ao domingo (ver 10.1, 10.2)
- [ ] Implementar a regra de permissão por escopo (Ministro de Louvor escalado edita só o repertório do seu domingo) — extensão do RBAC da seção 7.3, não é papel global (ver 10.4)
- [ ] Migração automática de permissão de repertório quando o Ministro de Louvor é substituído (seção 9.6) — testar esse caminho específico
- [ ] Redigir o template `repertorio_definido` junto com os demais da seção 9.8
- [ ] Wireframe da aba "Repertório" dentro do card do domingo (Web) e da tela de detalhe do domingo (Mobile) — ver 10.5
- [ ] Definir regra de desempate final quando dois candidatos têm fairness score idêntico (ex: aleatório determinístico por seed do ciclo, evitando viés por ordem de cadastro) — ver 9.4
- [ ] Implementar detecção de modo standalone (PWA instalado vs. aba do Safari) e fluxo de onboarding "Adicionar à Tela de Início" — obrigatório em iOS para Wake Lock/Push funcionarem (ver 8.2)
- [ ] Implementar reconexão de WebSocket com snapshot de estado (`GET /sessions/:id/state`) como fluxo normal, não exceção — crítico em iOS por causa da queda de conexão em background (ver 8.2)
- [ ] Testar Screen Wake Lock em iOS 16.4–18.3 (comportamento inconsistente conhecido) vs. 18.4+ (corrigido) e definir fallback visual para versões mais antigas
- [ ] Definir política de licenciamento: `@chordbook/tuner` é GPLv3.0 — avaliar compatibilidade com o modelo de distribuição do Floworship (uso interno vs. distribuição em loja de apps) antes de embutir diretamente no bundle
