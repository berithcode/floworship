import { WhatsappService } from './types';
import { OpenWAService } from './implementations/openwa';

const WHATSAPP_PROVIDER = process.env.WHATSAPP_PROVIDER || 'openwa';

export let whatsappService: WhatsappService | undefined;

export function initWhatsappService(): void {
  if (WHATSAPP_PROVIDER === 'meta') {
    console.log('[WhatsApp] Provider: Meta Cloud API (não implementada)');
    whatsappService = createMetaStub();
  } else {
    console.log('[WhatsApp] Provider: OpenWA');
    whatsappService = new OpenWAService();
  }
}

function createMetaStub(): WhatsappService {
  return {
    sendTemplate: async () => ({ status: 'failed', error: 'Meta Cloud API não configurada' }),
    sendText: async () => ({ status: 'failed', error: 'Meta Cloud API não configurada' }),
    onReply: () => {},
    dispatchReply: () => {},
    status: async () => ({ status: 'disconnected' }),
  };
}