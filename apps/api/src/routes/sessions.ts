import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';
import type { AuthenticatedUser } from '../middleware/auth';

function getUser(request: { user?: unknown }): AuthenticatedUser | null {
  return (request.user as AuthenticatedUser) || null;
}

export async function sessionRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.post('/sessions', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const { type = 'ensaio' } = request.body as { type?: 'culto' | 'ensaio' };

    const schedule = await prisma.serviceSchedule.create({
      data: {
        ministryId: user.ministryId,
        date: new Date(),
        sessionType: type,
        createdById: user.id,
        operatorId: user.id,
      },
    });

    return { id: schedule.id, type: schedule.sessionType, date: schedule.date };
  });

  fastify.get('/sessions/upcoming', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const member = await prisma.ministryMember.findFirst({
      where: { userId: user.id, ministryId: user.ministryId },
      select: { id: true },
    });

    const sessions = await prisma.serviceSchedule.findMany({
      where: {
        ministryId: user.ministryId,
        date: { gte: new Date() },
      },
      take: 5,
      orderBy: { date: 'asc' },
      include: {
        assignments: {
          where: member ? { ministryMemberId: member.id } : { ministryMemberId: '' },
        },
        repertoire: {
          include: { song: { select: { title: true } } },
        },
      },
    });

    return sessions.map((s: any) => ({
      id: s.id,
      date: s.date,
      type: s.sessionType,
      confirmed: s.assignments.length > 0,
      repertoireCount: s.repertoire?.length || 0,
    }));
  });

  fastify.get('/sessions', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const sessions = await prisma.serviceSchedule.findMany({
      where: { ministryId: user.ministryId },
      orderBy: { date: 'desc' },
      take: 10,
    });

    return sessions;
  });

  // Importar repertório da escala de hoje para uma sessão
  fastify.post('/sessions/:scheduleId/import-repertoire', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const { scheduleId } = request.params as { scheduleId: string };

    // Buscar repertório da escala
    const schedule = await prisma.serviceSchedule.findUnique({
      where: { id: scheduleId },
      include: { repertoire: true },
    });

    if (!schedule) {
      return reply.status(404).send({ error: 'Escala não encontrada' });
    }

    // Criar sessão com mesmo repertório
    const session = await prisma.serviceSchedule.create({
      data: {
        ministryId: user.ministryId,
        date: new Date(),
        sessionType: 'ensaio',
        createdById: user.id,
        operatorId: user.id,
        repertoire: {
          create: schedule.repertoire.map(r => ({
            songId: r.songId,
            order: r.order,
            keyOverride: r.keyOverride,
          })),
        },
      },
    });

    return { sessionId: session.id, repertoireCount: schedule.repertoire.length };
  });
}
