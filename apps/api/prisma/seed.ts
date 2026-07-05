import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPasswordHash = await argon2.hash('admin123');
  const musicianPasswordHash = await argon2.hash('1234');

  await prisma.sessionExecutionLog.deleteMany();
  await prisma.serviceRepertoireItem.deleteMany();
  await prisma.serviceAssignment.deleteMany();
  await prisma.serviceSchedule.deleteMany();
  await prisma.cueBlock.deleteMany();
  await prisma.songCueSheet.deleteMany();
  await prisma.song.deleteMany();
  await prisma.whatsAppMessageLog.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.availabilityResponse.deleteMany();
  await prisma.monthlyScheduleCycle.deleteMany();
  await prisma.ministryMember.deleteMany();
  await prisma.ministryConfig.deleteMany();
  await prisma.ministry.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@floworship.com',
      passwordHash: adminPasswordHash,
      name: 'Admin User',
    },
  });

  const musician1 = await prisma.user.create({
    data: {
      email: 'musician@floworship.com',
      passwordHash: musicianPasswordHash,
      name: 'Musician User',
    },
  });

  const musician2 = await prisma.user.create({
    data: {
      email: 'guitar@floworship.com',
      passwordHash: musicianPasswordHash,
      name: 'Guitar Player',
    },
  });

  const ministry = await prisma.ministry.create({
    data: { name: 'Floworship Worship' },
  });

  await prisma.ministryConfig.create({
    data: {
      ministryId: ministry.id,
      defaultFormation: JSON.stringify(['vocalista', 'guitarra', 'baixo', 'bateria', 'teclado']),
      availabilityDeadlineDays: 5,
      cycleTriggerDay: 20,
    },
  });

  await prisma.ministryMember.create({
    data: {
      userId: admin.id,
      ministryId: ministry.id,
      role: 'admin',
      worshipRoles: JSON.stringify(['ministro_de_louvor', 'guitarra']),
      instrument: 'Guitarra',
      isActiveInSchedule: true,
    },
  });

  const member1 = await prisma.ministryMember.create({
    data: {
      userId: musician1.id,
      ministryId: ministry.id,
      role: 'musician',
      worshipRoles: JSON.stringify(['vocalista']),
      instrument: 'Vocal',
      isActiveInSchedule: true,
    },
  });

  const member2 = await prisma.ministryMember.create({
    data: {
      userId: musician2.id,
      ministryId: ministry.id,
      role: 'musician',
      worshipRoles: JSON.stringify(['guitarra']),
      instrument: 'Guitarra',
      isActiveInSchedule: true,
    },
  });

  const songs: { title: string; artist: string; defaultKey: string; status: string }[] = [];

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
      sessionType: 'ensaio',
    },
  });

  await prisma.serviceAssignment.createMany({
    data: [
      { scheduleId: schedule.id, ministryMemberId: member1.id, role: 'vocalista', status: 'confirmado', confirmed: true, confirmedAt: new Date() },
      { scheduleId: schedule.id, ministryMemberId: member2.id, role: 'guitarra', status: 'confirmado', confirmed: true, confirmedAt: new Date() },
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
  console.log(`  Users: admin, musician1, musician2`);
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
