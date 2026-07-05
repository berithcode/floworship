
import { memo, useState, useCallback } from 'react';
import { Building2, MapPin, Globe } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface MinistryInfo {
  name: string;
  description?: string;
  city?: string;
  website?: string;
}

interface GeneralSettingsProps {
  ministry: MinistryInfo;
  onSave?: (data: MinistryInfo) => Promise<void>;
}

export const GeneralSettings = memo(function GeneralSettings({ ministry, onSave }: GeneralSettingsProps) {
  const [name, setName] = useState(ministry.name);
  const [description, setDescription] = useState(ministry.description || '');
  const [city, setCity] = useState(ministry.city || '');
  const [website, setWebsite] = useState(ministry.website || '');
  const [saving, setSaving] = useState(false);

  const hasChanges = name !== ministry.name ||
    description !== (ministry.description || '') ||
    city !== (ministry.city || '') ||
    website !== (ministry.website || '');

  const handleSave = useCallback(async () => {
    if (!hasChanges || !onSave) return;
    setSaving(true);
    try {
      await onSave({ name, description, city, website });
    } finally {
      setSaving(false);
    }
  }, [name, description, city, website, hasChanges, onSave]);

  return (
    <div className="space-y-6 p-6 bg-bg-card-gray-dark rounded-2xl border border-border-subtle">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-accent-mint" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="text-text-primary font-semibold">Dados do Ministério</h2>
      </div>

      <div className="space-y-4">
        <Input
          label="Nome"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome do ministério"
        />

        <div>
          <label className="block text-sm font-medium text-text-primary/70 mb-1.5">Descrição</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Breve descrição do ministério..."
            className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-mint/30 focus:border-transparent transition-colors resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={<><MapPin className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} aria-hidden="true" /> Cidade</>}
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="São Paulo"
          />

          <Input
            label={<><Globe className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} aria-hidden="true" /> Website</>}
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://igreja.com"
          />
        </div>
      </div>

      {hasChanges && (
        <div className="flex justify-end">
          <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      )}
    </div>
  );
});