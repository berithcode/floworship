
import { memo } from 'react';
import { Play, Users, Calendar, Music } from 'lucide-react';
import { Card } from '../ui/Card';

interface Session {
  id: string;
  date: string;
  type: 'culto' | 'ensaio';
  songs: number;
  musicians: number;
  status: 'agendada' | 'em_andamento';
}

interface SessionCardProps {
  session: Session;
  onClick?: () => void;
}

export const SessionCard = memo(function SessionCard({ session, onClick }: SessionCardProps) {
  const date = new Date(session.date);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const formattedTime = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isLive = session.status === 'em_andamento';

  return (
    <Card
      variant="white"
      padding="lg"
      hoverable
      className={`${isLive ? 'border-brand-purple/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isLive ? 'bg-brand-purple/20' : 'bg-white/10'
          }`}>
            <Calendar className={`w-6 h-6 ${isLive ? 'text-brand-purple' : 'text-text-primary/70'}`} strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-text-primary font-medium">
                {session.type === 'culto' ? 'Culto' : 'Ensaio'}
              </h3>
              {isLive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Ao vivo
                </span>
              )}
            </div>
            <p className="text-text-primary/70 text-sm mt-0.5">{formattedDate} às {formattedTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-text-primary/50">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" strokeWidth={1.5} />
              <span>{session.musicians}</span>
            </div>
            <div className="flex items-center gap-1">
              <Music className="w-4 h-4" strokeWidth={1.5} />
              <span>{session.songs}</span>
            </div>
          </div>
          <Play className="w-5 h-5 text-brand-purple" strokeWidth={1.5} />
        </div>
      </div>
    </Card>
  );
});
