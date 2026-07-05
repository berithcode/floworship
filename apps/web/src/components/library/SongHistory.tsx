import { useState, useEffect, memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, RotateCcw, Music } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface SessionLog {
  id: string;
  startedAt: string;
  endedAt: string | null;
  mode: string;
  blocksPlayed: number;
  accuracy: number | null;
}

interface SongHistoryProps {
  songId: string;
}

export const SongHistory = memo(function SongHistory({ songId }: SongHistoryProps) {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [songId]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/sessions/song/${songId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        setLogs(await res.json());
      } else {
        setLogs([]);
      }
    } catch {
      setError('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : Date.now();
    const diff = Math.floor((e - s) / 1000);
    const m = Math.floor(diff / 60);
    const seg = diff % 60;
    return `${m}m ${seg}s`;
  };

  const modeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      study: 'Estudo',
      rehearsal: 'Ensaio',
      service: 'Culto',
      practice: 'Prática',
    };
    return labels[mode] || mode;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between p-4 bg-error/10 rounded-xl">
        <span className="text-error text-sm">{error}</span>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1 text-xs text-brand-blue hover:text-blue-400 transition-colors"
        >
          <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Music className="w-8 h-8 text-text-primary/50" strokeWidth={1.5} />
        <p className="text-text-primary/50 text-sm">Nenhuma sessão de estudo ainda</p>
        <p className="text-text-primary/50 text-xs">Use o modo Estudo para praticar esta música</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-text-primary/70 text-sm font-medium">
        Histórico de sessões ({logs.length})
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {logs.map(log => (
          <div
            key={log.id}
            className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-brand-purple" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary capitalize">
                  {modeLabel(log.mode)}
                </span>
                <span className="text-xs text-text-primary/50">•</span>
                <span className="text-xs text-text-primary/50">
                  <Calendar className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
                  {format(new Date(log.startedAt), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-text-primary/50">
                  Duração: {formatDuration(log.startedAt, log.endedAt)}
                </span>
                <span className="text-xs text-text-primary/50">•</span>
                <span className="text-xs text-text-primary/50">
                  {log.blocksPlayed} blocos
                </span>
                {log.accuracy !== null && (
                  <>
                    <span className="text-xs text-text-primary/50">•</span>
                    <span className={`text-xs ${
                      log.accuracy >= 80 ? 'text-green-400' : log.accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {log.accuracy}% precisão
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
