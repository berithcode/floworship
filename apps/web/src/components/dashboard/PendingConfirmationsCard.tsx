import { memo } from 'react';
import { Bell } from 'lucide-react';

interface PendingConfirmationsCardProps {
  count?: number;
  onViewAll?: () => void;
}

export const PendingConfirmationsCard = memo(function PendingConfirmationsCard({
  count = 0,
  onViewAll
}: PendingConfirmationsCardProps) {
  return (
    <div className="bg-bg-card-gray-dark rounded-[24px] p-6 border-2 border-border-subtle h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full border border-warning/30 bg-warning/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-warning" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm text-text-primary/50">Confirmações</p>
            <p className="text-lg font-bold text-text-primary">Pendentes</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[32px] leading-tight font-bold tracking-tight text-text-primary">{count}</p>
          <p className="text-sm mt-1 text-text-primary/40 font-medium">
            {count === 0
              ? 'Todas as confirmações em dia'
              : `${count} ${count === 1 ? 'pendente' : 'pendentes'}`}
          </p>
        </div>
      </div>

      <div>
        {count > 0 && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-accent-mint/30 text-accent-mint hover:bg-accent-mint/10 transition-colors text-sm font-medium"
          >
            Responder agora
          </button>
        )}

        {count === 0 && (
          <div className="flex items-center gap-2 text-accent-mint text-sm">
            <span>Tudo em dia</span>
          </div>
        )}
      </div>
    </div>
  );
});