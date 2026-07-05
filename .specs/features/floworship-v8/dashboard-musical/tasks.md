# Dashboard Musical - Tasks de Implementação

## Fase 1: Backend (API) - 2 dias

### TSK-B01: Criar endpoint `GET /dashboard/metrics`
**Dependência**: Nenhuma  
**Estimativa**: 4h

**Descrição**:
Endpoint agregado que retorna todas as métricas principais do dashboard.

**Implementação**:
```typescript
// apps/api/src/routes/dashboard.ts
import { FastifyInstance } from 'fastify';
import { prisma } from '../db';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/metrics', async (request, reply) => {
    const { ministryId } = request.user; // Do token auth
    
    // Next service
    const nextService = await prisma.serviceSchedule.findFirst({
      where: {
        ministryId,
        date: { gte: new Date() }
      },
      orderBy: { date: 'asc' },
      include: {
        assignments: {
          where: { userId: request.user.id }
        }
      }
    });
    
    // Pending confirmations
    const pendingConfirmations = await prisma.serviceAssignment.count({
      where: {
        userId: request.user.id,
        status: 'pending',
        service: {
          ministryId,
          date: { gte: new Date() }
        }
      }
    });
    
    // Total musicians
    const totalMusicians = await prisma.ministryMember.count({
      where: {
        ministryId,
        role: 'musician'
      }
    });
    
    // Songs ready
    const songsReady = await prisma.song.count({
      where: {
        ministryId,
        status: 'pronta'
      }
    });
    
    // Cycle status
    const currentCycle = await prisma.monthlyScheduleCycle.findFirst({
      where: {
        ministryId,
        status: { in: ['coletando_disponibilidade', 'gerando', 'aguardando_aprovacao', 'publicada'] }
      },
      orderBy: { month: 'desc' }
    });
    
    reply.send({
      nextService: nextService ? {
        id: nextService.id,
        date: nextService.date,
        confirmed: nextService.assignments.some(a => a.status === 'confirmed'),
        repertoireCount: nextService.repertoireItems?.length || 0
      } : null,
      pendingConfirmations,
      totalMusicians,
      songsReady,
      cycleStatus: currentCycle?.status || 'nenhum',
      cycleDeadline: currentCycle?.availabilityDeadline
    });
  });
}
```

**Critérios de Aceitação**:
- [ ] Endpoint retorna dados corretos
- [ ] Protegido por autenticação
- [ ] Filtra por ministryId do usuário
- [ ] Teste unitário com Jest/Vitest

---

### TSK-B02: Criar endpoint `GET /dashboard/upcoming-services`
**Dependência**: TSK-B01  
**Estimativa**: 3h

**Descrição**:
Retorna lista dos próximos 4-6 cultos com status de confirmações e vagas.

**Implementação**:
```typescript
fastify.get('/upcoming-services', async (request, reply) => {
  const { ministryId } = request.user;
  
  const services = await prisma.serviceSchedule.findMany({
    where: {
      ministryId,
      date: { gte: new Date() }
    },
    take: 6,
    orderBy: { date: 'asc' },
    include: {
      assignments: {
        include: {
          user: true
        }
      },
      repertoireItems: {
        include: {
          song: true
        }
      }
    }
  });
  
  const formatted = services.map(service => {
    const confirmedCount = service.assignments.filter(
      a => a.status === 'confirmed'
    ).length;
    
    const vacantRoles = service.assignments
      .filter(a => a.status === 'vago')
      .map(a => a.role);
    
    return {
      id: service.id,
      date: service.date,
      confirmedCount,
      totalCount: service.assignments.length,
      vacantRoles: [...new Set(vacantRoles)], // Remove duplicates
      isConfirmed: service.assignments.some(
        a => a.userId === request.user.id && a.status === 'confirmed'
      ),
      repertoire: service.repertoireItems.map(r => ({
        songId: r.songId,
        title: r.song.title,
        order: r.order
      }))
    };
  });
  
  reply.send({ services: formatted });
});
```

