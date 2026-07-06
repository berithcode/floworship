import { PrismaClient } from '@prisma/client';
const pg = new PrismaClient();

async function check() {
  const users = await pg.user.findMany();
  const ministry = await pg.ministry.findFirst({ include: { members: true } });
  const songs = await pg.song.findMany();
  
  console.log('Users:', users.map(u => ({ email: u.email, name: u.name })));
  console.log('Ministry:', ministry?.name, 'Members:', ministry?.members.length);
  console.log('Songs:', songs.map(s => ({ title: s.title, key: s.defaultKey })));
}

check().finally(() => pg.$disconnect());