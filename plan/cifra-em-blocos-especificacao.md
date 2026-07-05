# Cifra em Blocos — Especificação de Feature

## Modo Estudo, Modo Banda e Pontos de Entrada

> Documento focado só nessa funcionalidade, separado da especificação geral, pra trabalhar ela com mais profundidade. Resolve o problema original: cifra inteira não cabe/não se lê numa tela de celular durante a execução.

---

## 1. Conceito central

Um **card grande** no topo mostra o bloco atual (acorde + letra, tamanho de leitura confortável). Embaixo dele, uma **fileira de blocos pequenos** (chips), um por seção da música — Intro, Verso 1, Refrão, Ponte, Final. Tocar num chip qualquer troca o conteúdo do card grande na hora, sem precisar avançar bloco a bloco em sequência.

Isso é diferente de um simples "próximo/anterior": a fileira de chips deixa a música inteira mapeada e navegável de qualquer ponto — se o músico perder a régua no meio do ensaio, ou quiser pular direto pro Refrão pra conferir um acorde, é um toque, não vários.

O card grande sempre mostra: nome do bloco, tom daquele trecho, e o conteúdo (cifra ou letra, conforme o modo ativo). O chip do bloco atual fica destacado na cor de acento pra orientar visualmente onde se está dentro da música.

---

## 2. Modo Estudo — uso solo

Layout descrito acima é o **Modo Estudo** por padrão: card grande + chips, navegação livre, sem ninguém do outro lado.

- **Toggle Cifra/Letra** — mesma música, dois jeitos de ler; cifra mostra o acorde alinhado sobre a sílaba, letra esconde o acorde.
- **Transposição de tom** — botões +1/-1 dentro do próprio card grande, pra praticar num tom diferente do original sem depender de o líder recadastrar a música.
- **"Seguir áudio" (opcional)** — se a música tem faixa de referência, liga a reprodução e o chip ativo muda sozinho conforme o tempo da gravação cruza o início de cada bloco. Desligado por padrão (fica manual, no toque).

---

## 3. Modo Banda — ao vivo, dois estados

Durante a execução ao vivo (a banda tocando de verdade, tela sincronizada entre os instrumentistas), existem dois comportamentos possíveis pra troca de bloco — e a pessoa alterna entre eles quando quiser:

- **Controlado** (padrão ao entrar numa sessão ao vivo): o bloco em tela é o mesmo que o cantor/ministro de louvor está definindo pra todo mundo — vem sincronizado pela sessão, os chips ficam bloqueados pra toque (só mostram onde se está, não trocam nada se tocados).
- **Manual**: o próprio músico assume o controle da navegação dos chips, sem afetar os outros — útil pra conferir um trecho adiantado sem tirar o resto da banda do compasso. Um aviso discreto (ex: "Você está fora de sincronia") deixa isso claro enquanto ativo.

Ao voltar pro Controlado, o card pula direto pro bloco que o restante da banda está vendo — nunca fica preso num chip antigo.

> **Nota de nomenclatura:** essas duas opções chamavam "Modo Conjunto" / "Modo Livre" numa conversa anterior — este documento usa **Controlado** / **Manual**, que descreve melhor quem está no comando de cada estado, dentro do contexto maior de "Modo Banda".

---

## 4. Anotações de interface

- **Card grande**: cantos arredondados (12px, mesmo padrão de card do design system), fundo `surface`, borda de 0.5px translúcida — sem sombra, sem gradiente, plano.
- **Chips de bloco**: pequenos, cantos bem arredondados (formato pílula, ~12px de raio ou mais), texto curto (nome do bloco só, sem subtítulo) — cabe uma fileira inteira rolável horizontalmente sem quebrar linha.
- **Chip ativo**: preenchido com a cor de acento (`accent-primary`), texto em contraste — o único elemento saturado na tela, pra guiar o olho direto pro "onde estou agora".
- **Chips inativos**: fundo neutro (`surface`/branco translúcido baixo), sem borda pesada — não competem visualmente com o ativo.
- **Tom**: sempre como texto pequeno logo abaixo do nome do bloco no card grande, nunca escondido atrás de outro toque — é informação crítica pra quem está tocando, tem que estar sempre visível sem ação extra.
- **Toggle Controlado/Manual** (Modo Banda) e **Toggle Cifra/Letra** (ambos os modos): pill pequena no topo da tela, não dentro do card — são controles de modo, ficam fora do conteúdo que muda.

