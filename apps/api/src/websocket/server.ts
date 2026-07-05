import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { IncomingMessage } from 'http';
import type { TransitionEvent } from '@floworship/types';
import { createHmac } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || process.env.TOKEN_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or TOKEN_SECRET environment variable is required for WebSocket auth');
}

export interface SessionRoom {
  ministryId: string;
  sessionId: string;
  clients: Set<WebSocket>;
}

interface AuthenticatedWebSocket extends WebSocket {
  data: {
    userId: string;
    ministryId?: string;
  };
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split('=');
    if (key && valueParts.length > 0) {
      cookies[key.trim()] = valueParts.join('=').trim();
    }
  }
  return cookies;
}

function verifyJwt(token: string): { userId: string; email: string; name: string; role: string; ministryId?: string } | null {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;

    const expected = createHmac('sha256', JWT_SECRET!).update(`${header}.${payload}`).digest('hex');
    if (expected !== signature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (decoded.exp && decoded.exp < Date.now()) return null;

    return decoded;
  } catch {
    return null;
  }
}

export class SessionWSServer {
  private wss: WebSocketServer;
  private rooms = new Map<string, SessionRoom>();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const cookieHeader = req.headers.cookie || '';
      const cookies = parseCookies(cookieHeader);
      const token = cookies.access_token;

      if (!token) {
        ws.close(4001, 'Authentication required');
        return;
      }

      const payload = verifyJwt(token);
      if (!payload) {
        ws.close(4001, 'Invalid or expired token');
        return;
      }

      (ws as AuthenticatedWebSocket).data = {
        userId: payload.userId,
        ministryId: payload.ministryId,
      };

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
