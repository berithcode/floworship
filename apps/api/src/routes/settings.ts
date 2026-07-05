import type { FastifyInstance } from 'fastify';
import { whatsappService } from '../services/whatsapp/provider';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';
import type { AuthenticatedUser } from '../middleware/auth';

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.put('/settings/whatsapp/test', async (request: any) => {
    const user = request.user as AuthenticatedUser;
    const { phone } = request.body as { phone?: string };

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw { statusCode: 404, message: 'Usuário não encontrado' };

    const recipient = phone || dbUser.whatsappPhone;
    if (!recipient) throw { statusCode: 400, message: 'Telefone não disponível' };

    if (!whatsappService) {
      return { success: false, error: 'WhatsApp desabilitado' };
    }
    const result = await whatsappService.sendText(
      recipient,
      '🔔 *Teste do Floworship*\n\nOlá! Esta é uma mensagem de teste do sistema. Se você recebeu, a integração com WhatsApp está funcionando! ✅'
    );

    return { success: result.status === 'sent', result };
  });

  fastify.put('/settings/whatsapp/phone', async (request: any) => {
    const user = request.user as AuthenticatedUser;
    const { phone } = request.body as { phone: string };

    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) throw { statusCode: 400, message: 'Número inválido' };

    const dbUser = await prisma.user.update({
      where: { id: user.id },
      data: { whatsappPhone: clean },
    });

    return { whatsappPhone: dbUser.whatsappPhone };
  });
}