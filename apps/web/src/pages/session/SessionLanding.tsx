
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionCard } from '../../components/session/SessionCard';
import { WebSocketStatus } from '../../components/session/WebSocketStatus';
import { Play, Plus, Users, Music, History } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Session {
  id: string;
  date: string;
  type: 'culto' | 'ensaio';
  songs: number;
  musicians: number;
  status: 'agendada' | 'em_andamento';
}

export function SessionLanding() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/sessions/upcoming`, { credentials: 'include' });
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = (sessionId: string) => {
    navigate(`/session/${sessionId}/operador`);
  };

  const handleNewRehearsal = async () => {
    try {
      const res = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'ensaio' }),
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/session/${data.id}/operador`);
      }
    } catch {
      // ignore
    }
  };

  const handleNewCulto = async () => {
    try {
      // Buscar próximo domingo com escala
      const today = new Date();
      const nextSunday = new Date(today);
      nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7);
      nextSunday.setHours(19, 0, 0, 0);

      const res = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'culto', date: nextSunday.toISOString() }),
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/session/${data.id}/operador`);
      }
    } catch {
      // ignore
    }
  };

  const handleImportRepertoire = async () => {
    try {
      // Buscar escala de hoje
      const todayRes = await fetch(`${API_URL}/schedules/today`, { credentials: 'include' });
      if (!todayRes.ok || !(await todayRes.json()).hasAssignment) {
        alert('Você não está escalado para hoje.');
        return;
      }
      const todayData = await todayRes.json();
      
      // Criar sessão com repertório de hoje
      const res = await fetch(`${API_URL}/sessions/${todayData.scheduleId}/import-repertoire`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/session/${data.sessionId}/operador`);
      }
    } catch {
      alert('Erro ao importar repertório.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  const upcomingSessions = sessions.filter(s => s.status === 'agendada');

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sessões</h1>
          <p className="text-text-primary/50 text-sm mt-1">Gerencie e inicie sessões ao vivo</p>
        </div>
        <WebSocketStatus connected={false} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={handleNewRehearsal}
          className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-brand-purple/10 hover:border-brand-purple/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-brand-purple/20 transition-colors">
            <Plus className="w-5 h-5 text-text-primary/70 group-hover:text-brand-purple transition-colors" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-medium text-text-primary/70 group-hover:text-brand-purple transition-colors">Novo Ensaio</span>
        </button>

        <button
          onClick={handleNewCulto}
          className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-brand-purple/10 hover:border-brand-purple/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-brand-purple/20 transition-colors">
            <Music className="w-5 h-5 text-text-primary/70 group-hover:text-brand-purple transition-colors" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-medium text-text-primary/70 group-hover:text-brand-purple transition-colors">Modo Culto</span>
        </button>

        <button
          onClick={handleImportRepertoire}
          className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-brand-blue/10 hover:border-brand-blue/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-brand-blue/20 transition-colors">
            <Users className="w-5 h-5 text-text-primary/70 group-hover:text-brand-blue transition-colors" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-medium text-text-primary/70 group-hover:text-brand-blue transition-colors">Importar Repertório</span>
        </button>

        <button
          onClick={() => navigate('/session/end')}
          className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-error/10 hover:border-error/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-error/20 transition-colors">
            <History className="w-5 h-5 text-text-primary/70 group-hover:text-error transition-colors" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-medium text-text-primary/70 group-hover:text-error transition-colors">Encerrar Sessão</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        <h2 className="text-text-primary font-semibold">Próximas Sessões</h2>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 bg-white/5 rounded-2xl border border-white/10">
            <Play className="w-10 h-10 text-text-primary/50" strokeWidth={1} />
            <p className="text-text-primary/50 text-sm">Nenhuma sessão agendada</p>
            <button
              onClick={handleNewRehearsal}
              className="text-xs text-brand-blue hover:text-blue-400 transition-colors"
            >
              Criar novo ensaio
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => handleStartSession(session.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}