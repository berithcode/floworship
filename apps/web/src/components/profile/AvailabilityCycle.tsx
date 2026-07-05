import { memo } from 'react';
import { Calendar, Check, X, Clock } from 'lucide-react';

interface AvailabilityDay {
  week: number;
  sunday: string;
  available: boolean;
}

interface AvailabilityCycleProps {
  availability?: AvailabilityDay[];
  readOnly?: boolean;
}

export const AvailabilityCycle = memo(function AvailabilityCycle({
  availability = [],
  readOnly = false,
}: AvailabilityCycleProps) {
  if (availability.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-text-primary/70" strokeWidth={1.5} />
          <h3 className="text-text-primary/70 text-sm font-medium">Disponibilidade Padrão</h3>
        </div>
        <div className="text-center py-6 text-text-primary/40 text-sm">
          Nenhuma disponibilidade configurada.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-text-primary/70" strokeWidth={1.5} />
        <h3 className="text-text-primary/70 text-sm font-medium">Disponibilidade Padrão</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {availability.map((day) => (
          <div
            key={day.week}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border ${
              day.available
                ? 'bg-success/10 border-success/20'
                : 'bg-error/10 border-error/20'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                day.available ? 'bg-success/20' : 'bg-error/20'
              }`}
            >
              {day.available ? (
                <Check className="w-5 h-5 text-success" strokeWidth={1.5} />
              ) : (
                <X className="w-5 h-5 text-error" strokeWidth={1.5} />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">{day.sunday}</p>
              <p className="text-xs text-text-primary/50 mt-0.5">
                {day.available ? 'Disponível' : 'Indisponível'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <p className="text-xs text-text-primary/50 flex items-center gap-2">
          <Clock className="w-3 h-3" strokeWidth={1.5} />
          Sua disponibilidade é usada para gerar as escalas mensais automaticamente
        </p>
      )}
    </div>
  );
});