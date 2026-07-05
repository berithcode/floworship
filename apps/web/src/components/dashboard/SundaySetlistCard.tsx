import { memo } from 'react';
import { Music, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SetlistSong {
  songId: string;
  title: string;
  order: number;
}

interface ServiceWithRepertoire {
  id: string;
  date: string;
  repertoire?: SetlistSong[];
}

interface SundaySetlistCardProps {
  service?: ServiceWithRepertoire;
}

export const SundaySetlistCard = memo(function SundaySetlistCard({
  service,
}: SundaySetlistCardProps) {
  const navigate = useNavigate();

  const hasRepertoire = service?.repertoire && service.repertoire.length > 0;

  if (!service) {
    return (
      <div className="bg-bg-card-gray-dark rounded-[24px] p-6 border-2 border-border-subtle">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-text-primary/5 flex items-center justify-center">
            <Music className="w-5 h-5 text-text-primary/40" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Setlist do Domingo</p>
            <p className="text-xs text-text-primary/40">Aguardando setlist...</p>
          </div>
        </div>
        <div className="text-center py-4 text-text-primary/30 text-sm">
          Nenhum repertório publicado ainda
        </div>
      </div>
    );
  }

  const serviceDate = new Date(service.date);
  const dayName = serviceDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayNumber = serviceDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <div className="bg-bg-card-gray-dark rounded-[24px] p-6 border-2 border-border-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-mint/10 flex items-center justify-center">
            <Music className="w-5 h-5 text-accent-mint" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Setlist do Domingo</p>
            <p className="text-xs text-text-primary/50 capitalize">{dayName}, {dayNumber}</p>
          </div>
        </div>
      </div>

      {hasRepertoire ? (
        <>
          <div className="space-y-1.5 mb-4">
            {service.repertoire!.slice(0, 5).map((song, i) => (
              <div
                key={song.songId}
                className="flex items-center gap-3 p-2.5 bg-white/[0.03] rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
                onClick={() => navigate(`/library/${song.songId}/study`, { state: { setlist: service.repertoire, currentIndex: i } })}
              >
                <div className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold text-text-primary/40 bg-text-primary/5 shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm text-text-primary truncate flex-1">{song.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-text-primary/30 shrink-0" />
              </div>
            ))}
            {service.repertoire!.length > 5 && (
              <p className="text-xs text-text-primary/40 text-center pt-1">
                +{service.repertoire!.length - 5} {service.repertoire!.length - 5 === 1 ? 'outra música' : 'outras músicas'}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/library')}
            className="w-full text-center text-xs font-medium text-accent-mint hover:text-accent-mint/80 transition-colors"
          >
            Estudar todas →
          </button>
        </>
      ) : (
        <div className="text-center py-4 text-text-primary/30 text-sm">
          Aguardando setlist...
        </div>
      )}
    </div>
  );
});
