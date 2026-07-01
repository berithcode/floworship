import React from 'react';
import './BottomNavPill.css';

interface BottomNavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

interface BottomNavPillProps {
  items: BottomNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function BottomNavPill({
  items,
  activeId,
  onSelect,
  className = '',
}: BottomNavPillProps) {
  if (items.length === 0) return null;

  return (
    <nav className={`bottom-nav-pill ${className}`} aria-label="Bottom navigation">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}