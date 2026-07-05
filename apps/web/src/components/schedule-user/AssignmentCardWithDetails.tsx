import { useState } from 'react';
import { ChevronDown, ChevronUp, Users, Music, User } from 'lucide-react';
import { getWorshipRoleLabel } from '../../constants/worshipRoles';
import { SetlistEditor } from '../setlist/SetlistEditor';

interface Assignment {
  id: string;
  date: string;
  role: string;
  status: 'confirmado' | 'pendente' | 'recusado';
  scheduleId?: string;
  team?: { role: string; name: string }[];
  isMinister?: boolean;
}

interface AssignmentCardProps {
  assignment: Assignment;
  onConfirm?: (id: string) => void;
  onDecline?: (id: string) => void;
}

export function AssignmentCardWithDetails({ assignment, onConfirm, onDecline }: AssignmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSetlist, setShowSetlist] = useState(false);

  const date = assignment.date ? new Date(assignment.date) : null;
  const isValidDate = date && !isNaN(date.getTime());
  
  const formattedDate = isValidDate ? date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }) : 'Data inválida';
  
  const isToday = isValidDate && date.toDateString() === new Date().toDateString();
  const roleLabel = getWorshipRoleLabel(assignment.role);

  const statusConfig = {
    confirmado: { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    pendente: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
    recusado: { color: 'text-red-400', bg: 'bg-red-500/10' },
  };

  const config = statusConfig[assignment.status];

  return (
    <>
      <div className={`p-4 bg-white/[0.02] rounded-2xl border ${
        isToday ? 'border-brand-purple/30' : 'border-white/[0.06]'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isToday ? 'bg-brand-purple/20' : 'bg-white/5'
            }`}>
              <User className={`w-5 h-5 ${isToday ? 'text-brand-purple' : 'text-white/40'}`} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-white font-medium">
                {formattedDate}
                {isToday && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-brand-purple/20 text-brand-purple">Hoje</span>
                )}
              </p>
              <p className="text-white/50 text-sm">{roleLabel}</p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
            {assignment.status === 'confirmado' ? 'Confirmado' : assignment.status === 'pendente' ? 'Pendente' : 'Recusado'}
          </span>
        </div>

        {/* Ações */}
        {assignment.status === 'pendente' && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => onConfirm?.(assignment.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 text-sm rounded-xl hover:bg-emerald-500/30 transition-colors"
            >
              Confirmar
            </button>
            <button
              onClick={() => onDecline?.(assignment.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 text-sm rounded-xl hover:bg-red-500/30 transition-colors"
            >
              Recusar
            </button>
          </div>
        )}

        {/* Botões de expandir */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
          {assignment.isMinister && assignment.scheduleId && (
            <button
              onClick={() => setShowSetlist(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-purple/20 text-brand-purple text-xs rounded-lg hover:bg-brand-purple/30 transition-colors"
            >
              <Music className="w-3.5 h-3.5" />
              Editar Setlist
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-white/50 text-xs rounded-lg hover:bg-white/10 transition-colors ml-auto"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Fechar
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Ver Equipe
              </>
            )}
          </button>
        </div>

        {/* Conteúdo expandido */}
        {expanded && assignment.team && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Equipe do Domingo
            </h4>
            <div className="space-y-2">
              {assignment.team.map((member, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white/[0.02] rounded-lg">
                  <span className="text-sm text-white">{member.name}</span>
                  <span className="text-xs text-white/40">{getWorshipRoleLabel(member.role)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSetlist && assignment.scheduleId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto" onClick={() => setShowSetlist(false)}>
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto" onClick={e => e.stopPropagation()}>
            <SetlistEditor scheduleId={assignment.scheduleId} isMinister={true} onClose={() => setShowSetlist(false)} />
          </div>
        </div>
      )}
    </>
  );
}