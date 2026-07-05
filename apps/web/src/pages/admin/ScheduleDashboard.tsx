
import { useState, useEffect } from 'react';
import { SundayCard } from '../../components/schedule/SundayCard';
import { CycleStatus } from '../../components/schedule/CycleStatus';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CheckCircle, Lock, Send, Trash2, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface Cycle {
  id: string;
  status: string;
  month: number;
  year: number;
}

interface Assignment {
  id: string;
  role: string;
  ministryMemberId: string | null;
  status: string;
  ministryMember?: {
    user?: {
      name: string;
    };
  };
}

interface Sunday {
  id: string;
  date: string;
  assignments: Assignment[];
}

const statusLabels: Record<string, { label: string; description: string }> = {
  coletando_disponibilidade: { label: 'Coletando', description: 'Aguardando respostas dos músicos' },
  gerando: { label: 'Gerando', description: 'Escalas sendo geradas' },
  aguardando_aprovacao: { label: 'Aprovação', description: 'Aguardando sua aprovação' },
  publicada: { label: 'Publicada', description: 'Escalas publicadas e notificadas' },
};

export function ScheduleDashboard() {
  const { user } = useAuth();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [sundays, setSundays] = useState<Sunday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'create' | 'close' | 'approve' | 'publish' | 'cancel' | null>(null);
  const [availabilityCount, setAvailabilityCount] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const ministryId = user?.ministries?.[0]?.ministryId || '';

  useEffect(() => {
    loadCycle();
  }, []);

  const loadCycle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/schedules/cycles/current`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCycle(data.cycle);
        setSundays(data.sundays || []);
        setAvailabilityCount(data.availabilityCount || 0);
        setTotalMembers(data.totalMembers || 0);
      } else {
        setError(`Não foi possível carregar as escalas (${res.status}).`);
      }
    } catch {
      setError('Não foi possível conectar à API. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const createCycle = async () => {
    const today = new Date();
    const nextMonth = today.getMonth() === 11 ? 0 : today.getMonth() + 1;
    const year = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();

    setActionLoading('create');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/schedules/cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ministryId, month: nextMonth + 1, year }),
      });
      if (res.ok) loadCycle();
    } catch (err) {
      console.error('Erro ao criar ciclo:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const closeCycle = async () => {
    if (!cycle || !confirm('Fechar coleta de disponibilidade e gerar escalas?')) return;
    setActionLoading('close');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/schedules/cycles/${cycle.id}/close`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) loadCycle();
    } finally {
      setActionLoading(null);
    }
  };

  const approveCycle = async () => {
    if (!cycle || !confirm('Aprovar escalas geradas?')) return;
    setActionLoading('approve');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/schedules/cycles/${cycle.id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) loadCycle();
    } finally {
      setActionLoading(null);
    }
  };

  const publishCycle = async () => {
    if (!cycle || !confirm('Publicar escalas e notificar músicos?')) return;
    setActionLoading('publish');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/schedules/cycles/${cycle.id}/publish`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) loadCycle();
    } finally {
      setActionLoading(null);
    }
  };

  const cancelCycle = async () => {
    if (!cycle) return;
    if (!confirm('Tem certeza que deseja cancelar este ciclo? Todos os dados serão apagados.')) return;
    setActionLoading('cancel');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/schedules/cycles/${cycle.id}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) loadCycle();
    } finally {
      setActionLoading(null);
    }
  };

  const confirmAllMembers = async () => {
    if (!cycle) return;
    if (!confirm('TESTE: Confirmar disponibilidade para TODOS os músicos?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/schedules/cycles/${cycle.id}/confirm-all`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) loadCycle();
    } catch (err) {
      console.error('Erro ao confirmar todos:', err);
    }
  };

  if (loading) {
    return (
      <div className="schedule-dashboard p-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-mint/30 border-t-accent-mint rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-dashboard p-6 max-w-[1400px] mx-auto">
        <header className="mb-6">
          <h1 className="text-xl font-bold text-text-primary">Escalas do Mês</h1>
        </header>
        <div className="text-center py-16 bg-bg-card-gray-dark rounded-2xl border-2 border-border-subtle">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-danger/60" />
          <p className="text-text-primary/70 font-medium mb-4">{error}</p>
          <Button variant="subtle" size="md" onClick={loadCycle}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-dashboard p-6 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Escalas do Mês</h1>
          <p className="text-text-primary/50 text-sm mt-1">Gerencie o ciclo mensal de escalas</p>
        </div>
      </header>

      {!cycle ? (
        <div className="text-center py-16 bg-bg-card-gray-dark rounded-2xl border-2 border-border-subtle">
          <Calendar className="w-14 h-14 mx-auto mb-4 text-text-primary/50" strokeWidth={1} aria-hidden="true" />
          <h2 className="text-text-primary font-semibold text-lg">Nenhum ciclo ativo</h2>
          <p className="text-text-primary/50 text-sm mt-2 mb-6 max-w-sm mx-auto">
            Gere a escala do próximo mês automaticamente com base na disponibilidade dos músicos
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={createCycle}
            disabled={actionLoading === 'create'}
          >
            {actionLoading === 'create' ? 'Criando...' : 'Gerar Escala do Mês'}
          </Button>
        </div>
      ) : (
        <>
          {/* Card de status do ciclo */}
          <div className="bg-bg-card-gray-dark rounded-2xl border-2 border-border-subtle p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <CycleStatus status={cycle.status} />
                <div>
                  <p className="text-text-primary/50 text-xs uppercase tracking-wider">
                    {statusLabels[cycle.status]?.description || cycle.status}
                  </p>
                  {cycle.status === 'coletando_disponibilidade' && (
                    <p className="text-text-primary/50 text-xs mt-1">
                      {availabilityCount} de {totalMembers} músicos responderam
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Ações principais */}
                {cycle.status === 'coletando_disponibilidade' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Lock}
                    onClick={closeCycle}
                    disabled={actionLoading === 'close'}
                  >
                    {actionLoading === 'close' ? 'Fechando...' : 'Fechar Coleta'}
                  </Button>
                )}
                {cycle.status === 'gerando' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle}
                    onClick={approveCycle}
                    disabled={actionLoading === 'approve'}
                  >
                    {actionLoading === 'approve' ? 'Aprovando...' : 'Aprovar Escalas'}
                  </Button>
                )}
                {cycle.status === 'aguardando_aprovacao' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Send}
                    onClick={publishCycle}
                    disabled={actionLoading === 'publish'}
                  >
                    {actionLoading === 'publish' ? 'Publicando...' : 'Publicar e Notificar'}
                  </Button>
                )}
                {cycle.status === 'publicada' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Calendar}
                    onClick={createCycle}
                    disabled={actionLoading === 'create'}
                  >
                    {actionLoading === 'create' ? 'Criando...' : 'Novo Ciclo'}
                  </Button>
                )}

                {/* Botão cancelar - aparece em qualquer status */}
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={cancelCycle}
                  disabled={actionLoading === 'cancel'}
                  title="Cancelar ciclo e recomeçar"
                >
                  {actionLoading === 'cancel' ? 'Cancelando...' : ''}
                </Button>

                {/* Botão teste - confirmar todos */}
                {cycle.status === 'coletando_disponibilidade' && (
                  <Button
                    variant="subtle"
                    size="sm"
                    icon={Zap}
                    onClick={confirmAllMembers}
                    title="TESTE: Confirmar todos os membros"
                  >
                    Confirmar Todos
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de domingos */}
          <div className="space-y-3">
            {sundays.map((sunday) => (
              <SundayCard
                key={sunday.id}
                sunday={sunday}
                ministryId={ministryId}
                onRefresh={loadCycle}
                totalMembers={totalMembers}
                cycleStatus={cycle.status}
              />
            ))}
          </div>

          {sundays.length === 0 && (
            <div className="text-center py-12 text-text-primary/50">
              <p className="text-sm">Nenhum domingo encontrado para este ciclo</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}