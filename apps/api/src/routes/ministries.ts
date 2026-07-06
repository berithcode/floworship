import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';
import type { AuthenticatedUser } from '../middleware/auth';

function getUser(request: { user?: unknown }): AuthenticatedUser | null {
  return (request.user as AuthenticatedUser) || null;
}

export async function ministriesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  // Get ministry config
  fastify.get<{ Params: { id: string } }>('/ministries/:id/config', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId || user.ministryId !== request.params.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const config = await prisma.ministryConfig.findUnique({
      where: { ministryId: request.params.id },
    });

    return config || {
      ministryId: request.params.id,
      defaultFormation: ['vocalista', 'guitarrista', 'tecladista', 'baterista', 'baixista'],
      availabilityDeadlineDays: 5,
      substitutionWindowHours: 4,
      cycleTriggerDay: 20,
    };
  });

  // Update ministry config
  fastify.put<{ Params: { id: string }; Body: any }>(
    '/ministries/:id/config',
    async (request: any, reply: any) => {
      const user = getUser(request);
      if (!user?.ministryId || user.ministryId !== request.params.id || user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { defaultFormation, availabilityDeadlineDays, substitutionWindowHours, cycleTriggerDay } = request.body;

      const config = await prisma.ministryConfig.upsert({
        where: { ministryId: request.params.id },
        update: {
          defaultFormation: JSON.stringify(defaultFormation || []),
          availabilityDeadlineDays: availabilityDeadlineDays ?? 5,
          substitutionWindowHours: substitutionWindowHours ?? 4,
          cycleTriggerDay: cycleTriggerDay ?? 20,
        },
        create: {
          ministryId: request.params.id,
          defaultFormation: JSON.stringify(defaultFormation || []),
          availabilityDeadlineDays: availabilityDeadlineDays ?? 5,
          substitutionWindowHours: substitutionWindowHours ?? 4,
          cycleTriggerDay: cycleTriggerDay ?? 20,
        },
      });

      return config;
    }
  );
  // List user ministries
  fastify.get('/ministries', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const memberships = await prisma.ministryMember.findMany({
      where: { userId: user.id },
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
    const user = getUser(request);
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
      telegramLinked: !!m.telegramChatId,
      telegramUsername: m.telegramUsername,
      createdAt: m.createdAt,
    }));
  });

  // Add member (admin only)
  fastify.post<{ Params: { id: string }; Body: { userId: string; role?: string } }>(
    '/ministries/:id/members',
    async (request: any, reply: any) => {
      const user = getUser(request);
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

  // Update member role (admin only)
  fastify.put<{ Params: { id: string; memberId: string }; Body: { role: string } }>(
    '/ministries/:id/members/:memberId/role',
    async (request: any, reply: any) => {
      const user = getUser(request);
      if (!user || user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { role } = request.body;
      const validRoles = ['admin', 'leader', 'musician', 'operator'];
      
      if (!validRoles.includes(role)) {
        return reply.status(400).send({ error: 'Invalid role' });
      }

      const member = await prisma.ministryMember.findUnique({
        where: { id: request.params.memberId },
      });

      if (!member || member.ministryId !== request.params.id) {
        return reply.status(404).send({ error: 'Member not found' });
      }

      // Prevent demoting the only admin
      if (member.role === 'admin') {
        const adminCount = await prisma.ministryMember.count({
          where: { ministryId: request.params.id, role: 'admin' },
        });
        
        if (adminCount === 1 && role !== 'admin') {
          return reply.status(400).send({ 
            error: 'Cannot demote the only admin. Promote another user first.' 
          });
        }
      }

      const updated = await prisma.ministryMember.update({
        where: { id: member.id },
        data: { role },
      });

      return updated;
    }
  );

  // Remove member (admin only)
  fastify.delete<{ Params: { id: string; memberId: string } }>(
    '/ministries/:id/members/:memberId',
    async (request: any, reply: any) => {
      const user = getUser(request);
      if (!user || user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const member = await prisma.ministryMember.findUnique({
        where: { id: request.params.memberId },
      });

      if (!member || member.ministryId !== request.params.id) {
        return reply.status(404).send({ error: 'Member not found' });
      }

      // Prevent deleting the only admin
      if (member.role === 'admin') {
        const adminCount = await prisma.ministryMember.count({
          where: { ministryId: request.params.id, role: 'admin' },
        });
        
        if (adminCount === 1) {
          return reply.status(400).send({ 
            error: 'Cannot delete the only admin.' 
          });
        }
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
    }
  );
}

