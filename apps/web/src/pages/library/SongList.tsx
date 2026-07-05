import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Search, SlidersHorizontal, Plus, MoreVertical, Archive, Trash2 } from 'lucide-react';
import { useSongs } from '../../hooks/useSongs';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-warning/20 text-warning' },
  pronta: { label: 'Pronta', color: 'bg-accent-mint/20 text-accent-mint' },
  arquivada: { label: 'Arquivada', color: 'bg-text-primary/10 text-text-primary/60' },
};

export function SongList() {
  const { songs, loading, error, deleteSong, permanentDeleteSong } = useSongs();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { user } = useAuth();
  const userRole = user?.ministries?.[0]?.role;
  const isAdmin = userRole !== 'musician';

  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      (song.artist?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesFilter = filter === 'all' || song.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-40 bg-[#0A0A0A]/10 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-60 bg-[#0A0A0A]/10 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} variant="gray-dark" padding="lg">
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-3/4 bg-text-primary/10 rounded" />
                <div className="h-4 w-1/2 bg-text-primary/10 rounded" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-text-primary/10 rounded-full" />
                  <div className="h-5 w-12 bg-text-primary/10 rounded-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-error text-lg font-semibold mb-2">Erro ao carregar músicas</p>
          <p className="text-text-tertiary text-sm mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Biblioteca</h1>
          <p className="text-sm text-text-primary/60 mt-1">
            {songs.length} {songs.length === 1 ? 'música' : 'músicas'} no repertório
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate('/library/new')}
          >
            Nova Música
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Buscar músicas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm appearance-none cursor-pointer hover:border-border-strong transition-[border-color] duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-brand-blue/50 pr-10"
          >
            <option value="all">Todas</option>
            <option value="rascunho">Rascunho</option>
            <option value="pronta">Pronta</option>
            <option value="arquivada">Arquivada</option>
          </select>
          <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/50 pointer-events-none" strokeWidth={1.5} />
        </div>
      </div>

      {filteredSongs.length === 0 ? (
        <Card variant="gray-dark" padding="xl">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-text-primary/10 flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-text-primary/50" strokeWidth={1.5} />
            </div>
            <p className="text-text-primary font-medium mb-1">
              {search ? 'Nenhuma música encontrada' : 'Nenhuma música cadastrada'}
            </p>
            <p className="text-text-primary/60 text-sm">
              {search
                ? 'Tente buscar por outro termo'
                : isAdmin ? 'Clique em "Nova Música" para adicionar' : ''}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSongs.map((song) => {
            const status = statusConfig[song.status] || statusConfig.arquivada;
            return (
              <Card
                key={song.id}
                variant="gray-dark"
                padding="lg"
                hoverable
                onClick={() => navigate(isAdmin ? `/library/${song.id}` : `/library/${song.id}/study`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-text-primary font-semibold truncate">{song.title}</h3>
                    {song.artist && (
                      <p className="text-text-primary/70 text-sm truncate mt-0.5">{song.artist}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="relative shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === song.id ? null : song.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-text-primary/10 transition-colors duration-150"
                      >
                        <MoreVertical className="w-4 h-4 text-text-primary/60" />
                      </button>
                      {menuOpen === song.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }} />
                          <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(null);
                                if (confirm('Arquivar esta música?')) deleteSong(song.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-primary hover:bg-white/10 transition-colors"
                            >
                              <Archive className="w-4 h-4 text-text-primary/60" />
                              Arquivar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(null);
                                if (confirm('Excluir esta música permanentemente? Esta ação não pode ser desfeita.')) permanentDeleteSong(song.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  {song.defaultKey && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-text-primary/10 text-text-primary/70">
                      Tom: {song.defaultKey}
                    </span>
                  )}
                  {song.cueSheet?.blocks && song.cueSheet.blocks.length > 0 && (
                    <span className="text-xs text-text-primary/50">
                      {song.cueSheet.blocks.length} {song.cueSheet.blocks.length === 1 ? 'bloco' : 'blocos'}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
