# Floworship — Especificação de Requisitos (spec.md)

**Origem:** `floworship-design-e-modo-performance-v8.md`
**Escopo:** Large/Complex (multi-componente, novo domínio, decisões arquiteturais já tomadas)
**Convenção:** cada requisito tem ID rastreável `REQ-<BLOCO>-NN`, critério de aceite testável e referência à seção do documento-fonte. Este spec.md é a fonte de verdade para o Agente de Revisão (ver `reviewer-agent.md`) — nenhum requisito aqui deve ser inferido pela implementação; a implementação é que deve provar cada ID.

---

## 0. Visão Geral e Blocos de Implementação

O projeto foi dividido em **11 blocos**, na ordem de dependência recomendada para execução. Cada bloco é uma unidade de entrega: só é considerado concluído quando o Agente de Revisão (auditor externo) emitir **PASS** para todos os requisitos do bloco. Nenhum bloco subsequente inicia com o anterior em `PENDENTE` ou `REPROVADO`.

| # | Bloco | Código | Depende de |
|---|---|---|---|
| B0 | Design System & Componentes Compartilhados | `DS` | — |
| B1 | Autenticação, Sessão e RBAC | `AUTH` | B0 |
| B2 | Persistência (Backend + Client Offline) | `DATA` | — (paralelo a B0/B1) |
| B3 | Biblioteca de Músicas & Editor de Cue (Web) | `LIB` | B1, B2 |
| B4 | Motor de Execução ao Vivo — Máquina de Estados & Sincronia | `PERF-CORE` | B2, B3 |
| B5 | Telas do Modo Performance (Mobile) | `PERF-UI` | B0, B4 |
| B6 | Modo Estudo — Afinador & Metrônomo | `STUDY` | B0 |
| B7 | Navegação Web & Mobile (Shell) | `NAV` | B0, B1 |
| B8 | Catálogo Oficial & Repertório do Culto | `REP` | B3 |
| B9 | Motor de Geração de Escalas | `SCHED` | B1, B2 |
| B10 | Integração WhatsApp (Meta Cloud API) | `WA` | B9 |

Stack confirmada (não rediscutir — ver seção 11 do documento-fonte): React/TypeScript único (Web + PWA), Fastify, PostgreSQL/Neon + Prisma, Dexie.js (IndexedDB), WebSocket (`ws`/Socket.io ou Supabase Realtime/Ably), wavesurfer.js, ChordPro + chordsheetjs (MIT), pitchy + @chordbook/tuner (GPLv3 — ver REQ-STUDY-08), Meta Cloud API oficial (não simuladores).

---

## B0 — Design System & Componentes Compartilhados (`DS`)
*Fonte: seção 1, 6.3*

- **REQ-DS-01** — Tokens de cor devem ser implementados como variáveis/tema único consumido por Web e Mobile: `bg-primary #121214`, `bg-card #1E1E22`, `bg-card-elevated #26262C`, `accent-primary #6C5CE7`, `accent-secondary #4A9EFF`, `text-primary #FFFFFF`, `text-secondary #9A9AA2`, `success #3DDC97`, `warning #FFB648`, `danger #FF5C5C`.
  - AC: alterar um token no arquivo central reflete em Web e Mobile sem editar componentes individualmente.
- **REQ-DS-02** — Cards com raio de borda 20–24px; pills/botões com raio full-round (999px); grid de espaçamento em múltiplos de 8px (8/16/24/32).
- **REQ-DS-03** — Ícones em botão circular: fundo `bg-card-elevated`, ícone branco, área de toque mínima 44×44px.
- **REQ-DS-04** — Componentes-padrão implementados como primitivos reutilizáveis: Pill Toggle, Card de item (ícone + botão circular + título + subtítulo), Slider horizontal, Dial circular (valor contínuo 0–100%), Bottom nav em pill flutuante, Avatar circular com badge de notificação.
- **REQ-DS-05** — Componentes de conteúdo (cards, pills, dial) vivem em camada compartilhada (`components/shared` ou pacote de monorepo), consumida por rotas Web e Mobile; componentes de shell/layout (sidebar vs. bottom nav) ficam isolados por plataforma.
  - AC: nenhum componente de card/pill/dial duplicado em diretórios `web/` e `mobile/`.

