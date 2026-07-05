# Dashboard Musical - Design Architecture

## 1. Visão Geral

Este documento descreve a arquitetura técnica para transformar o dashboard financeiro (atual) em um dashboard de ministério de música, mantendo o design system moderno já implementado.

---

## 2. Decisões Arquiteturais

### 2.1: Manter Design System Existente

**Decisão**: NÃO remover aurora effects, glassmorphism, ou layout de 2 cards.

**Racional**:
- Design system já foi aprovado e implementado
- Consistência visual com o resto da aplicação
- Moderno e esteticamente agradável

**Implementação**:
```tsx
// Manter estrutura atual
<AuroraBackground auroraIntensity="normal">
  <DashboardLayout
    sidebar={<Sidebar />}
    main={<DashboardContent />}
  />
</AuroraBackground>
```

---

### 2.2: Dados Reais vs Mock

**Decisão**: Criar camada de hooks com fallback para dados mockados durante desenvolvimento.

**Racional**:
- Frontend pode desenvolver sem backend pronto
- Fácil transição para dados reais
- Testes podem usar mocks

**Implementação**:
```typescript
// hooks/useDashboardMetrics.ts
const USE_MOCKS = process.env.NODE_ENV === 'development';

export function useDashboardMetrics(ministryId: string) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  
  useEffect(() => {
    if (USE_MOCKS) {
      setMetrics(mockDashboardData);
      return;
    }
    
    // Fetch real data from API
    fetch('/api/dashboard/metrics')
      .then(res => res.json())
      .then(setMetrics);
  }, [ministryId]);
  
  return { metrics, loading: false, error: null };
}
```

---

### 2.3: Polling Strategy

**Decisão**: Polling de 60s para métricas, sem WebSocket inicialmente.

**Racional**:
- Simplicidade de implementação
- Dados do dashboard não precisam de real-time absoluto
- WebSocket pode ser adicionado depois se necessário

**Implementação**:
```typescript
useEffect(() => {
  fetchMetrics();
  const interval = setInterval(fetchMetrics, 60000); // 60s
  return () => clearInterval(interval);
}, []);
```

---

### 2.4: Componentes por Domínio

**Decisão**: Organizar componentes por domínio do negócio, não por tipo.

**Estrutura**:
```
apps/web/src/components/dashboard/
├── NextServiceCard.tsx          # Domínio: Serviços
├── PendingConfirmationsCard.tsx # Domínio: Serviços
├── CycleStatusWidget.tsx        # Domínio: Escalas
├── UpcomingServicesList.tsx     # Domínio: Escalas
├── RepertoireStatsCard.tsx      # Domínio: Repertório
├── QuickActionsGrid.tsx         # Domínio: Ações
└── RecentActivityTimeline.tsx   # Domínio: Atividade
```

**Racional**:
- Fácil encontrar componentes
- Agrupamento por contexto de negócio
- Reuso facilitado

---

## 3. Estrutura de Componentes

### 3.1: Dashboard Layout (Manter)

```tsx
// components/layout/DashboardLayout.tsx
<div className="flex gap-6 p-6 h-screen">
  {/* Card 1: Sidebar (280px) */}
  <aside className="w-[280px]">
    <Card variant="aurora" auroraColor="blue">
      <Sidebar />
    </Card>
  </aside>
  
  {/* Card 2: Main Content (flex-1) */}
  <main className="flex-1">
    <Card variant="aurora" auroraColor="purple">
      <div className="p-8 overflow-auto">
        {children}
      </div>
    </Card>
  </main>
</div>
```

### 3.2: Dashboard Content (Novo)

```tsx
// pages/dashboard/DashboardNew.tsx
<div className="space-y-8">
  {/* Row 1: Quick Stats (4 cards) */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <NextServiceCard />
    <PendingConfirmationsCard />
    <MusiciansCountCard />
    <RepertoireStatsCard />
  </div>
  
  {/* Row 2: Main Content (2/3 + 1/3) */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Left: 2/3 */}
    <div className="lg:col-span-2 space-y-6">
      <UpcomingServicesList />
      <CycleStatusWidget />
    </div>
    
    {/* Right: 1/3 */}
    <div className="space-y-6">
      <QuickActionsGrid />
      <RecentActivityTimeline />
    </div>
  </div>
</div>
```

