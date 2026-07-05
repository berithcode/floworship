
import { memo, useState, useEffect, useCallback } from 'react';
import { Send, Check, X, Bot, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface TelegramStatus {
  configured: boolean;
  botUsername?: string;
  botFirstName?: string;
  webhookSet?: boolean;
}

export const TelegramIntegration = memo(function TelegramIntegration() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/telegram/status`, { credentials: 'include' });
      if (res.ok) setStatus(await res.json());
      else setStatus({ configured: false });
    } catch {
      setStatus({ configured: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleTest = useCallback(async () => {
    setTesting(true);
    try {
      const res = await fetch(`${API_URL}/telegram/test`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message || 'Mensagem de teste enviada!');
      else toast.error(data.error || 'Erro ao enviar teste');
    } catch {
      toast.error('Erro ao enviar teste');
    } finally {
      setTesting(false);
    }
  }, []);

  const handleSetWebhook = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/telegram/webhook/setup`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Webhook configurado!');
        checkStatus();
      } else {
        toast.error(data.error || 'Erro ao configurar webhook');
      }
    } catch {
      toast.error('Erro ao configurar webhook');
    }
  }, [checkStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-accent-mint/30 border-t-accent-mint rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card variant="gray-dark" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-info" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <h2 className="text-text-primary font-semibold">Telegram Bot</h2>
            <p className="text-xs text-text-primary/50 mt-0.5">Notificações via Bot do Telegram</p>
          </div>
        </div>
        {status?.configured ? (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-success/15 text-success border border-success/30">
            <Check className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
            Configurado
          </span>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-danger/15 text-danger border border-danger/30">
            <X className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
            Não configurado
          </span>
        )}
      </div>

      {status?.configured && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
            <Bot className="w-4 h-4 text-info" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="text-sm text-text-primary font-medium">@{status.botUsername}</p>
              <p className="text-xs text-text-primary/50">{status.botFirstName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
            <span className={`w-2 h-2 rounded-full ${status.webhookSet ? 'bg-success' : 'bg-warning'}`} />
            <div>
              <p className="text-sm text-text-primary">Webhook</p>
              <p className="text-xs text-text-primary/50">
                {status.webhookSet ? 'Ativo — recebendo atualizações' : 'Não configurado'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!status?.configured && (
        <div className="space-y-3 mb-6">
          <div className="p-4 bg-bg-tertiary rounded-xl border border-border-subtle">
            <p className="text-sm text-text-primary/70 mb-2">Para configurar:</p>
            <ol className="text-xs text-text-primary/50 space-y-1 list-decimal list-inside">
              <li>
                Fale com{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info hover:underline inline-flex items-center gap-1"
                >
                  @BotFather <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>{' '}
                no Telegram
              </li>
              <li>
                Crie um bot com{' '}
                <code className="bg-bg-card-gray-dark px-1 rounded">/newbot</code>
              </li>
              <li>
                Copie o token e adicione no{' '}
                <code className="bg-bg-card-gray-dark px-1 rounded">.env</code> como{' '}
                <code className="bg-bg-card-gray-dark px-1 rounded">TELEGRAM_BOT_TOKEN</code>
              </li>
              <li>Reinicie a API</li>
            </ol>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {status?.configured && !status.webhookSet && (
          <Button variant="primary" size="md" onClick={handleSetWebhook}>
            Configurar Webhook
          </Button>
        )}

        <Button
          variant="subtle"
          size="md"
          icon={Send}
          onClick={handleTest}
          disabled={testing || !status?.configured}
        >
          {testing ? 'Enviando...' : 'Enviar Teste'}
        </Button>
      </div>
    </Card>
  );
});