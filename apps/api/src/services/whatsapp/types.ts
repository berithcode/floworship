export interface WhatsappTemplate {
  /** Nome do template (ex: 'disponibilidade') */
  name: string;

  /** Parâmetros do template */
  params?: Record<string, string>;

  /** Componentes avançados (opcional) */
  components?: {
    type: 'body' | 'header' | 'button';
    parameters?: Array<{
      type: 'text' | 'image';
      text?: string;
      /** URL para imagens */
      url?: string;
    }>;
  }[];

  /** Botões interativos */
  buttons?: Array<{
    type: 'reply';
    reply: {
      id: string;
      title: string;
    };
  }>;
}

export interface MessageResponse {
  /** Status da mensagem */
  status: 'sent' | 'delivered' | 'read' | 'failed';

  /** UUID único */
  id?: string;

  /** Erro detalhado */
  error?: string;
}

export interface ButtonReply {
  from: string;
  messageId: string;
  replyId: string;
}

export interface DispatchReply {
  (reply: ButtonReply): void;
}

export interface WhatsappStatus {
  status: 'loading' | 'connected' | 'disconnected';
  qrCode?: string;
}

export interface WhatsappService {
  sendTemplate(recipient: string, template: WhatsappTemplate): Promise<MessageResponse>;
  sendText(recipient: string, text: string): Promise<MessageResponse>;
  onReply(callback: (reply: ButtonReply) => void): void;
  dispatchReply(reply: ButtonReply): void;
  status(): Promise<WhatsappStatus>;
}