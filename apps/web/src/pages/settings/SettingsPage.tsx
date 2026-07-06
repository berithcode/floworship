import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SettingsTabs, SettingsTab } from '../../components/settings/SettingsTabs';
import { GeneralSettings } from '../../components/settings/GeneralSettings';
import { MinistryConfigSettings } from '../../components/settings/MinistryConfigSettings';
import { TelegramIntegration } from '../../components/settings/TelegramIntegration';
import { NotificationPrefs } from '../../components/settings/NotificationPrefs';
import { PerformanceSettings } from '../../components/settings/PerformanceSettings';
import { WorshipScheduleSettings } from '../../components/settings/WorshipScheduleSettings';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useRole } from '../../hooks/useRole';
import { Card } from '../../components/ui/Card';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface MinistryInfo {
  name: string;
  description?: string;
  city?: string;
  website?: string;
}

export function SettingsPage() {
  const { user } = useAuth();
  const { isMusician } = useRole();
  const [activeTab, setActiveTab] = useState<SettingsTab>('ministry');
  const [ministryInfo, setMinistryInfo] = useState<MinistryInfo | null>(null);
  const [loadingMinistry, setLoadingMinistry] = useState(true);

  const ministryId = user?.ministries?.[0]?.ministryId || '';
  const ministryName = user?.ministries?.[0]?.ministryId || '';

  useEffect(() => {
    loadMinistryInfo();
  }, [ministryId]);

  const loadMinistryInfo = async () => {
    if (!ministryId) {
      setLoadingMinistry(false);
      return;
    }

    setLoadingMinistry(true);
    try {
      const res = await fetch(`${API_URL}/ministries/${ministryId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setMinistryInfo(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMinistry(false);
    }
  };

  const handleSaveMinistry = async (data: MinistryInfo) => {
    try {
      const res = await fetch(`${API_URL}/ministries/${ministryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        setMinistryInfo(data);
        alert('Dados do ministério atualizados com sucesso!');
      } else {
        throw new Error('Falha ao salvar');
      }
    } catch (error) {
      console.error('Failed to save ministry:', error);
      alert('Erro ao salvar dados do ministério.');
    }
  };

  if (loadingMinistry) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-accent-mint border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Configurações</h1>
          <p className="text-text-primary/60 text-sm mt-1">Gerencie seu ministério, configurações e integrações</p>
        </div>
        <ThemeToggle />
      </div>

      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-6">
        {activeTab === 'ministry' && (
          <GeneralSettings
            ministry={ministryInfo || { name: ministryName, description: '', city: '', website: '' }}
            onSave={handleSaveMinistry}
          />
        )}

        {activeTab === 'config' && (
          <>
            <WorshipScheduleSettings 
              ministryId={ministryId}
              onSave={() => {
                // Optionally refresh or show success message
              }}
            />
            <MinistryConfigSettings ministryId={ministryId} />
          </>
        )}

        {activeTab === 'telegram' && (
          <TelegramIntegration />
        )}

        {activeTab === 'notifications' && (
          <NotificationPrefs
            prefs={{ whatsappConfirmations: true, emailBackup: false, pushNotifications: false, reminderHours: 6 }}
            onSave={async (data) => {
              await fetch(`${API_URL}/settings/notifications`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
              });
            }}
          />
        )}

        {activeTab === 'performance' && (
          <PerformanceSettings
            config={{ transitionSeconds: 3, renderOrder: 'cifra-first' }}
            onSave={async (data) => {
              await fetch(`${API_URL}/settings/performance`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
              });
            }}
          />
        )}
      </div>
    </div>
  );
}