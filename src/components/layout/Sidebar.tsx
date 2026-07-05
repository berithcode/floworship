import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  FileText,
  Repeat,
  Users,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { SidebarItem } from '../ui/SidebarItem';
import { Button } from '../ui/Button';

export function Sidebar() {
  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: TrendingUp, label: 'Analytics', active: false },
    { icon: CreditCard, label: 'Transactions', active: false },
    { icon: FileText, label: 'Invoices', active: false },
  ];

  const featureItems = [
    { icon: Repeat, label: 'Recurring', badge: 0 },
    { icon: Users, label: 'Subscriptions', badge: 3 },
    { icon: MessageSquare, label: 'Feedback', badge: 0 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, #3A86FF 0%, #8338EC 100%)',
            }}
          >
            <Sparkles className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-xl font-bold text-white">Floworship</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {/* Main Navigation */}
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              isActive={item.active}
              badge={item.badge}
            />
          ))}
        </div>

        {/* Features Section */}
        <div className="pt-6 mt-6 border-t border-white/10">
          <p className="px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Features
          </p>
          <div className="space-y-2">
            {featureItems.map((item) => (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                isActive={false}
                badge={item.badge}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Upgrade Pro */}
      <div className="p-4 mt-auto">
        <div
          className="relative p-4 rounded-2xl overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(255, 140, 66, 0.3) 0%, rgba(255, 56, 56, 0.3) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Aurora effect */}
          <div
            className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-orange-500 opacity-60 filter blur-[40px]"
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-orange-400" strokeWidth={1.5} />
              <span className="text-sm font-bold text-white">Upgrade Pro</span>
            </div>
            <p className="text-xs text-white/80 mb-3">
              Higher productivity with better organization
            </p>
            <Button
              variant="glass"
              size="sm"
              fullWidth
              className="bg-white/20 hover:bg-white/30 border-white/20"
            >
              Upgrade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}