import { useState, useEffect } from 'react';
import './MinistrySelector.css';

interface Ministry {
  id: string;
  name: string;
  role: string;
}

interface MinistrySelectorProps {
  onSelect?: (ministryId: string) => void;
  onCreateNew?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function MinistrySelector({ onSelect, onCreateNew }: MinistrySelectorProps) {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch ministries');
      }

      const data = await res.json();
      setMinistries(data.ministries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (ministryId: string) => {
    document.cookie = `ministry_id=${ministryId}; path=/; max-age=${30 * 24 * 60 * 60}`;
    onSelect?.(ministryId);
  };

  if (loading) {
    return (
      <div className="ministry-selector">
        <div className="ministry-selector-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ministry-selector">
        <div className="ministry-selector-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ministry-selector">
      <div className="ministry-selector-card">
        <div className="ministry-selector-header">
          <h1 className="ministry-selector-title">Select Ministry</h1>
          <p className="ministry-selector-subtitle">
            Choose a ministry to continue
          </p>
        </div>

        {ministries.length === 0 ? (
          <div className="ministry-selector-empty">
            <p>You don't have any ministries yet.</p>
            <p>Create one or accept an invite to get started.</p>
            <button
              onClick={onCreateNew}
              className="ministry-selector-create-button"
            >
              Create Ministry
            </button>
          </div>
        ) : (
          <div className="ministry-selector-list">
            {ministries.map((ministry) => (
              <button
                key={ministry.id}
                className="ministry-selector-item"
                onClick={() => handleSelect(ministry.id)}
              >
                <div className="ministry-selector-item-info">
                  <span className="ministry-selector-item-name">
                    {ministry.name}
                  </span>
                  <span className="ministry-selector-item-role">
                    {ministry.role}
                  </span>
                </div>
                <span className="ministry-selector-item-arrow">→</span>
              </button>
            ))}
          </div>
        )}

        {ministries.length > 0 && (
          <button
            onClick={onCreateNew}
            className="ministry-selector-new-button"
          >
            + Create New Ministry
          </button>
        )}
      </div>
    </div>
  );
}