**Critérios de Aceitação**:
- [ ] Retorna próximos 6 cultos
- [ ] Inclui contagem de confirmações
- [ ] Lista vagas pendentes
- [ ] Indica se usuário está confirmado

---

### TSK-B03: Criar endpoint `GET /dashboard/repertoire-stats`
**Dependência**: TSK-B01  
**Estimativa**: 3h

**Descrição**:
Estatísticas do repertório: total, status, músicas mais usadas.

**Implementação**:
```typescript
fastify.get('/repertoire-stats', async (request, reply) => {
  const { ministryId } = request.user;
  
  // Total by status
  const [totalPronta, totalRascunho, totalArquivada] = await Promise.all([
    prisma.song.count({ where: { ministryId, status: 'pronta' } }),
    prisma.song.count({ where: { ministryId, status: 'rascunho' } }),
    prisma.song.count({ where: { ministryId, status: 'arquivada' } })
  ]);
  
  // With cue sheets
  const withCueSheets = await prisma.songCueSheet.count({
    where: {
      song: { ministryId }
    }
  });
  
  // Most used (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const mostUsed = await prisma.serviceRepertoireItem.groupBy({
    by: ['songId'],
    where: {
      service: {
        ministryId,
        date: { gte: thirtyDaysAgo }
      }
    },
    _count: true,
    orderBy: {
      _count: { songId: 'desc' }
    },
    take: 5
  });
  
  const mostUsedWithDetails = await Promise.all(
    mostUsed.map(async item => {
      const song = await prisma.song.findUnique({
        where: { id: item.songId },
        select: { title: true, artist: true }
      });
      return {
        songId: item.songId,
        title: song?.title || 'Unknown',
        artist: song?.artist || '',
        count: item._count
      };
    })
  );
  
  // New this month
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);
  
  const newThisMonth = await prisma.song.count({
    where: {
      ministryId,
      createdAt: { gte: firstDayOfMonth }
    }
  });
  
  reply.send({
    totalSongs: totalPronta + totalRascunho + totalArquivada,
    byStatus: {
      pronta: totalPronta,
      rascunho: totalRascunho,
      arquivada: totalArquivada
    },
    withCueSheets,
    mostUsed: mostUsedWithDetails,
    newThisMonth
  });
});
```

**Critérios de Aceitação**:
- [ ] Retorna breakdown por status
- [ ] Calcula % com cifra completa
- [ ] Top 5 músicas mais usadas
- [ ] Contagem de músicas novas no mês

---

### TSK-B04: Criar endpoint `GET /dashboard/recent-activity`
**Dependência**: TSK-B01  
**Estimativa**: 3h

**Descrição**:
Timeline de atividade recente: sessões, mensagens WhatsApp, novos membros.

