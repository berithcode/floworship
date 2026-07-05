import { FastifyRequest, FastifyReply } from 'fastify';

export type Role = 'admin' | 'operator' | 'musician';

export function requireRole(...allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as { id: string; email: string; role: Role; ministryId?: string } | undefined;

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  };
}

export function requireAuth() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!(request as any).user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  };
}

export function requireMinistry() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!(request as any).user?.ministryId) {
      return reply.status(403).send({ error: 'No ministry selected' });
    }
  };
}