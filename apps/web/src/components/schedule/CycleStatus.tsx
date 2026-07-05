import { memo } from 'react';

type CycleStatusType = 'coletando_disponibilidade' | 'gerando' | 'aguardando_aprovacao' | 'publicada';

interface CycleStatusProps {
  status: CycleStatusType | string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  coletando_disponibilidade: { label: 'Coletando disponibilidade', color: 'bg-warning/15 text-warning border-warning/30' },
  gerando: { label: 'Gerando escalas', color: 'bg-info/15 text-info border-info/30' },
  aguardando_aprovacao: { label: 'Aguardando aprovação', color: 'bg-warning/15 text-warning border-warning/30' },
  publicada: { label: 'Publicada', color: 'bg-success/15 text-success border-success/30' },
};

export const CycleStatus = memo(function CycleStatus({ status }: CycleStatusProps) {
  const config = statusConfig[status] || { label: status.replace(/_/g, ' '), color: 'bg-bg-tertiary text-text-primary/50 border-border-subtle' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
});