import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const sqlite = new PrismaClient({
  datasources: { db: { url: 'file:./dev.db' } },
});

async function exportSongs() {
  const songs = await sqlite.song.findMany();
  
  const json = JSON.stringify(songs, null, 2);
  writeFileSync('songs-export.json', json);
  console.log(`Exported ${songs.length} songs to songs-export.json`);
  console.log('Songs:', songs.map(s => s.title));
}

exportSongs()
  .catch(console.error)
  .finally(() => sqlite.$disconnect());