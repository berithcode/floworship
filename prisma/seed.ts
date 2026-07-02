import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.sessionExecutionLog.deleteMany();
  await prisma.serviceRepertoireItem.deleteMany();
  await prisma.serviceAssignment.deleteMany();
  await prisma.serviceSchedule.deleteMany();
  await prisma.cueBlock.deleteMany();
  await prisma.songCueSheet.deleteMany();
  await prisma.song.deleteMany();
  await prisma.musician.deleteMany();
  await prisma.whatsAppMessageLog.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.ministryMember.deleteMany();
  await prisma.ministry.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@floworship.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$placeholder',
      name: 'Admin User',
    },
  });

  const operator = await prisma.user.create({
    data: {
      email: 'operator@floworship.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$placeholder',
      name: 'Operator User',
    },
  });

  const musician = await prisma.user.create({
    data: {
      email: 'musician@floworship.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$placeholder',
      name: 'Musician User',
    },
  });

  const ministry = await prisma.ministry.create({
    data: { name: 'Floworship Worship' },
  });

  await prisma.ministryMember.createMany({
    data: [
      { userId: admin.id, ministryId: ministry.id, role: 'admin' },
      { userId: operator.id, ministryId: ministry.id, role: 'operator' },
      { userId: musician.id, ministryId: ministry.id, role: 'musician' },
    ],
  });

  const songs = [
    { title: 'Reckless Love', artist: 'Cory Asbury', defaultKey: 'G', status: 'pronta' },
    { title: 'Good Grace', artist: 'Hillsong UNITED', defaultKey: 'A', status: 'pronta' },
    { title: 'King of Kings', artist: 'Hillsong Worship', defaultKey: 'D', status: 'pronta' },
    { title: 'Build My Life', artist: 'Housefires', defaultKey: 'C', status: 'rascunho' },
    { title: 'Great Are You Lord', artist: 'All Sons & Daughters', defaultKey: 'A', status: 'arquivada' },
  ];

  const createdSongs = [];
  for (const song of songs) {
    const s = await prisma.song.create({
      data: {
        ...song,
        ministryId: ministry.id,
        createdById: admin.id,
      },
    });
    createdSongs.push(s);
  }

  for (const song of createdSongs.slice(0, 3)) {
    const cueSheet = await prisma.songCueSheet.create({
      data: {
        songId: song.id,
        referenceTrackUrl: `https://example.com/tracks/${song.id}.mp3`,
        totalDurationSeconds: 240,
      },
    });

    await prisma.cueBlock.createMany({
      data: [
        { cueSheetId: cueSheet.id, label: 'Intro', startTime: 0, endTime: 15, duration: 15, chordproContent: '[G] [D] [Em] [C]', order: 0 },
        { cueSheetId: cueSheet.id, label: 'Verse 1', startTime: 15, endTime: 45, duration: 30, chordproContent: '[G]Before I spoke a word[D]\nYou were singing over me[Em]', order: 1 },
        { cueSheetId: cueSheet.id, label: 'Chorus', startTime: 45, endTime: 75, duration: 30, chordproContent: '[C]Oh, the overwhelming, reckless love of God[G]', order: 2 },
      ],
    });
  }

  const schedule = await prisma.serviceSchedule.create({
    data: {
      ministryId: ministry.id,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
    },
  });

  await prisma.serviceAssignment.createMany({
    data: [
      { scheduleId: schedule.id, userId: admin.id, role: 'worship_leader', confirmed: true, confirmedAt: new Date() },
      { scheduleId: schedule.id, userId: musician.id, role: 'guitarist', confirmed: false },
    ],
  });

  await prisma.serviceRepertoireItem.createMany({
    data: [
      { scheduleId: schedule.id, songId: createdSongs[0].id, order: 0 },
      { scheduleId: schedule.id, songId: createdSongs[1].id, order: 1, keyOverride: 'B' },
      { scheduleId: schedule.id, songId: createdSongs[2].id, order: 2 },
    ],
  });

  console.log('Seed complete!');
  console.log(`  Ministry: ${ministry.name} (${ministry.id})`);
  console.log(`  Users: admin, operator, musician`);
  console.log(`  Songs: ${songs.length}`);
  console.log(`  Schedule: ${schedule.date.toISOString()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });