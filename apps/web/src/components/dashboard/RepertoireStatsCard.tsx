import { memo } from 'react';
import { Music, ArrowRight } from 'lucide-react';

interface RepertoireStatsCardProps {
  totalSongs?: number;
  readyCount?: number;
  newThisMonth?: number;
  onViewAll?: () => void;
}

export const RepertoireStatsCard = memo(function RepertoireStatsCard({
  totalSongs = 0,
  readyCount = 0,
  newThisMonth = 0,
  onViewAll
}: RepertoireStatsCardProps) {
  const readyPercent = totalSongs > 0 ? Math.round((readyCount / totalSongs) * 100) : 0;

  return (
    <div className="bg-bg-card-gray-dark rounded-[24px] p-6 border-2 border-border-subtle h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border border-border-strong flex items-center justify-center">
              <Music className="w-5 h-5 text-text-primary/80" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm text-text-primary/50">Total</p>
              <p className="text-lg font-bold text-text-primary">Repertório</p>
            </div>
          </div>
          {newThisMonth > 0 && (
            <div className="px-3 py-1 rounded-full bg-accent-mint/10">
              <span className="text-xs font-bold text-accent-mint">+{newThisMonth} mês</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-[32px] leading-tight font-bold tracking-tight text-text-primary">{totalSongs}</p>
          <p className="text-sm mt-1 text-text-primary/40 font-medium">
            {readyCount} prontas ({readyPercent}%)
          </p>
        </div>

        <div className="w-full bg-text-primary/5 rounded-full h-1.5 mb-6 overflow-hidden">
          <div
            className="bg-accent-mint h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${readyPercent}%` }}
          />
        </div>
      </div>

      <div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-accent-mint/30 text-accent-mint hover:bg-accent-mint/10 transition-colors text-sm font-medium"
        >
          Ver repertório
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
