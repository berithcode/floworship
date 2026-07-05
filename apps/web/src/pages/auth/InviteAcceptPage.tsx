import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Music, User, Lock, KeyRound, ArrowRight, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/invite/${token}`);
        if (!res.ok) throw new Error('Convite inválido');
        const data = await res.json();
        setInviteInfo(data);
        setName(data.name || '');
      } catch {
        setError('Convite inválido ou expirado');
      } finally {
        setValidating(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handlePinChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setter(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin !== confirmPin) {
      setError('Os PINs não coincidem');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('O PIN deve ter exatamente 4 dígitos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/invite/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          pin,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao aceitar convite');
      }

      toast.success('Conta criada com sucesso!');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aceitar convite');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="spinner-gradient" />
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <Card variant="gray-dark" padding="xl" className="max-w-md w-full text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-danger/15 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-danger" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                Convite Inválido
              </h1>
              <p className="text-text-tertiary text-sm">{error}</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/login')} icon={ArrowRight}>
              Ir para Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <Card variant="gray-dark" padding="xl" className="max-w-md w-full">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-accent-mint-dim flex items-center justify-center mb-5">
            <Music className="w-8 h-8 text-accent-mint" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Bem-vindo ao Floworship!
          </h1>
          <p className="text-text-tertiary text-sm max-w-xs">
            Você foi convidado para a equipe de louvor
          </p>
          {inviteInfo && (
            <div className="mt-3 px-4 py-2 rounded-lg bg-accent-mint-dim border border-accent-mint/20">
              <p className="text-accent-mint font-medium text-sm">
                {inviteInfo.name}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Seu nome completo"
            placeholder="João Silva"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary/70">
              Crie um PIN de 4 dígitos
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" strokeWidth={1.5} />
              <input
                type="text"
                inputMode="numeric"
                value={pin}
                onChange={handlePinChange(setPin)}
                className="w-full px-4 py-2.5 pl-10 bg-bg-tertiary border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary text-center text-2xl tracking-[0.5em] transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out)] focus:outline-none focus:ring-2 focus:ring-accent-mint/30 focus:border-transparent hover:border-border-strong"
                placeholder="****"
                required
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary/70">
              Confirme o PIN
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" strokeWidth={1.5} />
              <input
                type="text"
                inputMode="numeric"
                value={confirmPin}
                onChange={handlePinChange(setConfirmPin)}
                className="w-full px-4 py-2.5 pl-10 bg-bg-tertiary border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary text-center text-2xl tracking-[0.5em] transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out)] focus:outline-none focus:ring-2 focus:ring-accent-mint/30 focus:border-transparent hover:border-border-strong"
                placeholder="****"
                required
                maxLength={4}
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth isLoading={loading} icon={ArrowRight}>
            Criar Minha Conta
          </Button>
        </form>
      </Card>
    </div>
  );
}