---

## B1 — Autenticação, Sessão e RBAC (`AUTH`)
*Fonte: seção 7*

- **REQ-AUTH-01** — Login por e-mail+senha e OAuth Google, na mesma tela/componente compartilhado entre Web e Mobile.
- **REQ-AUTH-02** — Cadastro fechado por convite: só o primeiro líder pode se cadastrar livremente ao criar um ministério; demais usuários entram via convite (e-mail/link) que já vincula `ministry_member` com papel definido.
- **REQ-AUTH-03** — Access token JWT de curta duração (~15min), mantido em memória (nunca persistido); refresh token httpOnly, Secure, SameSite=Strict, ~30 dias, nunca em localStorage/IndexedDB.
- **REQ-AUTH-04** — Renovação silenciosa via `/auth/refresh` antes da expiração do access token.
- **REQ-AUTH-05** — Sessões múltiplas simultâneas por usuário (mobile + web) sem invalidar as demais ao logar em novo dispositivo.
- **REQ-AUTH-06** — Tela "Dispositivos conectados" em Perfil, listando sessões ativas com opção de revogação remota individual.
- **REQ-AUTH-07** — Modelo de papéis: `admin`, `operator`, `musician`, associado por `ministry_member (user_id, ministry_id, role)` — não direto no `user`; um usuário pode ter papéis diferentes em ministérios diferentes.
  - AC: matriz de permissões da tabela da seção 7.3 (Admin: tudo; Operador: conduz Modo Operador, sem Editor de Cue nem gestão de membros; Músico: sem acesso administrativo) é aplicada e testável via tentativa de acesso negado (403) por papel.
- **REQ-AUTH-08** — Seletor de ministério na UI só aparece se o usuário tiver mais de um vínculo em `ministry_member`.
- **REQ-AUTH-09 (segurança)** — Hash de senha com bcrypt ou argon2id; rate limiting no login (ex.: 5 tentativas/15min por IP+e-mail); reset de senha via token de uso único com expiração curta (~30min), nunca reenvio de senha atual; CORS restrito ao domínio do app; HTTPS obrigatório em todo o domínio.
- **REQ-AUTH-10** — Handshake de WebSocket valida o token e confirma vínculo do usuário ao ministério/sessão antes de admitir na room — nenhum dado de sessão ao vivo trafega sem autenticação.

---

## B2 — Persistência (`DATA`)
*Fonte: seção 8 (numerada "7." no documento-fonte, tratar como seção 8)*

- **REQ-DATA-01** — Backend com PostgreSQL (Neon) + Prisma como fonte de verdade, atrás de API Fastify, armazenando `songs`, `song_cue_sheet.blocks`, escalas, membros, `session_execution_log`, etc.
- **REQ-DATA-02** — Client-side (PWA) usa IndexedDB via Dexie.js — nunca SQLite nativo/Capacitor.
- **REQ-DATA-03** — Uso do cache local limitado a: biblioteca de músicas/cifras/escalas confirmadas (para Modo Estudo offline) e fila de ações pendentes offline (ex.: confirmação de presença), sincronizada ao reconectar.
  - AC negativo: o estado da sessão ao vivo (bloco atual do Modo Operador) **não** é lido do IndexedDB como fonte de verdade — sempre vem do servidor em tempo real.
- **REQ-DATA-04** — Modelo `song_cue_sheet` conforme seção 3.2/8.3: `song_id`, `reference_track_url`, `total_duration_seconds`, `blocks[]` com `id, label, start_time, end_time, duration, chordpro_content, order`; `song.default_key`.

---

## B3 — Biblioteca de Músicas & Editor de Cue (`LIB`)
*Fonte: seção 2.1, 3.2, 5 (referenciada), 8.3*

