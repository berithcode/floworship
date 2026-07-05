import { memo } from 'react';
import { Clock, CheckCircle, Hourglass, CalendarCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

type CycleStatus = 'coletando_disponibilidade' | 'gerando' | 'aguardando_aprovacao' | 'publicada' | 'nenhum';

interface CycleStatusWidgetProps {
  status?: CycleStatus;
  deadline?: string;
  onAction?: () => void;
  actionLoading?: boolean;
}

const statusConfig: Record<CycleStatus, {
  icon: typeof Clock;
  label: string;
  color: string;
  actionLabel: string;
}> = {
  coletando_disponibilidade: {
    icon: Hourglass,
    label: 'Coletando disponibilidade',
    color: 'text-warning',
    actionLabel: 'Gerar Escala'
  },
  gerando: {
    icon: Clock,
    label: 'Gerando escala',
    color: 'text-info',
    actionLabel: 'Aguardar'
  },
  aguardando_aprovacao: {
    icon: Clock,
    label: 'Aguardando aprovação',
    color: 'text-warning',
    actionLabel: 'Aprovar Escala'
  },
  publicada: {
    icon: CheckCircle,
    label: 'Escala publicada',
    color: 'text-success',
    actionLabel: 'Novo Ciclo'
  },
  nenhum: {
    icon: CalendarCheck,
    label: 'Nenhum ciclo ativo',
    color: 'text-text-primary/50',
    actionLabel: 'Iniciar Ciclo'
  }
};

export const CycleStatusWidget = memo(function CycleStatusWidget({
  status = 'nenhum',
  deadline,
  onAction,
  actionLoading = false
}: CycleStatusWidgetProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const daysRemaining = deadline
    ? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card variant="gray-dark" padding="lg" role="region" aria-label="Status do ciclo">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
          <Icon className={`w-5 h-5 ${config.color}`} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-text-primary">{config.label}</h3>
      </div>

      {daysRemaining !== null && daysRemaining > 0 && status !== 'nenhum' && (
        <div className="flex items-center gap-2 text-text-primary/70 text-sm mb-4">
          <Clock className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          <span>
            Deadline: {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes
          </span>
        </div>
      )}

      {status !== 'gerando' && (
        <Button
          variant={status === 'publicada' || status === 'nenhum' ? 'ghost' : 'primary'}
          size="sm"
          fullWidth
          onClick={onAction}
          disabled={actionLoading}
        >
          {actionLoading ? 'Carregando...' : config.actionLabel}
        </Button>
      )}
    </Card>
  );
});
