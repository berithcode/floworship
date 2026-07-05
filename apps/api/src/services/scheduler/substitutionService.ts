import { prisma } from '../../db';
import { calculateFairnessScore } from './fairness';
import { sendNotification } from '../notifications';

export async function reportUnavailability(assignmentId: string) {
  return prisma.serviceAssignment.update({
    where: { id: assignmentId },
    data: { status: 'recusado' },
  });
}

export async function findSubstitute(assignmentId: string) {
  const assignment = await prisma.serviceAssignment.findUnique({
    where: { id: assignmentId },
    include: { schedule: true },
  });

  if (!assignment) throw new Error('Assignment not found');

  const assignedMembers = await prisma.serviceAssignment.findMany({
    where: {
      scheduleId: assignment.scheduleId,
      status: 'confirmado',
    },
    select: { ministryMemberId: true },
  });

  const assignedIds = assignedMembers.map((a) => a.ministryMemberId).filter((id): id is string => !!id);

  const candidates = await prisma.ministryMember.findMany({
    where: {
      ministryId: assignment.schedule.ministryId,
      isActiveInSchedule: true,
      NOT: { id: { in: assignedIds } },
    },
    include: {
      assignments: {
        where: { status: 'confirmado' },
        orderBy: { schedule: { date: 'desc' } },
        take: 1,
        select: { role: true, schedule: { select: { date: true } } },
      },
    },
  });

  const scored = candidates.map((c) => {
    const map: Record<string, Date> = {};
    for (const a of c.assignments) {
      if (!map[a.role]) {
        map[a.role] = a.schedule.date;
      }
    }
    return {
      id: c.id,
      userId: c.userId,
      timesServedThisMonth: c.assignments.length,
      lastServedAt: map,
      worshipRoles: (c.worshipRoles as string[]) || [],
    };
  });

  const sorted = calculateFairnessScore(scored, assignment.role);

  for (const candidate of sorted) {
    try {
      const member = await prisma.ministryMember.findUnique({ where: { id: candidate.id } });
      if (member?.telegramChatId) {
        const dateStr = assignment.schedule.date.toLocaleDateString('pt-BR');
        await sendNotification(
          member.id,
          assignment.schedule.ministryId,
          'substituicao_urgente',
          {
            date: dateStr,
            role: assignment.role,
            songTitle: 'Culto',
            assignmentId: assignment.id,
          }
        );
      }

      await prisma.serviceAssignment.update({
        where: { id: assignmentId },
        data: {
          ministryMemberId: candidate.id,
          status: 'convidado',
          substitutionOf: assignment.ministryMemberId,
        },
      });

      return candidate;
    } catch {
      continue;
    }
  }

  await prisma.serviceAssignment.update({
    where: { id: assignmentId },
    data: { status: 'vago', ministryMemberId: null },
  });

  return null;
}
