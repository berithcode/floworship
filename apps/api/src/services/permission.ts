import { prisma } from '../db';

export async function canEditRepertoire(userId: string, scheduleId: string): Promise<boolean> {
  const member = await prisma.ministryMember.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!member) return false;

  const assignment = await prisma.serviceAssignment.findFirst({
    where: { scheduleId, ministryMemberId: member.id },
  });

  if (!assignment) return false;

  if (['admin', 'leader'].includes(assignment.role)) {
    return true;
  }

  if (assignment.role === 'ministro_de_louvor') {
    return true;
  }

  return false;
}

export async function migrateRepertoirePermission(originalUserId: string, substituteUserId: string, scheduleId: string): Promise<void> {
  const originalMember = await prisma.ministryMember.findFirst({
    where: { userId: originalUserId },
    select: { id: true },
  });

  const substituteMember = await prisma.ministryMember.findFirst({
    where: { userId: substituteUserId },
    select: { id: true },
  });

  if (!originalMember || !substituteMember) return;

  await prisma.serviceAssignment.updateMany({
    where: { scheduleId, ministryMemberId: originalMember.id, role: 'ministro_de_louvor' },
    data: { ministryMemberId: substituteMember.id },
  });
}
