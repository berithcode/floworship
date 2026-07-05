import { memo } from 'react';
import { User, Mail, Shield } from 'lucide-react';

interface ProfileHeaderProps {
  name: string;
  email: string;
  role: string;
  ministryName?: string;
}

export const ProfileHeader = memo(function ProfileHeader({
  name,
  email,
  role,
  ministryName,
}: ProfileHeaderProps) {
  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      leader: 'Líder de Louvor',
      musician: 'Músico',
      operator: 'Operador',
    };
    return labels[role] || role;
  };

  const roleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      leader: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      musician: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      operator: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return colors[role] || 'bg-white/10 text-text-primary/70 border-white/10';
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-white/5 rounded-2xl border border-white/10">
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #3A86FF 0%, #8338EC 100%)',
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-success flex items-center justify-center border-2 border-bg-dark">
          <Shield className="w-4 h-4 text-white" strokeWidth={1.5} />
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
        <p className="text-text-primary/50 text-sm mt-1">{email}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColor(role)}`}>
          {roleLabel(role)}
        </span>
        {ministryName && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-text-primary/70 border border-white/10">
            {ministryName}
          </span>
        )}
      </div>

      <div className="flex gap-6 mt-2 text-sm text-text-primary/50">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" strokeWidth={1.5} />
          <span>ID: {name.split(' ')[0].toLowerCase()}{Math.floor(Math.random() * 1000)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4" strokeWidth={1.5} />
          <span>Verificado</span>
        </div>
      </div>
    </div>
  );
});