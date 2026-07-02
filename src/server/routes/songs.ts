import { FastifyInstance } from 'fastify';
import { prisma } from '../db';

function getMinistryId(request: any): string | null {
  const token = request.cookies?.access_token;
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return payload.ministryId || null;
  } catch {
    return null;
  }
}

function getUserPayload(request: any): { userId: string; ministryId?: string; role?: string } | null {
  const token = request.cookies?.access_token;
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    return null;
  }
}

export async function songsRoutes(fastify: FastifyInstance) {
  // List songs
  fastify.get('/songs', async (request: any, reply: any) => {
    const ministryId = getMinistryId(request);
    if (!ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const songs = await prisma.song.findMany({
      where: { ministryId },
      include: { cueSheet: true },
      orderBy: { title: 'asc' },
    });

    return songs;
  });

  // Get song by id
  fastify.get<{ Params: { id: string } }>('/songs/:id', async (request: any, reply: any) => {
    const ministryId = getMinistryId(request);
    if (!ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const song = await prisma.song.findFirst({
      where: { id: request.params.id, ministryId },
      include: {
        cueSheet: {
          include: { blocks: { orderBy: { order: 'asc' } } },
        },
      },
    });

    if (!song) {
      return reply.status(404).send({ error: 'Song not found' });
    }

    return song;
  });

  // Create song
  fastify.post('/songs', async (request: any, reply: any) => {
    const user = getUserPayload(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    if (user.role === 'musician') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const { title, artist, defaultKey, tags, notes } = request.body as any;

    if (!title) {
      return reply.status(400).send({ error: 'Title is required' });
    }

    const song = await prisma.song.create({
      data: {
        title,
        artist,
        defaultKey,
        tags: JSON.stringify(tags || []),
        notes,
        ministryId: user.ministryId,
        createdById: user.userId,
      },
    });

    return reply.status(201).send(song);
  });

  // Update song
  fastify.put<{ Params: { id: string } }>('/songs/:id', async (request: any, reply: any) => {
    const user = getUserPayload(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    if (user.role === 'musician') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const song = await prisma.song.findFirst({
      where: { id: request.params.id, ministryId: user.ministryId },
    });

    if (!song) {
      return reply.status(404).send({ error: 'Song not found' });
    }

    const { title, artist, defaultKey, tags, notes, status } = request.body as any;

    const updated = await prisma.song.update({
      where: { id: request.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(artist !== undefined && { artist }),
        ...(defaultKey !== undefined && { defaultKey }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
    });

    return updated;
  });

  // Delete song (soft delete - set status to arquivada)
  fastify.delete<{ Params: { id: string } }>('/songs/:id', async (request: any, reply: any) => {
    const user = getUserPayload(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    if (user.role === 'musician') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const song = await prisma.song.findFirst({
      where: { id: request.params.id, ministryId: user.ministryId },
    });

    if (!song) {
      return reply.status(404).send({ error: 'Song not found' });
    }

    await prisma.song.update({
      where: { id: request.params.id },
      data: { status: 'arquivada' },
    });

    return { success: true };
  });

  // Upsert cue sheet with blocks
  fastify.post<{ Params: { id: string } }>('/songs/:id/cue-sheet', async (request: any, reply: any) => {
    const user = getUserPayload(request);
    if (!user?.ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    if (user.role === 'musician') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const song = await prisma.song.findFirst({
      where: { id: request.params.id, ministryId: user.ministryId },
    });

    if (!song) {
      return reply.status(404).send({ error: 'Song not found' });
    }

    const { referenceTrackUrl, totalDurationSeconds, blocks } = request.body as any;

    const cueSheet = await prisma.songCueSheet.upsert({
      where: { songId: request.params.id },
      create: {
        songId: request.params.id,
        referenceTrackUrl,
        totalDurationSeconds,
        blocks: blocks ? {
          create: blocks.map((b: any, i: number) => ({
            label: b.label,
            startTime: b.startTime,
            endTime: b.endTime,
            duration: b.duration,
            chordproContent: b.chordproContent,
            order: b.order ?? i,
          })),
        } : undefined,
      },
      update: {
        referenceTrackUrl,
        totalDurationSeconds,
        blocks: blocks ? {
          deleteMany: {},
          create: blocks.map((b: any, i: number) => ({
            label: b.label,
            startTime: b.startTime,
            endTime: b.endTime,
            duration: b.duration,
            chordproContent: b.chordproContent,
            order: b.order ?? i,
          })),
        } : undefined,
      },
      include: { blocks: { orderBy: { order: 'asc' } } },
    });

    return cueSheet;
  });

  // Get cue sheet
  fastify.get<{ Params: { id: string } }>('/songs/:id/cue-sheet', async (request: any, reply: any) => {
    const ministryId = getMinistryId(request);
    if (!ministryId) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const song = await prisma.song.findFirst({
      where: { id: request.params.id, ministryId },
    });

    if (!song) {
      return reply.status(404).send({ error: 'Song not found' });
    }

    const cueSheet = await prisma.songCueSheet.findUnique({
      where: { songId: request.params.id },
      include: { blocks: { orderBy: { order: 'asc' } } },
    });

    return cueSheet || { blocks: [] };
  });
}