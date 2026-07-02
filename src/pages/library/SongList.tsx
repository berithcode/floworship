import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSongs } from '../../hooks/useSongs';
import './SongList.css';

export function SongList() {
  const { songs, loading, error, deleteSong } = useSongs();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const userRole = JSON.parse(
    atob(document.cookie.split(';').find((c) => c.trim().startsWith('access_token='))?.split('=')[1] || 'e30=') || '{}'
  ).role;

  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      (song.artist?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesFilter = filter === 'all' || song.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = { rascunho: 'Draft', pronta: 'Ready', arquivada: 'Archived' };
    return labels[status] || status;
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = { rascunho: '#f59e0b', pronta: '#10b981', arquivada: '#6b7280' };
    return colors[status] || '#6b7280';
  };

  if (loading) return <div className="song-list-loading">Loading songs...</div>;
  if (error) return <div className="song-list-error">{error}</div>;

  return (
    <div className="song-list-page">
      <header className="song-list-header">
        <h1 className="song-list-title">Song Library</h1>
        {userRole !== 'musician' && (
          <button className="song-list-add-btn" onClick={() => navigate('/library/new')}>
            + Add Song
          </button>
        )}
      </header>

      <div className="song-list-filters">
        <input
          type="text"
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="song-list-search"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="song-list-filter">
          <option value="all">All</option>
          <option value="rascunho">Draft</option>
          <option value="pronta">Ready</option>
          <option value="arquivada">Archived</option>
        </select>
      </div>

      <div className="song-list-grid">
        {filteredSongs.length === 0 ? (
          <p className="song-list-empty">No songs found</p>
        ) : (
          filteredSongs.map((song) => (
            <div
              key={song.id}
              className="song-card"
              onClick={() => navigate(`/library/${song.id}`)}
            >
              <div className="song-card-header">
                <h3 className="song-card-title">{song.title}</h3>
                <span
                  className="song-card-status"
                  style={{ backgroundColor: statusColor(song.status) }}
                >
                  {statusLabel(song.status)}
                </span>
              </div>
              {song.artist && <p className="song-card-artist">{song.artist}</p>}
              <div className="song-card-meta">
                {song.defaultKey && <span className="song-card-key">Key: {song.defaultKey}</span>}
                {song.cueSheet && (
                  <span className="song-card-blocks">{song.cueSheet.blocks.length} blocks</span>
                )}
              </div>
              {userRole !== 'musician' && (
                <button
                  className="song-card-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Archive this song?')) deleteSong(song.id);
                  }}
                >
                  Archive
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}