---

## 5. Pontos de entrada — onde isso aparece pro músico

Hoje essa função existe, mas está "enterrada" — só se chega nela entrando numa música específica pelo caminho administrativo. Ela precisa aparecer em pelo menos dois lugares óbvios pro músico:

1. **Login/Home do músico** — um card de destaque (ex: "Estudar repertório da próxima escala" ou similar) levando direto pro Modo Estudo da música mais relevante no momento (a do próximo culto em que a pessoa está escalada). Hoje a tela inicial do músico (ver "Meus Horários", já discutido antes) não tem esse atalho — a pessoa precisa saber navegar até a Biblioteca por conta própria.
2. **Ao abrir "Músicas"** — pra quem está logado como músico (não admin), tocar numa música deveria levar direto pro Modo Estudo (o card grande + chips). Hoje, pelo que vimos no código, `/library/:id` sempre abre a tela administrativa (abas Informações/Roteiro/Histórico, pensada pra quem cadastra a música) — o mesmo destino serve os dois papéis.

### O problema de fundo por trás disso

Isso não é um detalhe pequeno de navegação — é o mesmo problema estrutural já identificado no documento de revisão da Fase 5 (seção 8): **não existe hoje diferenciação de tela por papel**. O `Sidebar` mostra o mesmo menu pra admin e músico, e as rotas de música não sabem quem está abrindo. Enquanto isso não for resolvido de forma geral (ver Fase 5, seção 9.2 e 8.5), qualquer entry point que a gente desenhar aqui vai continuar competindo com a tela errada por engano — vale tratar a correção de roteamento por papel como pré-requisito, não como detalhe de polimento posterior.

---

## 6. O que já existe no código (base técnica)

- **Parser de ChordPro** (`services/chordpro/parser.ts`) — já funciona, já transpõe tom, já separa cifra de letra. Não precisa refazer.
- **`BlockReader.tsx`** (componente já construído numa rodada anterior) — implementa a leitura em tela cheia com navegação anterior/próximo e uma faixa de "próximo bloco" fixa embaixo. É a base certa, mas **precisa de um ajuste**: hoje só anda um bloco por vez (anterior/próximo); o conceito deste documento pede uma fileira de chips com acesso direto a qualquer bloco, não só o vizinho. Vale evoluir o componente pra aceitar essa navegação por índice livre, em vez de só incrementar/decrementar.
- **Toggle Controlado/Manual** — já implementado como "Modo Conjunto"/"Modo Livre" no `ModoCifra.tsx`/`ModoLetra.tsx`; só precisa de ajuste de rótulo pra bater com a nomenclatura deste documento (seção 3).
- **StudyMode.tsx** — já busca a música e os blocos de verdade (antes não buscava nada); o "Seguir áudio" já existe. Falta trocar a lista simples de navegação pelo layout de card grande + chips descrito na seção 1-2.

---

## 7. Checklist desta feature

- [ ] Evoluir `BlockReader.tsx` pra suportar navegação direta por chip (índice livre), não só anterior/próximo
- [ ] Construir a fileira de chips (rolável horizontal, chip ativo destacado) conforme seção 4
- [ ] Renomear rótulos de "Modo Conjunto"/"Modo Livre" pra "Controlado"/"Manual" no `ModoCifra.tsx`/`ModoLetra.tsx`
- [ ] Resolver roteamento por papel em `/library/:id` — admin vai pra tela de edição, músico vai direto pro Modo Estudo (depende da correção geral de navegação por papel, Fase 5 seção 9.2)
- [ ] Adicionar card de atalho pro Modo Estudo na tela inicial do músico (seção 5, item 1)
- [ ] Validar ponta a ponta: músico loga → vê o card de atalho → abre a música do próximo culto → usa o card grande + chips pra estudar → entra numa sessão ao vivo → alterna Controlado/Manual sem perder o lugar