**Implementação**:
```typescript
fastify.get('/recent-activity', async (request, reply) => {
  const { ministryId } = request.user;
  
  // Recent sessions (last 7 days)
  const recentSessions = await prisma.sessionExecutionLog.findMany({
    where: {
      triggeredAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      session: {
        service: {
          ministryId
        }
      }
    },
    include: {
      session: {
        include: {
          service: true
        }
      }
    },
    orderBy: { triggeredAt: 'desc' },
    take: 5
  });
  
  // WhatsApp stats (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const [sent, delivered, failed] = await Promise.all([
    prisma.whatsappMessageLog.count({
      where: {
        ministryId,
        sentAt: { gte: sevenDaysAgo },
        status: 'sent'
      }
    }),
    prisma.whatsappMessageLog.count({
      where: {
        ministryId,
        sentAt: { gte: sevenDaysAgo },
        status: 'delivered'
      }
    }),
    prisma.whatsappMessageLog.count({
      where: {
        ministryId,
        sentAt: { gte: sevenDaysAgo },
        status: 'failed'
      }
    })
  ]);
  
  // New members (this month)
  const newMembers = await prisma.ministryMember.findMany({
    where: {
      ministryId,
      createdAt: { gte: firstDayOfMonth }
    },
    include: {
      user: true
    },
    take: 5
  });
  
  // Pending invites
  const pendingInvites = await prisma.invite.count({
    where: {
      ministryId,
      usedAt: null,
      expiresAt: { gte: new Date() }
    }
  });
  
  reply.send({
    recentSessions: recentSessions.map(s => ({
      id: s.id,
      serviceName: s.service.name,
      date: s.triggeredAt,
      duration: s.duration,
      hadOverride: s.wasOverride
    })),
    whatsappStats: {
      sent,
      delivered,
      failed,
      deliveryRate: Math.round((delivered / sent) * 100) || 0
    },
    newMembers: newMembers.map(m => ({
      id: m.id,
      name: m.user.name,
      email: m.user.email,
      joinedAt: m.createdAt
    })),
    pendingInvites
  });
});
```

**Critérios de Aceitação**:
- [ ] Retorna últimas 5 sessões
- [ ] Stats do WhatsApp (sent/delivered/failed)
- [ ] Novos membros do mês
- [ ] Convites pendentes

---

### TSK-B05: Otimizar queries com indexes
**Dependência**: TSK-B01, B02, B03, B04  
**Estimativa**: 2h

**Descrição**:
Adicionar indexes no Prisma para melhorar performance das queries do dashboard.

**Implementação**:
```prisma
// prisma/schema.prisma

model ServiceSchedule {
  // ... existing fields
  
  @@index([ministryId, date])
}

model ServiceAssignment {
  // ... existing fields
  
  @@index([userId, status])
  @@index([serviceId, status])
}

model Song {
  // ... existing fields
  
  @@index([ministryId, status])
}

model MinistryMember {
  // ... existing fields
  
  @@index([ministryId, role])
}

model SessionExecutionLog {
  // ... existing fields
  
  @@index([triggeredAt])
}

model WhatsAppMessageLog {
  // ... existing fields
  
  @@index([ministryId, sentAt, status])
}
```

**Critérios de Aceitação**:
- [ ] Migration criada e aplicada
- [ ] Queries do dashboard < 100ms
- [ ] Teste de carga com 1000+ registros

---

## Fase 2: Componentes do Dashboard - 2 dias

### TSK-F01: Criar `NextServiceCard.tsx`
**Dependência**: TSK-B01  
**Estimativa**: 2h

**Descrição**:
Card exibindo informações do próximo culto.

**Implementação**:
```tsx
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface NextServiceCardProps {
  date: string;
  confirmed: boolean;
  repertoireCount: number;
  onConfirm?: () => void;
  onDecline?: () => void;
}

export function NextServiceCard({ 
  date, 
  confirmed, 
  repertoireCount,
  onConfirm,
  onDecline 
}: NextServiceCardProps) {
  const serviceDate = new Date(date);
  const dayName = serviceDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayNumber = serviceDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });
  const time = serviceDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  return (
    <Card variant="gradient" gradient="brand" padding="lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-white/80 text-sm">Próximo Culto</p>
            <p className="text-white text-lg font-bold capitalize">{dayName}</p>
          </div>
        </div>
        
        {confirmed ? (
          <div className="flex items-center gap-1 text-success bg-success/20 px-3 py-1 rounded-full">
            <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-semibold">Confirmado</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-warning bg-warning/20 px-3 py-1 rounded-full">
            <XCircle className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-semibold">Pendente</span>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <p className="text-white text-2xl font-bold">
          {dayNumber} às {time}
        </p>
        <p className="text-white/60 text-sm mt-1">
          {repertoireCount} músicas no repertório
        </p>
      </div>
      
      {!confirmed && (
        <div className="flex gap-2">
          <Button 
            variant="glass" 
            size="sm" 
            fullWidth
            onClick={onConfirm}
            className="bg-success/20 hover:bg-success/30 border-success/30"
          >
            Confirmar
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onDecline}
            className="text-white hover:bg-white/10"
          >
            Recusar
          </Button>
        </div>
      )}
    </Card>
  );
}
```

