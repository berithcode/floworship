import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { BlockReader } from '../../components/performance/BlockReader';
import { apiFetch } from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface StudyBlock {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  chordproContent: string | null;
}

interface StudySong {
  id: string;
  title: string;
  artist: string | null;
  defaultKey: string | null;
  cueSheet?: {
    referenceTrackUrl?: string | null;
    blocks: StudyBlock[];
  } | null;
}

interface SetlistSong {
  songId: string;
  title: string;
  order: number;
}

export function StudyMode() {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const setlist = (location.state as { setlist?: SetlistSong[]; currentIndex?: number } | null)?.setlist;
  const setlistIndex = (location.state as { setlist?: SetlistSong[]; currentIndex?: number } | null)?.currentIndex;

  const [song, setSong] = useState<StudySong | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'cifra' | 'letra'>('cifra');
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!songId) return;
    setLoading(true);
    apiFetch(`${API_URL}/songs/${songId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setSong)
      .catch(() => setSong(null))
      .finally(() => setLoading(false));
  }, [songId]);

  const blocks = song?.cueSheet?.blocks ?? [];

  const hasSetlist = setlist && setlist.length > 0;
  const currentIdx = setlistIndex ?? setlist?.findIndex(s => s.songId === songId) ?? -1;
  const canGoPrev = hasSetlist && currentIdx > 0;
  const canGoNext = hasSetlist && currentIdx < setlist.length - 1;

  const goToSong = (direction: 'prev' | 'next') => {
    if (!hasSetlist) return;
    const newIdx = direction === 'prev' ? currentIdx - 1 : currentIdx + 1;
    if (newIdx < 0 || newIdx >= setlist.length) return;
    const target = setlist[newIdx];
    setIndex(0);
    navigate(`/library/${target.songId}/study`, {
      state: { setlist, currentIndex: newIdx },
      replace: true,
    });
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-bg-dark flex items-center justify-center text-text-primary/70">Carregando...</div>;
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center gap-3 text-text-primary/70">
        <p>Música não encontrada.</p>
        <button onClick={() => navigate('/library')} className="text-brand-blue text-sm">← Voltar pra Biblioteca</button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full bg-bg-dark px-3 py-2 flex flex-col gap-1.5 overflow-hidden">
      {/* Header compacto: voltar + setlist nav + título + fullscreen */}
      <div className="flex items-center justify-between shrink-0 gap-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-white/70 text-sm shrink-0">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Voltar
        </button>

        {hasSetlist && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => goToSong('prev')}
              disabled={!canGoPrev}
              className="p-1 rounded-md hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed text-white/70 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <span className="text-[11px] text-white/40 font-mono min-w-[2rem] text-center">
              {currentIdx + 1}/{setlist.length}
            </span>
            <button
              onClick={() => goToSong('next')}
              disabled={!canGoNext}
              className="p-1 rounded-md hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed text-white/70 transition-colors"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        )}

        <h1 className="text-sm font-bold text-white truncate flex-1 text-center min-w-0">{song.title}</h1>

        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 transition-colors shrink-0"
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" strokeWidth={1.5} /> : <Maximize className="w-4 h-4" strokeWidth={1.5} />}
        </button>
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-2xl bg-surface border border-white/10 p-6 text-center text-white/50 text-sm flex-1 flex items-center justify-center">
          Essa música ainda não tem blocos de cifra cadastrados.
        </div>
      ) : (
        <BlockReader
          blocks={blocks}
          index={index}
          mode={mode}
          onModeChange={setMode}
          onAdvance={() => setIndex((i) => Math.min(i + 1, blocks.length - 1))}
          onBack={() => setIndex((i) => Math.max(i - 1, 0))}
          onSelectBlock={(i) => setIndex(i)}
          defaultKey={song.defaultKey ?? undefined}
        />
      )}
    </div>
  );
}
