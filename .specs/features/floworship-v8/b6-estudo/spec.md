# Modo Estudo — Páginas & Caminhos (Engines Adiadas)

## Problem Statement

Fornece a estrutura de navegação e páginas do Modo Estudo: caminho Repertório → Detalhe da Música → Estudar, com placeholders para Afinador e Metrônomo. **As engines de áudio (pitchy, @chordbook/tuner, Web Audio metronome) estão adiadas** — implementação posterior. Foco atual:.rotas, componentes de UI, e integração com B7 (navegação).

## Goals

- [ ] Rota `/repertoire/:songId/study`funcional com layout da página *(REQ-NAV-08)*
- [ ] Página Estudar com abas/seções: Afinador (placeholder) e Metrônomo (placeholder) *(REQ-STUDY-07)*
- [ ] Afinador: UI estática com Dial Circular do B0, sem detecção de áudio *(adiado)*
- [ ] Metrônomo: UI estática com Slider de BPM e botão Play/Pause, sem áudio *(adiado)*
- [ ] Acesso via botão "Estudar" no detalhe da música *(REQ-NAV-08)*
- [ ] Layout responsivo (Web e Mobile)

## Out of Scope (adiado para implementação posterior)

| Feature | Motivo |
|---|---|
| Engine de detecção de pitch (pitchy/MPM) | Adiado — engines de áudio são secundárias |
| @chordbook/tuner (captura de microfone) | Adiado + pendente decisão GPLv3 (REQ-STUDY-08) |
| Engine de metrônomo (Web Audio look-ahead) | Adiado — engines de áudio são secundárias |
| Web Worker de agendamento de cliques | Adiado |
| Detecção de microfone / getUserMedia | Adiado |

## What IS implemented now

| Feature | Status |
|---|---|
| Rota `/repertoire/:songId/study` | ✅ Implementar |
| Layout da página Estudar (header + seções) | ✅ Implementar |
| Placeholder Afinador (Dial Circular estático) | ✅ Implementar |
| Placeholder Metrônomo (Slider + Play/Pause visual) | ✅ Implementar |
| Botão "Estudar" no song detail | ✅ Implementar |
| Integração com bottom nav / sidebar | ✅ Via B7 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Placeholder behavior | UI renderiza mas não produz áudio; botões são visíveis mas não funcionais | Mantém caminho navegável para testes de integração | n |
| Tuner placeholder | Dial Circular do B0 com valor fixo (ex.: "A4, 0 cents") | Mostra como ficará; engine connecta depois | n |
| Metronome placeholder | Slider de BPM (input visual) + botão Play/Pause (sem áudio) | Mostra layout; engine connecta depois | n |
| Licensing (REQ-STUDY-08) | BLOCKED — não resolve agora | Engines adiadas; decisão não bloqueia estrutura | ⛔ BLOCKED |

**Open questions:**

| Question | Options | Recommendation | Status |
|---|---|---|---|
| Como integrar engines depois? | Service layer com interface; placeholder atual retorna mock | Permite troca transparente | Adiado |

---

## User Stories

### P1: Study Mode Page Structure ⭐ MVP

**User Story**: As a musician, I want to navigate to a study page from a song's detail so that the path is ready for when the tuner and metronome are implemented.

**Why P1**: REQ-NAV-08 define o caminho; estrutura deve existir antes das engines.

**Acceptance Criteria**:

1. WHEN a musician navigates to song detail THEN an "Estudar" button/tab SHALL be visible. *(REQ-NAV-08)*
2. WHEN "Estudar" is tapped THEN the route `/repertoire/:songId/study` SHALL load. *(REQ-NAV-08)*
3. WHEN the Study Mode page loads THEN it SHALL display: header with song name, two sections (Afinador placeholder, Metrônomo placeholder). *(REQ-STUDY-07)*
4. WHEN the Study Mode is open THEN it SHALL operate independently — no live session connection. *(REQ-STUDY-07)*

