import { memo } from 'react';
import { Play } from 'lucide-react';

export interface MusicCardProps {
  title: string;
  artist: string;
  coverImage: string;
  onClick?: () => void;
}

export const MusicCard = memo(function MusicCard({ title, artist, coverImage, onClick }: MusicCardProps) {
  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden">
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, #3A86FF 0%, #8338EC 100%)',
              boxShadow: '0 8px 24px rgba(58, 134, 255, 0.4)',
            }}
          >
            <Play className="w-6 h-6 text-white ml-1" strokeWidth={1.5} fill="white" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold text-base mb-1 drop-shadow-lg">
          {title}
        </h3>
        <p className="text-white/80 text-sm drop-shadow-md">
          {artist}
        </p>
      </div>
    </div>
  );
});