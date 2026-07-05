import { memo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Music,
  CalendarCheck,
  User,
  Sparkles,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

function BottomNavItem({ icon: Icon, label, isActive, onClick }: BottomNavItemProps) {
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

      <span className={`text-[10px] font-medium relative z-10 transition-colors duration-300 ${
        isActive ? 'text-white' : 'text-white/60'
      }`}>
        {label}
      </span>
    </button>
  );
}

const tabs = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Music, label: 'Músicas', path: '/library' },
  { icon: CalendarCheck, label: 'Escala', path: '/my-schedule' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

export const MusicianLayout = memo(function MusicianLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const activeTab = tabs.findIndex(t => location.pathname.startsWith(t.path));
  const isStudyMode = location.pathname.includes('/study');

  function handleLogout() {
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    navigate('/login');
  }

  return (
    <div className={`${isStudyMode ? 'h-full' : 'min-h-screen'} bg-bg-dark flex flex-col`}>
      {!isStudyMode && (
        <header className="sticky top-0 z-30 px-4 py-4 bg-bg-dark/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, #3A86FF 0%, #8338EC 100%)',
                }}
              >
                <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-white/60 text-xs">Bem-vindo</p>
                <h1 className="text-base font-bold text-white truncate max-w-[200px]">
                  {user?.name || 'Músico'}
                </h1>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Sair"
            >
              <LogOut className="w-5 h-5 text-white/60" strokeWidth={1.5} />
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 min-h-0 px-4 overflow-hidden ${isStudyMode ? 'pb-0 px-0' : 'pb-24'}`}>
        <Outlet />
      </main>

      {!isStudyMode && (
        <nav
          aria-label="Navegação principal"
          className="fixed bottom-0 left-0 right-0 z-50"
          style={{
            background: 'rgba(26, 26, 26, 0.85)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div className="flex items-center max-w-lg mx-auto px-2 py-1">
            {tabs.map((tab, index) => (
              <BottomNavItem
                key={tab.path}
                icon={tab.icon}
                label={tab.label}
                isActive={activeTab === index}
                onClick={() => navigate(tab.path)}
              />
            ))}
          </div>
        </nav>
      )}
    </div>
  );
});
