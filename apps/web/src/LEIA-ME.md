# Patch — Leitor de cifra em blocos (Modo Conjunto / Modo Livre / Seguir Áudio)

## Como aplicar

Caminhos relativos a `web/src/`:

```
components/performance/BlockReader.tsx    → web/src/components/performance/BlockReader.tsx   (NOVO)
pages/performance/ModoCifra.tsx           → web/src/pages/performance/ModoCifra.tsx           (substituir)
pages/performance/ModoLetra.tsx           → web/src/pages/performance/ModoLetra.tsx           (substituir)
pages/study/StudyMode.tsx                 → web/src/pages/study/StudyMode.tsx                 (substituir)
```

Sem dependências novas — usa só o que já existia (`services/chordpro/parser.ts`, `lucide-react`, `useSessionSocket`).

## O que mudou

### `BlockReader.tsx` (novo) — o leitor em si

Componente único, compartilhado pelas três telas: bloco em tela cheia, acorde alinhado sobre a letra (via `parseChordPro`/`renderCifra`/`renderLetra`, que já existiam mas não eram usados fora do editor admin), toggle Cifra/Letra, transposição de tom (-1/+1) e o próximo bloco sempre visível numa faixa fixa embaixo — pra ninguém ser pego de surpresa numa troca de tom.

O componente não decide quem controla a navegação — só recebe `index` + `locked` de fora. Isso é o que permite o mesmo componente servir tanto o modo sincronizado (ao vivo) quanto o manual (Estudo), sem duplicar a lógica de leitura em três lugares.

### `ModoCifra.tsx` / `ModoLetra.tsx` — Modo Conjunto / Modo Livre

Antes: `<pre>{currentBlock.chordproContent}</pre>` cru, tom hardcoded em "Key: C", sem navegação nenhuma além do que o operador mandasse.

Agora: um toggle no topo da tela alterna entre:
- **Modo Conjunto** (padrão): bloco vem do `useSessionSocket` (sincronizado com o operador), navegação bloqueada (`locked`).
- **Modo Livre**: navegação local por toque, independente dos outros — ao religar o Modo Conjunto, volta automaticamente pro bloco atual da sessão (não fica preso num bloco antigo).

### `StudyMode.tsx` — agora carrega a música de verdade

Antes esse arquivo não buscava dado nenhum — só renderizava afinador e metrônomo de mentirinha, sem repertório.

Agora:
- Busca a música (`GET /songs/:id`) e o cue sheet com os blocos
- Usa o mesmo `BlockReader`, navegação manual por padrão
- Toggle **"Seguir áudio"**: se a música tem faixa de referência cadastrada, toca o áudio e avança o bloco sozinho conforme o tempo cruza o `startTime`/`endTime` de cada bloco (comparando contra o array de blocos a cada `timeupdate` do elemento `<audio>`)
- Afinador/metrônomo continuam disponíveis, agora atrás de um botão "Ferramentas" — evita empilhar tudo na tela de uma vez

## O que isso não resolve ainda

- O afinador/metrônomo em si continuam sendo placeholder visual (motor de detecção real é outro passo, já mapeado na seção 4.5 do documento de design)
- Wake Lock durante o Modo Estudo com áudio tocando (a tela pode apagar no meio da prática) — mesma ressalva já documentada pra sessão ao vivo (seção 8.2)
