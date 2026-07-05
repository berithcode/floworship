import { useState, useEffect } from 'react';
import { Music, Plus, X, GripVertical, Save } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist?: string;
  defaultKey?: string;
}

interface SetlistEditorProps {
  scheduleId: string;
  isMinister?: boolean;
  onClose?: () => void;
}

export function SetlistEditor({ scheduleId, isMinister = false, onClose }: SetlistEditorProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlist, setSetlist] = useState<{ songId: string; title: string; artist?: string; key?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadSetlist();
    loadSongs();
  }, [scheduleId]);

  const loadSetlist = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/schedules/${scheduleId}/setlist`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSetlist(data.repertoire.map((r: any) => ({
          songId: r.song.id,
          title: r.song.title,
          artist: r.song.artist,
          key: r.keyOverride || r.song.defaultKey,
        })));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadSongs = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/songs`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch {
      // ignore
    }
  };

  const addSong = (song: Song) => {
    setSetlist(prev => [...prev, { songId: song.id, title: song.title, artist: song.artist, key: song.defaultKey }]);
    setShowSearch(false);
    setSearchQuery('');
  };

  const removeSong = (index: number) => {
    setSetlist(prev => prev.filter((_, i) => i !== index));
  };

  const moveSong = (index: number, direction: 'up' | 'down') => {
    setSetlist(prev => {
      const newSetlist = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newSetlist.length) return prev;
      [newSetlist[index], newSetlist[newIndex]] = [newSetlist[newIndex], newSetlist[index]];
      return newSetlist;
    });
  };

  const saveSetlist = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/schedules/${scheduleId}/setlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ songIds: setlist.map(s => s.songId) }),
      });
      if (res.ok) {
        onClose?.();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Setlist do Domingo</h3>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4 text-white/60" />
          </button>
        )}
      </div>

      {setlist.length === 0 ? (
        <div className="text-center py-8 text-white/40">
          <Music className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma música selecionada</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {setlist.map((song, index) => (
            <div
              key={`${song.songId}-${index}`}
              className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]"
            >
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium text-white/40 bg-white/5">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{song.title}</p>
                {song.artist && (
                  <p className="text-xs text-white/40 truncate">{song.artist}</p>
                )}
              </div>
              {song.key && (
                <span className="px-2 py-0.5 rounded text-xs bg-brand-purple/20 text-brand-purple font-medium">
                  {song.key}
                </span>
              )}
              {isMinister && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveSong(index, 'up')}
                    disabled={index === 0}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <GripVertical className="w-3 h-3 text-white/40" />
                  </button>
                  <button
                    onClick={() => removeSong(index)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/20"
                  >
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isMinister && (
        <>
          {!showSearch ? (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/10 text-white/40 hover:text-white hover:border-white/20 hover:bg-white/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar música
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Buscar música..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-purple"
                autoFocus
              />
              {searchQuery && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredSongs.map(song => (
                    <button
                      key={song.id}
                      onClick={() => addSong(song)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{song.title}</p>
                        {song.artist && (
                          <p className="text-xs text-white/40 truncate">{song.artist}</p>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-white/40" />
                    </button>
                  ))}
                  {filteredSongs.length === 0 && (
                    <p className="text-center text-white/30 text-sm py-4">Nenhuma música encontrada</p>
                  )}
                </div>
              )}
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="w-full px-4 py-2 bg-white/5 rounded-xl text-white/60 text-sm hover:bg-white/10"
              >
                Cancelar
              </button>
            </div>
          )}

          {setlist.length > 0 && (
            <button
              onClick={saveSetlist}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3 bg-brand-purple text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Setlist'}
            </button>
          )}
        </>
      )}
    </div>
  );
}