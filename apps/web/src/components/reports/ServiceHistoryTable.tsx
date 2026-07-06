import { Card } from '../ui/Card';
import { Music, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ServiceHistoryItem {
  id: string;
  date: string;
  type: 'culto' | 'ensaio';
  confirmedCount: number;
  totalCount: number;
  vacantRoles: string[];
  repertoireCount?: number;
  hasHappened: boolean;
}

interface ServiceHistoryTableProps {
  services: ServiceHistoryItem[];
  maxItems?: number;
}

export function ServiceHistoryTable({ services, maxItems = 10 }: ServiceHistoryTableProps) {
  const displayed = services.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <Card variant="gray-dark" padding="lg">
        <div className="text-center py-8">
          <p className="text-text-primary/60 text-sm">
            Nenhum serviço realizado ainda
          </p>
        </div>
      </Card>
    );
  }

  const formatType = (type: 'culto' | 'ensaio') => {
    return type === 'culto' ? 'Culto' : 'Ensaio';
  };

  const getConfirmationRate = (confirmed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((confirmed / total) * 100);
  };

  const getRateColor = (rate: number, hasHappened: boolean) => {
    if (!hasHappened) return 'text-info';
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-danger';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      dayWeek: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
      day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      full: date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  return (
    <Card variant="gray-dark" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold">Histórico de Serviços</h3>
        {services.length > maxItems && (
          <span className="text-text-primary/60 text-xs">
            Mostrando {maxItems} de {services.length}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {displayed.map(service => {
          const rate = getConfirmationRate(service.confirmedCount, service.totalCount);
          const colorClass = getRateColor(rate, service.hasHappened);
          const dateFmt = formatDate(service.date);

          return (
            <div
              key={service.id}
              className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl hover:bg-bg-quaternary transition-colors"
            >
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-bg-primary shrink-0">
                <span className="text-text-primary/70 text-[10px] uppercase">
                  {dateFmt.dayWeek}
                </span>
                <span className="text-text-primary font-semibold text-sm">
                  {dateFmt.day}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-text-primary font-medium">
                    {formatType(service.type)}
                  </p>
                  {!service.hasHappened && (
                    <span className="text-info text-xs px-1.5 py-0.5 rounded bg-info/10 border border-info/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" strokeWidth={1.5} />
                      Futuro
                    </span>
                  )}
                </div>
                <p className="text-text-primary/60 text-xs mt-0.5 truncate">
                  {dateFmt.full}
                </p>

                <div className="flex items-center gap-3 mt-1.5">
                  {service.vacantRoles.length > 0 ? (
                    <span className="text-xs text-warning flex items-center gap-1">
                      <XCircle className="w-3 h-3" strokeWidth={1.5} />
                      {service.vacantRoles.length} {service.vacantRoles.length === 1 ? 'vaga' : 'vagas'}
                    </span>
                  ) : (
                    <span className="text-xs text-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                      Equipe completa
                    </span>
                  )}

                  {service.repertoireCount !== undefined && (
                    <span className="text-xs text-text-primary/50 flex items-center gap-1">
                      <Music className="w-3 h-3" strokeWidth={1.5} />
                      {service.repertoireCount} {service.repertoireCount === 1 ? 'música' : 'músicas'}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className={`text-base font-semibold ${colorClass}`}>
                  {rate}%
                </div>
                <div className="text-xs text-text-primary/60">
                  {service.confirmedCount}/{service.totalCount}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