---

## 4. Design Tokens

### 4.1: Cores das Métricas

```typescript
// styles/metricColors.ts
export const metricColors = {
  success: {
    bg: 'bg-success/20',
    text: 'text-success',
    border: 'border-success/30'
  },
  warning: {
    bg: 'bg-warning/20',
    text: 'text-warning',
    border: 'border-warning/30'
  },
  error: {
    bg: 'bg-error/20',
    text: 'text-error',
    border: 'border-error/30'
  },
  info: {
    bg: 'bg-info/20',
    text: 'text-info',
    border: 'border-info/30'
  }
};
```

### 4.2: Breakpoints

```typescript
// Mobile: < 768px - 1 coluna
// Tablet: 768px - 1023px - 2 colunas
// Desktop: ≥ 1024px - 3-4 colunas

<NextServiceCard className="
  col-span-1
  md:col-span-2 lg:col-span-1
" />
```

---

## 5. Estado e Data Fetching

### 5.1: Hook Principal

```typescript
// hooks/useDashboardMetrics.ts
interface DashboardMetrics {
  nextService: {
    id: string;
    date: string;
    confirmed: boolean;
    repertoireCount: number;
  } | null;
  pendingConfirmations: number;
  totalMusicians: number;
  songsReady: number;
  cycleStatus: CycleStatus;
  cycleDeadline?: string;
}

interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDashboardMetrics(ministryId: string): UseDashboardMetricsReturn {
  // Implementation with polling
}
```

### 5.2: Cache Strategy

```typescript
// Cache por 5 minutos
const CACHE_DURATION = 5 * 60 * 1000;

let cachedMetrics: DashboardMetrics | null = null;
let cacheTime: number = 0;

function isCacheValid() {
  return cachedMetrics && (Date.now() - cacheTime < CACHE_DURATION);
}
```

---

## 6. API Contract

### 6.1: Response Shapes

```typescript
// GET /api/dashboard/metrics
interface DashboardMetricsResponse {
  nextService: {
    id: string;
    date: ISO8601;
    confirmed: boolean;
    repertoireCount: number;
  } | null;
  pendingConfirmations: number;
  totalMusicians: number;
  songsReady: number;
  cycleStatus: CycleStatus;
  cycleDeadline?: ISO8601;
}

// GET /api/dashboard/upcoming-services
interface UpcomingServicesResponse {
  services: {
    id: string;
    date: ISO8601;
    confirmedCount: number;
    totalCount: number;
    vacantRoles: string[];
    isConfirmed: boolean;
    repertoire: {
      songId: string;
      title: string;
      order: number;
    }[];
  }[];
}

// GET /api/dashboard/repertoire-stats
interface RepertoireStatsResponse {
  totalSongs: number;
  byStatus: {
    pronta: number;
    rascunho: number;
    arquivada: number;
  };
  withCueSheets: number;
  mostUsed: {
    songId: string;
    title: string;
    artist: string;
    count: number;
  }[];
  newThisMonth: number;
}

// GET /api/dashboard/recent-activity
interface RecentActivityResponse {
  recentSessions: {
    id: string;
    serviceName: string;
    date: ISO8601;
    duration?: number;
    hadOverride: boolean;
  }[];
  whatsappStats: {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  };
  newMembers: {
    id: string;
    name: string;
    email: string;
    joinedAt: ISO8601;
  }[];
  pendingInvites: number;
}
```

---

## 7. Loading States

### 7.1: Skeleton Screens

```tsx
// components/dashboard/SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <Card variant="glass" padding="lg">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface" />
          <div className="flex-1">
            <div className="h-4 bg-surface rounded w-24 mb-2" />
            <div className="h-6 bg-surface rounded w-32" />
          </div>
        </div>
        <div className="h-8 bg-surface rounded w-48" />
      </div>
    </Card>
  );
}
```

### 7.2: Dashboard Loading

```tsx
if (loading) {
  return (
    <DashboardLayout sidebar={<Sidebar />} main={
      <div className="space-y-8">
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    } />
  );
}
```

---

## 8. Error States

### 8.1: Error Boundary