**Independent Test**: Navigate to song detail → tap "Estudar" → page loads with two sections → no audio plays → navigate back works.

---

### P1: Tuner Placeholder ⭐ MVP

**User Story**: As a developer, I want the tuner section to render a Dial Circular from B0 with static values so that the UI structure is ready for engine integration.

**Why P1**: Mantém caminho funcional; engine conecta depois.

**Acceptance Criteria**:

1. WHEN the Tuner section renders THEN it SHALL display the Dial Circular component from B0. *(REQ-STUDY-03)*
2. WHEN the Tuner section renders THEN it SHALL show static placeholder values (e.g., note: "A4", cents: 0, clarity: 1.0). *(Placeholder)*
3. WHEN the Tuner section renders THEN it SHALL show instrument preset selector (Violão, Baixo, Cavaquinho) — visual only, sem detecção. *(REQ-STUDY-04)*
4. WHEN the Tuner section renders THEN it SHALL show a message: "Motor de detecção em breve" (ou similar). *(Placeholder)*

**Independent Test**: Study page loads → Dial Circular visible with static values → preset selector visible → no audio/microphone access requested.

---

### P1: Metronome Placeholder ⭐ MVP

**User Story**: As a developer, I want the metronome section to render a BPM slider and play/pause button from B0 so that the UI structure is ready for engine integration.

**Why P1**: Mantém caminho funcional; engine conecta depois.

**Acceptance Criteria**:

1. WHEN the Metronome section renders THEN it SHALL display a SliderHorizontal from B0 for BPM (range 30–300, default 120). *(REQ-STUDY-05)*
2. WHEN the Metronome section renders THEN it SHALL display a Play/Pause button (visual only, sem áudio). *(REQ-STUDY-05)*
3. WHEN the Metronome section renders THEN it SHALL show current BPM value as text. *(REQ-STUDY-05)*
4. WHEN the Metronome section renders THEN it SHALL show a message: "Motor de áudio em breve" (ou similar). *(Placeholder)*

**Independent Test**: Study page loads → Slider visible with BPM → Play/Pause button visible → no audio plays → BPM value updates visually when slider moves.

---

## Edge Cases

- WHEN the song has no cue sheet THEN the "Estudar" button SHALL still be visible (study mode works independently).
- WHEN the user is on Mobile THEN the page SHALL be responsive (single column layout).
- WHEN the user navigates away and back THEN placeholder state SHALL reset (no persistent state needed).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| STUDY-01 | P1: Tuner Placeholder | Placeholder | ⏳ Adiado (engine) |
| STUDY-02 | P1: Tuner Placeholder | Placeholder | ⏳ Adiado (engine) |
| STUDY-03 | P1: Tuner Placeholder | Placeholder | ✅ Estrutura |
| STUDY-04 | P1: Tuner Placeholder | Placeholder | ✅ Estrutura |
| STUDY-05 | P1: Metronome Placeholder | Placeholder | ⏳ Adiado (engine) |
| STUDY-06 | P1: Metronome Placeholder | Placeholder | ⏳ Adiado (engine) |
| STUDY-07 | P1: Study Mode Page | Navigation | ✅ Implementar |
| STUDY-08 | BLOCKED — Licensing | Legal | ⛔ BLOCKED |

**Coverage:** 8 total, 3 implementados agora, 4 adiados (engine), 1 BLOCKED

---

## Success Criteria

- [ ] Rota `/repertoire/:songId/study`funcional
- [ ] Página Estudar com header + 2 seções (Afinador placeholder + Metrônomo placeholder)
- [ ] Botão "Estudar" no song detail visível e funcional
- [ ] Dial Circular renderiza no placeholder do Afinador
- [ ] Slider de BPM e Play/Pause renderizam no placeholder do Metrônomo
- [ ] Nenhuma solicitação de microfone/áudio (engines desligadas)
- [ ] Layout responsivo (Web e Mobile)
