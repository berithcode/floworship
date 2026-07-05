import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AssignmentCardWithDetails } from '../../components/schedule-user/AssignmentCardWithDetails';
import { AvailabilityForm } from '../../components/schedule/AvailabilityForm';
import { Calendar, Clock, Music, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Assignment {
  id: string;
  date: string;
  role: string;
  status: 'confirmado' | 'pendente' | 'recusado';
  songs?: number;
  scheduleId?: string;
  team?: { role: string; name: string }[];
  isMinister?: boolean;
}

type Filter = 'all' | 'confirmado' | 'pendente' | 'recusado';

export function MySchedule() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const textColorPrimary = isLight ? 'text-text-primary' : 'text-text-primary';
  const textColorSecondary = isLight ? 'text-text-primary/70' : 'text-text-secondary';
  const textColorTertiary = isLight ? 'text-text-primary/50' : 'text-text-tertiary';
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [showAvailability, setShowAvailability] = useState(false);
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [hasActiveCycle, setHasActiveCycle] = useState(false);

  useEffect(() => {
    loadCycle();
  }, []);

  const loadCycle = async () => {
    try {
      const res = await fetch(`${API_URL}/schedules/cycles/current`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.cycle) {
          setCycleId(data.cycle.id);
          setHasActiveCycle(true);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (cycleId) {
      loadAssignments();
    }
  }, [cycleId]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/schedules/my-assignments`, { credentials: 'include' });
      if (res.ok) {
        setAssignments(await res.json());
      }
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/schedules/assignments/${id}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmed: true }),
      });
      if (res.ok) {
        setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmado' as const } : a));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDecline = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/schedules/assignments/${id}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmed: false }),
      });
      if (res.ok) {
        setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'recusado' as const } : a));
      }
    } catch {
      // ignore
    }
  }, []);

  const filtered = useMemo(() => {
    return filter === 'all' ? assignments : assignments.filter(a => a.status === filter);
  }, [assignments, filter]);

  const pendingCount = assignments.filter(a => a.status === 'pendente').length;
  const confirmedCount = assignments.filter(a => a.status === 'confirmado').length;

  const canRespondAvailability = hasActiveCycle && cycleId !== null;

  if (loading && !cycleId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${textColorPrimary}`}>Meus Horários</h1>
          <p className={`${textColorTertiary} text-sm mt-1`}>Suas próximas escalas e confirmações</p>
        </div>
        <button
          onClick={() => setShowAvailability(!showAvailability)}
          disabled={!canRespondAvailability}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${
            canRespondAvailability
              ? `bg-white/5 border border-white/10 ${textColorSecondary} hover:${textColorPrimary} hover:bg-white/10`
              : 'bg-white/5 border border-white/5 text-text-tertiary cursor-not-allowed opacity-50'
          }`}
        >
          <Calendar className="w-4 h-4" strokeWidth={1.5} />
          Disponibilidade
        </button>
      </div>

      {!canRespondAvailability && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-sm text-blue-300">
            ℹ️ Não há ciclo de escalas ativo no momento. 
            {hasActiveCycle ? 'Carregando ciclo...' : 'Aguarde o administrador criar o ciclo mensal.'}
          </p>
        </div>
      )}

      {showAvailability && cycleId && (
        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <AvailabilityForm
            cycleId={cycleId}
            onSubmitted={() => setShowAvailability(false)}
          />
        </div>
      )}

      {/* Status Summary */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" strokeWidth={1.5} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${textColorPrimary}`}>{pendingCount}</p>
              <p className={`text-xs ${textColorTertiary}`}>Pendentes</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Music className="w-5 h-5 text-success" strokeWidth={1.5} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${textColorPrimary}`}>{confirmedCount}</p>
              <p className={`text-xs ${textColorTertiary}`}>Confirmados</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pendente', 'confirmado', 'recusado'] as Filter[]).map(f => {
          const labels: Record<Filter, string> = { all: 'Todos', pendente: 'Pendentes', confirmado: 'Confirmados', recusado: 'Recusados' };
          const counts: Record<Filter, number> = {
            all: assignments.length,
            pendente: pendingCount,
            confirmado: confirmedCount,
            recusado: assignments.filter(a => a.status === 'recusado').length,
          };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-sm transition-all ${
                filter === f
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10'
              }`}
            >
              {labels[f]} ({counts[f]})
            </button>
          );
        })}
      </div>

      {/* Assignment List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3 bg-white/5 rounded-2xl border border-white/10">
          <AlertCircle className="w-10 h-10 text-text-tertiary" strokeWidth={1} />
          <p className="text-text-tertiary text-sm">Nenhuma escala encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(assignment => (
              <AssignmentCardWithDetails
                key={assignment.id}
                assignment={assignment}
                onConfirm={handleConfirm}
                onDecline={handleDecline}
              />
            ))}
        </div>
      )}
    </div>
  );
}