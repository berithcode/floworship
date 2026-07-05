import { memo, useState } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const MessageInput = memo(function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <div className="flex items-center gap-3 p-4 border-t border-white/10">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Digite uma mensagem..."
        disabled={disabled}
        className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-brand-blue disabled:opacity-50"
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50"
        aria-label="Enviar mensagem"
      >
        <Send className="w-4 h-4 text-white" strokeWidth={1.5} />
      </button>
    </div>
  );
});