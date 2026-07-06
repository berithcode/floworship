import { Card } from '../ui/Card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: 'mint' | 'info' | 'success' | 'warning' | 'danger' | 'brand-purple';
  helperText?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'mint',
  helperText,
  trend
}: StatCardProps) {
  const colorClasses = {
    mint: 'bg-accent-mint/15 text-accent-mint border-accent-mint/30',
    info: 'bg-info/15 text-info border-info/30',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    'brand-purple': 'bg-brand-purple/15 text-brand-purple border-brand-purple/30'
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-danger',
    stable: 'text-text-tertiary'
  };

  return (
    <Card variant="gray-dark" padding="lg" hoverable>
      <div className="flex items-start justify-between mb-3">
        <span className="text-text-primary/60 text-sm font-medium">
          {label}
        </span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorClasses[iconColor]}`}>
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-text-primary text-3xl font-bold">
          {value}
        </span>
        {trend && (
          <span className={`text-sm font-medium ${trendColors[trend.direction]}`}>
            {trend.value}
          </span>
        )}
      </div>

      {helperText && (
        <p className="text-text-primary/60 text-xs mt-1">
          {helperText}
        </p>
      )}
    </Card>
  );
}
