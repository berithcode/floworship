import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { Role } from './rbac';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  ministryId?: string;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const cookies = (request as any).cookies as Record<string, string | undefined>;
  const token = cookies?.access_token;

  if (!token) {
    reply.code(401).send({ error: 'Token de acesso não fornecido' });
    return;
  }

  try {
    const server = request.server as FastifyInstance;
    const payload = server.jwt.verify<{ userId: string; email: string; name: string; role: string; ministryId?: string }>(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        ministryMembers: {
          where: { role: payload.role || 'musician' },
          take: 1,
        },
      },
    });

    if (!user) {
      reply.code(401).send({ error: 'Usuário não encontrado' });
      return;
    }

    const membership = user.ministryMembers[0];

    (request as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: membership?.role as Role || 'musician',
      ministryId: membership?.ministryId,
    };
  } catch (err) {
    reply.code(401).send({ error: 'Token de acesso inválido ou expirado' });
  }
}
