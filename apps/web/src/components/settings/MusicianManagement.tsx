
import { memo, useState, useEffect, useCallback } from 'react';
import { Plus, Guitar, Edit2, Trash2, User, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface Musician {
  id: string;
  userId: string;
  name: string;
  email: string;
  instrument: string;
  worshipRoles: string[];
  telegramLinked: boolean;
  telegramUsername?: string;
  isActive: boolean;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface MusicianManagementProps {
  ministryId: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const INSTRUMENTS = ['Vocal', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Violão', 'Cavaquinho', 'Flauta', 'Violino', 'Contrabaixo', 'Percussão'];

const WORSHIP_ROLES = ['vocalista', 'guitarrista', 'tecladista', 'baterista', 'baixista', 'violonista', 'cavaco', 'flautista', 'violinista', 'contrabaixista', 'percussionista'];

export const MusicianManagement = memo(function MusicianManagement({ ministryId }: MusicianManagementProps) {
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [members, setMembers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [instrument, setInstrument] = useState('Vocal');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [musiciansRes, membersRes] = await Promise.all([
        fetch(`${API_URL}/musicians`, { credentials: 'include' }),
        fetch(`${API_URL}/ministries/${ministryId}/members`, { credentials: 'include' }),
      ]);

      if (musiciansRes.ok) {
        const data = await musiciansRes.json();
        setMusicians(data);
      }

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data);
      }
    } catch (err) {
      console.error('Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  }, [ministryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setSelectedUserId('');
    setInstrument('Vocal');
    setSelectedRoles([]);
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

  const handleEdit = (musician: Musician) => {
    setSelectedUserId(musician.userId);
    setInstrument(musician.instrument);
    setSelectedRoles(musician.worshipRoles);
    setEditingId(musician.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este músico da equipe?')) return;

    try {
      await fetch(`${API_URL}/musicians/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      loadData();
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Guitar className="w-5 h-5 text-accent-mint" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="text-text-primary font-semibold">Equipe de Música ({musicians.length})</h2>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => setShowForm(true)}>
          Adicionar Músico
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-6 bg-bg-card-gray-dark rounded-2xl border border-accent-mint/30 space-y-4">
          <h3 className="text-text-primary font-medium">
            {editingId ? 'Editar Músico' : 'Novo Músico'}
          </h3>

          {/* User selector */}
          <div>
            <label className="block text-sm font-medium text-text-primary/70 mb-1.5">Membro</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-mint/30 focus:border-transparent transition-colors"
            >
              <option value="">Selecione...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>

          {/* Instrument */}
          <div>
            <label className="block text-sm font-medium text-text-primary/70 mb-1.5">Instrumento Principal</label>
            <select
              value={instrument}
              onChange={e => setInstrument(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-mint/30 focus:border-transparent transition-colors"
            >
              {INSTRUMENTS.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {/* Worship Roles */}
          <div>
            <label className="block text-sm font-medium text-text-primary/70 mb-2">Funções na Equipe</label>
            <div className="flex flex-wrap gap-2">
              {WORSHIP_ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                    selectedRoles.includes(role)
                      ? 'bg-accent-mint text-on-mint border-accent-mint'
                      : 'bg-bg-tertiary text-text-primary/70 border-border-subtle hover:bg-bg-card-gray-dark'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={Check}
              onClick={handleSave}
              disabled={saving || !selectedUserId || !instrument}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="subtle" size="md" onClick={resetForm}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Musicians List */}
      {musicians.length === 0 ? (
        <div className="text-center py-12 text-text-primary/50">
          <User className="w-12 h-12 mx-auto mb-3 opacity-50" strokeWidth={1} aria-hidden="true" />
          <p>Nenhum músico na equipe ainda.</p>
          <p className="text-sm mt-1">Clique em "Adicionar Músico" para começar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {musicians.map(musician => (
            <div key={musician.id} className="flex items-center justify-between p-4 bg-bg-card-gray-dark rounded-xl border border-border-subtle hover:border-border-strong transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-mint/15 flex items-center justify-center text-sm font-medium text-accent-mint">
                  {musician.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{musician.name}</p>
                  <p className="text-xs text-text-primary/50">
                    {musician.instrument}
                    {musician.worshipRoles.length > 0 && (
                      <span className="ml-2 text-accent-mint/70">
                        • {musician.worshipRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {musician.telegramLinked && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-success/15 text-success border border-success/30">
                    ✓ Telegram
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleEdit(musician)}
                  aria-label="Editar"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDelete(musician.id)}
                  aria-label="Remover"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});