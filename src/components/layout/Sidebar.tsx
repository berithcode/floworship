import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_GROUPS } from '../../config/routes';
import './Sidebar.css';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__logo">
        <span className="sidebar__logo-icon">F</span>
        {!collapsed && <span className="sidebar__logo-text">Floworship</span>}
      </div>

      <nav className="sidebar__nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="sidebar__group">
            {!collapsed && <div className="sidebar__group-label">{group.label}</div>}
            {group.items.map((item) => (
              <button
                key={item.path}
                className={`sidebar__item ${location.pathname.startsWith(item.path) ? 'sidebar__item--active' : ''}`}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar__item-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar__item-label">{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">U</div>
          {!collapsed && <span className="sidebar__user-name">User</span>}
        </div>
        <button className="sidebar__collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '>' : '<'}
        </button>
      </div>
    </aside>
  );
}