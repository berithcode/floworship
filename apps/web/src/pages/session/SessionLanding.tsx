import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Music, History, Play } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { SessionFormDialog } from '../../components/session/SessionFormDialog';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ServiceToday } from './MySessionToday';

function SessionTodayWidget() {
  const [hasAssignment, setHasAssignment] = useState(false);
  const [date, setDate] = useState<string>();
  const [sessionId, setSessionId] = useState<string>();
  const navigate = useNavigate();

  useEffect(() => {
    const checkToday = async () => {
      try {
        const res = await fetch(`${API_URL}/schedules/today`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setHasAssignment(data.hasAssignment);
          setDate(data.date);
          setSessionId(data.scheduleId);
        }
      } catch {
        // ignore
      }
    };
    checkToday();
  }, []);

  if (!hasAssignment) return null;

  const formattedDate = date ? new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  }) : 'Serviço hoje';

  return (
    <Card
      variant="gray-dark"
      padding="lg"
      hoverable
      onClick={() => navigate(`/session/${sessionId}/operador`)}
      className="mb-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-text-primary font-medium flex items-center gap-2">
            <Users className="w-4 h-4" /> Serviço de hoje
          </h3>
          <p className="text-text-primary/60 text-sm mt-0.5">{formattedDate}</p>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-success"></div>
      </div>
    </Card>
  );
}



const API_URL = import.meta.env.VITE_API_URL || '/api'
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '')
const WS_URL = BASE_URL.replace('http', 'ws') + '/ws'

// --- Types ---
interface SessionItem {
  id: string;
  name: string;
  date: string;
  type: 'rehearsal' | 'cult';
  status: 'agendada' | 'em_andamento';
  songs?: number;
  musicians?: number;
}

function getDefaultName(mode: 'rehearsal' | 'cult') {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  return mode === 'cult' ? `Culto - ${dateStr}` : `Ensaio - ${dateStr}`;
}

// --- Component ---
export function SessionLanding() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected } = useWebSocket({ url: WS_URL, autoConnect: true });

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'rehearsal' | 'cult'>('rehearsal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/sessions/upcoming`, { credentials: 'include' });
      if (res.ok) setSessions(await res.json());
      else setSessions([]);
    } catch { setSessions([]); }
    finally { setLoading(false); }
  };

  const openForm = (mode: 'rehearsal' | 'cult') => {
    setFormMode(mode);
    setIsFormOpen(true);
  };

  const handleCreate = async (data: { name: string; date: string; type: string }) => {
    setIsSubmitting(true);
    try {
      // Mapear tipo do frontend para API
      const apiType = data.type === 'cult' ? 'culto' : 'ensaio';
      
      const res = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: data.name, date: data.date, type: apiType }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      const result = await res.json();
      navigate(`/session/${result.id}/operador`);
    } catch (err) {
      console.error('Session creation failed:', err);
      alert('Erro ao criar sessão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
      setIsFormOpen(false);
    }
  };

  const handleImportRepertoire = async () => {
    try {
      const todayRes = await fetch(`${API_URL}/schedules/today`, { credentials: 'include' });
      if (!todayRes.ok) {
        throw new Error('Failed to check schedule');
      }
      const todayData = await todayRes.json();
      if (!todayData.hasAssignment) {
        alert('Você não está escalado para hoje.');
        return;
      }
      if (!todayData.scheduleId) {
        throw new Error('No schedule found for today');
      }

      const res = await fetch(`${API_URL}/sessions/${todayData.scheduleId}/import-repertoire`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/session/${data.sessionId}/operador`);
      } else {
        throw new Error('Failed to import repertoire');
      }
    } catch (error) {
      console.error('Import repertoire failed:', error);
      alert('Erro ao importar repertório: ' + error.message);
    }
  };

  const handleStartSession = (sessionId: string) => {
    navigate(`/session/${sessionId}/operador`);
  };

  const upcomingSessions = sessions.filter(s => s.status === 'agendada');

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sessões</h1>
          <p className="text-text-primary/60 text-sm mt-1">Gerencie e inicie sessões ao vivo</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          connected
            ? 'bg-success/15 text-success border border-success/20'
            : 'bg-danger/15 text-danger border border-danger/20'
        }`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-danger'}`}></span>
          {connected ? 'Servidor Online' : 'Servidor Offline'}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card variant="gray-dark" padding="lg" hoverable className="flex flex-col items-center gap-3" onClick={() => openForm('rehearsal')}>
          <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center group-hover:bg-accent-mint-dim transition-colors">
            <Plus className="w-6 h-6 text-text-tertiary" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-medium text-text-tertiary">Novo Ensaio</span>
        </Card>

        <Card variant="gray-dark" padding="lg" hoverable className="flex flex-col items-center gap-3" onClick={() => openForm('cult')}>
          <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center">
            <Music className="w-6 h-6 text-text-tertiary" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-medium text-text-tertiary">Novo Culto</span>
        </Card>

        <Card variant="gray-dark" padding="lg" hoverable className="flex flex-col items-center gap-3" onClick={handleImportRepertoire}>
          <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center">
            <Users className="w-6 h-6 text-text-tertiary" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-medium text-text-tertiary">Importar Repertório</span>
        </Card>

        <Card variant="gray-dark" padding="lg" hoverable className="flex flex-col items-center gap-3" onClick={() => navigate('/session/end')}>
          <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center">
            <History className="w-6 h-6 text-text-tertiary" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-medium text-text-tertiary">Encerrar Sessão</span>
        </Card>
      </div>

      {/* My Session Today */}
      <SessionTodayWidget />

      <div className="mb-4">
        <ServiceToday />
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        <h2 className="text-text-primary font-semibold">Próximas Sessões</h2>

        {loading ? (
          <Card variant="gray-dark" padding="xl">
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 rounded-full border-2 border-accent-mint border-t-transparent animate-spin" />
            </div>
          </Card>
        ) : sessions.length === 0 ? (
          <Card variant="gray-dark" padding="xl">
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-16 h-16 rounded-full bg-text-primary/10 flex items-center justify-center">
                <Play className="w-8 h-8 text-text-primary/50" strokeWidth={1.5} />
              </div>
              <p className="text-text-primary font-medium">Nenhuma sessão agendada</p>
              <p className="text-text-primary/60 text-sm">
                Crie um novo ensaio para começar
              </p>
              <Button variant="primary" size="sm" onClick={() => openForm('rehearsal')}>
                Criar novo ensaio
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map(session => (
              <Card
                key={session.id}
                variant="gray-dark"
                padding="lg"
                hoverable
                onClick={() => handleStartSession(session.id)}
                className="group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-text-primary font-medium">{session.name}</h3>
                    <p className="text-text-primary/60 text-sm mt-0.5">
                      {new Date(session.date).toLocaleDateString('pt-BR')} - {session.type === 'culto' ? 'Culto' : 'Ensaio'}
                    </p>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${session.status === 'em_andamento' ? 'bg-success animate-pulse' : 'bg-text-tertiary/30'}`} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <SessionFormDialog
        open={isFormOpen}
        mode={formMode}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};