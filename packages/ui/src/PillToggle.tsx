
import './PillToggle.css';

interface PillToggleOption {
  value: string;
  label: string;
}

interface PillToggleProps {
  options: PillToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PillToggle({ options, value, onChange, className = '' }: PillToggleProps) {
  if (options.length === 0) return null;

  return (
    <div className={`pill-toggle ${className}`} role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`pill-toggle-option ${value === option.value ? 'active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}