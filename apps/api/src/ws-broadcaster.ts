import type { SessionWSServer } from './websocket/server';

let wsServer: SessionWSServer | null = null;

export function setWSServer(server: SessionWSServer): void {
  wsServer = server;
}

export function getWSServer(): SessionWSServer | null {
  return wsServer;
}