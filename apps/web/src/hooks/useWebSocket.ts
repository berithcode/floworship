import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  onMessage?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    onMessage,
  } = options;

  // Build WS URL from VITE_API_URL or fallback to current host
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
  const baseUrl = apiBaseUrl.replace('/api', '');
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const defaultWsUrl = baseUrl ? `${protocol}//${baseUrl.replace('http:', '').replace('https:', '')}/ws` : `${protocol}//${window.location.host}/ws`;
  const url = options.url ?? defaultWsUrl;

  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setConnected(true);
        reconnectAttempts.current = 0;
        console.log('[WebSocket] Connected');
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('[WebSocket] Disconnected');

        // Tentar reconectar se não foi desconexão intencional
        if (autoConnect && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {
          console.error('[WebSocket] Failed to parse message:', event.data);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      setConnected(false);
    }
  }, [url, autoConnect, onMessage]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return {
    connected,
    connect,
    disconnect,
    send,
  };
}