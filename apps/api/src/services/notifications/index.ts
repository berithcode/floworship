import { telegramService } from '../telegram';
import { prisma } from '../../db';

export type NotificationChannel = 'telegram' | 'push' | 'whatsapp';

export interface NotificationContext {
  memberId?: string;
  ministryId: string;
  templateName: string;
  variables: Record<string, string>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  channel: NotificationChannel;
  error?: string;
}

export interface NotificationProvider {
  send(notification: NotificationContext): Promise<NotificationResult>;
  sendToChat(chatId: string, text: string, keyboard?: unknown): Promise<NotificationResult>;
}

export class TelegramNotificationProvider implements NotificationProvider {
  async send(notification: NotificationContext): Promise<NotificationResult> {
    try {
      console.log(`[TelegramNotif] Enviando para membro ${notification.memberId}...`);

      const member = notification.memberId
        ? await prisma.ministryMember.findUnique({
            where: { id: notification.memberId },
          })
        : null;

      if (!member?.telegramChatId) {
        console.warn(`[TelegramNotif] Membro ${notification.memberId} sem telegramChatId`);
        return {
          success: false,
          channel: 'telegram',
          error: 'Membro não tem Telegram vinculado',
        };
      }

      const { renderTemplate } = await import('../telegram/templates');
      const rendered = renderTemplate(notification.templateName, notification.variables);

      if (!rendered) {
        return {
          success: false,
          channel: 'telegram',
          error: `Template não encontrado: ${notification.templateName}`,
        };
      }

      console.log(`[TelegramNotif] Enviando para chatId ${member.telegramChatId}...`);
      const result = await telegramService.sendMessage(
        member.telegramChatId,
        rendered.text,
        rendered.keyboard
      );
      console.log(`[TelegramNotif] Enviado com sucesso! messageId: ${result.message_id}`);

      await prisma.notificationLog.create({
        data: {
          ministryMemberId: member.id,
          ministryId: notification.ministryId,
          channel: 'telegram',
          templateName: notification.templateName,
          context: JSON.stringify(notification.variables),
          messageId: String(result.message_id),
          status: 'enviado',
        },
      });

      return {
        success: true,
        messageId: String(result.message_id),
        channel: 'telegram',
      };
    } catch (error) {
      console.error('[TelegramNotif] Erro ao enviar:', error);
      return {
        success: false,
        channel: 'telegram',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  async sendToChat(chatId: string, text: string, keyboard?: unknown): Promise<NotificationResult> {
    try {
      const result = await telegramService.sendMessage(
        chatId,
        text,
        keyboard as Parameters<typeof telegramService.sendMessage>[2]
      );

      return {
        success: true,
        messageId: String(result.message_id),
        channel: 'telegram',
      };
    } catch (error) {
      return {
        success: false,
        channel: 'telegram',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}

export const telegramNotificationProvider = new TelegramNotificationProvider();

export async function sendNotification(
  memberId: string,
  ministryId: string,
  templateName: string,
  variables: Record<string, string>
): Promise<NotificationResult> {
  return telegramNotificationProvider.send({
    memberId,
    ministryId,
    templateName,
    variables,
  });
}

export async function sendBulkNotifications(
  notifications: NotificationContext[]
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];
  
  for (let i = 0; i < notifications.length; i++) {
    const result = await telegramNotificationProvider.send(notifications[i]);
    results.push(result);
    
    if (i < notifications.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  return results;
}
