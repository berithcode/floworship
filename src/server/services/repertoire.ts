import { prisma } from '../../server/db';

export async function getSongsForRepertoire(ministryId: string) {
  return prisma.song.findMany({
    where: { ministryId, status: 'pronta' },
    orderBy: { title: 'asc' },
  });
}

export async function getAllSongs(ministryId: string) {
  return prisma.song.findMany({
    where: { ministryId },
    orderBy: { title: 'asc' },
  });
}

export async function searchSongs(ministryId: string, query: string) {
  return prisma.song.findMany({
    where: {
      ministryId,
      status: { not: 'arquivada' },
      title: { contains: query },
    },
    orderBy: { title: 'asc' },
  });
}

export async function getRepertoireItems(scheduleId: string) {
  return prisma.serviceRepertoireItem.findMany({
    where: { scheduleId },
    include: { song: true },
    orderBy: { order: 'asc' },
  });
}

export async function addSongToRepertoire(scheduleId: string, songId: string, order: number, keyOverride?: string) {
  const song = await prisma.song.findUnique({ where: { id: songId } });
  if (!song || song.status !== 'pronta') {
    throw new Error('Song must be pronta to add to repertoire');
  }

  return prisma.serviceRepertoireItem.create({
    data: { scheduleId, songId, order, keyOverride },
    include: { song: true },
  });
}

export async function removeSongFromRepertoire(itemId: string) {
  return prisma.serviceRepertoireItem.delete({ where: { id: itemId } });
}

export async function reorderRepertoire(_scheduleId: string, items: { itemId: string; order: number }[]) {
  const updates = items.map((item) =>
    prisma.serviceRepertoireItem.update({
      where: { id: item.itemId },
      data: { order: item.order },
    })
  );
  return prisma.$transaction(updates);
}

export async function updateRepertoireItem(itemId: string, data: { keyOverride?: string }) {
  return prisma.serviceRepertoireItem.update({
    where: { id: itemId },
    data,
    include: { song: true },
  });
}

export async function canEditRepertoire(userId: string, scheduleId: string): Promise<boolean> {
  const assignment = await prisma.serviceAssignment.findFirst({
    where: { scheduleId, userId },
  });
  if (!assignment) return false;
  return ['admin', 'leader', 'ministro_de_louvor'].includes(assignment.role);
}