import { memo } from 'react';

interface PresenceChartProps {
  confirmed?: number;
  total?: number;
}

export const PresenceChart = memo(function PresenceChart({
  confirmed = 0,
  total = 0,
}: PresenceChartProps) {
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
        <h3 className="text-text-primary/70 text-sm font-medium">Presença</h3>
        <div className="text-center py-6 text-text-primary/40 text-sm">
          Nenhuma dados de presença registrados ainda.
        </div>
      </div>
    );
  }

  const percentage = Math.round((confirmed / total) * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 80) return 'text-success';
    if (pct >= 50) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
      <h3 className="text-text-primary/70 text-sm font-medium">Presença</h3>
      
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            className={getColor(percentage)}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className={`text-2xl font-bold ${getColor(percentage)}`}>{percentage}%</p>
            <p className="text-xs text-text-primary/50">presença</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 text-sm">
        <div className="text-center">
          <p className="text-2xl font-bold text-success">{confirmed}</p>
          <p className="text-xs text-text-primary/50">Confirmados</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-error">{total - confirmed}</p>
          <p className="text-xs text-text-primary/50">Ausências</p>
        </div>
      </div>
    </div>
  );
});