- **REQ-LIB-01** — CRUD completo de músicas disponível apenas na Web (mobile é leitura).
- **REQ-LIB-02** — Editor de Cue (Web, exclusivo) permite marcar pontos de início/fim de cada bloco sobre a faixa de referência de áudio, usando wavesurfer.js; cada bloco grava `start_time`, `end_time`, `duration` (calculado), `label`, `order`.
- **REQ-LIB-03** — Conteúdo de letra/cifra por bloco em formato ChordPro (`chordpro_content`), acordes embutidos entre colchetes na posição da sílaba (ex.: `[C]Amazing [F]grace`).
- **REQ-LIB-04** — Parsing, renderização e transposição de tom via chordsheetjs (`song.transpose(n)`); Modo Letra renderiza sem linha de acorde, Modo Cifra renderiza com acordes e aplica transposição quando o tom do evento difere de `default_key`.
- **REQ-LIB-05** — Detalhe de música abre como página própria com abas (Info / Editor de Cue / Histórico) — nunca como modal.

---

## B4 — Motor de Execução ao Vivo — Máquina de Estados & Sincronia (`PERF-CORE`)
*Fonte: seção 3.3, 3.4, 8.2*

- **REQ-CORE-01 (Estado Programado)** — O relógio da sessão avança automaticamente; ao atingir a `duration` do bloco atual, o sistema avança para o próximo bloco em `order + 1` sem intervenção.
- **REQ-CORE-02 (Estado Override)** — Ao tocar um bloco fora da ordem esperada, o sistema insere uma execução extra daquele bloco com sua própria contagem de `duration`; o ponteiro da sequência padrão permanece pausado no próximo bloco esperado.
- **REQ-CORE-03 (Retomada)** — Ao terminar a duração do bloco inserido em Override, a sessão retorna automaticamente ao Estado Programado, continuando exatamente de onde o ponteiro parou — sem pular nem repetir blocos seguintes.
  - AC: dado fluxo `Intro→Verso1→PréRefrão→Refrão→Verso2→Refrão→Ponte→Fim`, um Override do bloco "Refrão" antes do fluxo natural chegar lá deve, ao terminar, retomar exatamente em "Verso2".
- **REQ-CORE-04** — Apenas usuário com papel Operador/Líder na sessão pode disparar Override.
- **REQ-CORE-05** — Um Override em andamento pode ser cancelado, retornando direto ao fluxo programado.
- **REQ-CORE-06** — Múltiplos Overrides em sequência são permitidos (ex.: repetir refrão 3x).
- **REQ-CORE-07** — Log de execução da sessão persiste todos os overrides ocorridos com timestamp (`session_execution_log`).
- **REQ-CORE-08 (Sincronia)** — Transições de bloco são propagadas via WebSocket como evento leve por room de `session_id` (`{ event: "block_changed", block_id, session_id, triggered_at, was_override }`) — nunca broadcast do `song_cue_sheet` inteiro a cada mudança.
- **REQ-CORE-09 (Reconexão)** — Ao reconectar, o cliente busca snapshot via `GET /sessions/:id/state` antes de voltar a escutar eventos — tratado como fluxo normal (não exceção), crítico em iOS por queda de conexão em background.
- **REQ-CORE-10 (iOS/PWA)** — App orienta e idealmente detecta modo standalone (instalado vs. aba Safari) antes de liberar o Modo Operador; fallback visual para Wake Lock em iOS <18.4.

---

## B5 — Telas do Modo Performance (Mobile) (`PERF-UI`)
*Fonte: seção 4.1–4.4*

- **REQ-UI-01 (Modo Operador)** — Header com nome/tom/BPM; bloco atual em card `bg-card-elevated` com dial circular de progresso; timeline horizontal de pills com bloco atual em `accent-primary`; grid de blocos tocáveis (toque dispara Override); badge de estado "Programado"/"Override ativo" (`warning` quando override); bottom nav pill com Ordem do Culto / Modo Operador / Chat / Encerrar sessão.
- **REQ-UI-02 (Modo Letra)** — Letra do bloco atual em fonte grande, sem cifra por padrão; toggle "Mostrar cifra" (pill switch); prévia do próximo bloco no rodapé; sem controles de navegação manual — tela muda automaticamente conforme o Operador avança.
- **REQ-UI-03 (Modo Cifra)** — Mesma estrutura do Modo Letra, cifra sempre visível por padrão, acordes alinhados sobre a sílaba; toggle inverso "Ocultar letra"; indicador de tom sempre visível no header.
- **REQ-UI-04 (Modo TV)** — Mantém especificação anterior (fora do escopo desta v8) + dial circular de progresso do bloco atual.
- **REQ-UI-05** — Telas Letra/Cifra são somente-leitura em relação à máquina de estados: mudam por evento recebido do servidor, nunca por navegação local do usuário.

