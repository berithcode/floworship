import { useState, useEffect, useCallback, useRef } from 'react';
import type { Block } from '@floworship/types';
import { toast } from 'sonner';

interface SessionSnapshot {
  currentBlockId: string | null;
  blocks: Block[];
  sequence: number;
  programadoPointer: number;
  overrideStack: { blockId: string; triggeredByUserId: string; triggeredAt: string }[];
  operatorId: string | null;
  operatorName: string | null;
  isOperator: boolean;
  isCreator: boolean;
}

interface SessionSocketState {
  currentBlock: Block | undefined;
  blocks: Block[];
  sequence: number;
  isOverrideActive: boolean;
  isConnected: boolean;
  operatorId: string | null;
  operatorName: string | null;
  isOperator: boolean;
  isCreator: boolean;
}

export function useSessionSocket(sessionId: string, ministryId: string): SessionSocketState & {
  triggerBlock: (blockId: string) => Promise<void>;
} {
  const [state, setState] = useState<SessionSocketState>({
    currentBlock: undefined,
    blocks: [],
    sequence: 0,
    isOverrideActive: false,
    isConnected: false,
    operatorId: null,
    operatorName: null,
    isOperator: false,
    isCreator: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const backoffRef = useRef(1000);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    const wsUrl = baseUrl ? `${protocol}//${baseUrl.replace('http:', '').replace('https:', '')}/ws` : `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      backoffRef.current = 1000;
      setState((prev) => ({ ...prev, isConnected: true }));
      ws.send(JSON.stringify({ type: 'join', sessionId, ministryId }));
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === 'block_changed') {
          setState((prev) => {
            const block = prev.blocks.find((b) => b.id === data.blockId);
            return {
              ...prev,
              currentBlock: block,
              sequence: data.sequence,
              isOverrideActive: data.wasOverride,
            };
          });
        } else if (data.type === 'operator_changed') {
          setState((prev) => ({
            ...prev,
            operatorId: data.operatorId,
            operatorName: data.operatorName,
            isOperator: data.operatorId === prev.operatorId
              ? prev.isOperator
              : prev.isOperator,
          }));
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
      reconnectTimeoutRef.current = setTimeout(() => {
        backoffRef.current = Math.min(backoffRef.current * 2, 30000);
        connect();
      }, backoffRef.current);
    };
  }, [sessionId, ministryId]);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${apiUrl}/sessions/${sessionId}/state`, { credentials: 'include' });
        if (res.ok) {
          const snapshot: SessionSnapshot = await res.json();
          const block = snapshot.blocks.find((b) => b.id === snapshot.currentBlockId);
          setState({
            currentBlock: block,
            blocks: snapshot.blocks,
            sequence: snapshot.sequence,
            isOverrideActive: snapshot.overrideStack.length > 0,
            isConnected: false,
            operatorId: snapshot.operatorId,
            operatorName: snapshot.operatorName,
            isOperator: snapshot.isOperator,
            isCreator: snapshot.isCreator,
          });
        }
      } catch {
        // ignore
      }
    };

    fetchSnapshot();
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect, sessionId]);

  const triggerBlock = useCallback(async (blockId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiUrl}/sessions/${sessionId}/trigger-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ blockId }),
      });
      if (!res.ok) {
        if (res.status === 403) {
          toast.error('Apenas o operador pode acionar blocos');
        } else {
          toast.error('Erro ao acionar bloco');
        }
        return;
      }
      const result = await res.json();
      return result;
    } catch (error) {
      console.error('Failed to trigger block:', error);
      toast.error('Erro de conexão ao acionar bloco');
    }
  }, [sessionId]);

  return { ...state, triggerBlock };
}