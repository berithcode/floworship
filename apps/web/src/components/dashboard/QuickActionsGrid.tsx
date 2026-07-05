import { memo, useMemo } from 'react';
import { Music, Calendar, Users, FileText, Settings, MessageSquare, CalendarCheck, BookOpen, CheckCircle, Play, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';

interface ActionItem {
  icon: typeof Music;
  label: string;
  to: string;
  color: string;
}

const adminActions: ActionItem[] = [
  { icon: Music, label: 'Nova Música', to: '/library/new', color: 'text-accent-mint' },
  { icon: Calendar, label: 'Agendar Culto', to: '/schedules', color: 'text-info' },
  { icon: Users, label: 'Convidar Músico', to: '/settings', color: 'text-success' },
  { icon: MessageSquare, label: 'Enviar Aviso', to: '/chat', color: 'text-info' },
  { icon: FileText, label: 'Gerar Escala', to: '/schedules', color: 'text-warning' },
  { icon: Settings, label: 'Configurações', to: '/settings', color: 'text-text-primary/50' },
];

const musicianActions: ActionItem[] = [
  { icon: CalendarCheck, label: 'Minha Escala', to: '/my-schedule', color: 'text-accent-mint' },
  { icon: CheckCircle, label: 'Confirmar Presença', to: '/my-schedule', color: 'text-accent-mint' },
  { icon: BookOpen, label: 'Estudar Músicas', to: '/library', color: 'text-info' },
  { icon: Music, label: 'Repertório', to: '/library', color: 'text-info' },
  { icon: Play, label: 'Modo Operador', to: '/session', color: 'text-warning' },
  { icon: User, label: 'Meu Perfil', to: '/profile', color: 'text-text-primary/50' },
];

export const QuickActionsGrid = memo(function QuickActionsGrid() {
  const navigate = useNavigate();
  const { isMusician } = useRole();
  const actions = useMemo(() => isMusician ? musicianActions : adminActions, [isMusician]);

  return (
    <div className="bg-bg-card-gray-dark rounded-[24px] p-4 border-2 border-border-subtle">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Ações Rápidas</h3>

      <div className="grid grid-cols-3 gap-2">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-[12px] bg-bg-tertiary border border-border-subtle hover:bg-text-primary/5 hover:border-text-primary/10 transition-colors focus-visible:outline-2 focus-visible:outline-accent-mint focus-visible:outline-offset-2"
              aria-label={action.label}
            >
              <div className="w-8 h-8 rounded-full bg-text-primary/5 flex items-center justify-center">
                <Icon className={`w-4 h-4 ${action.color}`} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <span className="text-[10px] text-text-primary/70 text-center font-medium leading-tight px-1">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
