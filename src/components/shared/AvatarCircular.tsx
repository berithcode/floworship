import { useState } from 'react';
import './AvatarCircular.css';

interface AvatarCircularProps {
  src?: string;
  fallback?: string;
  size?: number;
  badge?: boolean;
  badgeColor?: string;
  className?: string;
}

export function AvatarCircular({
  src,
  fallback,
  size = 40,
  badge = false,
  badgeColor = 'var(--color-danger)',
  className = '',
}: AvatarCircularProps) {
  const [imageError, setImageError] = useState(false);
  const showFallback = !src || imageError;

  const initials = fallback
    ? fallback
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <div
      className={`avatar-circular ${className}`}
      style={{ width: size, height: size, borderRadius: '50%' }}
    >
      {showFallback ? (
        <div
          className="avatar-fallback"
          style={{
            backgroundColor: 'var(--color-accent-primary)',
            color: 'var(--color-text-primary)',
            width: size,
            height: size,
            fontSize: size * 0.4,
          }}
        >
          {initials}
        </div>
      ) : (
        <img
          src={src}
          alt=""
          className="avatar-image"
          style={{ width: size, height: size }}
          onError={() => setImageError(true)}
        />
      )}
      {badge && (
        <span
          className="avatar-badge"
          style={{ backgroundColor: badgeColor }}
        />
      )}
    </div>
  );
}