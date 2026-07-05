import { useState, useEffect } from 'react';
import './InviteManager.css';

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

interface InviteManagerProps {
  ministryId: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function InviteManager({ ministryId }: InviteManagerProps) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('musician');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInvites = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/invites?ministryId=${ministryId}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      } else {
        setError('Failed to load invites');
      }
    } catch {
      setError('Failed to load invites');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, role, ministryId }),
      });

      if (res.ok) {
        setEmail('');
        setRole('musician');
        setShowForm(false);
        fetchInvites();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create invite');
      }
    } catch {
      setError('Failed to create invite');
    } finally {
      setCreating(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
  };

  if (loading) {
    return <div className="invite-manager-loading">Loading invites...</div>;
  }

  return (
    <div className="invite-manager">
      <div className="invite-manager-header">
        <h3 className="invite-manager-title">Manage Invites</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="invite-manager-toggle"
        >
          {showForm ? 'Cancel' : '+ New Invite'}
        </button>
      </div>

      {error && <div className="invite-manager-error">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreateInvite} className="invite-manager-form">
          <div className="invite-form-row">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="invite-form-input"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="invite-form-select"
            >
              <option value="musician">Musician</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="invite-form-submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create Invite'}
          </button>
        </form>
      )}

      <div className="invite-manager-list">
        {invites.length === 0 ? (
          <p className="invite-manager-empty">No pending invites</p>
        ) : (
          invites.map((invite) => (
            <div key={invite.id} className="invite-manager-item">
              <div className="invite-item-info">
                <span className="invite-item-email">{invite.email}</span>
                <span className="invite-item-meta">
                  {invite.role} • Expires {new Date(invite.expiresAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => copyInviteLink(invite.id)}
                className="invite-item-copy"
                title="Copy invite link"
              >
                📋
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}