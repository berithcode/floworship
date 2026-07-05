import { memo, ReactNode } from 'react';
import { Card } from '../ui/Card';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export const DashboardLayout = memo(function DashboardLayout({ sidebar, main }: DashboardLayoutProps) {
  return (
    <div className="flex gap-6 p-6 h-screen bg-bg-primary">
      <aside className="w-[280px] flex-shrink-0">
        <Card
          variant="gray-dark"
          padding="none"
          className="h-full overflow-hidden"
        >
          <div className="h-full overflow-auto scrollbar-hide">
            {sidebar}
          </div>
        </Card>
      </aside>

      <main className="flex-1 min-w-0 h-full overflow-hidden">
        <Card
          variant="gray-dark"
          padding="none"
          className="h-full flex flex-col"
        >
          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
            {main}
          </div>
        </Card>
      </main>
    </div>
  );
});