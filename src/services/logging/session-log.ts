import { prisma } from '../../server/db';
import type { TransitionEvent } from '../../engine/types';

export async function logTransition(event: TransitionEvent, durationSeconds?: number): Promise<void> {
  await prisma.sessionExecutionLog.create({
    data: {
      sessionId: event.sessionId,
      blockId: event.blockId,
      triggeredAt: new Date(event.triggeredAt),
      wasOverride: event.wasOverride,
      triggeredByUserId: event.triggeredByUserId || 'system',
      durationSeconds: durationSeconds || 0,
    },
  });
}

export async function getSessionLogs(sessionId: string) {
  return prisma.sessionExecutionLog.findMany({
    where: { sessionId },
    orderBy: { triggeredAt: 'asc' },
  });
}