
import './DialCircular.css';

interface DialCircularProps {
  value: number;
  size?: number;
  label?: string;
  className?: string;
}

export function DialCircular({
  value,
  size = 120,
  label,
  className = '',
}: DialCircularProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={`dial-circular ${className}`} style={{ width: size, height: size }}>
      <svg
        className="dial-circular-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="dial-circular-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={8}
        />
        <circle
          className="dial-circular-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="dial-circular-content">
        <span className="dial-circular-value">{Math.round(clampedValue)}%</span>
        {label && <span className="dial-circular-label">{label}</span>}
      </div>
    </div>
  );
}