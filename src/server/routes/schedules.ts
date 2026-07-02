import type { FastifyInstance } from 'fastify';
import { prisma } from '../../server/db';
import { authMiddleware } from '../../server/middleware/auth';
import { createCycle, closeAvailability, approveCycle, publishCycle } from '../../server/services/scheduler/cycleService';
import { findSubstitute } from '../../server/services/scheduler/substitutionService';

export async function scheduleRoutes(app: FastifyInstance) {
  app.get('/schedules/cycles/:cycleId', { preHandler: [authMiddleware] }, async (request) => {
    const { cycleId } = request.params as { cycleId: string };
    return prisma.monthlyScheduleCycle.findUnique({ where: { id: cycleId } });
  });

  app.get('/schedules/cycles/:cycleId/sundays', { preHandler: [authMiddleware] }, async (request) => {
    const { cycleId } = request.params as { cycleId: string };
    return prisma.serviceSchedule.findMany({
      where: { ministryId: cycleId },
      include: { assignments: true },
      orderBy: { date: 'asc' },
    });
  });

  app.post('/schedules/cycles', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { ministryId, month, year } = request.body as { ministryId: string; month: number; year: number };
    const cycle = await createCycle(ministryId, month, year);
    return reply.status(201).send(cycle);
  });

  app.post('/schedules/cycles/:cycleId/close', { preHandler: [authMiddleware] }, async (request) => {
    const { cycleId } = request.params as { cycleId: string };
    return closeAvailability(cycleId);
  });

  app.post('/schedules/cycles/:cycleId/approve', { preHandler: [authMiddleware] }, async (request) => {
    const { cycleId } = request.params as { cycleId: string };
    return approveCycle(cycleId);
  });

  app.post('/schedules/cycles/:cycleId/publish', { preHandler: [authMiddleware] }, async (request) => {
    const { cycleId } = request.params as { cycleId: string };
    return publishCycle(cycleId);
  });

  app.post('/schedules/swap', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { assignmentId, newMusicianId } = request.body as { assignmentId: string; newMusicianId: string };
    const assignment = await prisma.serviceAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) return reply.status(404).send({ error: 'Assignment not found' });

    await prisma.serviceAssignment.update({
      where: { id: assignmentId },
      data: { musicianId: newMusicianId, status: 'confirmado' },
    });

    return { success: true };
  });

  app.post('/schedules/substitution/:assignmentId', { preHandler: [authMiddleware] }, async (request) => {
    const { assignmentId } = request.params as { assignmentId: string };
    return findSubstitute(assignmentId);
  });
}