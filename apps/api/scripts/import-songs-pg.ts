import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const pg = new PrismaClient();

async function importSongs() {
  const songsData = JSON.parse(readFileSync('songs-export.json', 'utf8'));
  
  const ministry = await pg.ministry.findFirst();
  const admin = await pg.user.findFirst();
  
  if (!ministry || !admin) {
    console.error('No ministry or admin found. Run seed first.');
    process.exit(1);
  }
  
  console.log(`Importing ${songsData.length} songs into ministry "${ministry.name}"...`);
  
  for (const song of songsData) {
    const created = await pg.song.create({
      data: {
        title: song.title,
        artist: song.artist,
        defaultKey: song.defaultKey,
        tags: song.tags,
        status: song.status,
        notes: song.notes,
        ministryId: ministry.id,
        createdById: admin.id,
      },
    });
    console.log(`  - "${created.title}" (${created.defaultKey})`);
  }
  
  const count = await pg.song.count();
  console.log(`\nTotal songs in DB: ${count}`);
}

importSongs()
  .catch(console.error)
  .finally(() => pg.$disconnect());