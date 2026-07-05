
import { useState, useEffect, memo } from 'react';
import { Save, Settings } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface MinistryConfig {
  defaultFormation: string[];
  availabilityDeadlineDays: number;
  substitutionWindowHours: number;
  cycleTriggerDay: number;
}

interface MinistryConfigSettingsProps {
  ministryId: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const FORMATION_ROLES = [
  'vocalista',
  'guitarrista',
  'tecladista',
  'baterista',
  'baixista',
  'violonista',
  'cavaco',
  'flautista',
  'violinista',
  'percussionista',
];

export const MinistryConfigSettings = memo(function MinistryConfigSettings({ ministryId }: MinistryConfigSettingsProps) {
  const [config, setConfig] = useState<MinistryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<string[]>([]);

  useEffect(() => {
    loadConfig();
  }, [ministryId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ministries/${ministryId}/config`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setSelectedFormation(data.defaultFormation || []);
      } else {
        // Config não existe, usa defaults
        setConfig({
          defaultFormation: ['vocalista', 'guitarrista', 'tecladista', 'baterista', 'baixista'],
          availabilityDeadlineDays: 5,
          substitutionWindowHours: 4,
          cycleTriggerDay: 20,
        });
        setSelectedFormation(['vocalista', 'guitarrista', 'tecladista', 'baterista', 'baixista']);
      }
    } catch {
      // usa defaults
      setConfig({
        defaultFormation: ['vocalista', 'guitarrista', 'tecladista', 'baterista', 'baixista'],
        availabilityDeadlineDays: 5,
        substitutionWindowHours: 4,
        cycleTriggerDay: 20,
      });
      setSelectedFormation(['vocalista', 'guitarrista', 'tecladista', 'baterista', 'baixista']);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/ministries/${ministryId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...config,
          defaultFormation: selectedFormation,
        }),
      });
      loadConfig();
    } finally {
      setSaving(false);
    }
  };

  const toggleFormation = (role: string) => {
    setSelectedFormation(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-accent-mint/30 border-t-accent-mint rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formação Padrão */}
      <div className="p-6 bg-bg-card-gray-dark rounded-2xl border border-border-subtle">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-accent-mint" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="text-text-primary font-semibold">Formação Padrão</h2>
        </div>
        <p className="text-text-primary/50 text-sm mb-4">
          Selecione as funções que compõem a equipe de louvor padrão para cada culto
        </p>
        <div className="flex flex-wrap gap-2">
          {FORMATION_ROLES.map(role => (
            <button
              key={role}
              onClick={() => toggleFormation(role)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                selectedFormation.includes(role)
                  ? 'bg-accent-mint text-on-mint border-accent-mint'
                  : 'bg-bg-tertiary text-text-primary/70 border-border-subtle hover:bg-bg-card-gray-dark'
              }`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Prazos */}
      <div className="p-6 bg-bg-card-gray-dark rounded-2xl border border-border-subtle space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Save className="w-5 h-5 text-info" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="text-text-primary font-semibold">Prazos e Configurações</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prazo Disponibilidade (dias)"
            type="number"
            value={config?.availabilityDeadlineDays || 5}
            onChange={e => setConfig(prev => prev ? { ...prev, availabilityDeadlineDays: parseInt(e.target.value) || 5 } : null)}
            helperText="Dias para coletar disponibilidade"
          />

          <Input
            label="Janela Substituição (horas)"
            type="number"
            value={config?.substitutionWindowHours || 4}
            onChange={e => setConfig(prev => prev ? { ...prev, substitutionWindowHours: parseInt(e.target.value) || 4 } : null)}
            helperText="Horas para encontrar substituto"
          />

          <Input
            label="Dia do Ciclo Mensal"
            type="number"
            value={config?.cycleTriggerDay || 20}
            onChange={e => setConfig(prev => prev ? { ...prev, cycleTriggerDay: parseInt(e.target.value) || 20 } : null)}
            helperText="Dia do mês para disparar ciclo (1-28)"
          />
        </div>

        <Button variant="primary" size="md" icon={Save} onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
});