import { memo } from 'react';
import { Calendar } from 'lucide-react';

interface UpcomingService {
  id: string;
  date: string;
  confirmedCount: number;
  totalCount: number;
}

interface NextServiceCardProps {
  date?: string;
  confirmed?: boolean;
  repertoireCount?: number;
  className?: string;
  upcomingServices?: UpcomingService[];
}

export const NextServiceCard = memo(function NextServiceCard({
  date,
  confirmed: _confirmed,
  repertoireCount = 0,
  className = '',
  upcomingServices = []
}: NextServiceCardProps) {
  if (!date) {
    return (
      <div className={`bg-bg-card-gray-dark rounded-[24px] p-6 border-2 border-border-subtle h-full flex items-center gap-3 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-text-primary/5 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-text-primary/40" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm text-text-primary/60">Próximo Culto</p>
          <p className="text-sm text-text-primary/40">Nenhum culto agendado</p>
        </div>
      </div>
    );
  }

  const serviceDate = new Date(date);
  const dayName = serviceDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayNumber = serviceDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });
  const time = serviceDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`bg-accent-mint rounded-[24px] p-6 text-text-on-mint h-full flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-text-on-mint/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-text-on-mint" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm text-text-on-mint/80 font-medium">Próximo Culto</p>
            <p className="text-xl font-bold capitalize">{dayName}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[32px] leading-tight font-bold tracking-tight">
            {dayNumber}
          </p>
          <p className="text-sm text-text-on-mint/80 font-medium">{time}</p>
        </div>
      </div>

      <p className="text-sm text-text-on-mint/80 font-medium mb-3">
        {repertoireCount} {repertoireCount === 1 ? 'música' : 'músicas'} no repertório
      </p>

      {upcomingServices.length > 0 && (
        <div className="pt-3 border-t border-text-on-mint/20 flex-1 min-h-0">
          <p className="text-[11px] font-semibold text-text-on-mint/50 mb-1.5 uppercase tracking-wider">Próximos</p>
          <div className="space-y-1.5">
            {upcomingServices.slice(0, 3).map(service => {
              const sDate = new Date(service.date);
              const sDay = sDate.toLocaleDateString('pt-BR', { weekday: 'short' });
              const sDateNum = sDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              const sTime = sDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={service.id} className="flex items-center justify-between text-xs">
                  <span className="text-text-on-mint/70 capitalize">{sDay}, {sDateNum} às {sTime}</span>
                  <span className="text-text-on-mint/50 text-[11px]">{service.confirmedCount}/{service.totalCount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});