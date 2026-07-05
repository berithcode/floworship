
import { useState, useEffect, useCallback, memo } from 'react';
import { X, Loader2, UserCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Musician {
  id: string;
  name: string;
  email: string;
  instrument: string;
  worshipRoles: string[];
}

interface SwapDialogProps {
  assignmentId: string;
  currentMusicianName: string;
  role: string;
  ministryId: string;
  onClose: () => void;
  onSwapped: () => void;
}

export const SwapDialog = memo(function SwapDialog({
  assignmentId,
  currentMusicianName,
  role,
  ministryId,
  onClose,
  onSwapped
}: SwapDialogProps) {
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [loading, setLoading] = useState(true);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMusicians();
  }, [ministryId]);

  const fetchMusicians = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/musicians`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        // Filtra músicos que têm a role necessária ou são polivalentes
        const filtered = (data as Musician[]).filter(m =>
          m.worshipRoles?.includes(role.toLowerCase()) ||
          m.instrument.toLowerCase() === role.toLowerCase()
        );
        setMusicians(filtered);
      }
    } catch {
      setError('Erro ao carregar músicos');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = useCallback(async (newMusicianId: string) => {
    setSwapping(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/schedules/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assignmentId, newMusicianId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro ao trocar' }));
        throw new Error(err.error || 'Erro ao trocar');
      }
      onSwapped();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao trocar');
    } finally {
      setSwapping(false);
    }
  }, [assignmentId, onClose, onSwapped]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="text-text-primary font-medium">Trocar Músico</h3>
            <p className="text-xs text-text-primary/50 mt-0.5">
              {role} • Atual: {currentMusicianName || 'Vago'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-text-primary/70" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-brand-purple animate-spin" strokeWidth={1.5} />
            </div>
          ) : error ? (
            <div className="text-error text-sm text-center p-4">{error}</div>
          ) : musicians.length === 0 ? (
            <div className="text-text-primary/50 text-sm text-center p-4">Nenhum músico disponível</div>
          ) : (
            <div className="space-y-1">
              {musicians.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSwap(m.id)}
                  disabled={swapping}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-purple/10 transition-colors disabled:opacity-50 text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-purple/20 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4 text-brand-purple" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{m.name}</p>
                    <p className="text-xs text-text-primary/50 truncate">
                      {m.instrument}
                      {m.worshipRoles?.length > 0 && (
                        <span className="ml-1 text-brand-purple/70">
                          • {m.worshipRoles.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
