import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { telegramService } from '../services/telegram';
import { renderTemplate, TEMPLATES } from '../services/telegram/templates';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';

const TELEGRAM_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || 'dev-telegram-secret';

interface TelegramWebhookBody {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name?: string; username?: string };
    chat: { id: number };
    date: number;
    text?: string;
    entities?: Array<{ type: string; offset: number; length: number }>;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name?: string; username?: string };
    chat_instance?: string;
    data?: string;
    message?: {
      message_id: number;
      chat: { id: number };
      text?: string;
    };
  };
}

async function linkTelegramAccount(telegramChatId: string, telegramUsername: string | undefined, linkingToken: string) {
  const member = await prisma.ministryMember.findFirst({
    where: { telegramLinkToken: linkingToken },
    include: { user: true },
  });

  if (!member) {
    return { success: false, error: 'Token de vínculo inválido ou expirado' };
  }

  const updated = await prisma.ministryMember.update({
    where: { id: member.id },
    data: {
      telegramChatId,
      telegramUsername: telegramUsername || null,
      telegramLinkToken: null,
    },
  });

  return { success: true, musician: updated };
}

function generateLinkToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function handleCallbackQuery(callbackQuery: TelegramWebhookBody['callback_query']) {
  if (!callbackQuery?.data) return;

  const { id: queryId, from, data, message } = callbackQuery;
  const chatId = message?.chat?.id || from.id;
  const callbackData = data!;

  try {
    if (callbackData.startsWith('disp:')) {
      const parts = callbackData.split(':');
      const action = parts[1]; // yes, no, toggle, confirm
      const cycleId = parts[2];

      const cycle = await prisma.monthlyScheduleCycle.findUnique({
        where: { id: cycleId },
        include: { ministry: true },
      });

      if (!cycle) {
        await telegramService.answerCallbackQuery(queryId, 'Ciclo não encontrado');
        return;
      }

      let member = await prisma.ministryMember.findFirst({
        where: { telegramChatId: String(from.id) },
      });

      if (!member) {
        await telegramService.answerCallbackQuery(queryId, 'Sua conta não está vinculada a um músico. Vincule pelo app.');
        return;
      }

      const sundays = await prisma.serviceSchedule.findMany({
        where: { cycleId },
        orderBy: { date: 'asc' },
      });

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      if (action === 'yes') {
        // Disponível para todos
        for (const sunday of sundays) {
          await prisma.availabilityResponse.upsert({
            where: {
              cycleId_ministryMemberId_sundayDate: {
                cycleId,
                ministryMemberId: member.id,
                sundayDate: sunday.date,
              },
            },
            create: { cycleId, ministryMemberId: member.id, sundayDate: sunday.date, available: true, respondedAt: new Date() },
            update: { available: true, respondedAt: new Date() },
          });
        }
        await telegramService.answerCallbackQuery(queryId, '✅ Disponível para todos!');
        await telegramService.sendMessage(chatId, `✅ Você marcou <b>disponível</b> para os ${sundays.length} domingos!\n\nObrigado pela resposta!`);

      } else if (action === 'no') {
        // Marcar todos como indisponível e mostrar seleção individual
        for (const sunday of sundays) {
          await prisma.availabilityResponse.upsert({
            where: {
              cycleId_ministryMemberId_sundayDate: {
                cycleId,
                ministryMemberId: member.id,
                sundayDate: sunday.date,
              },
            },
            create: { cycleId, ministryMemberId: member.id, sundayDate: sunday.date, available: false, respondedAt: new Date() },
            update: { available: false, respondedAt: new Date() },
          });
        }

        // Mostrar seleção individual — todos marcados como ❌
        const rows = sundays.map((s, i) => {
          const d = new Date(s.date + 'T12:00:00');
          const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;
          return [{ text: `❌ ${label}`, callback_data: `disp:toggle:${cycleId}:${i}` }];
        });
        rows.push([{ text: '✅ Confirmar', callback_data: `disp:confirm:${cycleId}` }]);

        await telegramService.answerCallbackQuery(queryId, 'Selecione os dias que você pode participar:');
        await telegramService.sendMessage(chatId,
          `Marque os domingos que você <b>pode</b> participar (toque para alternar):`,
          { inline_keyboard: rows }
        );

      } else if (action === 'toggle') {
        // Alternar disponibilidade de um domingo específico
        const sundayIndex = parseInt(parts[3], 10);
        const sunday = sundays[sundayIndex];
        if (!sunday) {
          await telegramService.answerCallbackQuery(queryId, 'Domingo não encontrado');
          return;
        }

        // Buscar resposta atual
        const existing = await prisma.availabilityResponse.findUnique({
          where: {
            cycleId_ministryMemberId_sundayDate: {
              cycleId,
              ministryMemberId: member.id,
              sundayDate: sunday.date,
            },
          },
        });

        const newAvailable = existing ? !existing.available : true;

        await prisma.availabilityResponse.upsert({
          where: {
            cycleId_ministryMemberId_sundayDate: {
              cycleId,
              ministryMemberId: member.id,
              sundayDate: sunday.date,
            },
          },
          create: { cycleId, ministryMemberId: member.id, sundayDate: sunday.date, available: newAvailable, respondedAt: new Date() },
          update: { available: newAvailable, respondedAt: new Date() },
        });

        // Re-renderizar teclado com estado atualizado
        const allResponses = await prisma.availabilityResponse.findMany({
          where: { cycleId, ministryMemberId: member.id },
        });
        const responseMap = new Map(allResponses.map(r => [r.sundayDate.toISOString(), r.available]));

        const updatedRows = sundays.map((s, i) => {
          const d = new Date(s.date + 'T12:00:00');
          const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;
          const isAvail = responseMap.get(s.date.toISOString()) ?? false;
          return [{ text: `${isAvail ? '✅' : '❌'} ${label}`, callback_data: `disp:toggle:${cycleId}:${i}` }];
        });
        updatedRows.push([{ text: '✅ Confirmar', callback_data: `disp:confirm:${cycleId}` }]);

        const d = new Date(sunday.date + 'T12:00:00');
        await telegramService.answerCallbackQuery(queryId, `${d.getDate()}/${d.getMonth()+1}: ${newAvailable ? 'Disponível' : 'Indisponível'}`);

        // Editar mensagem anterior
        if (message?.message_id) {
          await telegramService.editMessageText(chatId, message.message_id,
            `Marque os domingos que você <b>pode</b> participar (toque para alternar):`,
            { inline_keyboard: updatedRows }
          );
        }

      } else if (action === 'confirm') {
        const responses = await prisma.availabilityResponse.findMany({
          where: { cycleId, ministryMemberId: member.id },
        });
        const availCount = responses.filter(r => r.available).length;
        const unavailCount = responses.filter(r => !r.available).length;

        await telegramService.answerCallbackQuery(queryId, '✅ Resposta salva!');
        await telegramService.sendMessage(chatId,
          `✅ <b>Disponibilidade registrada!</b>\n\n` +
          `🟢 Disponível: <b>${availCount}</b> domingo(s)\n` +
          `🔴 Indisponível: <b>${unavailCount}</b> domingo(s)\n\n` +
          `Obrigado pela resposta!`
        );

        // Remover teclado
        if (message?.message_id) {
          await telegramService.editMessageReplyMarkup(chatId, message.message_id);
        }
      }

    } else if (callbackData.startsWith('subst:')) {
      const [, action, assignmentId] = callbackData.split(':');
      const isAccept = action === 'accept';

      const assignment = await prisma.serviceAssignment.findUnique({
        where: { id: assignmentId },
        include: { schedule: true, ministryMember: true },
      });

      if (!assignment) {
        await telegramService.answerCallbackQuery(queryId, 'Proposta não encontrada');
        return;
      }

      let member = await prisma.ministryMember.findFirst({
        where: { telegramChatId: String(from.id) },
      });

      if (!member) {
        await telegramService.answerCallbackQuery(queryId, 'Sua conta não está vinculada a um músico.');
        return;
      }

      if (isAccept) {
        await prisma.serviceAssignment.update({
          where: { id: assignmentId },
          data: {
            ministryMemberId: member.id,
            status: 'confirmado',
            confirmed: true,
            confirmedAt: new Date(),
          },
        });

        await telegramService.answerCallbackQuery(queryId, '✅ Substituição confirmada!');
        await telegramService.sendMessage(
          chatId,
          `🎉 <b>Substituição Confirmada!</b>\n\nVocê agora está escalado para o culto.`
        );
      } else {
        await telegramService.answerCallbackQuery(queryId, 'Entendido. Lamentamos que não possa participar.');
        await telegramService.sendMessage(
          chatId,
          `Ok, sem problemas. O líder será notificado para buscar outro substituto.`
        );
      }
    }
  } catch (error) {
    console.error('[TelegramWebhook] Erro ao processar callback:', error);
    await telegramService.answerCallbackQuery(queryId, 'Erro ao processar resposta. Tente novamente.');
  }
}

