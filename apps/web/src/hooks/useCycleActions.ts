import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type CycleAction = 'create' | 'close' | 'approve' | 'publish' | 'cancel' | 'navigate';

interface UseCycleActionsReturn {
  executeAction: (action: CycleAction, cycleId?: string, ministryId?: string) => Promise<void>;
  loading: CycleAction | null;
  error: string | null;
}

export function useCycleActions(onSuccess?: () => void): UseCycleActionsReturn {
  const [loading, setLoading] = useState<CycleAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeAction = useCallback(async (action: CycleAction, cycleId?: string, ministryId?: string) => {
    setLoading(action);
    setError(null);

    try {
      if (action === 'create') {
        const today = new Date();
        const nextMonth = today.getMonth() === 11 ? 0 : today.getMonth() + 1;
        const year = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();

        const res = await fetch(`${API_URL}/schedules/cycles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ministryId, month: nextMonth + 1, year }),
        });
        if (!res.ok) throw new Error('Erro ao criar ciclo');
      } else if (action === 'close' && cycleId) {
        if (!confirm('Fechar coleta de disponibilidade e gerar escalas?')) return;
        const res = await fetch(`${API_URL}/schedules/cycles/${cycleId}/close`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Erro ao fechar ciclo');
      } else if (action === 'approve' && cycleId) {
        if (!confirm('Aprovar escalas geradas?')) return;
        const res = await fetch(`${API_URL}/schedules/cycles/${cycleId}/approve`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Erro ao aprovar ciclo');
      } else if (action === 'publish' && cycleId) {
        if (!confirm('Publicar escalas e notificar músicos?')) return;
        const res = await fetch(`${API_URL}/schedules/cycles/${cycleId}/publish`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Erro ao publicar ciclo');
      } else if (action === 'cancel' && cycleId) {
        if (!confirm('Tem certeza que deseja cancelar este ciclo?')) return;
        const res = await fetch(`${API_URL}/schedules/cycles/${cycleId}/cancel`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Erro ao cancelar ciclo');
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(null);
    }
  }, [onSuccess]);

  return { executeAction, loading, error };
}
