import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SongForm } from '../../components/library/SongForm';
import type { SongFormData } from '../../components/library/SongForm';
import './SongDetail.css';

interface SongDetail {
  id: string;
  title: string;
  artist: string | null;
  defaultKey: string | null;
  tags: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  cueSheet?: {
    id: string;
    totalDurationSeconds: number | null;
    blocks: { id: string; label: string; startTime: number; endTime: number; chordproContent: string | null; order: number }[];
  } | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<SongDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'cue' | 'history'>('info');

  useEffect(() => {
    if (id) fetchSong(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSong = async (songId: string) => {
    try {
      const res = await fetch(`${API_URL}/songs/${songId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Song not found');
      setSong(await res.json());
    } catch {
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: SongFormData) => {
    const res = await fetch(`${API_URL}/songs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...data,
        tags: typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags),
      }),
    });
    if (res.ok) setSong(await res.json());
  };

  if (loading) return <div className="song-detail-loading">Loading...</div>;
  if (!song) return null;

  return (
    <div className="song-detail-page">
      <header className="song-detail-header">
        <button className="song-detail-back" onClick={() => navigate('/library')}>← Back</button>
        <h1 className="song-detail-title">{song.title}</h1>
        {song.artist && <p className="song-detail-artist">{song.artist}</p>}
      </header>

      <div className="song-detail-tabs">
        <button
          className={`song-detail-tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>
        <button
          className={`song-detail-tab ${activeTab === 'cue' ? 'active' : ''}`}
          onClick={() => setActiveTab('cue')}
        >
          Cue Editor
        </button>
        <button
          className={`song-detail-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className="song-detail-tab song-detail-tab--study"
          onClick={() => navigate(`/library/${id}/study`)}
        >
          Estudar
        </button>
      </div>

      <div className="song-detail-content">
        {activeTab === 'info' && (
          <SongForm
            initialData={{
              title: song.title,
              artist: song.artist || '',
              defaultKey: song.defaultKey || '',
              tags: song.tags,
              notes: song.notes || '',
              status: song.status,
            }}
            onSubmit={handleUpdate}
            submitLabel="Update Song"
          />
        )}

        {activeTab === 'cue' && (
          <div className="cue-editor-placeholder">
            <p>Cue Editor — coming in T4-T6</p>
            {song.cueSheet ? (
              <div className="cue-sheet-summary">
                <p>{song.cueSheet.blocks.length} blocks</p>
                {song.cueSheet.blocks.map((b) => (
                  <div key={b.id} className="cue-block-item">
                    <span>{b.label}</span>
                    <span>{b.startTime.toFixed(1)}s - {b.endTime.toFixed(1)}s</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No cue sheet yet</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="song-history-placeholder">
            <p>Session history — coming in T9</p>
          </div>
        )}
      </div>
    </div>
  );
}