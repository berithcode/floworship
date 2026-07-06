import { useState, useEffect } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { useSessionSocket } from '../../hooks/useSessionSocket';
import { BlockReader } from '../../components/performance/BlockReader';

interface ModoLetraProps {
  sessionId: string;
  ministryId: string;
}

export function ModoLetra({ sessionId, ministryId }: ModoLetraProps) {
  const { currentBlock, blocks, operatorName } = useSessionSocket(sessionId, ministryId);
  const [synced, setSynced] = useState(true);
  const [mode, setMode] = useState<'cifra' | 'letra'>('letra');
  const [localIndex, setLocalIndex] = useState(0);

  const syncedIndex = blocks.findIndex((b) => b.id === currentBlock?.id);

  useEffect(() => {
    if (synced && syncedIndex >= 0) setLocalIndex(syncedIndex);
  }, [synced, syncedIndex]);

  const index = synced ? Math.max(syncedIndex, 0) : localIndex;

  return (
    <div className="min-h-screen bg-bg-primary p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-text-primary/70 text-sm">
          Modo Letra
          {operatorName && (
            <span className="ml-2 text-xs text-text-primary/40">
              · operando: {operatorName}
            </span>
          )}
        </span>
        <button
          onClick={() => setSynced((s) => !s)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            synced ? 'bg-info/15 text-info' : 'bg-bg-tertiary text-text-primary/70'
          }`}
        >
          {synced ? <Users className="w-3.5 h-3.5" strokeWidth={1.5} /> : <UserCheck className="w-3.5 h-3.5" strokeWidth={1.5} />}
          {synced ? 'Controlado' : 'Manual'}
        </button>
      </div>

      <BlockReader
        blocks={blocks}
        index={index}
        mode={mode}
        onModeChange={setMode}
        locked={synced}
        onAdvance={() => setLocalIndex((i) => Math.min(i + 1, blocks.length - 1))}
        onBack={() => setLocalIndex((i) => Math.max(i - 1, 0))}
        onSelectBlock={(i) => setLocalIndex(i)}
      />

      {!synced && (
        <p className="text-center text-xs text-text-primary/50 pb-4">
          Você está navegando por conta própria — os outros músicos continuam vendo o bloco que o operador escolher.
        </p>
      )}
    </div>
  );
}