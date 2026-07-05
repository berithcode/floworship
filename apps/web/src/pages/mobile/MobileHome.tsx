import { useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { Background } from '../../components/ui/Background';
import { BottomNav } from '../../components/mobile/BottomNav';
import { PlayerBar } from '../../components/mobile/PlayerBar';
import { MusicCard } from '../../components/mobile/MusicCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const featuredPlaylists = [
  {
    id: 1,
    title: "Today's Top Hits",
    artist: 'Various Artists',
    cover: 'https://picsum.photos/seed/playlist1/300',
  },
  {
    id: 2,
    title: 'Worship Essentials',
    artist: 'Floworship',
    cover: 'https://picsum.photos/seed/playlist2/300',
  },
];

const recentAlbums = [
  {
    id: 1,
    title: 'Grace Alone',
    artist: 'Worship Team',
    cover: 'https://picsum.photos/seed/album1/300',
  },
  {
    id: 2,
    title: 'Holy Spirit',
    artist: 'Church Band',
    cover: 'https://picsum.photos/seed/album2/300',
  },
  {
    id: 3,
    title: 'Praise & Worship',
    artist: 'Ministry',
    cover: 'https://picsum.photos/seed/album3/300',
  },
  {
    id: 4,
    title: 'Live Session',
    artist: 'Worship Leaders',
    cover: 'https://picsum.photos/seed/album4/300',
  },
];

export function MobileHome() {
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'library' | 'profile'>('home');

  return (
    <Background className="min-h-screen pb-40">
      <header className="sticky top-0 z-30 px-4 py-4 bg-bg-secondary/80 backdrop-blur-md border-b border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-text-primary/50 text-sm">Good Morning</p>
            <h1 className="text-2xl font-bold text-text-primary">Welcome Back</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-bg-tertiary rounded-full transition-colors relative">
              <Bell className="w-5 h-5 text-text-primary" strokeWidth={1.5} aria-hidden="true" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Input
            icon={Search}
            placeholder="Search songs, artists..."
            className="!mb-0"
          />
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">Featured</h2>
            <Button variant="ghost" size="sm" className="text-text-primary/50 hover:text-text-primary">
              See All
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {featuredPlaylists.map((playlist) => (
              <MusicCard
                key={playlist.id}
                title={playlist.title}
                artist={playlist.artist}
                coverImage={playlist.cover}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">Recent Albums</h2>
            <Button variant="ghost" size="sm" className="text-text-primary/50 hover:text-text-primary">
              See All
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {recentAlbums.map((album) => (
              <MusicCard
                key={album.id}
                title={album.title}
                artist={album.artist}
                coverImage={album.cover}
              />
            ))}
          </div>
        </section>
      </main>

      <PlayerBar
        title="Amazing Grace"
        artist="Worship Team"
        thumbnail="https://picsum.photos/seed/track/32"
        isPlaying={true}
        progress={35}
        currentTime="1:18"
        duration="3:45"
      />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </Background>
  );
}