import { memo } from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  from: string;
  content: string;
  time: string;
  isMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={`flex ${message.isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[70%] ${message.isMe ? 'order-1' : 'order-2'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            message.isMe
              ? 'bg-brand-blue text-white rounded-br-md'
              : 'bg-white/10 text-text-primary rounded-bl-md'
          }`}
        >
          {!message.isMe && (
            <p className="text-xs font-medium text-brand-purple mb-0.5">{message.from}</p>
          )}
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <div className={`flex items-center gap-1 mt-1 ${message.isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-text-primary/50">{message.time}</span>
          {message.isMe && message.status === 'read' && (
            <CheckCheck className="w-3 h-3 text-brand-blue" strokeWidth={2} />
          )}
          {message.isMe && message.status === 'delivered' && (
            <Check className="w-3 h-3 text-text-primary/50" strokeWidth={1.5} />
          )}
        </div>
      </div>
    </div>
  );
});