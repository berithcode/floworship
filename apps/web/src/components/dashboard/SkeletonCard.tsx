import { memo } from 'react';
import { Card } from '../ui/Card';

export const SkeletonCard = memo(function SkeletonCard() {
  return (
    <Card variant="gray-dark" padding="lg">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-bg-tertiary" />
          <div className="flex-1">
            <div className="h-4 bg-bg-tertiary rounded w-24 mb-2" />
            <div className="h-6 bg-bg-tertiary rounded w-32" />
          </div>
        </div>
        <div className="h-8 bg-bg-tertiary rounded w-48" />
      </div>
    </Card>
  );
});