import { useState } from 'react';
import { Users, Calendar, TrendingUp, Music, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/reports/StatCard';
import { ServiceHistoryTable } from '../../components/reports/ServiceHistoryTable';
import { PresenceRanking } from '../../components/reports/PresenceRanking';
import { useAdminReports } from '../../hooks/useAdminReports';

export function AdminReports() {
  const { user } = useAuth();
  const { generalStats, serviceHistory, loading, error, refetch } = useAdminReports();
  const [periodFilter, setPeriodFilter] = useState<'all' | '30d' | '90d'>('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-accent-mint border-t-transparent animate-spin" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Card variant="gray-dark" padding="lg">
          <div className="flex flex-col items-center text-center gap-2 py-6">
            <AlertCircle className="w-10 h-10 text-danger" strokeWidth={1.5} />
            <p className="text-text-primary font-medium">Erro ao carregar relatórios</p>
            <p className="text-text-primary/60 text-sm">{error.message}</p>
            <Button variant="primary" size="sm" onClick={refetch} className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const ministry = user?.ministries?.[0];
  const cyclesLabels: Record<string, string> = {
    nenhum: 'Sem ciclo ativo',
    coletando_disponibilidade: 'Coletando disponibilidade',
    gerando: 'Gerando escala',
    aguardando_aprovacao: 'Aguardando aprovação',
    publicada: 'Escala publicada'
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Relatórios</h1>
          <p className="text-text-primary/60 text-sm mt-1">
            Visão geral do ministério {ministry?.ministryId || ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-bg-secondary border border-border-subtle rounded-xl p-1">
            {[
              { value: 'all' as const, label: 'Tudo' },
              { value: '30d' as const, label: '30 dias' },
              { value: '90d' as const, label: '90 dias' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriodFilter(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  periodFilter === opt.value
                    ? 'bg-accent-mint text-on-mint'
                    : 'text-text-primary/70 hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Músicos"
          value={generalStats?.totalMusicians || 0}
          icon={Users}
          iconColor="info"
          helperText="Total no ministério"
        />
        <StatCard
          label="Serviços"
          value={generalStats?.totalServices || 0}
          icon={Calendar}
          iconColor="brand-purple"
          helperText="Histórico registrado"
        />
        <StatCard
          label="Presença"
          value={`${generalStats?.averagePresence || 0}%`}
          icon={TrendingUp}
          iconColor={generalStats && generalStats.averagePresence >= 80 ? 'success' : generalStats && generalStats.averagePresence >= 60 ? 'warning' : 'danger'}
          helperText="Média de confirmações"
        />
        <StatCard
          label="Músicas"
          value={generalStats?.repertoireStats?.totalSongs || 0}
          icon={Music}
          iconColor="mint"
          helperText={`${generalStats?.repertoireStats?.newThisMonth || 0} novas no mês`}
        />
      </div>

      {(generalStats?.pendingConfirmations || 0) > 0 && (
        <Card variant="gray-dark" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/15 border border-warning/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-warning" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-text-primary font-medium text-sm">
                {generalStats?.pendingConfirmations} confirmações pendentes
              </p>
              <p className="text-text-primary/60 text-xs mt-0.5">
                Status do ciclo: {cyclesLabels[generalStats?.cycleStatus || 'nenhum']}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ServiceHistoryTable services={serviceHistory} maxItems={10} />
        </div>

        <div>
          <PresenceRanking rankings={[]} />
        </div>
      </div>

      <Card variant="gray-dark" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-text-primary font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-text-primary/70" strokeWidth={1.5} />
              Top Músicas do Repertório
            </h3>
            <p className="text-text-primary/60 text-xs mt-0.5">
              Mais utilizadas nos últimos 30 dias
            </p>
          </div>
        </div>

        {generalStats?.repertoireStats?.mostUsed && generalStats.repertoireStats.mostUsed.length > 0 ? (
          <div className="space-y-2">
            {generalStats.repertoireStats.mostUsed.map((song, index) => (
              <div
                key={song.songId}
                className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-primary text-accent-mint font-semibold text-sm shrink-0">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium truncate">
                    {song.title}
                  </p>
                  {song.artist && (
                    <p className="text-text-primary/60 text-xs mt-0.5 truncate">
                      {song.artist}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-text-primary font-semibold text-sm">
                    {song.count}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-text-primary/60 text-sm">
              Nenhuma música registrada nos últimos 30 dias
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
