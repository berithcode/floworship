import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNav.css';

const NAV_ITEMS = [
  { label: 'Inicio', path: '/dashboard', icon: 'home' },
  { label: 'Repertorio', path: '/library', icon: 'music' },
  { label: 'Escala', path: '/schedules', icon: 'calendar' },
  { label: 'Perfil', path: '/profile', icon: 'user' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.path}
          className={`bottom-nav__item ${location.pathname.startsWith(item.path) ? 'bottom-nav__item--active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}