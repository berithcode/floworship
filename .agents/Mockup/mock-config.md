---
description: Configurações de domínio para geração de dados mock SaudeSeg+. Tabelas de referência: CBO, estados, tipos de exame, enums, cenários de teste.
---

# Configuração de Domínio — Mockup SaudeSeg+

## Prefixo de marcação

Todos os dados mock devem ser identificáveis:
- **Emails**: prefixo `mock_` → `mock_colaborador1@techcorp.com`
- **Nomes**: prefixo `[MOCK]` → `[MOCK] Carlos Silva Santos`
- **PasswordHash**: valor fixo `mock_hash_placeholder`

## CBO Codes (Classificação Brasileira de Ocupações)

| CBO | Função | Risco | Exames Necessários |
|-----|--------|-------|--------------------|
| 1312-15 | Analista de Sistemas | BAIXO | admissional, periodico |
| 3320-15 | Caixa | BAIXO | admissional, periodico |
| 4110-10 | Servente de Limpeza | MEDIO | admissional, periodico, audiometria |
| 4211-10 | Auxiliar de Escritório | BAIXO | admissional, periodico |
| 5151-20 | Cozinheiro | MEDIO | admissional, periodico, acuidade_visual |
| 6220-10 | Vendedor | BAIXO | admissional, periodico |
| 7170-20 | Motorista Particular | MEDIO | admissional, periodico, acuidade_visual, audiometria |
| 7232-10 | Técnico em Enfermagem | ALTO | admissional, periodico, audiometria, acuidade_visual |
| 7832-20 | Operador de Telemarketing | BAIXO | admissional, periodico, audiometria |
| 8485-10 | Pedreiro | CRITICO | admissional, periodico, audiometria, acuidade_visual, espirometria |

## Estados Brasileiros (por região)

| Região | Estados |
|--------|---------|
| Sudeste | SP, RJ, MG, ES |
| Sul | RS, SC, PR |
| Nordeste | BA, SE, AL, PE, PB, RN, CE, PI, MA |
| Norte | AM, PA, AC, RO, RR, AP, TO |
| Centro-Oeste | MT, MS, GO, DF |

## Tipos de Exame

| Tipo | Categoria | Requer Equipamento | Remoto | Validade (dias) |
|------|-----------|-------------------|--------|-----------------|
| Exame Clínico (pa) | clinico | false | true | 365 |
| Audiometria | clinico | true | false | 365 |
| Acuidade Visual | clinico | true | false | 365 |
| Espirometria | funcional | true | false | 365 |
| Exame Laboratorial | laboratorial | false | true | 180 |
| Eletrocardiograma | clinico | true | false | 180 |

## Categorias de Exame (ExamType.category)

- `clinico` — exames clínicos gerais
- `laboratorial` — exames laboratoriais (sangue, urina)
- `imagem` — raio-x, etc.
- `funcional` — espirometria, audiometria

## Enums do Sistema

### Role
```
ADMIN | OPERATOR | DOCTOR | PATIENT | COMPANY_ADMIN
```

### CompanyStatus
```
CADASTRO_INCOMPLETO | EM_ANALISE | LIBERADA | DOCUMENTACAO_VENCIDA
```

### InviteStatus
```
ENVIADO | ABERTO | EXPIRADO | CONCLUIDO
```

### TimelineEventType
```
LINK_ENVIADO | LINK_ABERTO | CADASTRO_CONCLUIDO | EXAME_INICIADO | EM_ATENDIMENTO_MEDICO | CONCLUIDO
```

### ExamRequest.status
```
AGUARDANDO_COLETA | EM_COLETA | NA_FILA_MEDICA | EM_ATENDIMENTO | CONCLUIDO | CANCELADO
```

### QueueEntry.status
```
WAITING | IN_PROGRESS | COMPLETED
```

### AsoDocument.decision
```
APTO | APTO_COM_RESTRICAO | INAPTO | INCONCLUSIVO
```

## Cenários de Teste Pré-definidos

### Cenário 1 — Fluxo Completo (Happy Path)
Empresa LIBERADA → convite ENVIADO → paciente ABERTO → ExamRequest CONCLUIDO → fila → teleconsulta → ASO APTO

### Cenário 2 — Documentação Vencida
Empresa com status DOCUMENTACAO_VENCIDA, pcmsoValidUntil e ppraValidUntil no passado

### Cenário 3 — Convite Expirado
ExamInvite com expiresAt no passado, status EXPIRADO

### Cenário 4 — Exame em Andamento
Paciente com ExamRequest EM_COLETA, QueueEntry WAITING

### Cenário 5 — Dados Inválidos (Boundary)
- CPF com dígitos verificadores errados
- CNPJ duplicado (viola unique constraint)
- Email duplicado em UserAccount (viola unique constraint)
- CRM duplicado em Doctor (viola unique constraint)
- CBO code inexistente na tabela OccupationalRisk
- Decision ASO com valor inválido

## Dados dos 10 Pacientes

| # | Nome | CPF | CBO | Função | Cidade/UF | Empresa |
|---|------|-----|-----|--------|-----------|---------|
| 1 | Carlos Silva Santos | 52998224725 | 7232-10 | Técnico em Enfermagem | São Paulo/SP | Tech Corp Brasil |
| 2 | Ana Maria Costa | 37485162008 | 4110-10 | Servente de Limpeza | São Paulo/SP | Tech Corp Brasil |
| 3 | Pedro Henrique Oliveira | 18763549073 | 7170-20 | Motorista Particular | Guarulhos/SP | Tech Corp Brasil |
| 4 | Juliana Ferreira Lima | 60347281050 | 3320-15 | Caixa | Campinas/SP | Tech Corp Brasil |
| 5 | Roberto Almeida Neto | 85219634017 | 5151-20 | Cozinheiro | Santo André/SP | Tech Corp Brasil |
| 6 | Fernanda Souza Nascimento | 20673814095 | 6220-10 | Vendedor | Osasco/SP | Tech Corp Brasil |
| 7 | Lucas Barbosa Ferreira | 47152983064 | 8485-10 | Pedreiro | São Paulo/SP | Tech Corp Brasil |
| 8 | Mariana Lopes Ribeiro | 92461735036 | 4211-10 | Auxiliar de Escritório | Manaus/AM | Indústria Norte Ltda |
| 9 | Thiago Martins Costa | 31856294082 | 7832-20 | Operador de Telemarketing | Manaus/AM | Indústria Norte Ltda |
| 10 | Patrícia Araújo Santos | 75329148003 | 1312-15 | Analista de Sistemas | Parintins/AM | Indústria Norte Ltda |
