import { memo } from 'react';
import { Clock, MessageSquare, Users, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';

interface ActivityItem {
  id: string;
  type: 'session' | 'member' | 'whatsapp' | 'invite';
  description: string;
  date: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface RecentActivityTimelineProps {
  activities?: ActivityItem[];
}

const typeConfig = {
  session: { icon: Clock, color: 'text-info', bg: 'bg-info/15' },
  member: { icon: Users, color: 'text-success', bg: 'bg-success/15' },
  whatsapp: { icon: MessageSquare, color: 'text-brand-purple', bg: 'bg-brand-purple/15' },
  invite: { icon: CheckCircle, color: 'text-warning', bg: 'bg-warning/15' },
};

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const config = typeConfig[activity.type];
  const Icon = config.icon;
  const activityDate = new Date(activity.date);
  const timeAgo = getTimeAgo(activityDate);

  return (
    <div className="flex items-start gap-3 relative pb-3 last:pb-0">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center z-10`}>
          <Icon className={`w-4 h-4 ${config.color}`} strokeWidth={1.5} aria-hidden="true" />
        </div>
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-text-primary text-sm truncate">{activity.description}</p>
        <p className="text-text-primary/50 text-xs mt-0.5">{timeAgo}</p>
      </div>
      {activity.status && (
        <StatusBadge status={activity.status} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-danger/15 text-danger',
    info: 'bg-info/15 text-info',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${colors[status as keyof typeof colors] || colors.info}`}>
      {status === 'success' ? 'Sucesso' :
       status === 'warning' ? 'Pendente' :
       status === 'error' ? 'Falha' : 'Info'}
    </span>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'agora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });
}

export const RecentActivityTimeline = memo(function RecentActivityTimeline({
  activities = []
}: RecentActivityTimelineProps) {
  return (
    <Card variant="gray-dark" padding="lg" role="region" aria-label="Atividade recente">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Atividade Recente</h3>

      {activities.length === 0 ? (
        <p className="text-text-primary/50 text-sm text-center py-8">
          Nenhuma atividade recente
        </p>
      ) : (
        <div className="space-y-1">
          {activities.map(activity => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </Card>
  );
});
