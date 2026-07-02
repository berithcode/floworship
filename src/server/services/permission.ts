import { prisma } from '../../server/db';

export async function canEditRepertoire(userId: string, scheduleId: string): Promise<boolean> {
  const assignment = await prisma.serviceAssignment.findFirst({
    where: { scheduleId, userId },
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
  await prisma.serviceAssignment.updateMany({
    where: { scheduleId, userId: originalUserId, role: 'ministro_de_louvor' },
    data: { userId: substituteUserId },
  });
}