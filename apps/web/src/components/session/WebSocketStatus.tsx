import { memo } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface WebSocketStatusProps {
  connected: boolean;
}

export const WebSocketStatus = memo(function WebSocketStatus({ connected }: WebSocketStatusProps) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
      connected
        ? 'bg-success/20 text-success border border-success/30'
        : 'bg-error/20 text-error border border-error/30'
    }`}>
      {connected ? (
        <Wifi className="w-3.5 h-3.5" strokeWidth={1.5} />
      ) : (
        <WifiOff className="w-3.5 h-3.5" strokeWidth={1.5} />
      )}
      {connected ? 'Servidor Online' : 'Servidor Offline'}
    </div>
  );
});