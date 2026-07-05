import { useTheme } from '../../context/ThemeContext';
import { memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Music,
  Calendar,
  CalendarCheck,
  Play,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Users,
} from 'lucide-react';
import { useRole } from '../../hooks/useRole';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Music, label: 'Músicas', path: '/library' },
  { icon: Calendar, label: 'Escalas', path: '/schedules' },
  { icon: CalendarCheck, label: 'Minha Escala', path: '/my-schedule' },
  { icon: Users, label: 'Equipe', path: '/team' },
  { icon: Play, label: 'Sessão', path: '/session' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: User, label: 'Perfil', path: '/profile' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

const musicianNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Music, label: 'Músicas', path: '/library' },
  { icon: CalendarCheck, label: 'Minha Escala', path: '/my-schedule' },
  { icon: Play, label: 'Sessão', path: '/session' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

export const Sidebar = memo(function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMusician } = useRole();
  const { theme } = useTheme();
  const navItems = useMemo(() => isMusician ? musicianNavItems : adminNavItems, [isMusician]);

  const isLight = theme === 'light';
  
  // Light theme: sidebar preta com textos BRANCOS (opacity para hierarquia)
  // Dark theme: sidebar escura com tokens padrão
  const sidebarBg = isLight ? 'bg-[#0A0A0A]' : 'bg-bg-secondary';
  const borderColor = isLight ? 'border-white/10' : 'border-border-subtle';
  
  return (
    <div className={`flex flex-col h-full ${sidebarBg} border-r ${borderColor}`}>
      <div className={`p-6 pb-4 ${isLight ? 'border-b border-white/10' : ''}`}>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3"
          aria-label="Floworship - voltar ao dashboard"
        >
          <img
            src={isLight ? '/logo-dark.svg' : '/logo-light.svg'}
            alt="Floworship"
            className="w-10 h-10 rounded-xl"
          />
          <span className={`text-xl font-bold ${isLight ? 'text-white' : 'text-text-primary'}`}>Floworship</span>
        </button>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-[background-color,color] duration-150 ease-[var(--ease-out)] ${
                  isActive
                    ? isLight
                      ? 'bg-white/15 text-white border-l-2 border-[#B8E844] pl-[calc(1rem-2px)]'
                      : 'bg-accent-mint/20 text-accent-mint border-l-2 border-accent-mint pl-[calc(1rem-2px)]'
                    : isLight
                      ? 'text-white/60 hover:text-white/80 hover:bg-white/10'
                      : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="flex-1 text-left truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className={`p-4 ${isLight ? 'border-t border-white/10' : 'border-t border-border-subtle'}`}>
        <button
          onClick={() => {
            document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            navigate('/login');
          }}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-[background-color,color] duration-150 ease-[var(--ease-out)] ${
            isLight
              ? 'text-white/60 hover:text-white/80 hover:bg-white/10'
              : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary'
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span className="flex-1 text-left truncate">Sair</span>
        </button>
      </div>
    </div>
  );
});