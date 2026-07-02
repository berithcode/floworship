import type { FastifyInstance } from 'fastify';
import { prisma } from '../../server/db';
import { authMiddleware } from '../../server/middleware/auth';

export async function sessionStateRoutes(app: FastifyInstance) {
  app.get('/sessions/:id/state', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const session = await prisma.serviceSchedule.findUnique({
      where: { id },
    });

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    return {
      currentBlockId: null,
      blocks: [],
      sequence: 0,
      timestamp: new Date().toISOString(),
      programadoPointer: 0,
      overrideStack: [],
    };
  });
}