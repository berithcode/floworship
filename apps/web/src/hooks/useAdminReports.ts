import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface ServiceHistoryItem {
  id: string;
  date: string;
  type: 'culto' | 'ensaio';
  confirmedCount: number;
  totalCount: number;
  vacantRoles: string[];
  repertoireCount: number;
  hasHappened: boolean;
}

export interface PresenceRank {
  memberId: string;
  name: string;
  role?: string;
  confirmed: number;
  total: number;
  percent: number;
  trend?: 'up' | 'down' | 'stable';
}

interface GeneralStats {
  totalMusicians: number;
  totalServices: number;
  averagePresence: number;
  pendingConfirmations: number;
  repertoireStats: {
    totalSongs: number;
    mostUsed: Array<{ songId: string; title: string; artist: string; count: number }>;
    newThisMonth: number;
  };
  cycleStatus: string;
}

interface UseAdminReportsReturn {
  generalStats: GeneralStats | null;
  serviceHistory: ServiceHistoryItem[];
  presenceRanking: PresenceRank[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAdminReports(): UseAdminReportsReturn {
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryItem[]>([]);
  const [presenceRanking, setPresenceRanking] = useState<PresenceRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, servicesRes, repertoireRes, pastServicesRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/metrics`, { credentials: 'include' }),
        fetch(`${API_URL}/dashboard/upcoming-services`, { credentials: 'include' }),
        fetch(`${API_URL}/dashboard/repertoire-stats`, { credentials: 'include' }),
        fetch(`${API_URL}/sessions?type=past&take=20`, { credentials: 'include' })
      ]);

      if (!metricsRes.ok) throw new Error('Failed to fetch metrics');

      const metrics = await metricsRes.json();
      const upcomingRaw = servicesRes.ok ? await servicesRes.json() : { services: [] };
      const repertoire = repertoireRes.ok ? await repertoireRes.json() : null;
      const pastRaw = pastServicesRes.ok ? await pastServicesRes.json() : [];

      const now = Date.now();
      const upcomingProcessed: ServiceHistoryItem[] = (upcomingRaw.services || []).map((s: any) => ({
        id: s.id,
        date: s.date,
        type: 'culto' as const,
        confirmedCount: s.confirmedCount,
        totalCount: s.totalCount,
        vacantRoles: s.vacantRoles || [],
        repertoireCount: (s.repertoire || []).length,
        hasHappened: false
      }));

      const pastProcessed: ServiceHistoryItem[] = Array.isArray(pastRaw) ? pastRaw.map((s: any) => ({
        id: s.id,
        date: s.date,
        type: (s.sessionType || s.type || 'culto') as 'culto' | 'ensaio',
        confirmedCount: s.confirmedCount || (s.assignments?.filter((a: any) => a.status === 'confirmed').length ?? 0),
        totalCount: s.totalCount || (s.assignments?.length ?? 0),
        vacantRoles: s.vacantRoles || [],
        repertoireCount: s.repertoireCount ?? 0,
        hasHappened: new Date(s.date).getTime() < now
      })) : [];

      const allHistory = [...pastProcessed, ...upcomingProcessed]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const pastHistoryForRanking = pastProcessed.filter(s => s.confirmedCount !== undefined);
      const totalConfirmed = pastHistoryForRanking.reduce((sum, s) => sum + s.confirmedCount, 0);
      const totalSlots = pastHistoryForRanking.reduce((sum, s) => sum + s.totalCount, 0);
      const avgPresence = totalSlots > 0 ? Math.round((totalConfirmed / totalSlots) * 100) : 0;

      const stats: GeneralStats = {
        totalMusicians: metrics.totalMusicians || 0,
        totalServices: pastProcessed.length,
        averagePresence: avgPresence,
        pendingConfirmations: metrics.pendingConfirmations || 0,
        repertoireStats: {
          totalSongs: repertoire?.totalSongs || 0,
          mostUsed: repertoire?.mostUsed || [],
          newThisMonth: repertoire?.newThisMonth || 0
        },
        cycleStatus: metrics.cycleStatus || 'nenhum'
      };

      setGeneralStats(stats);
      setServiceHistory(allHistory);

      setPresenceRanking([]);
    } catch (err) {
      setError(err as Error);
      setGeneralStats(null);
      setServiceHistory([]);
      setPresenceRanking([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { generalStats, serviceHistory, presenceRanking, loading, error, refetch: fetchAll };
}
