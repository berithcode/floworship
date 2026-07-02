import { useState } from 'react';
import { useSessionSocket } from '../../hooks/useSessionSocket';
import './ModoLetra.css';

interface ModoLetraProps {
  sessionId: string;
  ministryId: string;
}

export function ModoLetra({ sessionId, ministryId }: ModoLetraProps) {
  const { currentBlock, blocks } = useSessionSocket(sessionId, ministryId);
  const [showChords, setShowChords] = useState(false);

  const currentIndex = blocks.findIndex((b) => b.id === currentBlock?.id);
  const nextBlock = currentIndex >= 0 ? blocks[currentIndex + 1] : undefined;

  return (
    <div className="modo-letra">
      <header className="modo-letra__header">
        <span className="modo-letra__title">{currentBlock?.label || 'Modo Letra'}</span>
        <button
          className={`modo-letra__toggle ${showChords ? 'modo-letra__toggle--active' : ''}`}
          onClick={() => setShowChords(!showChords)}
        >
          Mostrar cifra
        </button>
      </header>

      <main className="modo-letra__content">
        {currentBlock?.chordproContent ? (
          <pre className="modo-letra__lyrics">{currentBlock.chordproContent}</pre>
        ) : (
          <span className="modo-letra__placeholder">[No content]</span>
        )}
      </main>

      {nextBlock && (
        <footer className="modo-letra__preview">
          <span className="modo-letra__preview-label">Proximo: {nextBlock.label}</span>
        </footer>
      )}
    </div>
  );
}