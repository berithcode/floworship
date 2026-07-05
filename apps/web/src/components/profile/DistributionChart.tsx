
import { memo } from 'react';
import { Guitar, Piano, Drum, Mic, Music } from 'lucide-react';

type Instrument = 'guitarra' | 'teclado' | 'bateria' | 'baixo' | 'vozes';

interface Distribution {
  instrument: Instrument;
  count: number;
}

interface DistributionChartProps {
  distribution?: Distribution[];
}

export const DistributionChart = memo(function DistributionChart({
  distribution = [],
}: DistributionChartProps) {
  if (distribution.length === 0) {
    return (
      <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/10">
        <h3 className="text-text-primary/70 text-sm font-medium">Instrumentos mais Tocados</h3>
        <div className="text-center py-6 text-text-primary/40 text-sm">
          Dados de instrumentos ainda não disponíveis.
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...distribution.map((d) => d.count));
  const total = distribution.reduce((sum, d) => sum + d.count, 0);

  const getIcon = (instrument: Instrument) => {
    const icons: Record<Instrument, any> = {
      guitarra: Guitar,
      teclado: Piano,
      bateria: Drum,
      baixo: Music,
      vozes: Mic,
    };
    return icons[instrument];
  };

  const getColor = (instrument: Instrument) => {
    const colors: Record<Instrument, string> = {
      guitarra: 'bg-blue-500/20 text-blue-400',
      teclado: 'bg-purple-500/20 text-purple-400',
      bateria: 'bg-red-500/20 text-red-400',
      baixo: 'bg-green-500/20 text-green-400',
      vozes: 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[instrument];
  };

  return (
    <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/10">
      <h3 className="text-text-primary/70 text-sm font-medium">Instrumentos mais Tocados</h3>

      <div className="space-y-3">
        {distribution.map((item) => {
          const Icon = getIcon(item.instrument);
          const percentage = Math.round((item.count / maxCount) * 100);
          return (
            <div key={item.instrument} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-text-primary/70" strokeWidth={1.5} />
                  <span className="text-text-primary capitalize">{item.instrument}</span>
                </div>
                <span className="text-text-primary/50">
                  {item.count}x ({Math.round((item.count / total) * 100)}%)
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getColor(item.instrument)} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-text-primary/50 text-center pt-2">
        Total de {total} participações
      </p>
    </div>
  );
});