import { memo, useState, useCallback } from 'react';
import { Guitar, Piano, Drum, Mic, Music } from 'lucide-react';

export type Instrument = 'guitarra' | 'teclado' | 'bateria' | 'baixo' | 'vozes' | 'outro';

const instruments: { value: Instrument; label: string; icon: any }[] = [
  { value: 'guitarra', label: 'Guitarra', icon: Guitar },
  { value: 'teclado', label: 'Teclado', icon: Piano },
  { value: 'bateria', label: 'Bateria', icon: Drum },
  { value: 'baixo', label: 'Baixo', icon: Music },
  { value: 'vozes', label: 'Vozes', icon: Mic },
  { value: 'outro', label: 'Outro', icon: Music },
];

interface InstrumentSelectorProps {
  currentInstrument?: Instrument | null;
  onSave?: (instrument: Instrument) => void;
}

export const InstrumentSelector = memo(function InstrumentSelector({
  currentInstrument,
  onSave,
}: InstrumentSelectorProps) {
  const [selected, setSelected] = useState<Instrument | null>(currentInstrument || null);
  const [saving, setSaving] = useState(false);

  const handleSelect = useCallback((instrument: Instrument) => {
    setSelected(instrument);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await onSave?.(selected);
    } finally {
      setSaving(false);
    }
  }, [selected, onSave]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-text-primary/70 text-sm font-medium mb-3">Instrumento Principal</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {instruments.map((inst) => {
            const Icon = inst.icon;
            const isActive = selected === inst.value;
            return (
              <button
                key={inst.value}
                onClick={() => handleSelect(inst.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-brand-purple/20 border-brand-purple/30 text-brand-purple'
                    : 'bg-white/5 border-white/10 text-text-primary/70 hover:bg-white/10'
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={1.5} />
                <span className="text-xs font-medium">{inst.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selected !== currentInstrument && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !selected}
            className="px-6 py-2 bg-brand-blue text-white text-sm rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}
    </div>
  );
});