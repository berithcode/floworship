import { useSessionSocket } from '../../hooks/useSessionSocket';
import { DialCircular } from '@floworship/ui';
import './ModoTV.css';

interface ModoTVProps {
  sessionId: string;
  ministryId: string;
}

export function ModoTV({ sessionId, ministryId }: ModoTVProps) {
  const { currentBlock, blocks } = useSessionSocket(sessionId, ministryId);

  const currentIndex = blocks.findIndex((b) => b.id === currentBlock?.id);
  const progress = currentBlock
    ? Math.min(((currentIndex + 1) / blocks.length) * 100, 100)
    : 0;

  return (
    <div className="modo-tv">
      <main className="modo-tv__main">
        <DialCircular value={progress} label={currentBlock?.label || ''} />
        <div className="modo-tv__info">
          <h1 className="modo-tv__block-name">{currentBlock?.label || 'Sessao'}</h1>
          <span className="modo-tv__timing">{currentBlock?.duration || 0}s</span>
        </div>
        <div className="modo-tv__sequence">Bloco {currentIndex + 1} de {blocks.length}</div>
      </main>
    </div>
  );
}