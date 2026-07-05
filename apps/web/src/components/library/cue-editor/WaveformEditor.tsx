import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Play, Pause, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

interface WaveformEditorProps {
  audioUrl?: string | null;
  rawUrl?: string | null;
  onTimeUpdate?: (time: number) => void;
  onReady?: (duration: number) => void;
}

function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com');
}

export const WaveformEditor = memo(function WaveformEditor({
  audioUrl,
  rawUrl,
  onTimeUpdate,
  onReady
}: WaveformEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioUrl || !containerRef.current) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    import('wavesurfer.js').then(({ default: WaveSurfer }) => {
      if (cancelled) return;

      wavesurferRef.current = WaveSurfer.create({
        container: containerRef.current!,
        waveColor: 'rgba(255,255,255,0.2)',
        progressColor: 'var(--color-accent-mint, #21f1a8)',
        cursorColor: 'var(--color-accent-mint, #21f1a8)',
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        height: 80,
        normalize: true,
        backend: 'WebAudio',
        minPxPerSec: 50,
      });

      wavesurferRef.current.on('ready', () => {
        if (cancelled) return;
        setLoading(false);
        const dur = wavesurferRef.current.getDuration();
        setDuration(dur);
        onReady?.(dur);
      });

      wavesurferRef.current.on('timeupdate', (time: number) => {
        onTimeUpdate?.(time);
      });

      wavesurferRef.current.on('play', () => setPlaying(true));
      wavesurferRef.current.on('finish', () => setPlaying(false));
      wavesurferRef.current.on('pause', () => setPlaying(false));
      wavesurferRef.current.on('error', (_err: any) => {
        if (cancelled) return;
        setLoading(false);
        if (isGoogleDriveUrl(audioUrl)) {
          setError('DRIVE_CORS');
        } else {
          setError('Erro ao carregar áudio');
        }
      });

      wavesurferRef.current.load(audioUrl);
    });

    return () => {
      cancelled = true;
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, onTimeUpdate, onReady]);

  const togglePlay = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, []);

  if (error === 'DRIVE_CORS') {
    return (
      <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/20 rounded-xl text-sm">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
        <div className="space-y-1">
          <p className="text-warning font-medium">Google Drive — áudio não carrega direto</p>
          <p className="text-text-primary/60 text-xs leading-relaxed">
            O Google Drive bloqueia reprodução direta por CORS. Para ouvir aqui, copie o link direto do arquivo
            (terminado em <code className="text-text-primary/80">.mp3</code>, <code className="text-text-primary/80">.wav</code> etc).
          </p>
          {rawUrl && (
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent-mint hover:underline"
            >
              Abrir no Drive <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-20 text-error text-sm bg-white/5 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={loading}
          className="w-9 h-9 rounded-full bg-accent-mint/20 flex items-center justify-center hover:bg-accent-mint/30 transition-colors disabled:opacity-50"
          aria-label={playing ? 'Pausar' : 'Tocar'}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-accent-mint animate-spin" strokeWidth={1.5} />
          ) : playing ? (
            <Pause className="w-4 h-4 text-accent-mint" strokeWidth={1.5} />
          ) : (
            <Play className="w-4 h-4 text-accent-mint ml-0.5" strokeWidth={1.5} />
          )}
        </button>
        <span className="text-text-primary/50 text-xs">
          {duration > 0 ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}` : 'Carregando...'}
        </span>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
});
