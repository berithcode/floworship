
import { useState, memo } from 'react';
import { ChevronDown, ChevronUp, Music, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { getWorshipRoleLabel } from '../../constants/worshipRoles';

interface Assignment {
  id: string;
  role: string;
  ministryMemberId: string | null;
  status: string;
  confirmed?: boolean;
  ministryMember?: {
    user?: {
      name: string;
    };
  };
}

interface Sunday {
  id: string;
  date: string;
  assignments: Assignment[];
}

interface SundayCardProps {
  sunday: Sunday;
  ministryId?: string;
  onRefresh?: () => void;
  totalMembers?: number;
  cycleStatus?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  confirmado: { label: 'Confirmado', color: 'text-success', bg: 'bg-success/15 border-success/30' },
  pendente: { label: 'Pendente', color: 'text-warning', bg: 'bg-warning/15 border-warning/30' },
  vago: { label: 'Vago', color: 'text-danger', bg: 'bg-danger/15 border-danger/30' },
  confirmado_pelo_admin: { label: 'Confirmado', color: 'text-success', bg: 'bg-success/15 border-success/30' },
};

export const SundayCard = memo(function SundayCard({ sunday, totalMembers, cycleStatus }: SundayCardProps) {
  const [expanded, setExpanded] = useState(false);

  const dateObj = new Date(typeof sunday.date === 'string' && sunday.date.includes('T') ? sunday.date : sunday.date + 'T12:00:00');
  const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayNumber = dateObj.toLocaleDateString('pt-BR', { day: '2-digit' });
  const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long' });

  const isCollecting = cycleStatus === 'coletando_disponibilidade';
  const availCount = (sunday as any).availabilityCount || 0;

  const confirmedCount = sunday.assignments.filter(a => a.status === 'confirmado' || a.status === 'confirmado_pelo_admin').length;
  const totalCount = sunday.assignments.length;
  const vagoCount = sunday.assignments.filter(a => !a.ministryMemberId || a.status === 'vago').length;

  const displayCount = isCollecting ? availCount : confirmedCount;
  const displayTotal = isCollecting ? (totalMembers || 0) : totalCount;
  const progress = displayTotal > 0 ? (displayCount / displayTotal) * 100 : 0;

  return (
    <div className="bg-bg-card-gray-dark rounded-2xl border-2 border-border-subtle overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center gap-4 text-left hover:bg-bg-tertiary transition-colors duration-150"
      >
        {/* Ícone do dia */}
        <div className="w-14 h-14 rounded-xl bg-accent-mint/15 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-accent-mint leading-none">{dayNumber}</span>
          <span className="text-[10px] text-accent-mint/70 uppercase tracking-wider">{monthName.slice(0, 3)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold capitalize">{dayName}, {dayNumber} de {monthName}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-text-primary/50">
              {isCollecting ? `${displayCount} de ${displayTotal} disponíveis` : `${displayCount}/${displayTotal} confirmados`}
            </span>
            {!isCollecting && vagoCount > 0 && (
              <span className="text-xs text-danger/80 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                {vagoCount} vago{vagoCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {/* Barra de progresso */}
          <div className="mt-2 h-1 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-[var(--ease-out)]"
              style={{
                width: `${progress}%`,
                background: progress === 100
                  ? 'linear-gradient(90deg, var(--color-success), var(--color-success))'
                  : progress > 50
                    ? 'linear-gradient(90deg, var(--color-warning), var(--color-warning))'
                    : 'linear-gradient(90deg, var(--color-danger), var(--color-danger))',
              }}
            />
          </div>
        </div>

        {/* Toggle */}
        <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-primary/50" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-primary/50" aria-hidden="true" />
          )}
        </div>
      </button>

      {/* Conteúdo expandido */}
      {expanded && (
        <div className="px-5 pb-5 space-y-2">
          <div className="h-px bg-border-subtle mb-4" />

          {sunday.assignments.length === 0 ? (
            <div className="text-center py-8 text-text-primary/50">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
              <p className="text-sm">Nenhuma atribuição para este domingo</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {sunday.assignments.map((assignment) => {
                const st = statusConfig[assignment.status] || statusConfig.pendente;
                const memberName = assignment.ministryMember?.user?.name;
                const roleLabel = getWorshipRoleLabel(assignment.role);
                const isVago = !assignment.ministryMemberId || assignment.status === 'vago';

                return (
                  <div
                    key={assignment.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      isVago
                        ? 'bg-danger/5 border-danger/10'
                        : 'bg-bg-tertiary border-border-subtle'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isVago ? 'bg-danger/10' : 'bg-accent-mint/15'
                    }`}>
                      {isVago ? (
                        <AlertTriangle className="w-4 h-4 text-danger/60" aria-hidden="true" />
                      ) : (
                        <span className="text-xs font-medium text-accent-mint">
                          {memberName?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-text-primary/50 uppercase tracking-wider">
                          {roleLabel}
                        </span>
                      </div>
                      <p className={`text-sm font-medium truncate ${isVago ? 'text-danger/60 italic' : 'text-text-primary'}`}>
                        {isVago ? 'Vago' : memberName}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${st.bg} ${st.color}`}>
                      {st.label}
                    </span>

                    {/* Botão trocar */}
                    {!isVago && (
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center hover:bg-border-subtle flex-shrink-0 transition-colors"
                        title="Trocar músico"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-text-primary/50" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});