**Critérios de Aceitação**:
- [ ] Exibe data/hora formatada
- [ ] Mostra status de confirmação
- [ ] Botões de confirmar/recusar (se pendente)
- [ ] Design consistente com spec

---

### TSK-F02: Criar `PendingConfirmationsCard.tsx`
**Dependência**: TSK-B01  
**Estimativa**: 1.5h

**Implementação similar ao TSK-F01**

---

### TSK-F03: Criar `MusiciansCountCard.tsx`
**Dependência**: TSK-B01  
**Estimativa**: 1.5h

---

### TSK-F04: Criar `RepertoireStatsCard.tsx`
**Dependência**: TSK-B03  
**Estimativa**: 2h

---

### TSK-F05: Criar `CycleStatusWidget.tsx`
**Dependência**: TSK-B01  
**Estimativa**: 2h

**Descrição**:
Widget mostrando status do ciclo mensal com countdown e ação contextual.

**Implementação**:
```tsx
import { Clock, CheckCircle, Hourglass, Send } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

type CycleStatus = 'coletando_disponibilidade' | 'gerando' | 'aguardando_aprovacao' | 'publicada';

interface CycleStatusWidgetProps {
  status: CycleStatus;
  deadline?: string;
  onAction?: () => void;
}

const statusConfig: Record<CycleStatus, {
  icon: React.ComponentType;
  label: string;
  color: string;
  actionLabel: string;
}> = {
  coletando_disponibilidade: {
    icon: Hourglass,
    label: 'Coletando disponibilidade',
    color: 'text-warning',
    actionLabel: 'Preencher Disponibilidade'
  },
  gerando: {
    icon: Clock,
    label: 'Gerando escala',
    color: 'text-info',
    actionLabel: 'Aguardar'
  },
  aguardando_aprovacao: {
    icon: Clock,
    label: 'Aguardando aprovação',
    color: 'text-warning',
    actionLabel: 'Aprovar Escala'
  },
  publicada: {
    icon: CheckCircle,
    label: 'Escala publicada',
    color: 'text-success',
    actionLabel: 'Ver Escala'
  }
};

export function CycleStatusWidget({ status, deadline, onAction }: CycleStatusWidgetProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const daysRemaining = deadline 
    ? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  
  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-6 h-6 ${config.color}`} strokeWidth={1.5} />
        <h3 className="text-lg font-semibold text-text-primary">{config.label}</h3>
      </div>
      
      {daysRemaining !== null && daysRemaining > 0 && (
        <p className="text-text-secondary text-sm mb-4">
          Deadline: {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes
        </p>
      )}
      
      {status !== 'gerando' && (
        <Button 
          variant={status === 'publicada' ? 'ghost' : 'primary'}
          size="sm"
          fullWidth
          onClick={onAction}
        >
          {config.actionLabel}
        </Button>
      )}
    </Card>
  );
}
```

**Critérios de Aceitação**:
- [ ] 4 estados do ciclo
- [ ] Countdown para deadline
- [ ] Botão de ação contextual
- [ ] Ícones e cores por status

---

### TSK-F06 a TSK-F09: Componentes restantes
**Estimativa**: 6h total

---

## Fase 3: Integração - 1 dia

### TSK-I01: Criar hook `useDashboardMetrics`
**Dependência**: TSK-B01 a B04, TSK-F01 a F09  
**Estimativa**: 3h

**Implementação**:
```typescript
import { useState, useEffect, useCallback } from 'react';

