import { useNavigate } from 'react-router-dom';
import { SongForm } from '../../components/library/SongForm';
import type { SongFormData } from '../../components/library/SongForm';
import './SongDetail.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function NewSong() {
  const navigate = useNavigate();

  const handleCreate = async (data: SongFormData) => {
    const res = await fetch(`${API_URL}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...data,
        tags: typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags),
      }),
    });
    if (res.ok) {
      const song = await res.json();
      navigate(`/library/${song.id}`);
    }
  };

  return (
    <div className="song-detail-page">
      <header className="song-detail-header">
        <button className="song-detail-back" onClick={() => navigate('/library')}>← Voltar</button>
        <h1 className="song-detail-title">Nova Música</h1>
      </header>
      <SongForm onSubmit={handleCreate} submitLabel="Criar Música" />
    </div>
  );
}