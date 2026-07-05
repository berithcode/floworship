import type { FastifyInstance } from 'fastify';
import { prisma } from '../../db';
import { authMiddleware } from '../../middleware/auth';

export async function sessionStateRoutes(app: FastifyInstance) {
  app.get('/sessions/:id/state', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const session = await prisma.serviceSchedule.findUnique({
      where: { id },
      include: {
        repertoire: {
          include: {
            song: {
              include: {
                cueSheet: {
                  include: {
                    blocks: {
                      orderBy: { order: 'asc' },
                    },
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
      },
    });

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
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
                  include: {
                    blocks: true,
                  },
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

    // TODO: WebSocket broadcast
    return { success: true, blockId, sequence: Date.now() };
  });
}