
import { memo, useState, useEffect, useCallback } from 'react';
import { UserCheck, UserX, Clock, MessageSquare, Link, Check, Send, Shield, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  telegramLinked?: boolean;
  telegramUsername?: string;
}

interface Invite {
  id: string;
  name: string;
  phone: string;
  token: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

interface MemberManagementProps {
  ministryId: string;
  currentUserId?: string;
  currentUserRole?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const WEB_URL = import.meta.env.VITE_WEB_URL || window.location.origin;

export const MemberManagement = memo(function MemberManagement({ ministryId, currentUserId, currentUserRole }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('musician');
  const [inviting, setInviting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; role: string } | null>(null);
  const [editingRole, setEditingRole] = useState<{ id: string; name: string; currentRole: string } | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    loadData();
  }, [ministryId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`${API_URL}/ministries/${ministryId}/members`, { credentials: 'include' }),
        fetch(`${API_URL}/auth/invites?ministryId=${ministryId}`, { credentials: 'include' }),
      ]);
      if (membersRes.ok) setMembers(await membersRes.json());
      if (invitesRes.ok) setInvites(await invitesRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = useCallback(async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`${API_URL}/auth/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          role: newRole,
          ministryId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Convite criado! Copie o link abaixo.');
        setNewName('');
        setNewPhone('');
        loadData();

        const inviteUrl = `${WEB_URL}/invite/${data.token}`;
        await copyToClipboard(inviteUrl);
      }
    } catch {
      toast.error('Erro ao criar convite');
    } finally {
      setInviting(false);
    }
  }, [newName, newPhone, newRole, ministryId]);

  const copyToClipboard = useCallback(async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, []);

  const handleCopyLink = useCallback(async (token: string, id: string) => {
    const url = `${WEB_URL}/invite/${token}`;
    await copyToClipboard(url);
    setCopiedId(id);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  }, [copyToClipboard]);

  const generateTelegramLink = useCallback(async (memberId: string) => {
    try {
      const res = await fetch(`${API_URL}/telegram/link/${memberId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTelegramLink(data.deepLink);
      } else {
        toast.error('Erro ao gerar link do Telegram');
      }
    } catch {
      toast.error('Erro ao gerar link do Telegram');
    }
  }, []);

  const handleRevoke = useCallback(async (inviteId: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/invites/${inviteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        toast.success('Convite revogado');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao revogar convite');
      }
    } catch {
      toast.error('Erro ao revogar convite');
    }
  }, []);

  const handleRemove = useCallback(async (memberId: string) => {
    try {
      const res = await fetch(`${API_URL}/ministries/${ministryId}/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        setDeleteTarget(null);
        toast.success('Membro removido');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao remover membro');
      }
    } catch {
      toast.error('Erro ao remover membro');
    }
  }, [ministryId]);

  const handleRoleChange = useCallback(async (memberId: string, newRole: string) => {
    setSavingRole(true);
    try {
      const res = await fetch(`${API_URL}/ministries/${ministryId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        setEditingRole(null);
        toast.success('Permissão atualizada');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao atualizar permissão');
      }
    } catch {
      toast.error('Erro ao atualizar permissão');
    } finally {
      setSavingRole(false);
    }
  }, [ministryId]);

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = { admin: 'Admin', leader: 'Líder', musician: 'Músico', operator: 'Operador' };
    return labels[role] || role;
  };

  const roleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-danger/15 text-danger border-danger/30',
      leader: 'bg-brand-purple/15 text-brand-purple border-brand-purple/30',
      musician: 'bg-info/15 text-info border-info/30',
      operator: 'bg-success/15 text-success border-success/30',
    };
    return colors[role] || 'bg-bg-tertiary text-text-primary/50 border-border-subtle';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-accent-mint/30 border-t-accent-mint rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Membros */}
      <div className="p-6 bg-bg-card-gray-dark rounded-2xl border border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-accent-mint" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="text-text-primary font-semibold">Usuários ({members.length})</h2>
          </div>
        </div>

        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-mint/15 flex items-center justify-center text-sm font-medium text-accent-mint">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{member.name}</p>
                  <p className="text-xs text-text-primary/50">{member.email}</p>
                </div>
              </div>
