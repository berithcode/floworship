import { useState, useEffect } from 'react';
import { Users, Music, Calendar, Clock, User } from 'lucide-react';
import { getWorshipRoleLabel } from '../../constants/worshipRoles';
import { SetlistEditor } from '../../components/setlist/SetlistEditor';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface TodaySession {
  hasAssignment: boolean;
  scheduleId?: string;
  date?: string;
  role?: string;
  isMinister?: boolean;
  type?: 'culto' | 'ensaio';
  team?: { role: string; name: string }[];
  repertoire?: { id: string; songId: string; title: string; artist?: string; key?: string; order: number }[];
}

export function ServiceToday() {
  const [session, setSession] = useState<TodaySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetlist, setShowSetlist] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/schedules/today`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.hasAssignment) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-text-primary/10 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-text-primary/50" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Nenhuma escala hoje</h2>
        <p className="text-text-primary/60 text-sm">Você não está escalado para nenhum culto hoje.</p>
      </div>
    );
  }

  const date = session.date ? new Date(session.date) : null;
  const formattedDate = date?.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Serviço de Hoje</h1>
        <p className="text-text-primary/60 text-sm mt-1">{formattedDate}</p>
      </div>

      {/* Card principal */}
      <Card variant="gray-dark" padding="lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-purple/20 flex items-center justify-center">
            <User className="w-6 h-6 text-brand-purple" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-text-primary font-medium">Sua função: {getWorshipRoleLabel(session.role!)}</p>
            {session.isMinister && (
              <span className="text-xs text-brand-purple">Ministro de Louvor</span>
            )}
          </div>
        </div>

        {/* Equipe */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-text-primary/70 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" strokeWidth={1.5} />
            Equipe do Dia
          </h3>
          <div className="space-y-2">
            {session.team?.map((member, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-text-primary/5 flex items-center justify-center text-xs font-medium text-text-primary/60">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-text-primary">{member.name}</span>
                </div>
                <span className="text-xs text-text-primary/60">{getWorshipRoleLabel(member.role)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Setlist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-primary/70 flex items-center gap-2">
              <Music className="w-4 h-4" strokeWidth={1.5} />
              Setlist
            </h3>
            {session.isMinister && (
              <Button variant="subtle" size="sm" onClick={() => setShowSetlist(true)}>
                Editar
              </Button>
            )}
          </div>

          {session.repertoire && session.repertoire.length > 0 ? (
            <div className="space-y-2">
              {session.repertoire.map((song, i) => (
                <div key={song.id} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
                  <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium text-text-primary/40 bg-text-primary/5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{song.title}</p>
                    {song.artist && (
                      <p className="text-xs text-text-primary/60 truncate">{song.artist}</p>
                    )}
                  </div>
                  {song.key && (
                    <span className="px-2 py-0.5 rounded text-xs bg-brand-purple/20 text-brand-purple font-medium">
                      {song.key}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-primary/60">
              <div className="w-12 h-12 rounded-full bg-text-primary/10 flex items-center justify-center mx-auto mb-3">
                <Music className="w-6 h-6 text-text-primary/50" strokeWidth={1.5} />
              </div>
              <p className="text-sm">Setlist ainda não definido</p>
              {session.isMinister && (
                <p className="text-xs mt-1">Clique em "Editar" para adicionar músicas</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Botões para modo ensaio/culto */}
      {session.scheduleId && (
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="subtle"
            size="lg"
            icon={Clock}
            onClick={() => window.location.href = `/session/${session.scheduleId}/operador`}
            fullWidth
          >
            Modo Ensaio
          </Button>
          <Button
            variant="primary"
            size="lg"
            icon={Music}
            onClick={() => window.location.href = `/session/${session.scheduleId}/operador`}
            fullWidth
          >
            Modo Culto
          </Button>
        </div>
      )}

      {/* Modal de Setlist */}
      {showSetlist && session.scheduleId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto" onClick={() => setShowSetlist(false)}>
          <Card variant="gray-dark" padding="lg" className="w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto" onClick={e => e.stopPropagation()}>
            <SetlistEditor scheduleId={session.scheduleId} isMinister={true} onClose={() => setShowSetlist(false)} />
          </Card>
        </div>
      )}
    </div>
  );
}