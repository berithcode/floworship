import { useState, useCallback, useEffect } from 'react';
import { Music, Mic2, Calendar, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface SessionFormDialogProps {
  open: boolean;
  mode: 'rehearsal' | 'cult';
  onClose: () => void;
  onSubmit: (data: { name: string; date: string; type: 'rehearsal' | 'cult' }) => void;
  isSubmitting?: boolean;
}

function getNextSunday(): Date {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + ((7 - today.getDay()) % 7 || 7));
  nextSunday.setHours(19, 0, 0, 0);
  return nextSunday;
}

function formatDateForInput(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getTypeInfo(type: 'rehearsal' | 'cult') {
  const configs = {
    rehearsal: { label: 'Ensaio', Icon: Music },
    cult: { label: 'Culto', Icon: Mic2 },
  };
  const config = configs[type];
  return { label: config.label, Icon: config.Icon };
}

export function SessionFormDialog({ open, mode, onClose, onSubmit, isSubmitting }: SessionFormDialogProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const typeInfo = getTypeInfo(mode);

  useEffect(() => {
    if (open) {
      if (mode === 'cult') {
        const nextSunday = getNextSunday();
        setDate(formatDateForInput(nextSunday));
        setName('Culto - ' + nextSunday.toLocaleDateString('pt-BR'));
      } else {
        const now = new Date();
        setDate(formatDateForInput(now));
        setName('Ensaio - ' + now.toLocaleDateString('pt-BR'));
      }
      setError(null);
    }
  }, [open, mode]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Informe o nome da sessão'); return; }
    if (!date) { setError('Informe a data'); return; }
    setError(null);
    // Backend espera 'ensaio' ou 'culto'
    const apiType = mode === 'cult' ? 'culto' : 'ensaio';
    onSubmit({ name: name.trim(), date, type: apiType as 'rehearsal' | 'cult' });
  }, [name, date, mode, onSubmit]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card variant="gray-dark" padding="lg" className="max-w-md w-full" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center">
              <typeInfo.Icon className="w-5 h-5 text-brand-purple" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Novo {typeInfo.label}</h3>
              <p className="text-xs text-text-primary/60">Crie uma nova sessão de {typeInfo.label.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-primary/50 hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={`Ex: ${mode === 'cult' ? 'Culto de Domingo' : 'Ensaio da Banda'}`}
          />

          <Input
            label="Data e Hora"
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            icon={Calendar}
          />

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="subtle" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Sessão'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
