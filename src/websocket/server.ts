import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { TransitionEvent } from '../engine/types';

export interface SessionRoom {
  ministryId: string;
  sessionId: string;
  clients: Set<WebSocket>;
}

export class SessionWSServer {
  private wss: WebSocketServer;
  private rooms = new Map<string, SessionRoom>();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(ws, msg);
        } catch {
          ws.close(1008, 'Invalid message');
        }
      });

      ws.on('close', () => {
        this.removeClientFromAllRooms(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, msg: { type: string; sessionId?: string; ministryId?: string }) {
    if (msg.type === 'join' && msg.sessionId && msg.ministryId) {
      this.joinRoom(ws, msg.ministryId, msg.sessionId);
    } else if (msg.type === 'leave') {
      this.removeClientFromAllRooms(ws);
    }
  }

  joinRoom(ws: WebSocket, ministryId: string, sessionId: string): void {
    this.removeClientFromAllRooms(ws);

    const roomId = `ministry:${ministryId}:session:${sessionId}`;
    let room = this.rooms.get(roomId);
    if (!room) {
      room = { ministryId, sessionId, clients: new Set() };
      this.rooms.set(roomId, room);
    }
    room.clients.add(ws);

    ws.send(JSON.stringify({ type: 'joined', sessionId, ministryId }));
  }

  broadcast(sessionId: string, ministryId: string, event: TransitionEvent): void {
    const roomId = `ministry:${ministryId}:session:${sessionId}`;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const payload = JSON.stringify({ type: 'block_changed', ...event });
    for (const client of room.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  getSessionSnapshot(sessionId: string, ministryId: string): { clientCount: number } {
    const roomId = `ministry:${ministryId}:session:${sessionId}`;
    const room = this.rooms.get(roomId);
    return { clientCount: room?.clients.size || 0 };
  }

  private removeClientFromAllRooms(ws: WebSocket): void {
    for (const [roomId, room] of this.rooms) {
      room.clients.delete(ws);
      if (room.clients.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  close(): void {
    this.wss.close();
  }
}