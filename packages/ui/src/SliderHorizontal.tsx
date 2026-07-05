
import './SliderHorizontal.css';

interface SliderHorizontalProps {
  min?: number;
  max?: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  className?: string;
  'aria-label'?: string;
}

export function SliderHorizontal({
  min = 0,
  max = 100,
  value,
  onChange,
  step = 1,
  className = '',
  'aria-label': ariaLabel,
}: SliderHorizontalProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`slider-horizontal ${className}`}>
      <div className="slider-horizontal-track">
        <div
          className="slider-horizontal-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        className="slider-horizontal-input"
        min={min}
        max={max}
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
      />
    </div>
  );
}