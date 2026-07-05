import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';
import type { AuthenticatedUser } from '../middleware/auth';

function getUser(request: { user?: unknown }): AuthenticatedUser | null {
  return (request.user as AuthenticatedUser) || null;
}

export async function musicianRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/musicians', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const members = await prisma.ministryMember.findMany({
      where: { ministryId: user.ministryId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return members.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      name: m.user?.name || 'Unknown',
      email: m.user?.email || '',
      instrument: m.instrument || '',
      worshipRoles: JSON.parse(m.worshipRoles || '[]'),
      telegramLinked: !!m.telegramChatId,
      telegramUsername: m.telegramUsername,
      isActiveInSchedule: m.isActiveInSchedule,
      createdAt: m.createdAt,
    }));
  });

  fastify.get<{ Params: { id: string } }>('/musicians/:id', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const member = await prisma.ministryMember.findUnique({
      where: { id: request.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!member || member.ministryId !== user.ministryId) {
      return reply.status(404).send({ error: 'Musician not found' });
    }

    return {
      id: member.id,
      userId: member.userId,
      name: member.user?.name || 'Unknown',
      email: member.user?.email || '',
      instrument: member.instrument || '',
      worshipRoles: member.worshipRoles,
      telegramLinked: !!member.telegramChatId,
      telegramUsername: member.telegramUsername,
      isActiveInSchedule: member.isActiveInSchedule,
    };
  });

  fastify.post('/', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user || user.role === 'musician') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const { userId, instrument, worshipRoles } = request.body;

    if (!userId) {
      return reply.status(400).send({ error: 'userId is required' });
    }

    const existing = await prisma.ministryMember.findFirst({
      where: { userId, ministryId: user.ministryId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Member not found in this ministry' });
    }

    const worshipRolesArray = Array.isArray(worshipRoles) ? worshipRoles : [];

    const updated = await prisma.ministryMember.update({
      where: { id: existing.id },
      data: {
        instrument: instrument || existing.instrument,
        worshipRoles: JSON.stringify(worshipRolesArray),
        isActiveInSchedule: true,
      },
    });

    return reply.status(200).send({
      id: updated.id,
      userId: updated.userId,
      instrument: updated.instrument,
      worshipRoles: worshipRolesArray,
    });
  });

  fastify.put<{ Params: { id: string } }>('/musicians/:id', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user || user.role === 'musician') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const member = await prisma.ministryMember.findUnique({
      where: { id: request.params.id },
    });

    if (!member || member.ministryId !== user.ministryId) {
      return reply.status(404).send({ error: 'Musician not found' });
    }

    const { instrument, worshipRoles, isActiveInSchedule } = request.body;
    const updateData: any = {};

    if (instrument !== undefined) updateData.instrument = instrument;
    if (worshipRoles !== undefined) updateData.worshipRoles = JSON.stringify(Array.isArray(worshipRoles) ? worshipRoles : []);
    if (isActiveInSchedule !== undefined) updateData.isActiveInSchedule = isActiveInSchedule;

    const updated = await prisma.ministryMember.update({
      where: { id: request.params.id },
      data: updateData,
    });

    return {
      id: updated.id,
      instrument: updated.instrument,
      worshipRoles: updated.worshipRoles,
      isActiveInSchedule: updated.isActiveInSchedule,
    };
  });

  fastify.delete<{ Params: { id: string } }>('/musicians/:id', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user || user.role === 'musician') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const member = await prisma.ministryMember.findUnique({
      where: { id: request.params.id },
    });

    if (!member || member.ministryId !== user.ministryId) {
      return reply.status(404).send({ error: 'Musician not found' });
    }

    // Clean up related records before deleting
    await prisma.$transaction([
      prisma.serviceAssignment.deleteMany({
        where: { ministryMemberId: member.id },
      }),
      prisma.notificationLog.deleteMany({
        where: { ministryMemberId: member.id },
      }),
      prisma.ministryMember.delete({
        where: { id: member.id },
      }),
    ]);

    return { success: true };
  });
}
