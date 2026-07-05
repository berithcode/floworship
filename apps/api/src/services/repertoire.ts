import { prisma } from '../db';

export async function getRepertoireItems(scheduleId: string) {
  return prisma.serviceRepertoireItem.findMany({
    where: { scheduleId },
    include: { song: true },
    orderBy: { order: 'asc' },
  });
}

export async function addSongToRepertoire(
  scheduleId: string,
  songId: string,
  order: number,
  keyOverride?: string
) {
  return prisma.serviceRepertoireItem.create({
    data: { scheduleId, songId, order, keyOverride },
    include: { song: true },
  });
}

export async function removeSongFromRepertoire(itemId: string) {
  return prisma.serviceRepertoireItem.delete({ where: { id: itemId } });
}

export async function reorderRepertoire(
  _scheduleId: string,
  items: { itemId: string; order: number }[]
) {
  await Promise.all(
    items.map((item) =>
      prisma.serviceRepertoireItem.update({
        where: { id: item.itemId },
        data: { order: item.order },
      })
    )
  );
}

export async function updateRepertoireItem(
  id: string,
  data: { keyOverride?: string; observations?: string }
) {
  return prisma.serviceRepertoireItem.update({
    where: { id },
    data,
    include: { song: true },
  });
}

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
  return ['admin', 'leader', 'ministro_de_louvor'].includes(assignment.role);
}