async function handleMessage(message: TelegramWebhookBody['message']) {
  if (!message?.text) return;

  const chatId = message.chat.id;
  const text = message.text;

  const command = telegramService.parseCommand(text);
  if (!command) return;

  if (command.command === 'start') {
    const startParam = command.args;

    if (startParam && startParam.startsWith('link_')) {
      const linkingToken = startParam.replace('link_', '');
      const result = await linkTelegramAccount(
        String(chatId),
        message.from.username,
        linkingToken
      );

      if (result.success) {
        await telegramService.sendMessage(
          chatId,
          `✅ <b>Telegram vinculado com sucesso!</b>\n\nBem-vindo ao Floworship, ${(result.musician as any)?.user?.name || 'músico'}!`
        );
      } else {
        await telegramService.sendMessage(
          chatId,
          `❌ ${result.error || 'Erro ao vincular. O token pode ter expirado.'}`
        );
      }
    } else if (startParam === 'start') {
      await telegramService.sendMessage(
        chatId,
        `👋 <b>Bem-vindo ao Floworship Bot!</b>\n\nUse o aplicativo para vincular sua conta.`
      );
    }
  }
}

export async function telegramWebhookRoutes(fastify: FastifyInstance) {
  fastify.get('/telegram/status', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return { configured: false };
    }

    try {
      const botInfo = await telegramService.getMe();
      return {
        configured: true,
        botUsername: botInfo.username,
        botFirstName: botInfo.first_name,
        webhookSet: false,
      };
    } catch {
      return { configured: false };
    }
  });

  fastify.post('/telegram/test', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const authUser = request.user;
    if (!authUser) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const member = await prisma.ministryMember.findFirst({
      where: { userId: authUser.id },
    });

    if (!member?.telegramChatId) {
      return reply.status(400).send({ error: 'Seu Telegram não está vinculado. Vincule pelo bot primeiro.' });
    }

    try {
      await telegramService.sendMessage(
        member.telegramChatId,
        '🔔 <b>Teste de notificação</b>\n\nSe você está vendo esta mensagem, o bot está funcionando corretamente!'
      );
      return { message: 'Mensagem de teste enviada!' };
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao enviar mensagem. Verifique se o bot está ativo.' });
    }
  });

  fastify.post('/telegram/webhook/setup', { preHandler: [authMiddleware] }, async (request: any, reply: any) => {
    const authUser = request.user;
    if (!authUser || authUser.role !== 'admin') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    if (!webhookUrl) {
      return reply.status(400).send({ error: 'TELEGRAM_WEBHOOK_URL não configurado no .env' });
    }

    try {
      await telegramService.setWebhook(webhookUrl);
      return { message: 'Webhook configurado com sucesso!' };
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao configurar webhook: ' + err.message });
    }
  });

  fastify.post('/telegram/webhook', async (request: FastifyRequest<{ Body: TelegramWebhookBody }>, reply: FastifyReply) => {
    const body = request.body as TelegramWebhookBody;

    if (body.callback_query) {
      await handleCallbackQuery(body.callback_query);
    } else if (body.message) {
      await handleMessage(body.message);
    }

    return { ok: true };
  });

  fastify.get('/telegram/link/:memberId', async (request: FastifyRequest<{ Params: { memberId: string } }>, reply: FastifyReply) => {
    const { memberId } = request.params;

    const member = await prisma.ministryMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member) {
      return reply.status(404).send({ error: 'Membro não encontrado' });
    }

    const linkingToken = generateLinkToken();
    await prisma.ministryMember.update({
      where: { id: memberId },
      data: { telegramLinkToken: linkingToken },
    });

    const deepLink = `https://t.me/floworship_bot?start=link_${linkingToken}`;

    return {
      deepLink,
      displayText: `Vincular Telegram - ${member.user.name}`,
    };
  });
}
