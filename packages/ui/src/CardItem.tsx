import React from 'react';
import './CardItem.css';
import { CircularIconButton } from './CircularIconButton';

interface CardItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  active?: boolean;
  className?: string;
}

export function CardItem({
  icon,
  title,
  subtitle,
  onAction,
  actionIcon,
  active = false,
  className = '',
}: CardItemProps) {
  return (
    <div className={`card-item ${active ? 'active' : ''} ${className}`}>
      {icon && <div className="card-item-icon">{icon}</div>}
      <div className="card-item-content">
        <span className="card-item-title">{title}</span>
        {subtitle && <span className="card-item-subtitle">{subtitle}</span>}
      </div>
      {onAction && actionIcon && (
        <CircularIconButton
          icon={actionIcon}
          onClick={onAction}
          className="card-item-action"
        />
      )}
    </div>
  );
}