---

## B6 — Modo Estudo — Afinador & Metrônomo (`STUDY`)
*Fonte: seção 4.5*

- **REQ-STUDY-01** — Afinador cromático usa `pitchy` (McLeod/MPM) via Web Audio API, retornando frequência (Hz) e índice de clarity (0–1).
- **REQ-STUDY-02** — Camada `@chordbook/tuner` encapsula captura de microfone (`getUserMedia`), filtro de faixa de instrumentos de corda, e conversão para `{ note, cents, octave, clarity }`.
- **REQ-STUDY-03** — UI do afinador reaproveita o Dial circular do design system, exibindo desvio em cents (-50 a +50): cor `success` dentro da tolerância (ex.: ±5 cents), `warning` fora dela.
- **REQ-STUDY-04** — Modo cromático livre por padrão + presets rápidos (Violão/Guitarra EADGBE, Baixo EADG, Cavaquinho) que apenas destacam a nota-alvo mais próxima.
- **REQ-STUDY-05** — Metrônomo usa scheduling look-ahead via Web Audio API (não `setInterval`/`setTimeout`), com precisão de amostra.
- **REQ-STUDY-06** — Implementação em Web Worker para o agendamento de cliques, evitando atraso quando a thread principal está ocupada renderizando UI (referência: `react-metronome`).
- **REQ-STUDY-07** — Afinador e metrônomo são acessados fora do fluxo de sessão ao vivo (uso individual), sem máquina de estados nem sincronia com outros dispositivos.
- **REQ-STUDY-08 (licenciamento)** — `@chordbook/tuner` é GPLv3 — antes de embutir no bundle de distribuição, validar compatibilidade com o modelo de distribuição do Floworship (uso interno vs. loja de apps). Bloco não pode ser dado como PASS sem essa decisão registrada.

---

## B7 — Navegação Web & Mobile (Shell) (`NAV`)
*Fonte: seção 6*

- **REQ-NAV-01 (Web)** — Sidebar fixa agrupando: Visão Geral (Dashboard), Repertório (Biblioteca, Editor de Cue), Escalas (Calendário, Equipe/Membros), Ao Vivo (Histórico, Estatísticas), Comunicação (Avisos, Devocional), Configurações (Ministério, Papéis, Integrações); rodapé com avatar/menu.
- **REQ-NAV-02** — Item ativo da sidebar: fundo `bg-card-elevated` + barra vertical 3px `accent-primary`; sidebar colapsável para ícone-only (64px) com tooltip.
- **REQ-NAV-03** — Topbar com título da rota atual, busca global `Cmd/Ctrl+K` (músicas/membros/escalas, resultados agrupados por tipo), notificações e avatar.
- **REQ-NAV-04** — Padrão de página: header com título + descrição + ação primária; detalhe de item sempre como página própria com abas — nunca modal.
- **REQ-NAV-05 (Mobile — cotidiano)** — Bottom nav pill flutuante de 4 itens: Início, Repertório, Escala, Perfil; ícone ativo em `accent-primary`.
- **REQ-NAV-06 (Mobile — sessão ao vivo)** — Card fixo no topo do Início quando há sessão ativa ("Você está na escala de hoje · Entrar na sessão"); ao tocar, takeover de tela cheia (bottom nav desaparece), entrando direto no Modo correspondente ao papel do usuário na escala.
- **REQ-NAV-07** — Dentro do takeover de sessão ao vivo, único caminho de volta é botão discreto "sair da sessão" com confirmação — sem bottom nav.
- **REQ-NAV-08** — Hierarquia de entrada no Modo Estudo: Repertório → Detalhe da Música → Estudar.

---

## B8 — Catálogo Oficial & Repertório do Culto (`REP`)
*Fonte: seção 10*

