import { useSessionSocket } from '../../hooks/useSessionSocket';
import { DialCircular } from '@floworship/ui';
import { useNavigate } from 'react-router-dom';
import { Music, MessageCircle, LogOut, ListMusic, Crown, Users } from 'lucide-react';
import './ModoOperador.css';

interface ModoOperadorProps {
  sessionId: string;
  ministryId: string;
  onEndSession?: () => void;
}

export function ModoOperador({ sessionId, ministryId, onEndSession }: ModoOperadorProps) {
  const navigate = useNavigate();
  const { currentBlock, blocks, isOverrideActive, isConnected, triggerBlock, operatorName, isOperator, isCreator } =
    useSessionSocket(sessionId, ministryId);

  const currentIndex = blocks.findIndex((b) => b.id === currentBlock?.id);
  const progress = blocks.length > 0
    ? Math.min(((currentIndex + 1) / blocks.length) * 100, 100)
    : 0;

  const handleEndSession = () => {
    if (window.confirm('Tem certeza que deseja encerrar esta sessão?')) {
      navigate('/session/end');
    }
  };

  const handleRepertoire = () => {
    navigate('/library');
  };

  const handleChat = () => {
    navigate('/chat');
  };

  return (
    <div className="modo-operador">
      {/* Header */}
      <header className="modo-operador__header">
        <div className="modo-operador__song-info">
          <h1 className="modo-operador__song-name">{currentBlock?.label || 'Sessão'}</h1>
          <span className="modo-operador__meta">{blocks.length} blocos • {currentBlock?.duration ? `${currentBlock.duration}s` : '—'}</span>
        </div>

        {isOperator ? (
          <span className="modo-operador__badge modo-operador__badge--override">
            <Users className="w-3 h-3" /> Você opera
          </span>
        ) : (
          <span className="modo-operador__badge">
            <Crown className="w-3 h-3" /> {operatorName || 'Outro opera'}
          </span>
        )}

        <span className={`modo-operador__status ${isConnected ? 'modo-operador__status--connected' : ''}`}>
          {isConnected ? '●' : '○'}
        </span>
      </header>

      {/* Dial & Progress */}
      <section className="modo-operador__dial">
        <DialCircular value={progress} label={currentBlock?.label || ''} />
        <div className="modo-operador__block-label">
          {currentBlock?.label || (blocks.length > 0 ? 'Aguardando início' : 'Nenhum bloco')}
        </div>
      </section>

      {/* Timeline */}
      {blocks.length > 0 && (
        <section className="modo-operador__timeline">
          {blocks.map((block, i) => (
            <span
              key={block.id}
              className={`modo-operador__pill ${block.id === currentBlock?.id ? 'modo-operador__pill--active' : ''}`}
            >
              {i + 1}
            </span>
          ))}
        </section>
      )}

      {/* Grid de Blocos */}
      <section className="modo-operador__grid">
        {blocks.length === 0 ? (
          <div className="modo-operador__empty-state">
            <div className="modo-operador__empty-icon">
              <Music className="w-12 h-12" strokeWidth={1.5} />
            </div>
            <h3 className="modo-operador__empty-title">Nenhuma música adicionada</h3>
            <p className="modo-operador__empty-description">
              Adicione músicas ao repertório para começar a sessão
            </p>
            <button
              className="modo-operador__empty-button"
              onClick={handleRepertoire}
            >
              Ir para Biblioteca
            </button>
          </div>
        ) : !isOperator ? (
          <div className="modo-operador__empty-state">
            <div className="modo-operador__empty-icon">
              <Crown className="w-12 h-12" strokeWidth={1.5} />
            </div>
            <h3 className="modo-operador__empty-title">Você não é o operador</h3>
            <p className="modo-operador__empty-description">
              Apenas {operatorName || 'o operador'} pode controlar os blocos.
              Use o modo TV para acompanhar.
            </p>
            <button
              className="modo-operador__empty-button"
              onClick={() => navigate(`/session/tv/${sessionId}`)}
            >
              Modo TV
            </button>
          </div>
        ) : (
          blocks.map((block) => (
            <button
              key={block.id}
              className={`modo-operador__grid-item ${block.id === currentBlock?.id ? 'modo-operador__grid-item--active' : ''}`}
              onClick={() => triggerBlock(block.id)}
            >
              <span className="modo-operador__grid-label">{block.label}</span>
              <span className="modo-operador__grid-duration">{block.duration || 0}s</span>
            </button>
          ))
        )}
      </section>

      {/* Bottom Nav */}
      <nav className="modo-operador__bottom-nav">
        <button className="modo-operador__nav-pill" onClick={handleRepertoire} title="Ordem do Culto">
          <ListMusic className="w-4 h-4" />
        </button>
        <button className="modo-operador__nav-pill modo-operador__nav-pill--active" title="Modo Operador">
          <Music className="w-4 h-4" />
        </button>
        <button className="modo-operador__nav-pill" onClick={handleChat} title="Chat">
          <MessageCircle className="w-4 h-4" />
        </button>
        <button className="modo-operador__nav-pill modo-operador__nav-pill--danger" onClick={handleEndSession} title="Encerrar sessão">
          <LogOut className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}