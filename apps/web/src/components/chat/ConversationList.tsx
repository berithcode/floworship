import { memo } from 'react';
import { Calendar, Music, Megaphone } from 'lucide-react';

interface Conversation {
  id: string;
  type: 'sunday' | 'instrument' | 'general';
  name: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
  members?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
}

const typeIcons = {
  sunday: Calendar,
  instrument: Music,
  general: Megaphone,
};

export const ConversationList = memo(function ConversationList({
  conversations,
  activeId,
  onSelect,
}: ConversationListProps) {
  const grouped = {
    sunday: conversations.filter(c => c.type === 'sunday'),
    instrument: conversations.filter(c => c.type === 'instrument'),
    general: conversations.filter(c => c.type === 'general'),
  };

  return (
    <div className="w-72 border-r border-white/10 overflow-y-auto">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-text-primary font-semibold">Conversas</h2>
      </div>

      {Object.entries(grouped).map(([type, items]) => {
        if (items.length === 0) return null;
        const Icon = typeIcons[type as keyof typeof typeIcons];
        const labels = { sunday: 'Domingos', instrument: 'Instrumentos', general: 'Geral' };

        return (
          <div key={type} className="py-1">
            <div className="px-4 py-2 text-xs font-semibold text-text-primary/50 uppercase tracking-wider flex items-center gap-2">
              <Icon className="w-3 h-3" strokeWidth={1.5} />
              {labels[type as keyof typeof labels]}
            </div>
            {items.map(c => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeId === c.id ? 'bg-brand-purple/10 border-l-2 border-brand-purple' : 'hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-text-primary/70" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                    {c.lastTime && (
                      <span className="text-xs text-text-primary/50 shrink-0 ml-2">{c.lastTime}</span>
                    )}
                  </div>
                  {c.lastMessage && (
                    <p className="text-xs text-text-primary/50 truncate mt-0.5">{c.lastMessage}</p>
                  )}
                  {c.members && (
                    <p className="text-xs text-text-primary/50 mt-0.5">{c.members} participantes</p>
                  )}
                </div>
                {c.unread && c.unread > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-purple text-white shrink-0">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
});