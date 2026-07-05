import type { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';
import { createCycle, closeAvailability, approveCycle, publishCycle, cancelCycle } from '../services/scheduler/cycleService';
import { findSubstitute } from '../services/scheduler/substitutionService';

export async function scheduleRoutes(app: FastifyInstance) {
  app.get('/schedules/cycles/current', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const user = request.user;
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Ministério não encontrado' });
    }

    const cycle = await prisma.monthlyScheduleCycle.findFirst({
      where: {
        ministryId: user.ministryId,
        status: { in: ['coletando_disponibilidade', 'gerando', 'aguardando_aprovacao', 'publicada'] }
      },
      orderBy: { year: 'desc' },
    });

    if (!cycle) {
      return { cycle: null, sundays: [], availabilityCount: 0, totalMembers: 0 };
    }

    // Contar membros ativos do ministério
    const totalMembers = await prisma.ministryMember.count({
      where: { ministryId: user.ministryId, isActiveInSchedule: true },
    });

    if (cycle.status === 'coletando_disponibilidade') {
      // Durante coleta: retornar disponibilidades em vez de assignments
      const sundays = await prisma.serviceSchedule.findMany({
        where: { cycleId: cycle.id },
        orderBy: { date: 'asc' },
      });

      const responses = await prisma.availabilityResponse.findMany({
        where: { cycleId: cycle.id, available: true },
      });

      // Contar membros únicos que responderam como disponíveis
      const availableMemberIds = new Set(responses.map(r => r.ministryMemberId));
      const availabilityCount = availableMemberIds.size;

      // Mapear disponibilidades por domingo
      const sundaysWithAvailability = sundays.map(sunday => {
        const sundayResponses = responses.filter(r =>
          r.sundayDate.toISOString().split('T')[0] === sunday.date.toISOString().split('T')[0]
        );
        const availableMembers = new Set(sundayResponses.map(r => r.ministryMemberId));
        return {
          ...sunday,
          assignments: [],
          availabilityCount: availableMembers.size,
        };
      });

      return { cycle, sundays: sundaysWithAvailability, availabilityCount, totalMembers };
    }

    // Outros status: retornar assignments normalmente
    const sundays = await prisma.serviceSchedule.findMany({
      where: { cycleId: cycle.id },
      include: {
        assignments: {
          include: { ministryMember: { include: { user: { select: { id: true, name: true } } } } },
        },
      },
      orderBy: { date: 'asc' },
    });

    return { cycle, sundays, availabilityCount: 0, totalMembers };
  });

  app.get('/schedules/cycles/:cycleId', { preHandler: [authMiddleware] }, async (request) => {
    const { cycleId } = request.params as { cycleId: string };
    return prisma.monthlyScheduleCycle.findUnique({ where: { id: cycleId } });
  });

  app.get('/schedules/cycles/:cycleId/sundays', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const { cycleId } = request.params as { cycleId: string };

    const cycle = await prisma.monthlyScheduleCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) {
      return reply.status(404).send({ error: 'Cycle not found' });
    }

    const sundays = await prisma.serviceSchedule.findMany({
      where: { cycleId },
      include: {
        assignments: {
          include: { ministryMember: { include: { user: { select: { id: true, name: true } } } } }
        }
      },
      orderBy: { date: 'asc' },
    });

    return sundays;
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

  app.post('/schedules/cycles/:cycleId/cancel', { preHandler: [authMiddleware] }, async (request) => {
    const { cycleId } = request.params as { cycleId: string };
    return cancelCycle(cycleId);
  });

  // TESTE: Confirmar disponibilidade para todos os membros
  app.post('/schedules/cycles/:cycleId/confirm-all', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const { cycleId } = request.params as { cycleId: string };
    const user = request.user;

    const cycle = await prisma.monthlyScheduleCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) return reply.status(404).send({ error: 'Ciclo não encontrado' });

    const members = await prisma.ministryMember.findMany({
      where: { ministryId: cycle.ministryId, isActiveInSchedule: true },
    });

    const sundays = await prisma.serviceSchedule.findMany({
      where: { cycleId },
      orderBy: { date: 'asc' },
    });

    let count = 0;
    for (const member of members) {
      for (const sunday of sundays) {
        await prisma.availabilityResponse.upsert({
          where: {
            cycleId_ministryMemberId_sundayDate: {
              cycleId,
              ministryMemberId: member.id,
              sundayDate: sunday.date,
            },
          },
          create: { cycleId, ministryMemberId: member.id, sundayDate: sunday.date, available: true, respondedAt: new Date() },
          update: { available: true, respondedAt: new Date() },
        });
        count++;
      }
    }

    return { success: true, responsesCreated: count };
  });

  app.post('/schedules/swap', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { assignmentId, newMemberId } = request.body as { assignmentId: string; newMemberId: string };
    const assignment = await prisma.serviceAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) return reply.status(404).send({ error: 'Assignment not found' });

    await prisma.serviceAssignment.update({
      where: { id: assignmentId },
      data: { ministryMemberId: newMemberId, status: 'confirmado' },
    });

    return { success: true };
  });

  app.post('/schedules/substitution/:assignmentId', { preHandler: [authMiddleware] }, async (request) => {
    const { assignmentId } = request.params as { assignmentId: string };
    return findSubstitute(assignmentId);
  });

  app.post('/schedules/availability', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const member = await prisma.ministryMember.findFirst({
      where: { userId: user.id, ministryId: user.ministryId },
    });

    if (!member) {
      return reply.status(404).send({ error: 'Membro não encontrado' });
    }

    const { cycleId, sundayDate, available } = request.body as {
      cycleId: string;
      sundayDate: string;
      available: boolean;
    };

    if (!cycleId || !sundayDate) {
      return reply.status(400).send({ error: 'cycleId e sundayDate são obrigatórios' });
    }

    const cycle = await prisma.monthlyScheduleCycle.findUnique({
      where: { id: cycleId },
    });

    if (!cycle) {
      return reply.status(404).send({ error: 'Cycle not found' });
    }

    const sundayDateObj = new Date(sundayDate);

    const response = await prisma.availabilityResponse.upsert({
      where: {
        cycleId_ministryMemberId_sundayDate: {
          cycleId,
          ministryMemberId: member.id,
          sundayDate: sundayDateObj,
        },
      },
      create: {
        cycleId,
        ministryMemberId: member.id,
        sundayDate: sundayDateObj,
        available,
        respondedAt: new Date(),
      },
      update: {
        available,
        respondedAt: new Date(),
      },
    });

    return response;
  });

  const ROLE_LABELS: Record<string, string> = {
    vocalista: 'Vocalista',
    guitarrista: 'Guitarrista',
    tecladista: 'Tecladista',
    baterista: 'Baterista',
    baixista: 'Baixista',
    violonista: 'Violonista',
    cavaco: 'Cavaco',
    flautista: 'Flautista',
    violinista: 'Violinista',
    contrabaixista: 'Contrabaixista',
    percussionista: 'Percussionista',
  };

  app.get('/schedules/my-assignments', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const member = await prisma.ministryMember.findFirst({
      where: { userId: user.id, ministryId: user.ministryId },
    });

    if (!member) {
      return reply.status(404).send({ error: 'Membro não encontrado' });
    }

    const assignments = await prisma.serviceAssignment.findMany({
      where: { ministryMemberId: member.id },
      include: {
        schedule: {
          include: {
            repertoire: {
              include: { song: { select: { id: true, title: true, artist: true, defaultKey: true } } },
              orderBy: { order: 'asc' },
            },
            assignments: {
              include: {
                ministryMember: { include: { user: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { schedule: { date: 'asc' } },
    });

    const formatted = assignments.map((a: any) => {
      const isMinister = a.role === 'ministro_de_louvor';
      const team = a.schedule.assignments
        .filter((sa: any) => sa.ministryMember)
        .map((sa: any) => ({
          role: sa.role,
          name: sa.ministryMember.user.name,
        }));

      return {
        id: a.id,
        role: a.role,
        roleLabel: ROLE_LABELS[a.role] || a.role,
        status: a.status,
        confirmed: a.confirmed,
        confirmedAt: a.confirmedAt,
        date: a.schedule.date,
        scheduleId: a.schedule.id,
        isMinister,
        team,
        repertoire: a.schedule.repertoire,
        songs: a.schedule.repertoire?.length || 0,
      };
    });

    return formatted;
  });

  app.put<{ Params: { id: string }; Body: { confirmed: boolean } }>('/schedules/assignments/:id/confirm', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const user = request.user;
    const { id } = request.params;
    const { confirmed } = request.body;

    if (!user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const assignment = await prisma.serviceAssignment.findUnique({
      where: { id },
      include: { ministryMember: { select: { userId: true } } },
    });

    if (!assignment || assignment.ministryMember?.userId !== user.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const updated = await prisma.serviceAssignment.update({
      where: { id },
      data: {
        confirmed,
        confirmedAt: confirmed ? new Date() : null,
        status: confirmed ? 'confirmado' : 'recusado',
      },
    });

    return updated;
  });

  // Definir setlist do domingo (apenas para ministro escalado)
  app.post('/schedules/:scheduleId/setlist', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const { scheduleId } = request.params as { scheduleId: string };
    const { songIds } = request.body as { songIds: string[] };
    const user = request.user;

    const schedule = await prisma.serviceSchedule.findUnique({
      where: { id: scheduleId },
      include: { assignments: { include: { ministryMember: true } } },
    });

    if (!schedule) return reply.status(404).send({ error: 'Escala não encontrada' });

    // Verificar se usuário é ministro escalado neste domingo
    const isMinister = schedule.assignments.some(
      a => a.ministryMember?.userId === user.id && a.role === 'ministro_de_louvor'
    );

    if (!isMinister && user.role !== 'admin') {
      return reply.status(403).send({ error: 'Apenas o ministro de louvor pode definir o setlist' });
    }

    // Deletar setlist anterior
    await prisma.serviceRepertoireItem.deleteMany({
      where: { scheduleId },
    });

    // Criar novo setlist
    for (let i = 0; i < songIds.length; i++) {
      await prisma.serviceRepertoireItem.create({
        data: {
          scheduleId,
          songId: songIds[i],
          order: i,
        },
      });
    }

    return { success: true };
  });

  // Obter setlist do domingo
  app.get('/schedules/:scheduleId/setlist', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const { scheduleId } = request.params as { scheduleId: string };

    const repertoire = await prisma.serviceRepertoireItem.findMany({
      where: { scheduleId },
      include: { song: true },
      orderBy: { order: 'asc' },
    });

    return { repertoire };
  });

  // Minha escala de hoje
  app.get('/schedules/today', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Not authenticated' });

    const member = await prisma.ministryMember.findFirst({
      where: { userId: user.id, ministryId: user.ministryId },
    });

    if (!member) return reply.status(404).send({ error: 'Membro não encontrado' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const assignment = await prisma.serviceAssignment.findFirst({
      where: {
        ministryMemberId: member.id,
        schedule: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      },
      include: {
        schedule: {
          include: {
            assignments: {
              include: { ministryMember: { include: { user: { select: { name: true } } } } },
            },
            repertoire: {
              include: { song: { select: { id: true, title: true, artist: true, defaultKey: true } } },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!assignment) {
      return { hasAssignment: false };
    }

    const isMinister = assignment.role === 'ministro_de_louvor';
    const team = assignment.schedule.assignments
      .filter((a: any) => a.ministryMember)
      .map((a: any) => ({
        role: a.role,
        name: a.ministryMember.user.name,
      }));

    const repertoire = assignment.schedule.repertoire.map((r: any) => ({
      id: r.id,
      songId: r.songId,
      title: r.song.title,
      artist: r.song.artist,
      key: r.keyOverride || r.song.defaultKey,
      order: r.order,
    }));

    return {
      hasAssignment: true,
      scheduleId: assignment.schedule.id,
      date: assignment.schedule.date,
      role: assignment.role,
      isMinister,
      team,
      repertoire,
    };
  });
}