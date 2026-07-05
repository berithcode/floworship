import { memo } from 'react';
import { Home, Compass, Library, User } from 'lucide-react';

interface BottomNavItemProps {
  icon: typeof Home;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const BottomNavItem = memo(function BottomNavItem({ icon: Icon, label, isActive, onClick }: BottomNavItemProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className="flex-1 flex flex-col items-center justify-center gap-1 py-2 relative focus-visible:outline-2 focus-visible:outline-brand-blue focus-visible:outline-offset-2"
    >
      {isActive && (
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(58, 134, 255, 0.2) 0%, rgba(131, 56, 236, 0.2) 100%)',
            backdropFilter: 'blur(12px)',
          }}
        />
      )}

      <Icon
        className={`w-6 h-6 relative z-10 transition-all duration-300 ${
          isActive ? 'text-white' : 'text-white/60 hover:text-white/80'
        }`}
        strokeWidth={1.5}
        style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
        aria-hidden
      />

      <span className={`text-xs font-medium relative z-10 transition-colors duration-300 sr-only ${
        isActive ? 'text-white' : 'text-white/60'
      }`}>
        {label}
      </span>
    </button>
  );
});

export interface BottomNavProps {
  activeTab?: 'home' | 'explore' | 'library' | 'profile';
  onTabChange?: (tab: 'home' | 'explore' | 'library' | 'profile') => void;
}

export const BottomNav = memo(function BottomNav({
  activeTab = 'home',
  onTabChange,
}: BottomNavProps) {
  const tabs: { icon: typeof Home; label: string; key: string }[] = [
    { icon: Home, label: 'Home', key: 'home' },
    { icon: Compass, label: 'Explore', key: 'explore' },
    { icon: Library, label: 'Library', key: 'library' },
    { icon: User, label: 'Profile', key: 'profile' },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(26, 26, 26, 0.6)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center">
        {tabs.map((tab) => (
          <BottomNavItem
            key={tab.key}
            icon={tab.icon}
            label={tab.label}
            isActive={activeTab === tab.key}
            onClick={() => onTabChange?.(tab.key as any)}
          />
        ))}
      </div>
    </nav>
  );
});