- **REQ-REP-01** — Campo `status` em `song`: `"rascunho" | "pronta" | "arquivada"`; `rascunho` não aparece na seleção de repertório (só na Biblioteca administrativa); `pronta` liberada para qualquer repertório; `arquivada` mantém histórico fora da busca cotidiana.
- **REQ-REP-02** — Campo `tags: string[]` em `song` para filtro (ex.: adoração, louvor, ceia, natal, batismo).
- **REQ-REP-03** — Entidade `service_repertoire_item { id, service_schedule_id, song_id, order, key_override, notes }`, vinculada ao mesmo `service_schedule` da escala (seção 9.2) — sem nova entidade de "evento".
- **REQ-REP-04 (fluxo)** — Repertório só pode ser montado depois que a escala daquele domingo está aprovada/publicada; quem monta é o `ministro_de_louvor` escalado naquele `service_schedule` específico.
- **REQ-REP-05** — Busca de repertório filtra só músicas com `status = "pronta"`, com filtro adicional por tag/tom/tempo.
- **REQ-REP-06 (permissão por escopo)** — Admin/Líder edita repertório de qualquer domingo a qualquer momento; o Ministro de Louvor escalado edita **só** o repertório daquele domingo específico — não os demais do mês; `operador` e `musico` têm acesso somente leitura.
- **REQ-REP-07** — Se o Ministro de Louvor for substituído (seção 9.6), a permissão de editar o repertório migra automaticamente para o substituto.
- **REQ-REP-08 (telas)** — Web: aba "Repertório" dentro do card do domingo em "Escalas do Mês", habilitada só quando a escala está aprovada/publicada; busca lateral com filtros da Biblioteca; lista ordenável por drag-and-drop; tom/BPM inline. Mobile: detalhe do domingo mostra "Equipe escalada" e "Repertório"; cada música linka direto para o Modo Estudo daquela música.
- **REQ-REP-09** — Template WhatsApp `repertorio_definido`, disparado ao publicar o repertório, enviado só a quem está escalado naquele domingo, com botão que abre o Modo Estudo do repertório.

---

## B9 — Motor de Geração de Escalas (`SCHED`)
*Fonte: seção 9.1–9.7*

- **REQ-SCHED-01** — `worship_role` como tag extensível por música/pessoa (ex.: `ministro_de_louvor`, `apoio_de_voz`, `guitarra`, `baixo`, `bateria`, `violao`, `teclado`); uma pessoa pode ter múltiplas funções.
- **REQ-SCHED-02 (algoritmo)** — Atribuição gulosa com fairness score, **não** solver CSP/ILP. Para cada domingo em ordem cronológica e cada vaga: (1) filtra candidatos com o `worship_role`, disponíveis, e não escalados em outra vaga do mesmo domingo; (2) ordena por menor `times_served_this_month`, desempate por `last_served_at[role]` mais antigo; (3) atribui o primeiro, atualizando contadores em memória durante todo o ciclo; (4) sem candidato → `service_assignment.status = "vago"`, sem travar os demais domingos/vagas.
- **REQ-SCHED-03** — Processamento estritamente cronológico (não paralelo) dos domingos do mês, garantindo rotação justa dentro do mesmo mês.
- **REQ-SCHED-04 (painel admin)** — Tela "Escalas do Mês" com status do ciclo (Coletando → Gerando → Aguardando aprovação → Publicada); cards expansíveis por domingo; vaga `"vago"` destacada em `danger`; troca manual por seletor ordenado pelo mesmo fairness score; botão "Aprovar e Publicar" habilitado só com todas as vagas preenchidas ou confirmação explícita de publicar com vaga aberta; histórico de substituições por domingo.
- **REQ-SCHED-05 (substituição pós-publicação)** — Ao reportar indisponibilidade em domingo publicado: `status = "recusado"` → busca substitutos (mesma filtragem/fairness, excluindo já escalados no domingo) → convite **sequencial** (um candidato por vez, janela de resposta curta ex. 4h) → aceite atualiza `musician_id`, `status = "confirmado"`, `substitution_of` → recusa/timeout avança para o próximo → lista esgotada → `status = "vago"` + notificação de urgência ao líder.
  - AC: convite é sequencial, não broadcast simultâneo; lock otimista em `service_assignment` evita dupla aceitação.
