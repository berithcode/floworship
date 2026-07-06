import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../ui/Card';

interface PresenceRankingProps {
  rankings: Array<{
    memberId: string;
    name: string;
    role?: string;
    confirmed: number;
    total: number;
    percent: number;
    trend?: 'up' | 'down' | 'stable';
  }>;
}

export function PresenceRanking({ rankings }: PresenceRankingProps) {
  if (rankings.length === 0) {
    return (
      <Card variant="gray-dark" padding="lg">
        <div className="text-center py-8">
          <p className="text-text-primary/60 text-sm">
            Nenhuma presença registrada ainda
          </p>
        </div>
      </Card>
    );
  }

  const formatPercent = (percent: number) => {
    return `${Math.round(percent)}%`;
  };

  const getPresenceColor = (percent: number) => {
    if (percent >= 80) return 'text-success';
    if (percent >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getPresenceBg = (percent: number) => {
    if (percent >= 80) return 'bg-success/15 border-success/30';
    if (percent >= 60) return 'bg-warning/15 border-warning/30';
    return 'bg-danger/15 border-danger/30';
  };

  const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
    if (!trend || trend === 'stable') return <Minus className="w-3 h-3 text-text-tertiary" strokeWidth={1.5} />;
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-success" strokeWidth={1.5} />;
    return <TrendingDown className="w-3 h-3 text-danger" strokeWidth={1.5} />;
  };

  return (
    <Card variant="gray-dark" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold">Ranking de Presença</h3>
        <span className="text-xs text-text-primary/60">
          {rankings.length} {rankings.length === 1 ? 'músico' : 'músicos'}
        </span>
      </div>

      <div className="space-y-3">
        {rankings.map((rank, index) => (
          <div
            key={rank.memberId}
            className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-primary text-text-primary/70 font-semibold text-sm shrink-0">
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-text-primary font-medium truncate">
                  {rank.name}
                </p>
                <TrendIcon trend={rank.trend} />
              </div>
              {rank.role && (
                <p className="text-text-primary/60 text-xs mt-0.5">
                  {rank.role}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-text-primary/60">
                {rank.confirmed}/{rank.total}
              </span>
              <span
                className={`text-sm font-semibold px-2 py-0.5 rounded-full border ${getPresenceBg(rank.percent)} ${getPresenceColor(rank.percent)}`}
              >
                {formatPercent(rank.percent)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
