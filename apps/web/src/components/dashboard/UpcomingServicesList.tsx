import { memo } from 'react';
import { Calendar, Users, Music, CheckCircle, AlertCircle } from 'lucide-react';

interface UpcomingService {
  id: string;
  date: string;
  confirmedCount: number;
  totalCount: number;
  vacantRoles: string[];
  isConfirmed: boolean;
  repertoire: { songId: string; title: string; order: number }[];
}

interface UpcomingServicesListProps {
  services?: UpcomingService[];
}

function ServiceItem({ service }: { service: UpcomingService }) {
  const serviceDate = new Date(service.date);
  const dayName = serviceDate.toLocaleDateString('pt-BR', { weekday: 'short' });
  const dayNumber = serviceDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });
  const time = serviceDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const hasVacancies = service.vacantRoles.length > 0;

  return (
    <div className="flex items-center justify-between py-4 px-3 -mx-3 rounded-[16px] transition-[background-color] duration-150 hover:bg-text-primary/5 border border-transparent hover:border-text-primary/5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-[14px] bg-text-primary/5 border border-text-primary/5 flex flex-col items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-text-primary/40 mb-0.5" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-text-primary text-sm font-semibold capitalize">
            {dayName}, {dayNumber}
          </p>
          <p className="text-text-primary/40 text-xs mt-0.5 font-medium">{time}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-text-primary/50 text-xs font-medium" title="Confirmações">
          <Users className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
          <span>{service.confirmedCount}/{service.totalCount}</span>
        </div>

        <div className="flex items-center gap-1.5 text-text-primary/50 text-xs font-medium" title="Músicas">
          <Music className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
          <span>{service.repertoire.length}</span>
        </div>

        <div className="w-4 flex justify-center">
          {service.isConfirmed ? (
            <CheckCircle className="w-4 h-4 text-accent-mint shrink-0" strokeWidth={2} aria-hidden="true" />
          ) : hasVacancies ? (
            <AlertCircle className="w-4 h-4 text-warning shrink-0" strokeWidth={2} aria-hidden="true" />
          ) : (
            <CheckCircle className="w-4 h-4 text-text-primary/20 shrink-0" strokeWidth={2} aria-hidden="true" />
          )}
        </div>
      </div>

      {hasVacancies && !service.isConfirmed && (
        <div className="hidden lg:flex flex-wrap gap-1.5 max-w-[200px]">
          {service.vacantRoles.slice(0, 2).map(role => (
            <span key={role} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-warning/10 text-warning border border-warning/20">
              {role}
            </span>
          ))}
          {service.vacantRoles.length > 2 && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-warning/10 text-warning border border-warning/20">
              +{service.vacantRoles.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export const UpcomingServicesList = memo(function UpcomingServicesList({
  services = []
}: UpcomingServicesListProps) {
  return (
    <div className="bg-bg-card-gray-dark rounded-[24px] p-6 border border-border-subtle h-full">
      <h3 className="text-lg font-semibold text-text-primary mb-6">Próximos Cultos</h3>

      {services.length === 0 ? (
        <p className="text-text-primary/40 text-sm text-center py-8 font-medium">
          Nenhum culto agendado nos próximos dias
        </p>
      ) : (
        <div className="space-y-1">
          {services.map(service => (
            <ServiceItem key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
});
