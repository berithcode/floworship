import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import {
  getRepertoireItems,
  addSongToRepertoire,
  removeSongFromRepertoire,
  reorderRepertoire,
  updateRepertoireItem,
  canEditRepertoire,
} from '../services/repertoire';

export async function repertoireRoutes(app: FastifyInstance) {
  app.get('/schedules/:id/repertoire', { preHandler: [authMiddleware] }, async (request) => {
    const { id } = request.params as { id: string };
    const items = await getRepertoireItems(id);
    return items;
  });

  app.post('/schedules/:id/repertoire', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;
    const { songId, order, keyOverride } = request.body as { songId: string; order: number; keyOverride?: string };

    if (!await canEditRepertoire(user.id, id)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    try {
      const item = await addSongToRepertoire(id, songId, order, keyOverride);
      return reply.status(201).send(item);
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  app.delete('/schedules/:id/repertoire/:itemId', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { itemId } = request.params as { itemId: string };
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    if (!await canEditRepertoire(user.id, id)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    await removeSongFromRepertoire(itemId);
    return { success: true };
  });

  app.patch('/schedules/:id/repertoire/reorder', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;
    const { items } = request.body as { items: { itemId: string; order: number }[] };

    if (!await canEditRepertoire(user.id, id)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    await reorderRepertoire(id, items);
    return { success: true };
  });

  app.patch('/schedules/:id/repertoire/:itemId', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { itemId } = request.params as { itemId: string };
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const data = request.body as { keyOverride?: string };

    if (!await canEditRepertoire(user.id, id)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const item = await updateRepertoireItem(itemId, data);
    return item;
  });
}