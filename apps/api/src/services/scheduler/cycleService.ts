import { prisma } from '../../db';
import { generateSchedule } from './engine';
import { sendNotification, sendBulkNotifications } from '../notifications';

export type CycleStatus = 'coletando_disponibilidade' | 'gerando' | 'aguardando_aprovacao' | 'publicada';

export async function createCycle(ministryId: string, month: number, year: number) {
  const cycle = await prisma.monthlyScheduleCycle.create({
    data: {
      ministryId,
      month,
      year,
      status: 'coletando_disponibilidade',
      availabilityDeadline: new Date(year, month - 1, 15),
    },
  });

  // Criar registros de ServiceSchedule para cada domingo do mês
  const sundays = getSundaysInMonth(month, year);
  const anyUser = await prisma.user.findFirst({
    select: { id: true },
  });

  for (const sunday of sundays) {
    await prisma.serviceSchedule.create({
      data: {
        ministryId,
        cycleId: cycle.id,
        date: sunday,
        createdById: anyUser?.id || '',
      },
    });
  }

  // Buscar membros ativos com Telegram vinculado
  const members = await prisma.ministryMember.findMany({
    where: {
      ministryId,
      isActiveInSchedule: true,
      telegramChatId: { not: null },
    },
    include: { user: { select: { name: true } } },
  });

  if (members.length > 0) {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthName = monthNames[month - 1];

    const sundayDates = sundays.map(d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })).join(', ');

    // Enviar notificação para cada membro
    const notifications = members.map(member => ({
      memberId: member.id,
      ministryId,
      templateName: 'disponibilidade_mensal',
      variables: {
        name: member.user?.name || 'Músico',
        month: monthName,
        sunday_dates: sundayDates,
        cycleId: cycle.id,
      },
    }));

    // Enviar em background (não bloqueia a resposta)
    sendBulkNotifications(notifications).then(results => {
      const ok = results.filter(r => r.success).length;
      const fail = results.filter(r => !r.success).length;
      console.log(`[CycleService] Notificações: ${ok} enviadas, ${fail} falharam`);
      results.forEach((r, i) => {
        if (!r.success) console.warn(`  Membro ${notifications[i].memberId}: ${r.error}`);
      });
    }).catch(err => {
      console.error('[CycleService] Erro ao enviar notificações de disponibilidade:', err);
    });
  }

  return cycle;
}

export async function closeAvailability(cycleId: string) {
  const cycle = await prisma.monthlyScheduleCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || cycle.status !== 'coletando_disponibilidade') {
    throw new Error('Invalid cycle status');
  }

  await prisma.monthlyScheduleCycle.update({
    where: { id: cycleId },
    data: { status: 'gerando' },
  });

  return generateScheduleForCycle(cycleId);
}

export async function approveCycle(cycleId: string) {
  const cycle = await prisma.monthlyScheduleCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || cycle.status !== 'gerando') {
    throw new Error('Invalid cycle status');
  }

  return prisma.monthlyScheduleCycle.update({
    where: { id: cycleId },
    data: { status: 'aguardando_aprovacao' },
  });
}

export async function publishCycle(cycleId: string) {
  const cycle = await prisma.monthlyScheduleCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || cycle.status !== 'aguardando_aprovacao') {
    throw new Error('Invalid cycle status');
  }

  await prisma.monthlyScheduleCycle.update({
    where: { id: cycleId },
    data: { status: 'publicada' },
  });

  const schedules = await prisma.serviceSchedule.findMany({
    where: { cycleId },
    include: {
      assignments: { include: { ministryMember: { include: { user: true } } } },
    },
  });

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  for (const schedule of schedules) {
    for (const assignment of schedule.assignments) {
      if (assignment.ministryMember?.telegramChatId) {
        const dateStr = `${schedule.date.getDate()} de ${monthNames[cycle.month - 1]}`;
        await sendNotification(
          assignment.ministryMember.id,
          cycle.ministryId,
          'escala_confirmada',
          {
            date: dateStr,
            role: assignment.role,
            ministryName: 'Ministry',
            scheduleId: schedule.id,
            appUrl: process.env.APP_URL || 'http://localhost:5173',
          }
        );
      }
    }
  }

  return { status: 'publicada' };
}