- **REQ-SCHED-06** — Regras configuráveis por ministério: formação padrão obrigatória/opcional por culto, prazo de resposta da disponibilidade mensal, janela de resposta de substituição, dia do mês do disparo do ciclo.
- **REQ-SCHED-07** — Motor roda como job assíncrono (cron mensal + reação a eventos de indisponibilidade) — nunca em request síncrono de API.
- **REQ-SCHED-08 (pendente de definição)** — Regra de desempate final quando dois candidatos têm fairness score idêntico (ex.: aleatório determinístico por seed do ciclo). **Não implementar sem essa regra explicitamente definida e registrada em `.specs/STATE.md`.**

---

## B10 — Integração WhatsApp (Meta Cloud API) (`WA`)
*Fonte: seção 9.8, 10.6, 7.1*

- **REQ-WA-01** — Provedor obrigatório: **Meta Cloud API oficial** (direto ou via camada como Twilio). Simuladores não-oficiais (Z-API e afins) são explicitamente proibidos por risco de banimento do número, que travaria o motor de escalas inteiro.
- **REQ-WA-02** — Mensagens iniciadas pelo sistema (fora da janela de 24h da última mensagem do usuário) usam exclusivamente templates pré-aprovados pela Meta.
- **REQ-WA-03** — Uso de Reply Buttons (até 3) para respostas binárias e List Messages para múltiplos domingos — sem depender de interpretação de texto livre.
- **REQ-WA-04 (templates obrigatórios antes do lançamento)** — `disponibilidade_mensal`, `escala_confirmada`, `substituicao_urgente`, `lembrete_disponibilidade`, `repertorio_definido` — todos submetidos e aprovados na Meta Business Manager antes de qualquer teste ponta a ponta.
- **REQ-WA-05 (fluxo)** — Backend dispara via Cloud API → usuário responde no WhatsApp → Meta envia webhook com `button_reply.id` → backend atualiza `availability_response`/`service_assignment` → segue fluxo normal (B9).
- **REQ-WA-06** — Endpoint de webhook valida assinatura da Meta na requisição antes de processar.
- **REQ-WA-07** — Modelo `musician.whatsapp_phone` (E.164) e `musician.whatsapp_opt_in` (boolean); `whatsapp_message_log { id, musician_id, template_name, context, sent_at, status, response_payload? }`.
- **REQ-WA-08 (opt-in obrigatório)** — Consentimento explícito coletado no aceite do convite (seção 7.1); sem opt-in, o número não pode ser incluído no motor de escalas.
- **REQ-WA-09** — Papel do app com WhatsApp como canal primário: app deixa de ser lugar de confirmação e passa a ser consulta/execução (ver escala, Modo Estudo, Modo Operador/Letra/Cifra); push via PWA permanece só para avisos gerais, não crítico para o motor de escalas.

---

## Itens Explicitamente Fora de Escopo / Bloqueados

Estes itens do documento-fonte (seção 11) **não têm requisito de implementação definido** e não devem ser inventados pela IA implementadora — se um bloco depender deles, o Agente de Revisão deve reprovar por especificação incompleta, não aceitar suposição:

- Prototipagem em código da Máquina de Estados antes de wireframes completos (ordem de trabalho, não requisito funcional).
- Wireframes de alta fidelidade (Modo Operador, sidebar Web, takeover de sessão, painel "Escalas do Mês", aba Repertório) — não existem ainda; UI deve seguir a descrição textual desta spec até wireframe ser aprovado e anexado como `context.md`.
- Regra de desempate final de fairness score idêntico (REQ-SCHED-08).
- Detecção de modo standalone PWA + onboarding "Adicionar à Tela de Início" — comportamento a implementar, critério de UX não fechado.
- Decisão de licenciamento de `@chordbook/tuner` GPLv3 (REQ-STUDY-08).

---

## Rastreabilidade — Requisito → Bloco → Seção-fonte

Todos os IDs `REQ-<BLOCO>-NN` acima constituem a matriz de rastreabilidade. Para qualquer requisito, a seção-fonte está indicada no cabeçalho do bloco correspondente. O `reviewer-agent.md` usa exatamente esses IDs como checklist de auditoria — nenhum requisito deve ser reformulado ou dividido durante a implementação sem registrar a mudança em `.specs/STATE.md` (Decisions log, AD-NNN).
