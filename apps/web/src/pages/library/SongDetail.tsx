import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, ListVideo, History, BookOpen } from 'lucide-react';
import { SongForm } from '../../components/library/SongForm';
import { CueSheetEditor } from '../../components/library/cue-editor/CueSheetEditor';
import { SongHistory } from '../../components/library/SongHistory';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
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
    blocks: { id: string; label: string; startTime: number; endTime: number; duration: number; chordproContent: string | null; order: number }[];
  } | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [song, setSong] = useState<SongDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'cue' | 'history'>('info');

  const fetchSong = useCallback(async (songId: string) => {
    try {
      const res = await apiFetch(`${API_URL}/songs/${songId}`);
      if (!res.ok) throw new Error('Song not found');
      setSong(await res.json());
    } catch {
      navigate('/library');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Redirecionamento baseado no papel: se for apenas músico, vai direto para Estudo
    const role = user?.ministries?.[0]?.role;
    const isMusicianOnly = role === 'musician';
    
    if (isMusicianOnly && id) {
      navigate(`/library/${id}/study`, { replace: true });
      return;
    }

    if (id) fetchSong(id);
  }, [id, fetchSong, user, navigate]);

  const handleUpdate = async (data: SongFormData) => {
    const res = await apiFetch(`${API_URL}/songs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        tags: typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags),
      }),
    });
    if (res.ok) setSong(await res.json());
  };

  if (loading) return <div className="song-detail-loading">Carregando...</div>;
  if (!song) return null;

  return (
    <div className="song-detail-page">
      <div className="song-detail-nav">
        <div className="song-detail-nav-left">
          <button className="song-detail-back" onClick={() => navigate('/library')}>
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Voltar
          </button>
          <h1 className="song-detail-title">{song.title}</h1>
          {song.artist && <p className="song-detail-artist">{song.artist}</p>}
        </div>
        <div className="song-detail-tabs">
          <button
            className={`song-detail-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <Info className="w-4 h-4" strokeWidth={1.5} />
            Informações
          </button>
          <button
            className={`song-detail-tab ${activeTab === 'cue' ? 'active' : ''}`}
            onClick={() => setActiveTab('cue')}
          >
            <ListVideo className="w-4 h-4" strokeWidth={1.5} />
            Roteiro
          </button>
          <button
            className={`song-detail-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-4 h-4" strokeWidth={1.5} />
            Histórico
          </button>
          <button
            className="song-detail-tab song-detail-tab--study"
            onClick={() => navigate(`/library/${id}/study`)}
          >
            <BookOpen className="w-4 h-4" strokeWidth={1.5} />
            Estudar
          </button>
        </div>
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
            submitLabel="Atualizar Música"
          />
        )}

        {activeTab === 'cue' && (
          <CueSheetEditor
            songId={id!}
            initialCueSheet={song.cueSheet}
            onSaved={() => { id && fetchSong(id); }}
          />
        )}

        {activeTab === 'history' && (
          <SongHistory songId={id!} />
        )}
      </div>
    </div>
  );
}