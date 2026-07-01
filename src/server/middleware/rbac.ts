import { FastifyRequest, FastifyReply } from 'fastify';

export type Role = 'admin' | 'operator' | 'musician';

export interface AuthRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    role: Role;
    ministryId?: string;
  };
}

export function requireRole(...allowedRoles: Role[]) {
  return async (request: AuthRequest, reply: FastifyReply) => {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  };
}

export function requireAuth() {
  return async (request: AuthRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  };
}

export function requireMinistry() {
  return async (request: AuthRequest, reply: FastifyReply) => {
    if (!request.user?.ministryId) {
      return reply.status(403).send({ error: 'No ministry selected' });
    }
  };
}