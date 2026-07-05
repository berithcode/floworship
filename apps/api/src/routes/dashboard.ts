import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';
import type { AuthenticatedUser } from '../middleware/auth';

function getUser(request: { user?: unknown }): AuthenticatedUser | null {
  return (request.user as AuthenticatedUser) || null;
}

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/dashboard/metrics', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const ministryId = user.ministryId;

    const member = await prisma.ministryMember.findFirst({
      where: { userId: user.id, ministryId },
      select: { id: true },
    });

    const nextService = await prisma.serviceSchedule.findFirst({
      where: {
        ministryId,
        date: { gte: new Date() }
      },
      orderBy: { date: 'asc' },
      include: {
        assignments: {
          where: member ? { ministryMemberId: member.id } : { ministryMemberId: '' }
        },
        repertoire: true
      }
    });

    const pendingConfirmations = member ? await prisma.serviceAssignment.count({
      where: {
        ministryMemberId: member.id,
        status: 'pending',
        schedule: {
          ministryId,
          date: { gte: new Date() }
        }
      }
    }) : 0;

    const totalMusicians = await prisma.ministryMember.count({
      where: { ministryId }
    });

    const songsReady = await prisma.song.count({
      where: {
        ministryId,
        status: 'pronta'
      }
    });

    const currentCycle = await prisma.monthlyScheduleCycle.findFirst({
      where: {
        ministryId,
        status: { in: ['coletando_disponibilidade', 'gerando', 'aguardando_aprovacao', 'publicada'] }
      },
      orderBy: { month: 'desc' }
    });

    reply.send({
      nextService: nextService ? {
        id: nextService.id,
        date: nextService.date,
        confirmed: nextService.assignments.some((a: any) => a.status === 'confirmed'),
        repertoireCount: nextService.repertoire?.length || 0
      } : null,
      pendingConfirmations,
      totalMusicians,
      songsReady,
      cycleStatus: currentCycle?.status || 'nenhum',
      cycleDeadline: currentCycle?.availabilityDeadline
    });
  });

  fastify.get('/dashboard/upcoming-services', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const ministryId = user.ministryId;

    const member = await prisma.ministryMember.findFirst({
      where: { userId: user.id, ministryId },
      select: { id: true },
    });

    const services = await prisma.serviceSchedule.findMany({
      where: {
        ministryId,
        date: { gte: new Date() }
      },
      take: 6,
      orderBy: { date: 'asc' },
      include: {
        assignments: {
          include: {
            ministryMember: {
              include: { user: { select: { id: true, name: true } } }
            }
          }
        },
        repertoire: {
          include: { song: true }
        }
      }
    });

    const formatted = services.map(service => {
      const confirmedCount = service.assignments.filter(
        (a: any) => a.status === 'confirmed'
      ).length;

      const vacantRoles = service.assignments
        .filter((a: any) => a.status === 'vago')
        .map((a: any) => a.role);

      return {
        id: service.id,
        date: service.date,
        confirmedCount,
        totalCount: service.assignments.length,
        vacantRoles: [...new Set(vacantRoles)],
        isConfirmed: service.assignments.some(
          (a: any) => a.ministryMember?.userId === user.id && a.status === 'confirmed'
        ),
        repertoire: service.repertoire.map((r: any) => ({
          songId: r.songId,
          title: r.song.title,
          order: r.order
        }))
      };
    });

    reply.send({ services: formatted });
  });

  fastify.get('/dashboard/repertoire-stats', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const ministryId = user.ministryId;

    const [totalPronta, totalRascunho, totalArquivada] = await Promise.all([
      prisma.song.count({ where: { ministryId, status: 'pronta' } }),
      prisma.song.count({ where: { ministryId, status: 'rascunho' } }),
      prisma.song.count({ where: { ministryId, status: 'arquivada' } })
    ]);

    const withCueSheets = await prisma.songCueSheet.count({
      where: {
        song: { ministryId }
      }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mostUsed = await prisma.serviceRepertoireItem.groupBy({
      by: ['songId'],
      where: {
        schedule: {
          ministryId,
          date: { gte: thirtyDaysAgo }
        }
      },
      _count: true,
      orderBy: {
        _count: { songId: 'desc' }
      },
      take: 5
    });

    const mostUsedWithDetails = await Promise.all(
      mostUsed.map(async item => {
        const song = await prisma.song.findUnique({
          where: { id: item.songId },
          select: { title: true, artist: true }
        });
        return {
          songId: item.songId,
          title: song?.title || 'Unknown',
          artist: song?.artist || '',
          count: item._count
        };
      })
    );

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await prisma.song.count({
      where: {
        ministryId,
        createdAt: { gte: firstDayOfMonth }
      }
    });

    reply.send({
      totalSongs: totalPronta + totalRascunho + totalArquivada,
      byStatus: {
        pronta: totalPronta,
        rascunho: totalRascunho,
        arquivada: totalArquivada
      },
      withCueSheets,
      mostUsed: mostUsedWithDetails,
      newThisMonth
    });
  });

  fastify.get('/dashboard/recent-activity', async (request: any, reply: any) => {
    const user = getUser(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const ministryId = user.ministryId;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentSessions = await prisma.sessionExecutionLog.findMany({
      where: {
        triggeredAt: { gte: sevenDaysAgo }
      },
      include: {
        triggeredBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { triggeredAt: 'desc' },
      take: 5
    });

    const [sent, delivered, failed] = await Promise.all([
      prisma.whatsAppMessageLog.count({
        where: {
          ministryId,
          sentAt: { gte: sevenDaysAgo },
          status: 'sent'
        }
      }),
      prisma.whatsAppMessageLog.count({
        where: {
          ministryId,
          sentAt: { gte: sevenDaysAgo },
          status: 'delivered'
        }
      }),
      prisma.whatsAppMessageLog.count({
        where: {
          ministryId,
          sentAt: { gte: sevenDaysAgo },
          status: 'failed'
        }
      })
    ]);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newMembers = await prisma.ministryMember.findMany({
      where: {
        ministryId,
        createdAt: { gte: firstDayOfMonth }
      },
      include: {
        user: true
      },
      take: 5
    });

    const pendingInvites = await prisma.invite.count({
      where: {
        ministryId,
        usedAt: null,
        expiresAt: { gte: new Date() }
      }
    });

    reply.send({
      recentSessions: recentSessions.map(s => ({
        id: s.id,
        triggeredBy: s.triggeredBy.name,
        date: s.triggeredAt,
        duration: s.durationSeconds,
        hadOverride: s.wasOverride
      })),
      whatsappStats: {
        sent,
        delivered,
        failed,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0
      },
      newMembers: newMembers.map(m => ({
        id: m.id,
        name: m.user.name,
        email: m.user.email,
        joinedAt: m.createdAt
      })),
      pendingInvites
    });
  });
}
