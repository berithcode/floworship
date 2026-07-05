import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';
import type { AuthenticatedUser } from '../middleware/auth';

function getUser(request: { user?: unknown }): AuthenticatedUser | null {
  return (request.user as AuthenticatedUser) || null;
}

export async function profileRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/profile/me', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const memberships = await prisma.ministryMember.findMany({
      where: { userId: user.id },
      include: { ministry: true },
    });

    const member = await prisma.ministryMember.findFirst({
      where: { userId: user.id },
    });

    return {
      ...dbUser,
      ministries: memberships.map(m => ({
        ministryId: m.ministryId,
        ministryName: m.ministry.name,
        role: m.role,
      })),
      musician: member ? {
        instrument: member.instrument,
        worshipRoles: JSON.parse(member.worshipRoles || '[]'),
      } : null,
    };
  });
}