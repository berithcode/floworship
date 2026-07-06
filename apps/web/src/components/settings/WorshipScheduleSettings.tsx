import { useState, useEffect, memo } from 'react';
import { Calendar, Clock, Save } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface WorshipScheduleConfig {
  worshipDays: number[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  worshipTime: string; // HH:MM
  rehearsalTime: string; // HH:MM
  rehearsalDay?: number; // Dia do ensaio (opcional, pode ser antes do culto)
}

interface WorshipScheduleSettingsProps {
  ministryId: string;
  onSave?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

const WEEKDAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export const WorshipScheduleSettings = memo(function WorshipScheduleSettings({ ministryId, onSave }: WorshipScheduleSettingsProps) {
  const [config, setConfig] = useState<WorshipScheduleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [ministryId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ministries/${ministryId}/worship-schedule`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        // Config não existe, usa defaults
        setConfig({
          worshipDays: [0], // Apenas domingo
          worshipTime: '19:00',
          rehearsalTime: '15:00',
          rehearsalDay: 0, // Ensaios no mesmo dia do culto (antes)
        });
      }
    } catch {
      setConfig({
        worshipDays: [0],
        worshipTime: '19:00',
        rehearsalTime: '15:00',
        rehearsalDay: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/ministries/${ministryId}/worship-schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        throw new Error('Falha ao salvar configurações');
      }

      onSave?.();
    } catch (error) {
      console.error('Failed to save worship schedule:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const toggleWorshipDay = (dayIndex: number) => {
    if (!config) return;
    
    setConfig(prev => {
      if (!prev) return null;
      
      const hasDay = prev.worshipDays.includes(dayIndex);
      const newDays = hasDay
        ? prev.worshipDays.filter(d => d !== dayIndex)
        : [...prev.worshipDays, dayIndex].sort();
      
      return { ...prev, worshipDays: newDays };
    });
  };

  const updateTime = (type: 'worship' | 'rehearsal', value: string) => {
    if (!config) return;
    setConfig(prev => prev ? { 
      ...prev, 
      [type === 'worship' ? 'worshipTime' : 'rehearsalTime']: value 
    } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-accent-mint/30 border-t-accent-mint rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card variant="gray-dark" padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-accent-mint" strokeWidth={1.5} />
          <div>
            <h2 className="text-text-primary font-semibold">Dias e Horários de Culto</h2>
            <p className="text-text-primary/60 text-sm mt-0.5">
              Configure quando ocorrem os cultos e ensaios no seu ministério
            </p>
          </div>
        </div>

        {/* Dias de Culto */}
        <div>
          <label className="block text-sm font-medium text-text-primary/70 mb-3">
            Dias de Culto
          </label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day, index) => (
              <button
                key={day}
                onClick={() => toggleWorshipDay(index)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  config?.worshipDays.includes(index)
                    ? 'bg-accent-mint text-on-mint border-accent-mint shadow-lg shadow-accent-mint/20'
                    : 'bg-bg-tertiary text-text-primary/70 border-border-subtle hover:bg-bg-card-gray-dark'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          {config?.worshipDays.length === 0 && (
            <p className="text-danger text-xs mt-2">
              Selecione pelo menos um dia de culto
            </p>
          )}
        </div>

        {/* Horários */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary/70 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} />
              Horário do Culto
            </label>
            <Input
              type="time"
              value={config?.worshipTime || '19:00'}
              onChange={e => updateTime('worship', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary/70 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} />
              Horário do Ensaio
            </label>
            <Input
              type="time"
              value={config?.rehearsalTime || '15:00'}
              onChange={e => updateTime('rehearsal', e.target.value)}
            />
          </div>
        </div>

        {/* Dia do Ensaio (opcional) */}
        <div>
          <label className="block text-sm font-medium text-text-primary/70 mb-3">
            Dia do Ensaio (opcional)
          </label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day, index) => (
              <button
                key={day}
                onClick={() => setConfig(prev => prev ? { ...prev, rehearsalDay: index } : null)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  config?.rehearsalDay === index
                    ? 'bg-info text-white border-info shadow-lg shadow-info/20'
                    : 'bg-bg-tertiary text-text-primary/70 border-border-subtle hover:bg-bg-card-gray-dark'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          <p className="text-text-primary/60 text-xs mt-2">
            Deixe selecionado o mesmo dia do culto se o ensaio for antes do culto
          </p>
        </div>

        {/* Preview */}
        {config && config.worshipDays.length > 0 && (
          <div className="p-4 bg-bg-tertiary rounded-xl border border-border-subtle">
            <p className="text-text-primary/70 text-sm font-medium mb-2">
              Preview da Geração de Escalas:
            </p>
            <ul className="space-y-1 text-xs text-text-primary/60">
              {config.worshipDays.map(dayIndex => (
                <li key={dayIndex}>
                  <span className="text-accent-mint font-medium">{WEEKDAYS[dayIndex]}</span>
                  {' '}às {config.worshipTime} • Ensaio: {WEEKDAYS[config.rehearsalDay || dayIndex]} às {config.rehearsalTime}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            icon={Save}
            onClick={handleSave}
            disabled={saving || !config || config.worshipDays.length === 0}
          >
            {saving ? 'Salvando...' : 'Salvar Dias e Horários'}
          </Button>
        </div>
      </div>
    </Card>
  );
});