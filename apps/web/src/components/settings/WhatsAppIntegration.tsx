
import { memo, useState, useCallback } from 'react';
import { MessageSquare, Check, Link, Key } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface WhatsAppConfig {
  appId?: string;
  accessToken?: string;
  connected?: boolean;
}

interface WhatsAppIntegrationProps {
  config: WhatsAppConfig;
  onSave?: (data: WhatsAppConfig) => Promise<void>;
  onTest?: () => Promise<void>;
}

export const WhatsAppIntegration = memo(function WhatsAppIntegration({ config, onSave, onTest }: WhatsAppIntegrationProps) {
  const [appId, setAppId] = useState(config.appId || '');
  const [accessToken, setAccessToken] = useState(config.accessToken || '');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const hasChanges = appId !== (config.appId || '') || accessToken !== (config.accessToken || '');

  const handleSave = useCallback(async () => {
    if (!hasChanges || !onSave) return;
    setSaving(true);
    try {
      await onSave({ appId, accessToken });
    } finally {
      setSaving(false);
    }
  }, [appId, accessToken, hasChanges, onSave]);

  const handleTest = useCallback(async () => {
    if (!onTest) return;
    setTesting(true);
    setTestResult(null);
    try {
      await onTest();
      setTestResult('success');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  }, [onTest]);

  return (
    <Card variant="gray-dark" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-success" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <h2 className="text-text-primary font-semibold">WhatsApp Business API</h2>
            <p className="text-xs text-text-primary/50 mt-0.5">Integração oficial com Meta Cloud API</p>
          </div>
        </div>
        {config.connected && (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-success/15 text-success border border-success/30">
            <Check className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
            Conectado
          </span>
        )}
      </div>

      <div className="space-y-4">
        <Input
          label={<><Key className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} aria-hidden="true" /> App ID</>}
          value={appId}
          onChange={e => setAppId(e.target.value)}
          placeholder="123456789012345"
        />

        <Input
          label={<><Key className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} aria-hidden="true" /> Token de Acesso</>}
          type="password"
          value={accessToken}
          onChange={e => setAccessToken(e.target.value)}
          placeholder="EAAx..."
        />

        <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl border border-border-subtle">
          <Link className="w-4 h-4 text-text-primary/50" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-xs text-text-primary/50">
            Você precisa ter uma conta verificada no{' '}
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-info hover:underline">
              Meta for Developers
            </a>{' '}
            e um número de WhatsApp Business registrado.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          variant="subtle"
          size="md"
          onClick={handleTest}
          disabled={testing || !accessToken}
        >
          {testing ? 'Testando...' : 'Testar Conexão'}
        </Button>

        {hasChanges && (
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        )}
      </div>

      {testResult === 'success' && (
        <p className="text-success text-sm flex items-center gap-1 mt-4">
          <Check className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          Conexão bem-sucedida!
        </p>
      )}
      {testResult === 'error' && (
        <p className="text-danger text-sm mt-4">Falha na conexão. Verifique as credenciais.</p>
      )}
    </Card>
  );
});