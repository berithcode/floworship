import React from 'react';
import './CircularIconButton.css';

interface CircularIconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function CircularIconButton({
  icon,
  onClick,
  ariaLabel,
  disabled = false,
  className = '',
}: CircularIconButtonProps) {
  return (
    <button
      type="button"
      className={`circular-icon-button ${className}`}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}