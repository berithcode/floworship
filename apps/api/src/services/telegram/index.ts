export interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: TelegramInlineKeyboard;
  disable_web_page_preview?: boolean;
}

export interface TelegramInlineKeyboard {
  inline_keyboard: Array<Array<{
    text: string;
    callback_data?: string;
    url?: string;
  }>>;
}

export interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  chat_instance?: string;
  data?: string;
  message?: {
    message_id: number;
    chat: {
      id: number;
      first_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
}

export interface TelegramUpdate {
  update_id: number;
  callback_query?: TelegramCallbackQuery;
  message?: {
    message_id: number;
    from: TelegramCallbackQuery['from'];
    chat: { id: number; type: string };
    date: number;
    text?: string;
    entities?: Array<{ type: string; offset: number; length: number }>;
  };
}

export interface TelegramCommandContext {
  chatId: number;
  from: TelegramCallbackQuery['from'];
  args: string;
}

export class TelegramService {
  private botToken: string;
  private apiBase = 'https://api.telegram.org';

  constructor(botToken?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    if (!this.botToken) {
      console.warn('[Telegram] BOT_TOKEN não configurado');
    }
  }

  private async request<T>(method: string, body?: Record<string, unknown>): Promise<T> {
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN não configurado');
    }

    const url = `${this.apiBase}/bot${this.botToken}/${method}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async sendMessage(chatId: string | number, text: string, replyMarkup?: TelegramInlineKeyboard): Promise<{ message_id: number; chat: { id: number } }> {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const result = await this.request<{ ok: boolean; result: { message_id: number; chat: { id: number } } }>('sendMessage', payload);
    return result.result;
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    const body: Record<string, string> = { callback_query_id: callbackQueryId };
    if (text) {
      body.text = text;
      body.show_alert = 'true';
    }

    await this.request('answerCallbackQuery', body);
  }

  async setWebhook(url: string): Promise<void> {
    await this.request('setWebhook', { url, drop_pending_updates: true });
  }

  async deleteWebhook(): Promise<void> {
    await this.request('deleteWebhook', { drop_pending_updates: true });
  }

  async getMe(): Promise<{ id: number; username: string; first_name: string }> {
    const result = await this.request<{ ok: boolean; result: { id: number; username: string; first_name: string } }>('getMe');
    return result.result;
  }

  async editMessageText(chatId: number | string, messageId: number, text: string, replyMarkup?: TelegramInlineKeyboard): Promise<void> {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    await this.request('editMessageText', payload);
  }

  async editMessageReplyMarkup(chatId: number | string, messageId: number, replyMarkup?: TelegramInlineKeyboard): Promise<void> {
    await this.request('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup || { inline_keyboard: [] },
    });
  }

  parseCommand(text: string): { command: string; args: string } | null {
    const match = text.match(/^\/(\w+)(@[\w_]+)?\s*(.*)$/);
    if (!match) return null;
    return { command: match[1].toLowerCase(), args: match[3] || '' };
  }

  escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  buildDeepLink(startParam: string): string {
    return `https://t.me/floworship_bot?start=${startParam}`;
  }
}

export const telegramService = new TelegramService();