interface DashboardMetrics {
  nextService: { /* ... */ };
  pendingConfirmations: number;
  totalMusicians: number;
  songsReady: number;
  cycleStatus: string;
  cycleDeadline?: string;
}

export function useDashboardMetrics(ministryId: string) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/metrics');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchMetrics();
    
    // Polling a cada 60s
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);
  
  return { metrics, loading, error, refetch: fetchMetrics };
}
```

**Critérios de Aceitação**:
- [ ] Fetch inicial
- [ ] Polling 60s
- [ ] Loading state
- [ ] Error state
- [ ] Refetch manual

---

### TSK-I02: Refatorar `DashboardNew.tsx`
**Dependência**: TSK-I01  
**Estimativa**: 4h

**Descrição**:
Substituir dados mockados do dashboard financeiro pelos dados reais do ministério.

**Implementação**:
```tsx
import { AuroraBackground } from '../ui/AuroraBackground';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Sidebar } from '../layout/Sidebar';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { NextServiceCard } from '../dashboard/NextServiceCard';
import { PendingConfirmationsCard } from '../dashboard/PendingConfirmationsCard';
import { MusiciansCountCard } from '../dashboard/MusiciansCountCard';
import { RepertoireStatsCard } from '../dashboard/RepertoireStatsCard';
import { CycleStatusWidget } from '../dashboard/CycleStatusWidget';
import { UpcomingServicesList } from '../dashboard/UpcomingServicesList';
import { QuickActionsGrid } from '../dashboard/QuickActionsGrid';
import { RecentActivityTimeline } from '../dashboard/RecentActivityTimeline';

export function DashboardNew() {
  const { metrics, loading, error } = useDashboardMetrics('ministry-id');
  
  if (loading) {
    return (
      <AuroraBackground>
        <DashboardLayout
          sidebar={<Sidebar />}
          main={<div className="flex items-center justify-center h-full">Loading...</div>}
        />
      </AuroraBackground>
    );
  }
  
  if (error) {
    return (
      <AuroraBackground>
        <DashboardLayout
          sidebar={<Sidebar />}
          main={<div className="text-error">Error loading dashboard</div>}
        />
      </AuroraBackground>
    );
  }
  
  return (
    <AuroraBackground auroraIntensity="normal">
      <DashboardLayout
        sidebar={<Sidebar />}
        main={
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <NextServiceCard {...metrics.nextService} />
              <PendingConfirmationsCard count={metrics.pendingConfirmations} />
              <MusiciansCountCard count={metrics.totalMusicians} />
              <RepertoireStatsCard count={metrics.songsReady} />
            </div>
            
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <UpcomingServicesList />
                <CycleStatusWidget 
                  status={metrics.cycleStatus}
                  deadline={metrics.cycleDeadline}
                />
              </div>
              <div className="space-y-6">
                <QuickActionsGrid />
                <RecentActivityTimeline />
              </div>
            </div>
          </div>
        }
      />
    </AuroraBackground>
  );
}
```

**Critérios de Aceitação**:
- [ ] Layout responsivo
- [ ] Loading state
- [ ] Error state
- [ ] Dados reais da API
- [ ] Manter design system (aurora, glassmorphism)

---

## Fase 4: Testes - 1 dia

### TSK-T01 a TSK-T04: Testes unitários, integração, responsividade, acessibilidade
**Estimativa**: 6h total

---

## Resumo

| Fase | Tasks | Horas | Dias |
|------|-------|-------|------|
| Fase 1: Backend | 5 | 15h | 2 dias |
| Fase 2: Componentes | 9 | 16h | 2 dias |
| Fase 3: Integração | 2 | 7h | 1 dia |
| Fase 4: Testes | 4 | 6h | 1 dia |
| **Total** | **20** | **44h** | **6 dias** |

**Status**: Specs prontas, aguardando implementação
**Prioridade**: Alta
**Dependências**: Nenhuma (pode começar imediatamente)