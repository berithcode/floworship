import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { useCycleActions } from '../../hooks/useCycleActions';
import { NextServiceCard } from '../../components/dashboard/NextServiceCard';
import { PendingConfirmationsCard } from '../../components/dashboard/PendingConfirmationsCard';
import { MinistryStatsCard } from '../../components/dashboard/MinistryStatsCard';
import { CycleStatusWidget } from '../../components/dashboard/CycleStatusWidget';
import { QuickActionsGrid } from '../../components/dashboard/QuickActionsGrid';
import { SundaySetlistCard } from '../../components/dashboard/SundaySetlistCard';
import { SkeletonCard } from '../../components/dashboard/SkeletonCard';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../hooks/useRole';
import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

// Nota: este componente antes envolvia tudo em <AuroraBackground> +
// <DashboardLayout sidebar={<Sidebar/>} main={...}/> por conta própria.
// Isso agora vem do AppShell (rota de layout em App.tsx), que já envolve
// TODAS as páginas internas — não só o Dashboard. Manter o wrapper aqui
// também duplicaria a sidebar e o fundo aurora.
export function DashboardNew() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const { metrics, upcomingServices, repertoireStats, loading, error, refetch } =
    useDashboardMetrics('current-ministry');
  
  const ministryName = user?.ministries?.[0]?.ministryId || '';
  const ministryId = user?.ministries?.[0]?.ministryId || '';

  const { executeAction, loading: actionLoading } = useCycleActions(refetch);

  const nextServiceWithRepertoire = useMemo(() => {
    return upcomingServices.find((s: any) => s.repertoire && s.repertoire.length > 0) || null;
  }, [upcomingServices]);

  const handleCycleAction = useCallback(() => {
    const status = metrics?.cycleStatus;
    const _cycleId = metrics?.cycleId;

    if (status === 'nenhum') {
      executeAction('create', undefined, ministryId);
    } else if (status === 'coletando_disponibilidade') {
      navigate('/schedules');
    } else if (status === 'aguardando_aprovacao') {
      navigate('/schedules');
    } else if (status === 'publicada') {
      executeAction('create', undefined, ministryId);
    } else if (status === 'gerando') {
      return;
    }
  }, [metrics?.cycleStatus, metrics?.cycleId, executeAction, navigate, ministryId]);

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-8 p-4 md:p-8">
        <DashboardHeader ministryName={ministryName} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <SkeletonCard />
          </div>
          <div className="space-y-4 md:space-y-6">
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <DashboardHeader ministryName={ministryName} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-error text-lg font-semibold mb-2">Erro ao carregar dashboard</p>
            <p className="text-text-primary/70 text-sm mb-4">{error.message}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-brand-blue text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5 p-4 md:p-6">
      <DashboardHeader ministryName={ministryName} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <NextServiceCard
          date={metrics?.nextService?.date}
          confirmed={metrics?.nextService?.confirmed}
          repertoireCount={metrics?.nextService?.repertoireCount}
          className={isAdmin ? 'md:col-span-2' : 'md:col-span-2 lg:col-span-4'}
          upcomingServices={upcomingServices}
        />
        {isAdmin && (
          <>
            <PendingConfirmationsCard count={metrics?.pendingConfirmations} />
            <MinistryStatsCard
              musiciansCount={metrics?.totalMusicians}
              musiciansNewThisMonth={repertoireStats?.newThisMonth}
              totalSongs={repertoireStats?.totalSongs}
              readyCount={metrics?.songsReady}
              onViewMusicians={() => navigate('/team')}
              onViewRepertoire={() => navigate('/library')}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {isAdmin ? (
          <>
            <div className="lg:col-span-2">
              <CycleStatusWidget
                status={metrics?.cycleStatus}
                deadline={metrics?.cycleDeadline}
                onAction={handleCycleAction}
                actionLoading={actionLoading !== null}
              />
            </div>
            <div>
              <QuickActionsGrid />
            </div>
          </>
        ) : (
          <>
            <div className="lg:col-span-2">
              <SundaySetlistCard service={nextServiceWithRepertoire} />
            </div>
            <div>
              <QuickActionsGrid />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
