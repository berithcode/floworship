import { useState, useEffect, useCallback } from 'react';

const USE_MOCKS = false;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

interface NextServiceData {
  id: string;
  date: string;
  confirmed: boolean;
  repertoireCount: number;
}

interface DashboardMetrics {
  nextService: NextServiceData | null;
  pendingConfirmations: number;
  totalMusicians: number;
  songsReady: number;
  cycleStatus: 'coletando_disponibilidade' | 'gerando' | 'aguardando_aprovacao' | 'publicada' | 'nenhum';
  cycleId?: string;
  cycleDeadline?: string;
}

interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics | null;
  upcomingServices: any[];
  repertoireStats: any;
  recentActivity: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const mockMetrics: DashboardMetrics = {
  nextService: {
    id: 'mock-1',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    confirmed: false,
    repertoireCount: 5
  },
  pendingConfirmations: 3,
  totalMusicians: 24,
  songsReady: 42,
  cycleStatus: 'coletando_disponibilidade',
  cycleId: 'mock-cycle-1',
  cycleDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
};

const mockUpcomingServices = [
  {
    id: 's1',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    confirmedCount: 5,
    totalCount: 8,
    vacantRoles: ['Baixo', 'Bateria'],
    isConfirmed: false,
    repertoire: [
      { songId: 'm1', title: 'Grandioso És Tu', order: 1 },
      { songId: 'm2', title: 'Como A Chuva', order: 2 }
    ]
  },
  {
    id: 's2',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    confirmedCount: 6,
    totalCount: 8,
    vacantRoles: [],
    isConfirmed: true,
    repertoire: [
      { songId: 'm3', title: 'Lindo És', order: 1 },
      { songId: 'm4', title: 'Rendido Estou', order: 2 },
      { songId: 'm5', title: 'Tu És Bom', order: 3 }
    ]
  }
];

const mockRepertoireStats = {
  totalSongs: 67,
  byStatus: { pronta: 42, rascunho: 18, arquivada: 7 },
  withCueSheets: 38,
  mostUsed: [
    { songId: 'm1', title: 'Grandioso És Tu', artist: '', count: 12 },
    { songId: 'm3', title: 'Lindo És', artist: '', count: 10 }
  ],
  newThisMonth: 3
};

const mockRecentActivity = [
  { id: 'a1', type: 'session' as const, description: 'Sessão de culto iniciada', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'success' as const },
  { id: 'a2', type: 'whatsapp' as const, description: 'Lembrete enviado para 8 músicos', date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), status: 'success' as const },
  { id: 'a3', type: 'member' as const, description: 'Novo músico: Ana Silva', date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), status: 'info' as const },
  { id: 'a4', type: 'invite' as const, description: 'Convite enviado para Marcos', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'warning' as const },
  { id: 'a5', type: 'session' as const, description: 'Escala de domingo publicada', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'success' as const },
];

export function useDashboardMetrics(ministryId: string): UseDashboardMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [upcomingServices, setUpcomingServices] = useState<any[]>([]);
  const [repertoireStats, setRepertoireStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (USE_MOCKS) {
        await new Promise(r => setTimeout(r, 600));
        setMetrics(mockMetrics);
        setUpcomingServices(mockUpcomingServices);
        setRepertoireStats(mockRepertoireStats);
        setRecentActivity(mockRecentActivity);
      } else {
        const [metricsRes, servicesRes, repertoireRes, activityRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/metrics`, { credentials: 'include' }),
          fetch(`${API_URL}/dashboard/upcoming-services`, { credentials: 'include' }),
          fetch(`${API_URL}/dashboard/repertoire-stats`, { credentials: 'include' }),
          fetch(`${API_URL}/dashboard/recent-activity`, { credentials: 'include' })
        ]);

        if (!metricsRes.ok) throw new Error('Failed to fetch dashboard metrics');
        if (!servicesRes.ok) throw new Error('Failed to fetch upcoming services');

        const metricsData = await metricsRes.json();
        const servicesData = await servicesRes.json();
        const repertoireData = await repertoireRes.json();
        const activityData = await activityRes.json();

        const activities = [
          ...(activityData.recentSessions || []).map((s: any) => ({
            id: `session-${s.id}`,
            type: 'session' as const,
            description: `Sessão por ${s.triggeredBy}${s.hadOverride ? ' (override)' : ''}`,
            date: s.date,
            status: 'success' as const,
          })),
          ...(activityData.newMembers || []).map((m: any) => ({
            id: `member-${m.id}`,
            type: 'member' as const,
            description: `Novo músico: ${m.name}`,
            date: m.joinedAt,
            status: 'info' as const,
          })),
          ...(activityData.whatsappStats?.sent > 0 ? [{
            id: 'wa-stats',
            type: 'whatsapp' as const,
            description: `${activityData.whatsappStats.sent} mensagens enviadas (${activityData.whatsappStats.deliveryRate}% entrega)`,
            date: new Date().toISOString(),
            status: activityData.whatsappStats.failed > 0 ? 'warning' as const : 'success' as const,
          }] : []),
          ...(activityData.pendingInvites > 0 ? [{
            id: 'pending-invites',
            type: 'invite' as const,
            description: `${activityData.pendingInvites} convite${activityData.pendingInvites > 1 ? 's' : ''} pendente${activityData.pendingInvites > 1 ? 's' : ''}`,
            date: new Date().toISOString(),
            status: 'warning' as const,
          }] : []),
        ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setMetrics(metricsData);
        setUpcomingServices(servicesData.services || []);
        setRepertoireStats(repertoireData);
        setRecentActivity(activities);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [ministryId]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { metrics, upcomingServices, repertoireStats, recentActivity, loading, error, refetch: fetchAll };
}
