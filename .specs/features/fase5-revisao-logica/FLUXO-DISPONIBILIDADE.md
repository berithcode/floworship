# Fluxo de Disponibilidade do Músico

## Visão Geral

O músico pode responder sua disponibilidade para os domingos do ciclo mensal **apenas quando**:
1. ✅ O administrador criou um ciclo ativo (`MonthlyScheduleCycle`)
2. ✅ O ciclo está no status `coletando_disponibilidade`
3. ✅ Os domingos (`ServiceSchedule`) foram cadastrados no ciclo

---

## Fluxo Completo

### 1. Admin Cria o Ciclo
```
POST /schedules/cycles
Body: { ministryId, month, year }
→ Cria MonthlyScheduleCycle com status "coletando_disponibilidade"
→ Cria os domingos (ServiceSchedule) vinculados ao cycleId
```

### 2. Músico Acessa "Minha Escala"
```
GET /schedules/my-assignments
→ Busca ciclo ativo: GET /schedules/cycles/current
→ Se houver ciclo: habilita botão "Disponibilidade"
→ Se não houver: mostra mensagem "Aguarde o administrador criar o ciclo"
```

### 3. Músico Clica em "Disponibilidade"
```
→ Abre AvailabilityForm
→ GET /schedules/cycles/:cycleId/sundays
→ Retorna lista de domingos do ciclo
```

### 4. Músico Responde Disponibilidade
```
Para cada domingo:
POST /schedules/availability
Body: { cycleId, sundayDate, available: true|false }
→ Cria AvailabilityResponse com:
   - cycleId
   - ministryMemberId (buscado pelo userId)
   - sundayDate
   - available
   - respondedAt
```

### 5. Admin Fecha Coleta
```
POST /schedules/cycles/:cycleId/close
→ Para de aceitar respostas de disponibilidade
→ Gera escalas automaticamente (fairness algorithm)
→ Status muda para "gerando" → "aguardando_aprovacao"
```

### 6. Admin Aprova e Publica
```
POST /schedules/cycles/:cycleId/approve
→ Aprova escalas geradas
→ Status muda para "publicada"

POST /schedules/cycles/:cycleId/publish
→ Notifica músicos via Telegram/WhatsApp
→ Escalas visíveis para todos
```

---

## Componentes Frontend

### MySchedule.tsx
- **Busca ciclo ativo** ao carregar
- **Habilita/desabilita** botão de disponibilidade baseado no ciclo
- **Mostra mensagem** explicativa se não há ciclo
- **Lista assignments** (escalas já publicadas)

### AvailabilityForm.tsx
- **Carrega domingos** do ciclo ativo
- **Permite selecionar** Disponível/Indisponível para cada domingo
- **Envia respostas** em batch (Promise.all)
- **Mostra confirmação** após envio

---

## Endpoints Envolvidos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/schedules/cycles/current` | GET | Busca ciclo ativo do ministério |
| `/schedules/cycles/:cycleId/sundays` | GET | Lista domingos do ciclo |
| `/schedules/availability` | POST | Responde disponibilidade (por domingo) |
| `/schedules/my-assignments` | GET | Lista escalas do músico |
| `/schedules/cycles/:cycleId/close` | POST | Fecha coleta (admin) |
| `/schedules/cycles/:cycleId/approve` | POST | Aprova escalas (admin) |
| `/schedules/cycles/:cycleId/publish` | POST | Publica e notifica (admin) |

---

## Estados da UI

### Sem Ciclo Ativo
```
┌─────────────────────────────────────┐
│  Meus Horários          [Disponibi- │
│  Suas próximas escalas   lidade] ❌  │
│                                     │
│  ℹ️ Não há ciclo de escalas ativo   │
│     no momento. Aguarde o           │
│     administrador criar o ciclo     │
│     mensal.                         │
└─────────────────────────────────────┘
```

### Com Ciclo Ativo (botão habilitado)
```
┌─────────────────────────────────────┐
│  Meus Horários          [Disponibi- │
│  Suas próximas escalas   lidade] ✅  │
│                                     │
│  [2] Pendentes    [5] Confirmados   │
│                                     │
│  [Filtros: Todos (7) | Pendentes (2) │
│           | Confirmados (5)]        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 15/Jan - Vocalista          │   │
│  │ [Confirmado]                │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Formulário de Disponibilidade Aberto
```
┌─────────────────────────────────────┐
│  📅 Sua disponibilidade             │
│                                     │
│  05/Fev  [Disponível] [Indisponível]│
│  12/Fev  [Disponível✅] [Indispon.] │
│  19/Fev  [Disponível] [Indispon.✅] │
│  26/Fev  [Disponível] [Indisponível]│
│                                     │
│  [Confirmar disponibilidade]        │
└─────────────────────────────────────┘
```

---

## Regras de Negócio

1. **Um ciclo por vez**: Só pode haver um ciclo ativo por ministério
2. **Deadline de disponibilidade**: Configurado em `MinistryConfig.availabilityDeadlineDays`
3. **Resposta única**: Músico pode alterar resposta até o fechamento
4. **Compound unique**: `cycleId_ministryMemberId_sundayDate` evita duplicatas
5. **Status do ciclo**:
   - `coletando_disponibilidade`: Músicos podem responder
   - `gerando`: Algoritmo criando escalas
   - `aguardando_aprovacao`: Admin revisa
   - `publicada`: Escalas visíveis, notificações enviadas

---

## Melhorias Implementadas (Fase 5)

✅ **MySchedule busca ciclo ativo** antes de habilitar disponibilidade  
✅ **Botão desabilitado** quando não há ciclo  
✅ **Mensagem explicativa** para músico  
✅ **Loading state** enquanto busca ciclo  
✅ **Disponibilidade persistida** via AvailabilityResponse  
✅ **Tradução de roles** via WORSHIP_ROLES  
✅ **Data correta** parseada do schedule.date  

---

## Próximos Passos (Sugestões)

1. **Notificar músico** quando ciclo for criado (Telegram/WhatsApp)
2. **Mostrar deadline** de disponibilidade na UI
3. **Lembrete automático** para músicos que não responderam
4. **Histórico de respostas** (músico vê suas respostas passadas)
5. **Bulk response** (marcar todos como disponível/indisponível)

---

**Data**: 2026-07-03  
**Status**: ✅ Implementado e testável