<div className="flex items-center gap-3">
                  {member.role !== 'admin' && currentUserRole === 'admin' ? (
                    <>
                      {editingRole?.id === member.id ? (
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={e => handleRoleChange(member.id, e.target.value)}
                            disabled={savingRole}
                            className="appearance-none bg-bg-tertiary border border-border-subtle rounded-lg pl-3 pr-8 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-mint/30"
                            onBlur={() => setEditingRole(null)}
                            autoFocus
                          >
                            <option value="musician">Músico</option>
                            <option value="operator">Operador</option>
                            <option value="leader">Líder</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-primary/50 pointer-events-none" />
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingRole({ id: member.id, name: member.name, currentRole: member.role })}
                          className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
                          title="Alterar permissão"
                        >
                          <Shield className="w-4 h-4 text-text-primary/50" strokeWidth={1.5} />
                        </button>
                      )}
                    </>
                  ) : null}
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${roleColor(member.role)}`}>
                    {roleLabel(member.role)}
                  </span>
                  {member.telegramLinked ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-success/15 text-success border border-success/30 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Telegram
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Send}
                      onClick={() => generateTelegramLink(member.id)}
                      className="text-info hover:bg-info/15"
                      title="Vincular Telegram"
                    />
                  )}
                  {member.role !== 'admin' && member.role !== 'leader' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={UserX}
                      onClick={() => setDeleteTarget({ id: member.id, name: member.name, role: member.role })}
                      aria-label="Excluir usuário"
                    />
                  )}
                </div>
            </div>
          ))}
        </div>
      </div>

      {/* Convidar */}
      <div className="p-6 bg-bg-card-gray-dark rounded-2xl border border-border-subtle">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-info" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="text-text-primary font-semibold">Convidar Membro</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input
            label="Nome"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="João Silva"
          />
          <Input
            label="Telefone (com DDD)"
            type="tel"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            placeholder="11999998888"
            onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
          />
        </div>

        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm text-text-primary/70 mb-1">Cargo</label>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-mint/30 focus:border-transparent transition-colors"
            >
              <option value="musician">Músico</option>
              <option value="leader">Líder</option>
              <option value="operator">Operador</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleInvite}
            disabled={inviting || !newName.trim() || !newPhone.trim()}
          >
            {inviting ? 'Criando...' : 'Gerar Link de Convite'}
          </Button>
        </div>

        <p className="text-xs text-text-primary/50 mt-2">
          O link será copiado automaticamente. Cole no WhatsApp ou Telegram do músico.
        </p>
      </div>

      {/* Convites Pendentes */}
      {invites.length > 0 && (
        <div className="p-6 bg-bg-card-gray-dark rounded-2xl border border-border-subtle">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-warning" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="text-text-primary font-semibold">Convites Pendentes ({invites.length})</h2>
          </div>

          <div className="space-y-2">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-warning/15 flex items-center justify-center text-sm font-medium text-warning">
                    {invite.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{invite.name || invite.phone}</p>
                    <p className="text-xs text-text-primary/50">
                      {roleLabel(invite.role)} • Expira {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={copiedId === invite.id ? Check : Link}
                    onClick={() => handleCopyLink(invite.token, invite.id)}
                    title="Copiar link de convite"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => handleRevoke(invite.id)}
                  >
                    Revogar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal do link do Telegram */}
      {telegramLink && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setTelegramLink(null)}>
          <div className="bg-bg-secondary rounded-2xl border border-border-strong p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-text-primary mb-2">Vincular Telegram</h3>
            <p className="text-text-tertiary text-sm mb-4">
              Clique no link abaixo para vincular sua conta ao bot do Floworship no Telegram:
            </p>
            <div className="bg-bg-tertiary rounded-xl p-4 mb-4">
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-info hover:underline break-all text-sm"
              >
                {telegramLink}
              </a>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(telegramLink);
                  toast.success('Link copiado!');
                }}
              >
                Copiar Link
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setTelegramLink(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir ${deleteTarget?.name} (${roleLabel(deleteTarget?.role || '')})? Esta ação irá excluir permanentemente todos os dados associados ao usuário, incluindo histórico de presenças, disponibilidades e configurações. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir Permanentemente"
        cancelLabel="Cancelar"
        lockDuration={5}
        onConfirm={() => deleteTarget && handleRemove(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
});