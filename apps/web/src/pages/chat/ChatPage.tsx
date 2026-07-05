
import { useState, useCallback } from 'react';
import { ConversationList } from '../../components/chat/ConversationList';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInput } from '../../components/chat/MessageInput';
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

interface Message {
  id: string;
  from: string;
  content: string;
  time: string;
  isMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

const CONVERSATIONS: Conversation[] = [
  { id: 'sunday-14jul', type: 'sunday', name: '#14 Julho', lastMessage: 'Repertório confirmado! 🎵', lastTime: '10:30', unread: 2, members: 8 },
  { id: 'sunday-21jul', type: 'sunday', name: '#21 Julho', lastMessage: 'Precisamos de baterista', lastTime: '09:15', unread: 0, members: 7 },
  { id: 'sunday-28jul', type: 'sunday', name: '#28 Julho', lastMessage: 'Escala publicada', lastTime: 'Ter', members: 8 },
  { id: 'inst-guitar', type: 'instrument', name: '#Guitarra', lastMessage: 'Qual pedal vocês usam?', lastTime: '13:45', unread: 1, members: 3 },
  { id: 'inst-vozes', type: 'instrument', name: '#Vozes', lastMessage: 'Ensaio quinta às 20h', lastTime: '11:00', unread: 0, members: 4 },
  { id: 'inst-teclado', type: 'instrument', name: '#Teclado', lastMessage: '', lastTime: '', members: 2 },
  { id: 'general-avisos', type: 'general', name: 'Avisos Gerais', lastMessage: 'Culto especial domingo!', lastTime: '14:20', unread: 3, members: 24 },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'sunday-14jul': [
    { id: 'm1', from: 'Admin', content: 'Bom dia! Repertório do dia 14 está pronto.', time: '08:15', isMe: false, status: 'read' },
    { id: 'm2', from: 'João (Guitarra)', content: 'Show! Já estou estudando 🎸', time: '08:22', isMe: false, status: 'read' },
    { id: 'm3', from: 'Eu', content: 'Confirmo presença!', time: '08:30', isMe: true, status: 'read' },
    { id: 'm4', from: 'Ana (Vozes)', content: 'Alguém tem a cifra de "Lindo És"?', time: '09:10', isMe: false, status: 'read' },
    { id: 'm5', from: 'Admin', content: 'Subi no repertório da semana 👍', time: '10:30', isMe: false, status: 'read' },
    { id: 'm6', from: 'Eu', content: 'Repertório confirmado! 🎵', time: '10:35', isMe: true, status: 'read' },
  ],
  'inst-guitar': [
    { id: 'm7', from: 'Pedro', content: 'Qual pedal de delay vocês recomendam?', time: '12:00', isMe: false, status: 'read' },
    { id: 'm8', from: 'Eu', content: 'Uso o Boss DD-8, muito versátil!', time: '12:15', isMe: true, status: 'read' },
    { id: 'm9', from: 'Lucas', content: 'Strymon Timeline é o melhor mas é caro 😅', time: '13:30', isMe: false, status: 'read' },
    { id: 'm10', from: 'Pedro', content: 'Valeu! Vou testar o DD-8', time: '13:45', isMe: false, status: 'read' },
  ],
};

function ChatHeader({ conversation }: { conversation: Conversation | undefined }) {
  if (!conversation) return null;
  const Icon = conversation.type === 'sunday' ? Calendar : conversation.type === 'instrument' ? Music : Megaphone;
  return (
    <div className="flex items-center gap-3 p-4 border-b border-white/10">
      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-text-primary/70" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-text-primary font-medium">{conversation.name}</p>
        {conversation.members && (
          <p className="text-xs text-text-primary/50">{conversation.members} participantes</p>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Megaphone className="w-12 h-12 text-text-primary/50 mx-auto" strokeWidth={1} />
        <p className="text-text-primary/70 font-medium">Selecione uma conversa</p>
        <p className="text-text-primary/50 text-sm">Escolha uma conversa na lista à esquerda</p>
      </div>
    </div>
  );
}

export function ChatPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [conversations, setConversations] = useState(CONVERSATIONS);

  const active = conversations.find(c => c.id === activeId);
  const currentMessages = activeId ? (messages[activeId] || []) : [];

  const handleSend = useCallback((text: string) => {
    if (!activeId) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      from: 'Eu',
      content: text,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      status: 'sent',
    };

    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg],
    }));

    setConversations(prev =>
      prev.map(c =>
        c.id === activeId
          ? { ...c, lastMessage: text, lastTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
          : c
      )
    );
  }, [activeId]);

  return (
    <div className="h-[calc(100vh-3rem)] flex bg-bg-dark">
      <ConversationList
        conversations={conversations}
        activeId={activeId || undefined}
        onSelect={setActiveId}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader conversation={active} />

        <div className="flex-1 overflow-y-auto p-4">
          {currentMessages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        {active ? (
          <MessageInput onSend={handleSend} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}