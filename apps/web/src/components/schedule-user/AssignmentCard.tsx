
import { memo } from 'react';
import { Calendar, Music, Clock, Check, X, AlertCircle } from 'lucide-react';
import { getWorshipRoleLabel } from '../../constants/worshipRoles';

interface Assignment {
  id: string;
  date: string;
  role: string;
  roleLabel?: string;
  status: 'confirmado' | 'pendente' | 'recusado';
  songs?: number;
}

interface AssignmentCardProps {
  assignment: Assignment;
  onConfirm?: (id: string) => void;
  onDecline?: (id: string) => void;
}

export const AssignmentCard = memo(function AssignmentCard({
  assignment,
  onConfirm,
  onDecline,
}: AssignmentCardProps) {
  const date = assignment.date ? new Date(assignment.date) : null;
  const isValidDate = date && !isNaN(date.getTime());
  
  const formattedDate = isValidDate ? date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }) : 'Data inválida';
  
  const isToday = isValidDate && date.toDateString() === new Date().toDateString();
  const roleLabel = assignment.roleLabel || getWorshipRoleLabel(assignment.role);

  const statusConfig = {
    confirmado: { icon: Check, color: 'bg-success/20 text-success border-success/30', label: 'Confirmado' },
    pendente: { icon: Clock, color: 'bg-warning/20 text-warning border-warning/30', label: 'Pendente' },
    recusado: { icon: X, color: 'bg-error/20 text-error border-error/30', label: 'Recusado' },
  };

  const config = statusConfig[assignment.status];
  const Icon = config.icon;

  return (
    <div className={`p-4 bg-white/5 rounded-2xl border ${
      isToday ? 'border-brand-purple/30 bg-brand-purple/5' : 'border-white/10'
    } hover:bg-white/10 transition-colors`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isToday ? 'bg-brand-purple/20' : 'bg-white/10'
          }`}>
            <Calendar className={`w-5 h-5 ${isToday ? 'text-brand-purple' : 'text-text-primary/70'}`} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-text-primary font-medium">
              {formattedDate}
              {isToday && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-brand-purple/20 text-brand-purple">Hoje</span>
              )}
            </p>
            <p className="text-text-primary/70 text-sm">{roleLabel}</p>
          </div>
        </div>

        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <Icon className="w-3 h-3" strokeWidth={1.5} />
          {config.label}
        </span>
      </div>

      {assignment.songs !== undefined && (
        <div className="flex items-center gap-2 text-xs text-text-primary/50 mb-3">
          <Music className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{assignment.songs} músicas no repertório</span>
        </div>
      )}

      {assignment.status === 'pendente' && (
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm?.(assignment.id)}
            className="flex items-center gap-1 px-4 py-1.5 bg-success/20 text-success text-xs rounded-lg hover:bg-success/30 transition-colors"
          >
            <Check className="w-3 h-3" strokeWidth={1.5} />
            Confirmar
          </button>
          <button
            onClick={() => onDecline?.(assignment.id)}
            className="flex items-center gap-1 px-4 py-1.5 bg-error/20 text-error text-xs rounded-lg hover:bg-error/30 transition-colors"
          >
            <X className="w-3 h-3" strokeWidth={1.5} />
            Recusar
          </button>
        </div>
      )}

      {assignment.status === 'confirmado' && (
        <div className="flex items-center gap-1 text-xs text-success">
          <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
          Confirmado — seu repertório está disponível na biblioteca
        </div>
      )}
    </div>
  );
});