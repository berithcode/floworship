import { useState } from 'react';
import { useSessionSocket } from '../../hooks/useSessionSocket';
import './ModoCifra.css';

interface ModoCifraProps {
  sessionId: string;
  ministryId: string;
}

export function ModoCifra({ sessionId, ministryId }: ModoCifraProps) {
  const { currentBlock } = useSessionSocket(sessionId, ministryId);
  const [hideLyrics, setHideLyrics] = useState(false);

  return (
    <div className="modo-cifra">
      <header className="modo-cifra__header">
        <span className="modo-cifra__title">{currentBlock?.label || 'Modo Cifra'}</span>
        <span className="modo-cifra__key">Key: C</span>
        <button
          className={`modo-cifra__toggle ${hideLyrics ? 'modo-cifra__toggle--active' : ''}`}
          onClick={() => setHideLyrics(!hideLyrics)}
        >
          Ocultar letra
        </button>
      </header>

      <main className="modo-cifra__content">
        {currentBlock?.chordproContent ? (
          <pre className="modo-cifra__chords">{currentBlock.chordproContent}</pre>
        ) : (
          <span className="modo-cifra__placeholder">[No content]</span>
        )}
      </main>
    </div>
  );
}