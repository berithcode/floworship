
import { memo } from 'react';
import { Settings, MessageSquare, Bell, Music, Calendar } from 'lucide-react';

export type SettingsTab = 'ministry' | 'config' | 'telegram' | 'notifications' | 'performance';

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

const tabs: { id: SettingsTab; label: string; icon: any }[] = [
  { id: 'ministry', label: 'Ministério', icon: Settings },
  { id: 'config', label: 'Culto', icon: Calendar },
  { id: 'telegram', label: 'Telegram', icon: MessageSquare },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'performance', label: 'Performance', icon: Music },
];

export const SettingsTabs = memo(function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 p-1 bg-bg-tertiary rounded-2xl">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-accent-mint text-on-mint shadow-sm'
                : 'text-text-primary/70 hover:text-text-primary hover:bg-bg-card-gray-dark'
            }`}
          >
            <Icon className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
});