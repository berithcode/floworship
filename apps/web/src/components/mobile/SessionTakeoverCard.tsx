import './SessionTakeoverCard.css';

interface SessionTakeoverCardProps {
  onEnter: () => void;
}

export function SessionTakeoverCard({ onEnter }: SessionTakeoverCardProps) {
  return (
    <div className="takeover-card" onClick={onEnter}>
      <div className="takeover-card__content">
        <span className="takeover-card__text">Voce esta na escala de hoje</span>
        <span className="takeover-card__action">Entrar na sessao</span>
      </div>
    </div>
  );
}