```tsx
// components/ErrorBoundary.tsx
export function DashboardError({ error, onRetry }: { error: Error, onRetry: () => void }) {
  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-center gap-3 text-error mb-4">
        <AlertCircle className="w-6 h-6" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold">Erro ao carregar dashboard</h3>
      </div>
      <p className="text-text-secondary text-sm mb-4">
        {error.message || 'Não foi possível carregar os dados. Tente novamente.'}
      </p>
      <Button variant="primary" onClick={onRetry}>
        Tentar Novamente
      </Button>
    </Card>
  );
}
```

---

## 9. Responsividade

### 9.1: Mobile (< 768px)

```tsx
<div className="
  grid 
  grid-cols-1 
  gap-4
  p-4
">
  {/* Cards stackados verticalmente */}
  <NextServiceCard />
  <PendingConfirmationsCard />
  <MusiciansCountCard />
  <RepertoireStatsCard />
</div>
```

### 9.2: Tablet (768px - 1023px)

```tsx
<div className="
  grid 
  grid-cols-2 
  gap-6
  p-6
">
  {/* 2 cards por row */}
  <NextServiceCard />
  <PendingConfirmationsCard />
  <MusiciansCountCard />
  <RepertoireStatsCard />
</div>
```

### 9.3: Desktop (≥ 1024px)

```tsx
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-4 
  gap-6
  p-6
">
  {/* 4 cards em uma row */}
}
```

---

## 10. Acessibilidade

### 10.1: ARIA Labels

```tsx
<Card 
  variant="gradient"
  role="region"
  aria-label="Próximo culto"
>
  <h2 className="sr-only">Informações do próximo culto</h2>
  {/* Content */}
</Card>
```

### 10.2: Focus Management

```tsx
<Button
  variant="primary"
  onClick={handleConfirm}
  className="focus-visible:outline-2 focus-visible:outline-brand-blue focus-visible:outline-offset-2"
>
  Confirmar
</Button>
```

### 10.3: Keyboard Navigation

```tsx
// Tab order lógico
// Sidebar nav → Quick stats cards → Main content → Actions
```

---

## 11. Performance

### 11.1: Memoization

```tsx
export const NextServiceCard = memo(function NextServiceCard(props) {
  // Component implementation
});
```

### 11.2: Lazy Loading

```tsx
// Componentes pesados carregados sob demanda
const RepertoireChart = lazy(() => import('../dashboard/RepertoireChart'));

<Suspense fallback={<SkeletonCard />}>
  <RepertoireChart />
</Suspense>
```

### 11.3: Virtualization (Futuro)

```tsx
// Para listas longas (atividade recente)
import { useVirtualizer } from '@tanstack/react-virtual';

<VirtualList
  items={activities}
  renderItem={(activity) => <ActivityItem key={activity.id} {...activity} />}
/>
```

---

## 12. Internacionalização (Futuro)

### 12.1: Estrutura i18n

```typescript
// locales/pt-BR/dashboard.json
{
  "dashboard": {
    "title": "Dashboard",
    "nextService": "Próximo Culto",
    "pendingConfirmations": "Confirmações Pendentes",
    "musiciansCount": "Músicos",
    "repertoireStats": "Repertório"
  }
}

// locales/en/dashboard.json
{
  "dashboard": {
    "title": "Dashboard",
    "nextService": "Next Service",
    "pendingConfirmations": "Pending Confirmations",
    "musiciansCount": "Musicians",
    "repertoireStats": "Repertoire"
  }
}
```

---

## 13. Monitoramento

### 13.1: Analytics Events

```typescript
// Track dashboard interactions
trackEvent('dashboard_loaded', { ministryId, loadTime });
trackEvent('dashboard_action_clicked', { action: 'confirm_attendance' });
trackEvent('dashboard_card_clicked', { card: 'next_service' });
```

### 13.2: Performance Metrics

```typescript
// Monitor dashboard performance
const loadTime = performance.now() - startTime;
if (loadTime > 2000) {
  trackError('dashboard_slow_load', { loadTime, ministryId });
}
```

---

## 14. Referências

- **Spec**: `.specs/features/floworship-v8/dashboard-musical/spec.md`
- **Tasks**: `.specs/features/floworship-v8/dashboard-musical/tasks.md`
- **Design System**: `.specs/features/ui-refactoring/spec.md`
- **Backend Schema**: `prisma/schema.prisma`