export async function cancelCycle(cycleId: string) {
  const cycle = await prisma.monthlyScheduleCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) {
    throw new Error('Cycle not found');
  }

  // Deletar assignments vinculados aos schedules deste ciclo
  const schedules = await prisma.serviceSchedule.findMany({
    where: { cycleId },
    select: { id: true },
  });

  const scheduleIds = schedules.map(s => s.id);

  await prisma.serviceAssignment.deleteMany({
    where: { scheduleId: { in: scheduleIds } },
  });

  await prisma.serviceRepertoireItem.deleteMany({
    where: { scheduleId: { in: scheduleIds } },
  });

  await prisma.serviceSchedule.deleteMany({
    where: { cycleId },
  });

  await prisma.availabilityResponse.deleteMany({
    where: { cycleId },
  });

  // Soft delete do ciclo
  await prisma.monthlyScheduleCycle.update({
    where: { id: cycleId },
    data: { deletedAt: new Date() },
  });

  return { success: true };
}

async function getFormation(ministryId: string): Promise<string[]> {
  const config = await prisma.ministryConfig.findUnique({
    where: { ministryId },
  });

  if (config?.defaultFormation) {
    try {
      const formation = JSON.parse(config.defaultFormation);
      if (Array.isArray(formation) && formation.length > 0) {
        return formation;
      }
    } catch {}
  }

  return ['ministro_de_louvor', 'guitarra', 'teclado', 'bateria', 'baixo'];
}

async function generateScheduleForCycle(cycleId: string) {
  const cycle = await prisma.monthlyScheduleCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new Error('Cycle not found');

  // Usar os ServiceSchedule já criados no createCycle
  const existingSchedules = await prisma.serviceSchedule.findMany({
    where: { cycleId },
    orderBy: { date: 'asc' },
  });

  const sundays = existingSchedules.map(s => ({ date: s.date, scheduleId: s.id }));
  const roles = await getFormation(cycle.ministryId);

  console.log(`[Scheduler] Gerando para ${sundays.length} domingos, roles: ${roles.join(', ')}`);

  // Buscar contagem de assignments por membro NESTE ciclo (group by)
  const cycleCounts = await prisma.serviceAssignment.groupBy({
    by: ['ministryMemberId'],
    where: {
      status: 'confirmado',
      schedule: { cycleId },
    },
    _count: { ministryMemberId: true },
  });

  const countMap = new Map<string, number>();
  for (const c of cycleCounts) {
    if (c.ministryMemberId) {
      countMap.set(c.ministryMemberId, c._count.ministryMemberId);
    }
  }

  const members = await prisma.ministryMember.findMany({
    where: { ministryId: cycle.ministryId, isActiveInSchedule: true },
    include: {
      assignments: {
        where: { status: 'confirmado' },
        orderBy: { schedule: { date: 'desc' } },
        take: 1,
        select: { role: true, schedule: { select: { date: true } } },
      },
    },
  });

  console.log(`[Scheduler] ${members.length} membros ativos`);

  const lastServedMap = new Map<string, Record<string, Date>>();
  for (const m of members) {
    const map: Record<string, Date> = {};
    for (const a of m.assignments) {
      if (!map[a.role]) {
        map[a.role] = a.schedule.date;
      }
    }
    lastServedMap.set(m.id, map);
  }

  const candidates = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    timesServedThisMonth: countMap.get(m.id) || 0,
    lastServedAt: lastServedMap.get(m.id) || {} as Record<string, Date>,
    worshipRoles: JSON.parse(m.worshipRoles || '[]'),
  }));

  console.log(`[Scheduler] Candidatos:`, candidates.map(c => `${c.worshipRoles.join(',')}`).join(' | '));

  const assignments = generateSchedule(sundays, roles, candidates, new Map());

  console.log(`[Scheduler] ${assignments.length} assignments gerados`);

  for (const assignment of assignments) {
    await prisma.serviceAssignment.create({
      data: {
        scheduleId: assignment.scheduleId,
        role: assignment.role,
        ministryMemberId: assignment.ministryMemberId,
        status: assignment.status,
      },
    });
  }

  return existingSchedules;
}

function getSundaysInMonth(month: number, year: number): Date[] {
  const sundays: Date[] = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    if (date.getDay() === 0) {
      sundays.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return sundays;
}
