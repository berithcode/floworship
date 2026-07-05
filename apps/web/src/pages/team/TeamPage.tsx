
import { memo, useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, User, Check, Pause, Play, Link } from 'lucide-react';
import { WORSHIP_ROLES, getWorshipRoleLabel } from '../../constants/worshipRoles';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

interface MinistryMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  instrument: string;
  worshipRoles: string[];
  telegramLinked: boolean;
  telegramUsername?: string;
  isActiveInSchedule: boolean;
  createdAt: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const INSTRUMENTS = ['Vocal', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Violão', 'Cavaquinho', 'Flauta', 'Violino', 'Contrabaixo', 'Percussão'];

export const TeamPage = memo(function TeamPage() {
  const [members, setMembers] = useState<MinistryMember[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ministryId, setMinistryId] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [instrument, setInstrument] = useState('Vocal');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const loadMinistryId = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.ministries?.length > 0) {
          setMinistryId(data.ministries[0].ministryId);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar ministryId:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!ministryId) return;
    
    setLoading(true);
    try {
      const [membersRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/musicians`, { credentials: 'include' }),
        fetch(`${API_URL}/ministries/${ministryId}/members`, { credentials: 'include' }),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error('Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  }, [ministryId]);

  useEffect(() => {
    loadMinistryId();
  }, [loadMinistryId]);

  useEffect(() => {
    if (ministryId) {
      loadData();
    }
  }, [ministryId, loadData]);

  const resetForm = () => {
    setSelectedUserId('');
    setInstrument('Vocal');
    setSelectedRoles([]);
    setIsActive(true);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!selectedUserId || !instrument) return;
    setSaving(true);

    try {
      const body = {
        userId: selectedUserId,
        instrument,
        worshipRoles: selectedRoles,
        isActiveInSchedule: isActive,
      };

      const url = editingId ? `${API_URL}/musicians/${editingId}` : `${API_URL}/musicians`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        resetForm();
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar');
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member: MinistryMember) => {
    setSelectedUserId(member.userId);
    setInstrument(member.instrument);
    setSelectedRoles(member.worshipRoles);
    setIsActive(member.isActiveInSchedule);
    setEditingId(member.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/musicians/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const openDeleteDialog = (member: MinistryMember) => {
    setDeleteTarget({ id: member.id, name: member.name });
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const generateTelegramLink = async (memberId: string) => {
    try {
      const res = await fetch(`${API_URL}/telegram/link/${memberId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTelegramLink(data.deepLink);
      }
    } catch (err) {
      console.error('Erro ao gerar link:', err);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${API_URL}/musicians/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActiveInSchedule: !currentStatus }),
      });
      loadData();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeMembers = members.filter(m => m.isActiveInSchedule);
  const pausedMembers = members.filter(m => !m.isActiveInSchedule);

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Equipe de Música</h1>
            <p className="text-text-primary/70 mt-1">
              {activeMembers.length} ativos • {pausedMembers.length} pausados
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-mint text-text-on-mint text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Adicionar Membro
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="p-6 bg-bg-secondary rounded-2xl border border-border-strong space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">
              {editingId ? 'Editar Membro' : 'Novo Membro'}
            </h2>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm text-text-primary/70 mb-1">Membro</label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-mint transition-colors"
                >
                  <option value="">Selecione...</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-primary/70 mb-1">Instrumento Principal</label>
                  <select
                    value={instrument}
                    onChange={e => setInstrument(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-mint transition-colors"
                  >
                    {INSTRUMENTS.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-text-primary/70 mb-1">Status</label>
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                      isActive
                        ? 'bg-success/15 border-success/40 text-success'
                        : 'bg-warning/15 border-warning/40 text-warning'
                    }`}
                  >
                    {isActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isActive ? 'Ativo' : 'Pausado'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-primary/70 mb-2">Funções na Equipe</label>
                <div className="flex flex-wrap gap-2">
                  {WORSHIP_ROLES.map(role => (
                    <button
                      key={role.key}
                      onClick={() => toggleRole(role.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedRoles.includes(role.key)
                          ? 'bg-accent-mint text-text-on-mint'
                          : 'bg-bg-tertiary border border-border-subtle text-text-primary/70 hover:border-border-strong'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving || !selectedUserId || !instrument}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-mint text-text-on-mint text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={resetForm}
                className="px-5 py-2.5 bg-bg-tertiary border border-border-subtle text-text-primary/70 text-sm font-medium rounded-xl hover:bg-border-subtle transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Active Members */}
        {activeMembers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text-primary">Membros Ativos ({activeMembers.length})</h3>
            <div className="space-y-2">
              {activeMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border-subtle hover:border-border-strong transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-mint/15 flex items-center justify-center text-sm font-bold text-accent-mint">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{member.name}</p>
                      <p className="text-xs text-text-primary/50">
                        {member.instrument}
                        {member.worshipRoles.length > 0 && (
                          <span className="ml-2 text-accent-mint/70">
                            • {member.worshipRoles.map(r => getWorshipRoleLabel(r)).join(', ')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!member.telegramLinked && (
                      <button
                        onClick={() => generateTelegramLink(member.id)}
                        className="px-2 py-1 rounded-lg text-xs bg-info/15 text-info hover:bg-info/25 transition-colors flex items-center gap-1"
                        title="Vincular Telegram"
                      >
                        <Link className="w-3 h-3" />
                        Vincular
                      </button>
                    )}
                    {member.telegramLinked && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-success/15 text-success">
                        ✓ Telegram
                      </span>
                    )}
                    <button
                      onClick={() => toggleActive(member.id, member.isActiveInSchedule)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-tertiary transition-colors"
                      title="Pausar"
                    >
                      <Pause className="w-4 h-4 text-text-primary/70" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => handleEdit(member)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-tertiary transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-text-primary/70" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paused Members */}
        {pausedMembers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text-primary">Membros Pausados ({pausedMembers.length})</h3>
            <div className="space-y-2">
              {pausedMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border-subtle opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-bg-tertiary border border-border-subtle flex items-center justify-center text-sm font-medium text-text-primary/50">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary/70">{member.name}</p>
                      <p className="text-xs text-text-primary/50">
                        {member.instrument}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(member.id, member.isActiveInSchedule)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-tertiary transition-colors"
                      title="Reativar"
                    >
                      <Play className="w-4 h-4 text-text-primary/70" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => handleEdit(member)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-tertiary transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-text-primary/70" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(member)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-danger/15 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4 text-danger" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <div className="text-center py-16 text-text-primary/50">
            <User className="w-16 h-16 mx-auto mb-4 opacity-30" strokeWidth={1} />
            <p className="text-lg">Nenhum membro na equipe ainda.</p>
            <p className="text-sm mt-1">Clique em "Adicionar Membro" para começar.</p>
          </div>
        )}

        {/* Modal do link do Telegram */}
        {telegramLink && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setTelegramLink(null)}>
            <div className="bg-bg-secondary rounded-2xl border border-border-strong p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-text-primary mb-2">Vincular Telegram</h3>
              <p className="text-text-primary/50 text-sm mb-4">
                Clique no link abaixo para vincular sua conta ao bot do Telegram:
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
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(telegramLink);
                  }}
                  className="px-4 py-2 bg-bg-tertiary border border-border-subtle text-text-primary/80 rounded-xl hover:bg-border-subtle transition-colors text-sm"
                >
                  Copiar Link
                </button>
                <button
                  onClick={() => setTelegramLink(null)}
                  className="px-4 py-2 bg-accent-mint text-text-on-mint font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          title="Remover Membro"
          message={`Tem certeza que deseja remover ${deleteTarget?.name} da equipe? Esta ação irá excluir todos os dados associados ao membro, incluindo histórico de presenças, disponibilidades e configurações.`}
          confirmLabel="Remover"
          cancelLabel="Manter"
          lockDuration={5}
          onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          variant="danger"
        />
      </div>
    </div>
  );
});