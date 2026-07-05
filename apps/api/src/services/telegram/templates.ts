import { TelegramInlineKeyboard } from './index';

export interface NotificationTemplate {
  name: string;
  render(context: Record<string, string>): {
    text: string;
    keyboard?: TelegramInlineKeyboard;
  };
}

export const TEMPLATES: Record<string, NotificationTemplate> = {
  disponibilidade_mensal: {
    name: 'disponibilidade_mensal',
    render(ctx) {
      return {
        text: `🎵 <b>Olá, ${ctx.name}!</b>\n\nEstamos coletando disponibilidade para <b>${ctx.month}</b>.\n\nVocê está disponível nos seguintes domingos?\n\n📅 <b>${ctx.sunday_dates}</b>`,
        keyboard: {
          inline_keyboard: [
            [
              { text: '✅ Estou Disponível', callback_data: `disp:yes:${ctx.cycleId}` },
              { text: '❌ Não Posso', callback_data: `disp:no:${ctx.cycleId}` },
            ],
          ],
        },
      };
    },
  },

  escala_confirmada: {
    name: 'escala_confirmada',
    render(ctx) {
      return {
        text: `✅ <b>Escala Confirmada!</b>\n\n📅 <b>${ctx.date}</b>\n🎯 Função: <b>${ctx.role}</b>\n🏛️ Ministério: <b>${ctx.ministryName}</b>`,
        keyboard: {
          inline_keyboard: [
            [
              {
                text: '📋 Ver Escala Completa',
                url: ctx.appUrl ? `${ctx.appUrl}/my-schedule/${ctx.scheduleId}` : '#',
              },
            ],
          ],
        },
      };
    },
  },

  repertorio_definido: {
    name: 'repertorio_definido',
    render(ctx) {
      return {
        text: `🎶 <b>Repertório do Culto de ${ctx.date}!</b>\n\n${ctx.repertoireList}\n\nPrepare-se no Modo Estudo!`,
        keyboard: {
          inline_keyboard: [
            [
              {
                text: '🎸 Estudar Cifras',
                url: ctx.studyUrl || '#',
              },
            ],
          ],
        },
      };
    },
  },

  substituicao_urgente: {
    name: 'substituicao_urgente',
    render(ctx) {
      return {
        text: `🚨 <b>Substituição Necessária!</b>\n\nVocê foi convidado para substituir em:\n\n📅 <b>${ctx.date}</b>\n🎵 <b>${ctx.songTitle}</b>\n🎯 Função: <b>${ctx.role}</b>\n\nPode aceitar?`,
        keyboard: {
          inline_keyboard: [
            [
              { text: '✅ Aceito', callback_data: `subst:accept:${ctx.assignmentId}` },
              { text: '❌ Não Posso', callback_data: `subst:decline:${ctx.assignmentId}` },
            ],
          ],
        },
      };
    },
  },

  lembrete_disponibilidade: {
    name: 'lembrete_disponibilidade',
    render(ctx) {
      return {
        text: `⏰ <b>Lembrete:</b>\n\nFalta <b>${ctx.days} dia(s)</b> para fechar disponibilidade de <b>${ctx.month}</b>.\n\nSua resposta ainda não foi registrada.`,
        keyboard: {
          inline_keyboard: [
            [
              { text: '✅ Estou Disponível', callback_data: `disp:yes:${ctx.cycleId}` },
              { text: '❌ Não Posso', callback_data: `disp:no:${ctx.cycleId}` },
            ],
          ],
        },
      };
    },
  },

  welcome: {
    name: 'welcome',
    render(ctx) {
      return {
        text: `👋 <b>Bem-vindo ao Floworship!</b>\n\nSeu Telegram foi vinculado com sucesso${ctx.name ? ` a ${ctx.name}` : ''}.\n\nA partir de agora você receberá在这里 notifications about your worship team schedule.`,
      };
    },
  },

  generic_text: {
    name: 'generic_text',
    render(ctx) {
      return {
        text: ctx.message || 'Mensagem do Floworship',
      };
    },
  },
};

export function renderTemplate(
  templateName: string,
  context: Record<string, string>
): { text: string; keyboard?: TelegramInlineKeyboard } | null {
  const template = TEMPLATES[templateName];
  if (!template) {
    console.warn(`[TelegramTemplates] Template não encontrado: ${templateName}`);
    return null;
  }
  return template.render(context);
}