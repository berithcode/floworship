# Correções de Arquitetura — Versão Revisada

> Este documento não refaz o relatório original `03-analise-arquitetura.md` (a análise estrutural está correta). Ele resolve os pontos de **conflito de sequenciamento entre os três relatórios** (banco de dados, backend, arquitetura), que se aplicados na ordem originalmente sugerida causariam quebra do código legado.

---

## 1. Sequência unificada de remoção do schema Prisma duplicado

Os três relatórios tocam nesse mesmo problema com estimativas de tempo diferentes e sem se referenciar:

- Banco de dados → Fase 1: "eliminar `prisma/schema.prisma` (raiz)" — 30 min
- Arquitetura → Fase 2.1: "escolher schema canônico e remover duplicado" — 1-2 semanas
- Arquitetura → Fase 4.1: "remover código legado de `src/`" — 2-3 meses

O relatório de banco, isoladamente, sugere fazer isso em 30 minutos. Mas o `src/` legado e o `prisma/seed.ts` compartilhado dependem do schema raiz, e só são removidos na Fase 4 (2-3 meses depois). Se a Fase 1 do banco for executada como está escrita, quebra o legado imediatamente.

### Sequência corrigida (única, substitui as três anteriores)

| Ordem | Ação | Fonte original | Quando |
|-------|------|-----------------|--------|
| 1 | Adicionar `sessionType` ao schema da API (sem remover o raiz ainda) | Banco, 1.3 | Imediato |
| 2 | Mapear todo import do Prisma Client gerado a partir do schema raiz em `src/` | Arquitetura, 1.1 | Imediato |
| 3 | Redirecionar esses imports (incluindo `seed.ts`) para o client gerado por `apps/api/prisma/schema.prisma` | Arquitetura, 2.1 | Curto prazo |
| 4 | Rodar `src/` (legado) e `apps/api` lado a lado por pelo menos 1 ciclo de escala completo, usando o mesmo schema | — | Curto prazo |
| 5 | Remover `prisma/schema.prisma` da raiz | Banco, 1.3 | Depois do passo 4, **não antes** |
| 6 | Remover `src/` por completo | Arquitetura, Fase 4.1 | Longo prazo — pode acontecer bem depois do passo 5, já que a partir do passo 5 ambos já usam o mesmo schema |

O ponto-chave: **remover o schema duplicado (passo 5) não precisa esperar a remoção total do legado (passo 6)** — só precisa esperar o legado parar de apontar para o schema errado (passos 2-4). Isso desbloqueia a limpeza do schema sem esperar 2-3 meses.

---

## 2. Ordem entre "autenticar WebSocket" e "renomear `Session`"

O relatório de arquitetura pede autenticação JWT no WebSocket (Fase 1, emergencial). O relatório de banco pede renomear o model `Session` → `UserSession` (Fase 8, mais tardia). Como o payload do JWT pode referenciar dados de sessão, fazer a autenticação do WebSocket **antes** do rename é seguro — só é preciso reabrir o código de verificação de token do WebSocket depois do rename para confirmar que nenhuma referência ao nome antigo do model ficou hardcoded (ex: em logs, em `include` de queries relacionadas). Adicionar isso como item de checklist na Fase 8 do roadmap de banco:

> ✅ Checklist adicional na Fase 8 (rename de Session): revisar `websocket/server.ts` e qualquer middleware de auth que faça `prisma.session.findUnique` para atualizar a referência ao novo nome do model.

---

## 3. Repository Pattern (Fase 2 da arquitetura) antes ou depois das mudanças de schema?

O relatório de arquitetura propõe criar `repositories/` encapsulando o Prisma (Fase 2, 1-2 semanas) — mas o relatório de banco propõe mudanças estruturais no schema (enums, soft delete, modelos relacionais novos) que impactam diretamente a assinatura dessas mesmas queries.

### Recomendação de ordem

Fazer as mudanças de **schema** primeiro (Fases 0–7 do documento de banco revisado), e só então criar a camada de repositório — assim os repositórios já nascem com a forma final das queries (com enums, com filtro de soft delete via extension, etc.), evitando reescrever os repositórios duas vezes.

Se o time preferir não esperar (por exemplo, porque a Fase 2 da arquitetura já está em andamento), pelo menos isolar a criação dos repositórios de `MonthlyScheduleCycle` e `ServiceSchedule` para depois da Fase 5 do documento de banco (soft delete), já que esses dois repositórios são os que mais mudam de assinatura com a extensão de filtro automático.

---

## 4. CI que bloqueia duplicação (Arquitetura, 1.5) — adicionar checagem do schema

O script de CI sugerido no relatório de arquitetura ("script que compare `src/` vs `apps/` em busca de arquivos equivalentes") deveria incluir também uma checagem específica de schema, dado o histórico de divergência:

```yaml
# .github/workflows/ci.yml (adicionar ao job de segurança já sugerido)
- name: Verificar schema Prisma único
  run: |
    if [ -f "prisma/schema.prisma" ]; then
      echo "ERRO: schema Prisma duplicado na raiz ainda existe."
      exit 1
    fi
```

Isso evita que o schema raiz volte a ser recriado por engano (ex: alguém rodando `prisma init` na raiz sem saber do histórico) depois que o passo 5 da seção 1 deste documento for concluído.

---

## Resumo das mudanças em relação ao relatório original

| Item do relatório original | O que mudou |
|---|---|
| Banco, Fase 1 (30 min) | Passa a depender de mapeamento e migração do legado — não é mais uma tarefa isolada de 30 min |
| Arquitetura, Fase 2.1 | Passa a ser pré-requisito explícito da Fase 1 do banco, não uma tarefa paralela independente |
| Arquitetura, Fase 4.1 (remover `src/`) | Deixa de ser bloqueante para a remoção do schema duplicado — pode acontecer depois |
| Banco, Fase 8 (rename Session) | Ganha checklist de revisão do WebSocket após autenticação JWT ser implementada |
| Arquitetura, Fase 2 (repositories) | Recomendado fazer após as mudanças de schema do documento de banco, não em paralelo |
