import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { whatsappService } from '../services/whatsapp/provider';
import { ButtonReply } from '../services/whatsapp/types';

export async function whatsappLegacyRoutes(fastify: FastifyInstance) {

  fastify.get('/whatsapp-legacy/qr', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!whatsappService) {
      return reply.status(503).send({ error: 'WhatsApp desabilitado' });
    }
    try {
      const status = await whatsappService.status();
      if (status.status === 'disconnected' && status.qrCode) {
        reply.type('image/svg+xml');
        return Buffer.from(status.qrCode, 'utf8');
      }
      return reply.send({ status: status.status });
    } catch {
      return reply.status(503).send({ error: 'QR não disponível' });
    }
  });

  fastify.get('/whatsapp-legacy/status', async (): Promise<{ status: string }> => {
    if (!whatsappService) {
      return { status: 'disabled' };
    }
    try {
      const s = await whatsappService.status();
      return { status: s.status };
    } catch {
      return { status: 'error' };
    }
  });

  fastify.post('/whatsapp-legacy/reply', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { from: string; replyId: string; messageId?: string; payload?: string };
    if (!body.from || !body.replyId) {
      return reply.status(400).send({ error: 'Invalid reply payload' });
    }
    console.log('[WhatsApp] Button reply recebido:', body);

    if (whatsappService) {
      whatsappService.dispatchReply?.({ from: body.from, messageId: body.messageId || 'unknown', replyId: body.replyId });
    }

    return { status: 'acked' };
  });

  console.log('[WhatsApp] Rotas legacy carregadas');
}