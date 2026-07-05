import { useState } from 'react';
import { Phone, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

function BrandPanel() {
  return (
    <div
      className="flex w-full md:w-[45%] lg:w-[40%] rounded-2xl p-6 md:p-8 min-h-[40vh] md:min-h-0 relative overflow-hidden shrink-0"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 0%, #f3e0ff 0%, #b979f0 22%, #7c3aed 45%, #2d1259 72%, #000000 100%)',
      }}
    >
      <div className="flex flex-col items-center text-center gap-8 w-full justify-center my-auto">
        <div className="flex items-center gap-3 text-white mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-lg font-bold">F</span>
          </div>
          <span className="text-lg font-semibold tracking-wide">Floworship</span>
        </div>
        <div>
          <h1 className="text-white text-2xl font-semibold mb-3">
            Gerencie seu ministério
          </h1>
          <p className="text-gray-300 text-sm max-w-[280px] mx-auto leading-relaxed">
            Escalas, repertório, músicos e comunicação — tudo em um só lugar.
          </p>
        </div>
        <div className="hidden md:flex flex-col gap-2 w-full max-w-[240px]">
          {['Organize escalas', 'Gerencie repertório', 'Comunique com equipe'].map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-lg px-4 py-3 bg-white/5 text-gray-300"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-medium bg-white/10 text-gray-400">
                {i + 1}
              </span>
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminRegister, setIsAdminRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isAdminMode) {
      if (isAdminRegister) {
        if (!name.trim()) {
          setError('Nome é obrigatório');
          setLoading(false);
          return;
        }
        if (!email.trim()) {
          setError('Email é obrigatório');
          setLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          setError('Senha deve ter no mínimo 6 caracteres');
          setLoading(false);
          return;
        }

        try {
          const res = await fetch(`${API_URL}/auth/register/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Falha ao criar conta');
          }

          onLoginSuccess?.();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erro inesperado');
        } finally {
          setLoading(false);
        }
      } else {
        if (!email.trim()) {
          setError('Email é obrigatório');
          setLoading(false);
          return;
        }
        if (!password) {
          setError('Senha é obrigatória');
          setLoading(false);
          return;
        }

        try {
          const res = await fetch(`${API_URL}/auth/login/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: email.trim(), password }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Falha na autenticação');
          }

          onLoginSuccess?.();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erro inesperado');
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN deve ter 4 dígitos');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha na autenticação');
      }

      onLoginSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
  };

  const switchMode = (toAdmin: boolean) => {
    setIsAdminMode(toAdmin);
    setIsAdminRegister(false);
    setError('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen h-auto md:h-screen w-full bg-black overflow-auto md:overflow-hidden">
      <div className="flex flex-col md:flex-row w-full min-h-screen md:h-full gap-6 md:gap-12 items-stretch p-4 md:p-6">

        {/* Painel Roxo (Esquerda) */}
        <BrandPanel />

        {/* Lado Direito: Formulário direto no fundo escuro */}
        <div className="flex-1 flex flex-col justify-start md:justify-center items-center px-4 md:px-12 lg:px-24 pt-8 md:py-8">

          {isAdminMode ? (
            /* Admin Login / Register */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-sm">
              <div className="mb-2">
                <h2 className="text-white text-xl font-semibold">
                  {isAdminRegister ? 'Criar conta' : 'Login administrativo'}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {isAdminRegister ? 'Crie sua conta para gerenciar o ministério' : 'Acesse com email e senha'}
                </p>
              </div>

              {isAdminRegister && (
                <Input
                  label="Nome"
                  placeholder="Seu nome"
                  icon={Phone}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fieldClassName="bg-[#1c1c22]"
                />
              )}

              <Input
                label="Email"
                type="email"
                placeholder="admin@igreja.com"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fieldClassName="bg-[#1c1c22]"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">SENHA</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isAdminRegister ? 'Mínimo 6 caracteres' : 'Sua senha'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 pl-10 pr-10 bg-[#1c1c22] border border-border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" strokeWidth={1.5} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white bg-transparent border-none p-0 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                {isAdminRegister ? 'Criar Conta' : 'Entrar'}
              </Button>

              <div className="flex flex-col items-center gap-3 mt-4">
                <p className="text-center text-sm text-gray-400">
                  {isAdminRegister ? 'Já tem conta? ' : 'Não tem conta? '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminRegister(!isAdminRegister);
                      setError('');
                    }}
                    className="text-white font-medium hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    {isAdminRegister ? 'Entrar' : 'Criar conta'}
                  </button>
                </p>

                <p className="text-center text-sm border-t border-white/10 pt-3 w-full">
                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className="text-gray-400 hover:text-white underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Voltar ao login do músico
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* Musician Login: Telefone + PIN */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-sm">
              <Input
                label="Telefone"
                type="tel"
                placeholder="11999998888"
                icon={Phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                fieldClassName="bg-[#1c1c22]"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">PIN (4 dígitos)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="****"
                    value={pin}
                    onChange={handlePinChange}
                    required
                    maxLength={4}
                    className="w-full px-4 py-2.5 pl-10 bg-[#1c1c22] border border-border rounded-xl text-white placeholder-white/40 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" strokeWidth={1.5} />
                </div>
              </div>
              {error && (
                <div className="px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col items-center gap-3 mt-4">
                <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                  Entrar
                </Button>

                <p className="text-center text-sm text-gray-400 mt-2">
                  Apenas administradores podem criar conta.
                </p>

                <p className="text-center text-sm border-t border-white/10 pt-3 w-full">
                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className="text-gray-400 hover:text-white underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Login como administrador
                  </button>
                </p>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
