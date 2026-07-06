import type { FastifyInstance } from 'fastify';
import { prisma } from '../../db';
import { authMiddleware } from '../../middleware/auth';
import { getWSServer } from '../../ws-broadcaster';
import type { TransitionEvent } from '@floworship/types';

export async function sessionStateRoutes(app: FastifyInstance) {

  app.get('/sessions/:id/state', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const session = await prisma.serviceSchedule.findUnique({
      where: { id },
      include: {
        repertoire: {
          include: {
            song: {
              include: {
                cueSheet: {
                  include: {
                    blocks: { orderBy: { order: 'asc' } },
                  },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        assignments: {
          include: {
            ministryMember: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        operator: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    if (session.ministryId !== user.ministryId) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const allBlocks: any[] = [];
    for (const item of session.repertoire) {
      if (item.song.cueSheet) {
        for (const block of item.song.cueSheet.blocks) {
          allBlocks.push({
            id: block.id,
            label: block.label,
            chordproContent: block.chordproContent,
            order: block.order,
            songTitle: item.song.title,
            songId: item.song.id,
            cueSheetId: item.song.cueSheet.id,
          });
        }
      }
    }

    const team = session.assignments
      .filter((a) => a.ministryMember)
      .map((a) => ({
        role: a.role,
        name: a.ministryMember!.user.name,
        ministryMemberId: a.ministryMember!.id,
      }));

    return {
      currentBlockId: null,
      blocks: allBlocks,
      sequence: 0,
      timestamp: new Date().toISOString(),
      programadoPointer: 0,
      overrideStack: [],
      team,
      sessionType: session.sessionType,
      repertoire: session.repertoire.map((r) => ({
        id: r.id,
        songId: r.songId,
        title: r.song.title,
        artist: r.song.artist,
        key: r.keyOverride || r.song.defaultKey,
      })),
      operatorId: session.operatorId,
      operatorName: session.operator?.name || null,
      createdById: session.createdById,
      createdByName: session.createdBy.name,
      isOperator: user.id === session.operatorId,
      isCreator: user.id === session.createdById,
    };
  });

  app.post('/sessions/:id/trigger-block', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;
    const { blockId } = request.body as { blockId: string };

    const session = await prisma.serviceSchedule.findUnique({
      where: { id },
      include: {
        repertoire: {
          include: {
            song: {
              include: {
                cueSheet: {
                  include: { blocks: true },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    if (session.ministryId !== user.ministryId) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    if (session.operatorId !== user.id) {
      return reply.status(403).send({ error: 'Only the operator can trigger blocks' });
    }

    const allBlocks: any[] = [];
    for (const item of session.repertoire) {
      if (item.song.cueSheet) {
        for (const block of item.song.cueSheet.blocks) {
          allBlocks.push({
            id: block.id,
            label: block.label,
            chordproContent: block.chordproContent,
            order: block.order,
            songTitle: item.song.title,
            songId: item.song.id,
            cueSheetId: item.song.cueSheet.id,
          });
        }
      }
    }

    const block = allBlocks.find((b) => b.id === blockId);
    if (!block) {
      return reply.status(404).send({ error: 'Block not found' });
    }

    await prisma.sessionExecutionLog.create({
      data: {
        sessionId: id,
        blockId,
        triggeredByUserId: user.id,
        wasOverride: true,
      },
    });

    const event: TransitionEvent = {
      blockId,
      sessionId: id,
      triggeredAt: new Date().toISOString(),
      wasOverride: true,
      sequence: Date.now(),
      triggeredByUserId: user.id,
    };

    const ws = getWSServer();
    if (ws) {
      ws.broadcast(id, session.ministryId, event);
    }

    return { success: true, blockId, sequence: event.sequence };
  });

  app.post('/sessions/:id/transfer-operator', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;
    const { newOperatorId } = request.body as { newOperatorId: string };

    const session = await prisma.serviceSchedule.findUnique({
      where: { id },
      include: {
        operator: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    if (session.ministryId !== user.ministryId) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    if (session.createdById !== user.id) {
      return reply.status(403).send({ error: 'Only the session creator can transfer the operator' });
    }

    const newOperator = await prisma.user.findUnique({
      where: { id: newOperatorId },
      select: { id: true, name: true },
    });

    if (!newOperator) {
      return reply.status(404).send({ error: 'User not found' });
    }

    await prisma.serviceSchedule.update({
      where: { id },
      data: { operatorId: newOperatorId },
    });

    const ws = getWSServer();
    if (ws) {
      ws.broadcastOperatorChanged(id, session.ministryId, newOperatorId, newOperator.name);
    }

    return { success: true, operatorId: newOperatorId, operatorName: newOperator.name };
  });

  app.post('/sessions/:id/return-operator-to-creator', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const session = await prisma.serviceSchedule.findUnique({
      where: { id },
      include: {
        operator: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    if (session.ministryId !== user.ministryId) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    if (session.operatorId !== user.id) {
      return reply.status(403).send({ error: 'Only the current operator can return operator to creator' });
    }

    await prisma.serviceSchedule.update({
      where: { id },
      data: { operatorId: session.createdById },
    });

    const ws = getWSServer();
    if (ws) {
      ws.broadcastOperatorChanged(id, session.ministryId, session.createdById, session.createdBy.name);
    }

    return { success: true, operatorId: session.createdById, operatorName: session.createdBy.name };
  });
}