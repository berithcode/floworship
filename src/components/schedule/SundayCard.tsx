import { useState } from 'react';
import './SundayCard.css';

interface Assignment {
  id: string;
  role: string;
  musicianId: string | null;
  status: string;
}

interface Sunday {
  id: string;
  date: string;
  assignments: Assignment[];
}

export function SundayCard({ sunday }: SundayCardProps) {
  const [expanded, setExpanded] = useState(false);

  const dateStr = new Date(sunday.date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="sunday-card">
      <button className="sunday-card__header" onClick={() => setExpanded(!expanded)}>
        <span className="sunday-card__date">{dateStr}</span>
        <span className="sunday-card__toggle">{expanded ? '-' : '+'}</span>
      </button>

      {expanded && (
        <div className="sunday-card__assignments">
          {sunday.assignments.map((a) => (
            <div
              key={a.id}
              className={`sunday-card__slot ${a.status === 'vago' ? 'sunday-card__slot--vago' : ''}`}
            >
              <span className="sunday-card__role">{a.role}</span>
              <span className="sunday-card__musician">
                {a.musicianId || 'VAGO'}
              </span>
              <button className="sunday-card__swap">Trocar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SundayCardProps {
  sunday: Sunday;
}