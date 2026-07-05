import { type LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  badge?: number;
}

export function SidebarItem({ icon: Icon, label, isActive, badge }: SidebarItemProps) {
  return (
    <button
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-white/10 text-white shadow-sm'
          : 'text-white/60 hover:text-white/80 hover:bg-white/5'
      }`}
    >
      <Icon className="w-5 h-5" strokeWidth={1.5} />
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-purple/20 text-brand-purple">
          {badge}
        </span>
      )}
    </button>
  );
}
