import { useState, useEffect, useCallback, memo } from 'react';
import { Loader2, Calendar, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface AvailabilityFormProps {
  cycleId: string;
  onSubmitted?: () => void;
}

interface Sunday {
  id: string;
  date: string;
}

export const AvailabilityForm = memo(function AvailabilityForm({ cycleId, onSubmitted }: AvailabilityFormProps) {
  const [sundays, setSundays] = useState<Sunday[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!cycleId) return;
    setLoading(true);
    fetch(`${API_URL}/schedules/cycles/${cycleId}/sundays`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setSundays(data as Sunday[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [cycleId]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const promises = Object.entries(selections).map(([date, available]) =>
        fetch(`${API_URL}/schedules/availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ cycleId, sundayDate: date, available }),
        })
      );
      await Promise.all(promises);
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }, [cycleId, selections, onSubmitted]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <Loader2 className="w-5 h-5 text-text-primary/50 animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <Check className="w-4 h-4" strokeWidth={1.5} />
        Disponibilidade registrada!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-text-primary/70 text-sm font-medium flex items-center gap-2">
        <Calendar className="w-4 h-4" strokeWidth={1.5} />
        Sua disponibilidade
      </h3>
      {sundays.length === 0 ? (
        <p className="text-text-primary/50 text-sm text-center py-4">Nenhum domingo disponível</p>
      ) : (
        sundays.map((sunday) => {
          const date = new Date(sunday.date);
          const dateStr = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
          return (
            <div key={sunday.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <span className="text-sm text-text-primary">
                {dateStr}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelections(prev => ({ ...prev, [sunday.date]: true }))}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    selections[sunday.date] === true
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/5 text-text-primary/50 hover:text-text-primary'
                  }`}
                >
                  Disponível
                </button>
                <button
                  onClick={() => setSelections(prev => ({ ...prev, [sunday.date]: false }))}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    selections[sunday.date] === false
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-white/5 text-text-primary/50 hover:text-text-primary'
                  }`}
                >
                  Indisponível
                </button>
              </div>
            </div>
          );
        })
      )}
      {sundays.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(selections).length === 0}
          className="w-full py-2 bg-brand-blue text-white text-sm rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" strokeWidth={1.5} />
          ) : (
            'Confirmar disponibilidade'
          )}
        </button>
      )}
    </div>
  );
});
