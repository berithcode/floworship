import { memo } from 'react';
import { Users, ArrowRight } from 'lucide-react';

interface MusiciansCountCardProps {
  count?: number;
  newThisMonth?: number;
  onViewAll?: () => void;
}

export const MusiciansCountCard = memo(function MusiciansCountCard({
  count = 0,
  newThisMonth = 0,
  onViewAll
}: MusiciansCountCardProps) {
  return (
    <div className="bg-bg-card-gray-dark rounded-[24px] p-6 border-2 border-border-subtle h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full border border-info/30 bg-info/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-info" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm text-text-primary/50">Total</p>
            <p className="text-lg font-bold text-text-primary">Músicos</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[32px] leading-tight font-bold tracking-tight text-text-primary">{count}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-text-primary/40 font-medium">
              {count === 0
                ? 'Nenhum músico'
                : `${count} ${count === 1 ? 'músico' : 'músicos'} no ministério`}
            </p>
          </div>
        </div>

        {newThisMonth > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(newThisMonth, 3) }).map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-accent-mint/20 border border-bg-card-gray-dark"
                />
              ))}
            </div>
            <span className="text-xs text-text-primary/40 font-medium">novos este mês</span>
          </div>
        )}
      </div>

      <div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-accent-mint/30 text-accent-mint hover:bg-accent-mint/10 transition-colors text-sm font-medium"
        >
          Ver todos
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});