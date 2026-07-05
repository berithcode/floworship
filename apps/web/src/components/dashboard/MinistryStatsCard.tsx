import { memo } from 'react';
import { Users, Music, ArrowRight } from 'lucide-react';

interface MinistryStatsCardProps {
  musiciansCount?: number;
  musiciansNewThisMonth?: number;
  totalSongs?: number;
  readyCount?: number;
  onViewMusicians?: () => void;
  onViewRepertoire?: () => void;
}

export const MinistryStatsCard = memo(function MinistryStatsCard({
  musiciansCount = 0,
  musiciansNewThisMonth = 0,
  totalSongs = 0,
  readyCount = 0,
  onViewMusicians,
  onViewRepertoire
}: MinistryStatsCardProps) {
  const readyPercent = totalSongs > 0 ? Math.round((readyCount / totalSongs) * 100) : 0;

  return (
    <div className="bg-bg-card-gray-dark rounded-[24px] p-6 border-2 border-border-subtle h-full flex flex-col justify-between">
      <div className="space-y-6">
        {/* Músicos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-info/30 bg-info/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-info" strokeWidth={2} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{musiciansCount}</p>
              <p className="text-xs text-text-primary/50 font-medium">Músicos</p>
            </div>
          </div>
          {musiciansNewThisMonth > 0 && (
            <span className="text-xs text-accent-mint font-medium">+{musiciansNewThisMonth} mês</span>
          )}
        </div>

        {/* Repertório */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-border-strong flex items-center justify-center">
              <Music className="w-4 h-4 text-text-primary/80" strokeWidth={2} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{totalSongs}</p>
              <p className="text-xs text-text-primary/50 font-medium">Repertório</p>
            </div>
          </div>
          {readyPercent > 0 && (
            <span className="text-xs text-accent-mint font-medium">{readyPercent}% pronto</span>
          )}
        </div>

        {/* Barra de progresso */}
        {totalSongs > 0 && (
          <div className="w-full bg-text-primary/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-accent-mint h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${readyPercent}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={onViewMusicians}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-accent-mint/30 text-accent-mint hover:bg-accent-mint/10 transition-colors text-xs font-medium"
        >
          Ver músicos
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={onViewRepertoire}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-accent-mint/30 text-accent-mint hover:bg-accent-mint/10 transition-colors text-xs font-medium"
        >
          Ver repertório
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});
