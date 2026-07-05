import { memo } from 'react';
import { ReactNode } from 'react';

export interface BackgroundProps {
  children: ReactNode;
  className?: string;
}

export const Background = memo(function Background({
  children,
  className = '',
}: BackgroundProps) {
  return (
    <div className={`relative bg-bg-primary min-h-screen ${className}`}>
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
});

Background.displayName = 'Background';