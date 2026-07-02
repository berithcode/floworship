import { FastifyInstance } from 'fastify';
import { prisma } from '../db';

function getUserPayload(request: any): { userId: string; ministryId?: string; role?: string } | null {
  const token = request.cookies?.access_token;
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    return null;
  }
}

export async function ministriesRoutes(fastify: FastifyInstance) {
  // List user ministries
  fastify.get('/ministries', async (request: any, reply: any) => {
    const user = getUserPayload(request);
    if (!user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const memberships = await prisma.ministryMember.findMany({
      where: { userId: user.userId },
      include: { ministry: true },
    });

    return memberships.map((m: any) => ({
      id: m.ministry.id,
      name: m.ministry.name,
      role: m.role,
    }));
  });

  // Get ministry members
  fastify.get<{ Params: { id: string } }>('/ministries/:id/members', async (request: any, reply: any) => {
    const user = getUserPayload(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const members = await prisma.ministryMember.findMany({
      where: { ministryId: request.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return members.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      createdAt: m.createdAt,
    }));
  });

  // Add member (admin only)
  fastify.post<{ Params: { id: string }; Body: { userId: string; role?: string } }>(
    '/ministries/:id/members',
    async (request: any, reply: any) => {
      const user = getUserPayload(request);
      if (!user || user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { userId, role } = request.body;

      const existing = await prisma.ministryMember.findUnique({
        where: { userId_ministryId: { userId, ministryId: request.params.id } },
      });

      if (existing) {
        return reply.status(409).send({ error: 'User is already a member' });
      }

      const member = await prisma.ministryMember.create({
        data: {
          userId,
          ministryId: request.params.id,
          role: role || 'musician',
        },
      });

      return reply.status(201).send(member);
    }
  );

  // Remove member (admin only)
  fastify.delete<{ Params: { id: string; memberId: string } }>(
    '/ministries/:id/members/:memberId',
    async (request: any, reply: any) => {
      const user = getUserPayload(request);
      if (!user || user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      await prisma.ministryMember.delete({
        where: { id: request.params.memberId },
      });

      return { success: true };
    }
  );
}

export async function schedulesRoutes(fastify: FastifyInstance) {
  function getUser(request: any) {
    return getUserPayload(request);
  }

  // List schedules
  fastify.get('/schedules', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const schedules = await prisma.serviceSchedule.findMany({
      where: { ministryId: user.ministryId },
      include: {
        assignments: { include: { user: { select: { id: true, name: true } } } },
        repertoire: { include: { song: { select: { id: true, title: true, artist: true } } } },
      },
      orderBy: { date: 'desc' },
    });

    return schedules;
  });

  // Create schedule
  fastify.post('/schedules', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    if (user.role === 'musician') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const { date } = request.body as any;

    if (!date) {
      return reply.status(400).send({ error: 'Date is required' });
    }

    const schedule = await prisma.serviceSchedule.create({
      data: {
        ministryId: user.ministryId,
        date: new Date(date),
        createdById: user.userId,
      },
    });

    return reply.status(201).send(schedule);
  });

  // Add assignment
  fastify.post<{ Params: { id: string }; Body: { userId: string; role: string } }>(
    '/schedules/:id/assignments',
    async (request: any, reply: any) => {
      const user = getUser(request);
      if (!user || user.role === 'musician') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { userId, role } = request.body;

      const assignment = await prisma.serviceAssignment.create({
        data: {
          scheduleId: request.params.id,
          userId,
          role,
        },
      });

      return reply.status(201).send(assignment);
    }
  );

  // Confirm attendance
  fastify.put<{ Params: { id: string; assignmentId: string } }>(
    '/schedules/:id/assignments/:assignmentId/confirm',
    async (request: any, reply: any) => {
      const user = getUser(request);
      if (!user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const assignment = await prisma.serviceAssignment.findUnique({
        where: { id: request.params.assignmentId },
      });

      if (!assignment || assignment.userId !== user.userId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const updated = await prisma.serviceAssignment.update({
        where: { id: request.params.assignmentId },
        data: { confirmed: true, confirmedAt: new Date() },
      });

      return updated;
    }
  );
}