import { create, Client, ChatId } from '@open-wa/wa-automate';
import { ButtonReply, WhatsappService, WhatsappTemplate, MessageResponse, WhatsappStatus } from '../types';

export class OpenWAService implements WhatsappService {
  private client: Client | null = null;
  private listeners: ((reply: ButtonReply) => void)[] = [];
  private qrCode: string | undefined;
  private ready: Promise<void>;

  constructor() {
    console.log('[OpenWA] Iniciando cliente WhatsApp...');
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    this.client = await create({
      puppeteerOptions: {
        executablePath: process.env.CHROME_PATH || undefined,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      sessionId: process.env.WHATSAPP_SESSION_NAME || 'floworship',
      multiDevice: true,
      qrCallback: (qr: string) => {
        this.qrCode = qr;
        console.log('[OpenWA] QR Code gerado. Escaneie com seu WhatsApp:');
        console.log(qr);
      },
    });

    console.log('[OpenWA] WhatsApp Web conectado');

    this.client.onMessage(async (message) => {
      if (message.type === 'buttons_response') {
        const reply: ButtonReply = {
          from: message.from,
          messageId: message.id,
          replyId: message.selectedButtonId || message.body,
        };
        this.listeners.forEach(cb => cb(reply));
      }
    });
  }

  private normalizePhone(phone: string): string {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    return clean.endsWith('@c.us') ? clean : (clean.startsWith('55') ? `${clean}@c.us` : `55${clean}@c.us`);
  }

  private renderBody(template: WhatsappTemplate): string {
    if (!template.components) return template.name;
    const body = template.components.find((c: { type: string }) => c.type === 'body');
    return body?.parameters ? body.parameters.map((p: { text?: string }) => p.text || '').join('\n') : template.name;
  }

  async sendTemplate(recipient: string, template: WhatsappTemplate): Promise<MessageResponse> {
    await this.ready;
    if (!this.client) return { status: 'failed', error: 'Cliente não inicializado' };

    const chatId = this.normalizePhone(recipient) as ChatId;
    const buttons = template.buttons || [];

    try {
      if (buttons.length > 0) {
        await this.client.sendText(chatId, this.renderBody(template));
        const buttonLabels = buttons.map((b: { reply: { title: string } }) => `🔘 ${b.reply.title}`).join('\n');
        await this.client.sendText(chatId, `${buttonLabels}\n\n⚠️ Responda com o número do botão.`);
      } else {
        await this.client.sendText(chatId, this.renderBody(template));
      }
      return { status: 'sent', id: `ow-${Date.now()}` };
    } catch (error) {
      console.error('[OpenWA] Erro ao enviar:', error);
      return { status: 'failed', error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  async sendText(recipient: string, text: string): Promise<MessageResponse> {
    await this.ready;
    if (!this.client) return { status: 'failed', error: 'Cliente não inicializado' };

    try {
      const chatId = this.normalizePhone(recipient) as ChatId;
      await this.client.sendText(chatId, text);
      return { status: 'sent', id: `ow-${Date.now()}` };
    } catch (error) {
      return { status: 'failed', error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  onReply(callback: (reply: ButtonReply) => void): void {
    this.listeners.push(callback);
  }

  dispatchReply(reply: ButtonReply): void {
    this.listeners.forEach(cb => cb(reply));
  }

  async status(): Promise<WhatsappStatus> {
    try {
      await this.ready;
      return {
        status: this.client ? 'connected' : 'disconnected',
        qrCode: this.qrCode,
      };
    } catch {
      return { status: 'disconnected' };
    }
  }
}