import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SettingsTabs, SettingsTab } from '../../components/settings/SettingsTabs';
import { GeneralSettings } from '../../components/settings/GeneralSettings';
import { MemberManagement } from '../../components/settings/MemberManagement';
import { MusicianManagement } from '../../components/settings/MusicianManagement';
import { MinistryConfigSettings } from '../../components/settings/MinistryConfigSettings';
import { TelegramIntegration } from '../../components/settings/TelegramIntegration';
import { NotificationPrefs } from '../../components/settings/NotificationPrefs';
import { PerformanceSettings } from '../../components/settings/PerformanceSettings';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('ministry');

  const ministryId = user?.ministries?.[0]?.ministryId || '';
  const ministryName = user?.ministries?.[0]?.ministryId || '';

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Configurações</h1>
          <p className="text-text-primary/60 text-sm mt-1">Gerencie seu ministério, membros e integrações</p>
        </div>
        <ThemeToggle />
      </div>

      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

      <div>
        {activeTab === 'ministry' && (
          <GeneralSettings
            ministry={{ name: ministryName, description: '', city: '', website: '' }}
            onSave={async (data) => {
              await fetch(`${API_URL}/settings/ministry`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
              });
            }}
          />
        )}

        {activeTab === 'members' && (
          <MemberManagement ministryId={ministryId} />
        )}

        {activeTab === 'musicians' && (
          <MusicianManagement ministryId={ministryId} />
        )}

        {activeTab === 'config' && (
          <MinistryConfigSettings ministryId={ministryId} />
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