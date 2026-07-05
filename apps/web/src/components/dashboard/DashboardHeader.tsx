import { memo } from 'react';
import { useAuth } from '../../context/AuthContext';

interface DashboardHeaderProps {
  ministryName?: string;
}

export const DashboardHeader = memo(function DashboardHeader({
  ministryName,
}: DashboardHeaderProps) {
  const { user } = useAuth();
  const userName = user?.name?.split(' ')[0] || 'Usuário';
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-4 -mt-2 mb-2">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
        style={{ background: 'linear-gradient(135deg, #3A86FF 0%, #8338EC 100%)' }}
      >
        {userInitial}
      </div>

      {/* Saudação */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          Olá, {userName}
        </h1>
        {ministryName && (
          <p className="text-sm text-text-tertiary">{ministryName}</p>
        )}
      </div>
    </div>
  );
});