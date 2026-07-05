import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export interface PlayerBarProps {
  title?: string;
  artist?: string;
  thumbnail?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  progress?: number;
  duration?: string;
  currentTime?: string;
}

export const PlayerBar = memo(function PlayerBar({
  title = 'Song Title',
  artist = 'Artist Name',
  thumbnail = 'https://via.placeholder.com/32',
  isPlaying = false,
  onPlayPause,
  onNext,
  onPrevious,
  progress = 35,
  duration = '3:45',
  currentTime = '1:18',
}: PlayerBarProps) {
  const [localProgress, setLocalProgress] = useState(progress);

  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  return (
    <div
      aria-label="Music player"
      role="region"
      className="fixed bottom-[84px] left-0 right-0 z-40"
      style={{
        background: 'rgba(26, 26, 26, 0.7)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={thumbnail}
              alt={`${title} by ${artist}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{title}</p>
            <p className="text-white/60 text-xs truncate">{artist}</p>
          </div>

          <div className="flex items-center gap-2" role="group" aria-label="Playback controls">
            <button
              onClick={onPrevious}
              aria-label="Previous track"
              className="p-2 hover:bg-white/10 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-2"
            >
              <SkipBack className="w-5 h-5 text-white" strokeWidth={1.5} aria-hidden />
            </button>

            <button
              onClick={onPlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-3 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
              style={{
                background:
                  'linear-gradient(135deg, #3A86FF 0%, #8338EC 100%)',
                boxShadow: '0 4px 12px rgba(58, 134, 255, 0.3)',
              }}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" strokeWidth={1.5} fill="white" aria-hidden />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" strokeWidth={1.5} fill="white" aria-hidden />
              )}
            </button>

            <button
              onClick={onNext}
              aria-label="Next track"
              className="p-2 hover:bg-white/10 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-2"
            >
              <SkipForward className="w-5 h-5 text-white" strokeWidth={1.5} aria-hidden />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 w-48">
            <span className="text-xs text-white/60">{currentTime}</span>
            <div
              className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer"
              role="progressbar"
              aria-valuenow={localProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Playback progress: ${currentTime} of ${duration}`}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, #3A86FF 0%, #8338EC 100%)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${localProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-white/60">{duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
});