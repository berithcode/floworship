
import { memo, useState, useCallback } from 'react';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface NotificationPrefs {
  whatsappConfirmations: boolean;
  emailBackup: boolean;
  pushNotifications: boolean;
  reminderHours: number;
}

interface NotificationPrefsProps {
  prefs: NotificationPrefs;
  onSave?: (data: NotificationPrefs) => Promise<void>;
}

export const NotificationPrefs = memo(function NotificationPrefs({ prefs, onSave }: NotificationPrefsProps) {
  const [whatsappConfirmations, setWhatsappConfirmations] = useState(prefs.whatsappConfirmations);
  const [emailBackup, setEmailBackup] = useState(prefs.emailBackup);
  const pushNotifications = prefs.pushNotifications;
  const [reminderHours, setReminderHours] = useState(prefs.reminderHours);
  const [saving, setSaving] = useState(false);

  const hasChanges = whatsappConfirmations !== prefs.whatsappConfirmations
    || emailBackup !== prefs.emailBackup
    || pushNotifications !== prefs.pushNotifications
    || reminderHours !== prefs.reminderHours;

  const handleSave = useCallback(async () => {
    if (!hasChanges || !onSave) return;
    setSaving(true);
    try {
      await onSave({ whatsappConfirmations, emailBackup, pushNotifications, reminderHours });
    } finally {
      setSaving(false);
    }
  }, [whatsappConfirmations, emailBackup, pushNotifications, reminderHours, hasChanges, onSave]);

  return (
    <div className="space-y-6 p-6 bg-bg-card-gray-dark rounded-2xl border border-border-subtle">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-accent-mint" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="text-text-primary font-semibold">Preferências de Notificação</h2>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 bg-bg-tertiary rounded-xl cursor-pointer hover:bg-bg-card-gray-dark transition-colors">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-success" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-text-primary">Confirmações via WhatsApp</p>
              <p className="text-xs text-text-primary/50">Receber mensagens de confirmação de escala</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={whatsappConfirmations}
              onChange={e => setWhatsappConfirmations(e.target.checked)}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${whatsappConfirmations ? 'bg-accent-mint' : 'bg-border-strong'} peer-focus:ring-2 peer-focus:ring-accent-mint/30`}>
              <div className={`w-5 h-5 rounded-full bg-text-on-mint shadow-sm transition-transform ${whatsappConfirmations ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
            </div>
          </div>
        </label>

        <label className="flex items-center justify-between p-4 bg-bg-tertiary rounded-xl cursor-pointer hover:bg-bg-card-gray-dark transition-colors">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-info" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-text-primary">Email Backup</p>
              <p className="text-xs text-text-primary/50">Receber cópia de convites por email</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={emailBackup}
              onChange={e => setEmailBackup(e.target.checked)}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${emailBackup ? 'bg-accent-mint' : 'bg-border-strong'} peer-focus:ring-2 peer-focus:ring-accent-mint/30`}>
              <div className={`w-5 h-5 rounded-full bg-text-on-mint shadow-sm transition-transform ${emailBackup ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
            </div>
          </div>
        </label>

        <label className="flex items-center justify-between p-4 bg-bg-tertiary rounded-xl cursor-pointer opacity-50">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-text-primary/50" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-text-primary">Push Notifications</p>
              <p className="text-xs text-text-primary/50">Notificações no navegador (em breve)</p>
            </div>
          </div>
          <span className="text-xs text-text-primary/50">Em breve</span>
        </label>

        <Input
          label="Lembrete antes do culto"
          value={reminderHours}
          onChange={e => setReminderHours(Number(e.target.value))}
        >
          <option value={1}>1 hora antes</option>
          <option value={3}>3 horas antes</option>
          <option value={6}>6 horas antes</option>
          <option value={12}>12 horas antes</option>
          <option value={24}>1 dia antes</option>
        </Input>
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