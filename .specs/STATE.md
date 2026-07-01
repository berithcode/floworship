# Floworship — Project State

## Decisions

| ID | Decision | Rationale | Date | Context |
|---|---|---|---|---|
| AD-001 | Stack confirmada: React/TS único (Web+PWA), Fastify, PostgreSQL/Neon + Prisma, Dexie.js (IndexedDB), WebSocket, wavesurfer.js, ChordPro + chordsheetjs (MIT), pitchy + @chordbook/tuner (GPLv3), Meta Cloud API oficial | Decisão arquitetural consolidada no documento-fonte v8 seção 11 | 2026-07-01 | Não rediscutir — ver spec.md § Stack |
| AD-002 | SSH: Z-API e simuladores não-oficiais de WhatsApp são proibidos | REQ-WA-01: risco de banimento do número travaria motor de escalas inteiro | 2026-07-01 | Bloqueante |
| AD-003 | Motor de escalas usa algoritmo guloso com fairness score, não solver CSP/ILP | REQ-SCHED-02: simplicidade e previsibilidade sobre otimalidade | 2026-07-01 | Ver B9 tasks |

## Handoff

**Feature**: — (inicial)
**Phase/Task**: Especificação e geração de tasks
**Completed**: Criação da estrutura .specs/ e spec.md + tasks.md para todos os blocos
**In-progress**: N/A
**Next step**: Implementação do B0 (Design System)
**Blockers**: 
- REQ-SCHED-08: Regra de desempate final de fairness score idêntico — aguardar definição
- REQ-STUDY-08: Validação de licenciamento GPLv3 do @chordbook/tuner — aguardar decisão
- Wireframes de alta fidelidade não existem — UI segue descrição textual do spec até aprovação
- Detecção de modo standalone PWA + onboarding — critério de UX não fechado
**Uncommitted files**: N/A
**Branch**: main
