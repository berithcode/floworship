---
description: Gera dados fictícios (mockup) realistas para testar a plataforma SaudeSeg+ — empresas, médicos, pacientes, exames, documentos ASO, filas — sem alterar a estrutura real do sistema.
argument-hint: [entidade(s) a mockar, ex: "paciente, exame" ou vazio para gerar todas]
---

# Gerador de Arquivos Mockup — SaudeSeg+

Entidades solicitadas: $ARGUMENTS (se vazio, gera todas as entidades do domínio).

Sua responsabilidade aqui é SÓ produzir matéria-prima de dados fictícios. Você não altera schema, model, endpoint ou tela real.

## Passo 1 — Descobrir o schema real

Leia o Prisma schema em `apps/backend/prisma/schema.prisma` antes de inventar qualquer campo. O mock deve ser estruturalmente idêntico ao que a aplicação espera (mesmos campos, tipos, enums, relações).

### Entidades do domínio SaudeSeg+

| Entidade | Modelo Prisma | Relações-chave |
|----------|--------------|----------------|
| Empresa | `Company` | -> CompanyAdmin, ExamInvite, CompanyPatientRelation, Clinic |
| Administrador da Empresa | `CompanyAdmin` | -> UserAccount, Company |
| Médico | `Doctor` | -> UserAccount, Teleconsultation, AsoDocument |
| Paciente/Colaborador | `Patient` | -> UserAccount, CompanyPatientRelation, ExamRequest |
| Clínica | `Clinic` | -> Operator, ExamRequest, Company |
| Operador | `Operator` | -> UserAccount, Clinic, ExamResult |
| Convite de Exame | `ExamInvite` | -> Company, ExamRequest, ExamTimelineEvent |
| Solicitação de Exame | `ExamRequest` | -> Patient, Clinic, ExamInvite, ExamResult, QueueEntry, Teleconsultation, AsoDocument |
| Resultado de Exame | `ExamResult` | -> ExamRequest, ExamType, Operator |
| Tipo de Exame | `ExamType` | -> ExamResult |
| Fila Médica | `QueueEntry` | -> ExamRequest |
| Teleconsulta | `Teleconsultation` | -> ExamRequest, Doctor |
| Documento ASO | `AsoDocument` | -> ExamRequest, Doctor |
| Risco Ocupacional | `OccupationalRisk` | (independente) |

## Passo 2 — Consultar configurações de domínio

Leia `.agents/Mockup/mock-config.md` para obter:
- Tabela de CBO codes com funções e riscos
- Estados brasileiros por região
- Tipos de exame e categorias
- Enums válidos do sistema
- Cenários de teste pré-definidos
- Dados dos 10 pacientes

## Passo 3 — Gerar os dados

### Modo seed (recomendado)

Execute o script de seed:
```bash
npx ts-node apps/backend/prisma/seed-mock.ts
```

Este script gera:
- **Dados válidos**: 2 empresas, 1 clínica, 2 médicos, 10 pacientes, exames, filas, teleconsultas, ASOs
- **Marcação**: todos os emails com prefixo `mock_`, nomes com `[MOCK]`
- **Relações cruzadas coerentes**: cada paciente vinculado à empresa correta, convites com CBOs válidos, resultados de exame consistentes

### Modo erro (boundary testing)

Execute para cenários de invalidade:
```bash
npx ts-node apps/backend/prisma/seed-mock.ts --errors
```

Gera tentativas de inserção com:
- CPF com dígitos verificadores errados
- CNPJ duplicado
- Email duplicado
- CRM duplicado
- Convite com data expirada
- CBO inexistente
- Decision ASO inválido

### Modo manual (gerar arquivos JSON)

Se precisar de arquivos JSON separados para uso em testes E2E ou fixtures, leia o seed como referência e gere:

- `mocks/companies.json` — array de Company
- `mocks/doctors.json` — array de Doctor
- `mocks/patients.json` — array de Patient
- `mocks/exam-types.json` — array de ExamType
- `mocks/exam-invites.json` — array de ExamInvite
- `mocks/exam-requests.json` — array de ExamRequest

Cada arquivo deve seguir exatamente o schema Prisma (mesmos campos, mesmos tipos).

## Passo 4 — Isolar os arquivos

Salve tudo na pasta `mocks/` na raiz do projeto, separada de dados reais. Nunca salve dentro de `apps/` ou `src/`.

## Passo 5 — Documentar o inventário

O script `seed-mock.ts` gera automaticamente `mocks/MOCKS.md` com:
- Entidades e quantidades de registros
- Relações entre entidades mockadas
- Cenários de teste disponíveis
- Comandos para regenerar, limpar e testar erros

Se gerar arquivos JSON manualmente, atualize o `MOCKS.md` com inventário manual.

## Regras finais

1. **Prefixo obrigatório**: todos os emails devem começar com `mock_`, todos os nomes com `[MOCK]`
2. **Nunca misturar** dados reais com dados mock
3. **Se o schema real mudar**, o seed pode quebrar — execute `npx prisma generate` antes de rodar
4. **Idempotente**: o seed limpa antes de inserir, pode ser executado múltiplas vezes
5. **Ambiente**: só execute contra banco local/dev (confirmar DATABASE_URL com `localhost`)
