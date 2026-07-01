---
description: Injeta e gerencia dados mockados no SaudeSeg+ via Prisma seed. Suporta dados válidos, injeção de erros para teste de sistema, limpeza e listagem.
argument-hint: [ação: injetar | injetar-erros | limpar | listar] [entidade opcional]
---

# Gestor de Injeção de Dados Mockados — SaudeSeg+

Ação solicitada: $ARGUMENTS (se vazio, assuma "listar" primeiro e pergunte o que fazer).

Você é o responsável por inserir dados fictícios no sistema SaudeSeg+ de forma controlada e segura, usando o seed Prisma como mecanismo de injeção.

## Regras fixas

1. **NUNCA** execute isso contra ambiente de produção. Confirme antes: `DATABASE_URL` deve conter `localhost`.
2. **Sempre** que injetar dados, eles já vêm marcados com prefixo `mock_` (emails) e `[MOCK]` (nomes).
3. **Nunca** sobrescreva dados reais já existentes sem confirmação explícita.
4. **Ordem de limpeza**: sempre limpar antes de reinserir para evitar duplicatas.

## Ação: injetar

Execute o seed de dados válidos:

```bash
npx ts-node apps/backend/prisma/seed-mock.ts
```

### O que este comando faz:
1. **Limpa** todos os registros mock existentes (ordem respeitando FKs)
2. **Insere** dados válidos via Prisma Client (respeitando todas as validações do schema):
   - 2 empresas (Tech Corp Brasil LIBERADA, Indústria Norte EM_ANALISE)
   - 1 clínica (Clínica Central SP)
   - 2 médicos (Dr. João Silva/SP, Dra. Maria Souza/AM)
   - 10 pacientes (7 em SP, 3 em AM, todos com CBOs diferentes)
   - Convites, solicitações, resultados, filas, teleconsultas, ASOs
3. **Gera** `mocks/MOCKS.md` com inventário completo

### Relatório esperado ao final:
- Quantos registros foram inseridos por entidade
- Se algum registro falhou (e por quê)
- Status dos cenários de teste (fluxo completo, fila, coleta, teleconsulta)

### Validação pós-injeção:
```bash
# Verificar que o backend ainda funciona
curl http://localhost:3001/api/doctors | head -5
curl http://localhost:3001/api/clinics | head -5

# Verificar login com dados mock
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mock_colaborador1@techcorp.com","role":"PATIENT"}'
```

## Ação: injetar-erros

Execute o seed de cenários de erro:

```bash
npx ts-node apps/backend/prisma/seed-mock.ts --errors
```

### O que este comando faz:
1. **Tenta** inserir dados inválidos diretamente no banco via Prisma
2. **Captura** os erros que o Prisma/PostgreSQL retorna
3. **Gera** relatório indicando quais cenários foram capturados e quais passaram sem erro

### Cenários testados:
| # | Cenário | O que valida |
|---|---------|-------------|
| 1 | CPF com dígito verificador inválido | Prisma não valida CPF (campo String puro) |
| 2 | CNPJ duplicado | Constraint UNIQUE do PostgreSQL |
| 3 | Email duplicado em UserAccount | Constraint UNIQUE do PostgreSQL |
| 4 | CRM duplicado em Doctor | Constraint UNIQUE do PostgreSQL |
| 5 | Convite com expiresAt no passado | Prisma não valida data (campo DateTime puro) |
| 6 | CBO code inexistente | FK não obrigatória (campo String) |
| 7 | Decision ASO inválido | Prisma não valida enum em campo String |

### Interpretação do relatório:
- **✅ Capturado**: o sistema impediu a inserção (constraint funcionando)
- **⚠️ Não capturado**: o Prisma/PostgreSQL permite o dado inválido — é um **gap de validação** que pode ser corrigido com validação no NestJS (DTOs + class-validator) ou triggers no banco

### Ações recomendadas pós-relatório:
Para cada cenário que NÃO capturou erro, considere:
1. Adicionar validação no DTO do NestJS (ex: `class-validator` com `@IsCPF()`, `@IsCNPJ()`)
2. Adicionar validação no service antes do `prisma.create()`
3. Adicionar trigger no banco para campos críticos

## Ação: limpar

Execute a limpeza de todos os dados mock:

```bash
npx ts-node apps/backend/prisma/seed-mock.ts --clean
```

### O que este comando faz:
1. Identifica todos os registros com prefixo `[MOCK]` nos nomes e `mock_` nos emails
2. Remove-os na ordem correta de FKs (filhos antes dos pais)
3. Confirma a contagem total removida

### Ordem de remoção:
```
AsoDocument → Teleconsultation → QueueEntry → ExamResult
→ ExamTimelineEvent → ExamRequest → ExamInvite
→ CompanyPatientRelation → Patient → CompanyAdmin
→ Operator → Doctor → Clinic → Company → UserAccount
```

## Ação: listar

Consulte o banco para mostrar o estado atual dos dados mock:

```bash
# Contagem por entidade (via Prisma ou query direta)
npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const prefix = '[MOCK]';
  console.log('=== Dados Mock Ativos ===');
  console.log('Empresas:', await p.company.count({ where: { name: { startsWith: prefix } } }));
  console.log('Clínicas:', await p.clinic.count({ where: { name: { startsWith: prefix } } }));
  console.log('Médicos:', await p.doctor.count({ where: { user: { email: { startsWith: 'mock_' } } } }));
  console.log('Pacientes:', await p.patient.count({ where: { name: { startsWith: prefix } } }));
  console.log('Convites:', await p.examInvite.count({ where: { company: { name: { startsWith: prefix } } } }));
  console.log('Solicitações:', await p.examRequest.count({ where: { patient: { name: { startsWith: prefix } } } }));
  console.log('Resultados:', await p.examResult.count({ where: { request: { patient: { name: { startsWith: prefix } } } } }));
  console.log('ASOs:', await p.asoDocument.count({ where: { request: { patient: { name: { startsWith: prefix } } } } }));
  await p.\$disconnect();
}
main();
"
```

## Saída esperada

Sempre termine com um resumo de 3 partes:

1. **O que foi feito agora** (injeção válida, injeção de erros, limpeza, ou listagem)
2. **O que isso revela sobre a estrutura real** (ex: "entidade X permite dados inválidos — gap de validação")
3. **Próxima ação recomendada** (ex: "execute `injetar` para ter dados de teste", "corrija a validação de CPF no DTO")

## Fluxos de uso comuns

### Setup inicial para desenvolvimento
```
injetar → validar que dados aparecem no frontend
```

### Teste de validação
```
injetar → injetar-erros → analisar gaps → corrigir validações
```

### Reset rápido
```
limpar → injetar
```

### Verificação de estado
```
listar → decidir próxima ação
```
