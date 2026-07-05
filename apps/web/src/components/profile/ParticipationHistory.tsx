import { memo } from 'react';
import { Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Assignment {
  id: string;
  date: string;
  role: string;
  status: 'confirmado' | 'pendente' | 'recusado' | 'substituido';
}

interface ParticipationHistoryProps {
  assignments?: Assignment[];
}

export const ParticipationHistory = memo(function ParticipationHistory({
  assignments = [],
}: ParticipationHistoryProps) {
  const statusConfig = {
    confirmado: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Confirmado' },
    pendente: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', label: 'Pendente' },
    recusado: { icon: XCircle, color: 'text-error', bg: 'bg-error/10', label: 'Recusado' },
    substituido: { icon: AlertCircle, color: 'text-info', bg: 'bg-info/10', label: 'Substituído' },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-text-primary/70" strokeWidth={1.5} />
        <h3 className="text-text-primary/70 text-sm font-medium">Histórico de Participação</h3>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-text-primary/40 text-sm">
          Nenhuma participação registrada ainda.
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => {
            const config = statusConfig[assignment.status];
            const Icon = config.icon;
            return (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{assignment.role}</p>
                    <p className="text-xs text-text-primary/50">{formatDate(assignment.date)}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});