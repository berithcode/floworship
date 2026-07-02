import { useLocation } from 'react-router-dom';
import { NAV_GROUPS } from '../../config/routes';
import './Topbar.css';

export function Topbar() {
  const location = useLocation();

  const currentTitle = NAV_GROUPS.flatMap((g) => g.items).find((item) =>
    location.pathname.startsWith(item.path)
  )?.label || 'Floworship';

  return (
    <header className="topbar">
      <h1 className="topbar__title">{currentTitle}</h1>
      <div className="topbar__actions">
        <button className="topbar__search" title="Search (Cmd+K)">
          <span>Buscar</span>
        </button>
        <button className="topbar__notifications">
          <span>Notificacoes</span>
        </button>
        <div className="topbar__avatar">U</div>
      </div>
    </header>
  );
}