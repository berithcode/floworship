
import { memo, useState, useCallback } from 'react';
import { Music, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface PerformanceConfig {
  transitionSeconds: number;
  renderOrder: 'cifra-first' | 'letra-first';
}

interface PerformanceSettingsProps {
  config: PerformanceConfig;
  onSave?: (data: PerformanceConfig) => Promise<void>;
}

export const PerformanceSettings = memo(function PerformanceSettings({ config, onSave }: PerformanceSettingsProps) {
  const [transitionSeconds, setTransitionSeconds] = useState(config.transitionSeconds);
  const [renderOrder, setRenderOrder] = useState<'cifra-first' | 'letra-first'>(config.renderOrder);
  const [saving, setSaving] = useState(false);

  const hasChanges = transitionSeconds !== config.transitionSeconds
    || renderOrder !== config.renderOrder;

  const handleSave = useCallback(async () => {
    if (!hasChanges || !onSave) return;
    setSaving(true);
    try {
      await onSave({ transitionSeconds, renderOrder });
    } finally {
      setSaving(false);
    }
  }, [transitionSeconds, renderOrder, hasChanges, onSave]);

  return (
    <Card variant="gray-dark" padding="lg">
      <div className="flex items-center gap-3 mb-6">
        <Music className="w-5 h-5 text-accent-mint" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="text-text-primary font-semibold">Configurações de Performance</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary/70 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
            Tempo de transição entre blocos
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={transitionSeconds}
              onChange={e => setTransitionSeconds(Math.max(1, Number(e.target.value)))}
              min={1}
              max={30}
              className="w-24 bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary text-center focus:outline-none focus:ring-2 focus:ring-accent-mint/30 focus:border-transparent transition-colors"
            />
            <span className="text-text-primary/50 text-sm">segundos</span>
          </div>
          <p className="text-xs text-text-primary/50 mt-1">Tempo de espera entre o fim de um bloco e o início do próximo</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary/70 mb-2 flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
            Ordem de renderização (Modo Cifra)
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setRenderOrder('cifra-first')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                renderOrder === 'cifra-first'
                  ? 'bg-accent-mint/15 border-accent-mint/30 text-accent-mint'
                  : 'bg-bg-tertiary border-border-subtle text-text-primary/70 hover:bg-bg-card-gray-dark'
              }`}
            >
              <Music className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              <div className="text-left">
                <p className="text-sm font-medium">Cifra primeiro</p>
                <p className="text-xs text-text-primary/50">Mostrar acordes acima da letra</p>
              </div>
            </button>

            <button
              onClick={() => setRenderOrder('letra-first')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                renderOrder === 'letra-first'
                  ? 'bg-accent-mint/15 border-accent-mint/30 text-accent-mint'
                  : 'bg-bg-tertiary border-border-subtle text-text-primary/70 hover:bg-bg-card-gray-dark'
              }`}
            >
              <Music className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              <div className="text-left">
                <p className="text-sm font-medium">Letra primeiro</p>
                <p className="text-xs text-text-primary/50">Mostrar letra com acordes ao lado</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="flex justify-end mt-6">
          <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      )}
    </Card>
  );
});