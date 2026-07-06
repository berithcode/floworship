import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const WORSHIP_ROLES = [
  { key: 'ministro_de_louvor', label: 'Ministro de Louvor' },
  { key: 'guitarra', label: 'Guitarra' },
  { key: 'baixo', label: 'Baixo' },
  { key: 'bateria', label: 'Bateria' },
  { key: 'teclado', label: 'Teclado' },
  { key: 'violao', label: 'Violão' },
  { key: 'vocalista', label: 'Vocalista' },
  { key: 'apoio_voz', label: 'Apoio de Voz' },
];

async function main() {
  console.log('Seeding database...');

  // Limpar dados existentes
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
  await prisma.session.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.availabilityResponse.deleteMany();
  await prisma.monthlyScheduleCycle.deleteMany();
  await prisma.ministryMember.deleteMany();
  await prisma.ministryConfig.deleteMany();
  await prisma.ministry.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await argon2.hash('123456');
  const adminPasswordHash = await argon2.hash('admin123');

  // ========== USUÁRIOS ==========
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@floworship.com',
      passwordHash: adminPasswordHash,
      name: 'Marcos Oliveira',
    },
  });

  const users = [
    { name: 'Ana Carolina Souza', email: 'ana.souza@email.com' },
    { name: 'Pedro Henrique Lima', email: 'pedro.lima@email.com' },
    { name: 'Juliana Ferreira', email: 'juliana.f@email.com' },
    { name: 'Lucas Santos', email: 'lucas.santos@email.com' },
    { name: 'Mariana Costa', email: 'mariana.c@email.com' },
    { name: 'Gabriel Pereira', email: 'gabriel.p@email.com' },
    { name: 'Fernanda Almeida', email: 'fernanda.a@email.com' },
    { name: 'Rafael Oliveira', email: 'rafael.o@email.com' },
    { name: 'Camila Rodrigues', email: 'camila.r@email.com' },
    { name: 'Thiago Martins', email: 'thiago.m@email.com' },
    { name: 'Beatriz Araújo', email: 'beatriz.a@email.com' },
    { name: 'Diego Nascimento', email: 'diego.n@email.com' },
  ];

  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        name: u.name,
      },
    });
    createdUsers.push(user);
  }

  // ========== MINISTÉRIO ==========
  const ministry = await prisma.ministry.create({
    data: { name: 'Floworship Worship' },
  });

  // ========== MINISTRY CONFIG ==========
  await prisma.ministryConfig.create({
    data: {
      ministryId: ministry.id,
      defaultFormation: JSON.stringify(['vocalista', 'guitarra', 'baixo', 'bateria', 'teclado']),
      availabilityDeadlineDays: 5,
      cycleTriggerDay: 20,
    },
  });

  // ========== ADMIN MEMBER ==========
  await prisma.ministryMember.create({
    data: {
      user: { connect: { id: adminUser.id } },
      ministry: { connect: { id: ministry.id } },
      role: 'admin',
      worshipRoles: JSON.stringify(['ministro_de_louvor', 'guitarra']),
      instrument: 'Guitarra',
      isActiveInSchedule: true,
      timesServedThisMonth: 2,
      lastServedAt: new Date().toISOString(),
    },
  });

  // ========== MÚSICOS (12 membros) ==========
  const musiciansData = [
    {
      userId: createdUsers[0].id,    // Ana Carolina Souza
      worshipRoles: ['vocalista', 'apoio_voz'],
      instrument: 'Vocal',
      isActiveInSchedule: true,
      timesServedThisMonth: 1,
      lastServedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: createdUsers[1].id,    // Pedro Henrique Lima
      worshipRoles: ['guitarra'],
      instrument: 'Guitarra',
      isActiveInSchedule: true,
      timesServedThisMonth: 2,
      lastServedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: createdUsers[2].id,    // Juliana Ferreira
      worshipRoles: ['vocalista'],
      instrument: 'Vocal',
      isActiveInSchedule: true,
      timesServedThisMonth: 0,
      lastServedAt: '{}',
    },
    {
      userId: createdUsers[3].id,    // Lucas Santos
      worshipRoles: ['bateria'],
      instrument: 'Bateria',
      isActiveInSchedule: true,
      timesServedThisMonth: 1,
      lastServedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: createdUsers[4].id,    // Mariana Costa
      worshipRoles: ['vocalista', 'apoio_voz'],
      instrument: 'Vocal',
      isActiveInSchedule: true,
      timesServedThisMonth: 2,
      lastServedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: createdUsers[5].id,    // Gabriel Pereira
      worshipRoles: ['teclado'],
      instrument: 'Teclado',
      isActiveInSchedule: true,
      timesServedThisMonth: 0,
      lastServedAt: '{}',
    },
    {
      userId: createdUsers[6].id,    // Fernanda Almeida
      worshipRoles: ['vocalista'],
      instrument: 'Vocal',
      isActiveInSchedule: true,
      timesServedThisMonth: 1,
      lastServedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: createdUsers[7].id,    // Rafael Oliveira
      worshipRoles: ['baixo'],
      instrument: 'Baixo',
      isActiveInSchedule: true,
      timesServedThisMonth: 1,
      lastServedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: createdUsers[8].id,    // Camila Rodrigues
      worshipRoles: ['vocalista', 'apoio_voz'],
      instrument: 'Vocal',
      isActiveInSchedule: true,
      timesServedThisMonth: 0,
      lastServedAt: '{}',
    },
    {
      userId: createdUsers[9].id,    // Thiago Martins
      worshipRoles: ['violao', 'guitarra'],
      instrument: 'Violão',
      isActiveInSchedule: true,
      timesServedThisMonth: 2,
      lastServedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: createdUsers[10].id,   // Beatriz Araújo
      worshipRoles: ['vocalista'],
      instrument: 'Vocal',
      isActiveInSchedule: false,     // Pausada
      timesServedThisMonth: 0,
      lastServedAt: '{}',
    },
    {
      userId: createdUsers[11].id,   // Diego Nascimento
      worshipRoles: ['bateria', 'percussao'],
      instrument: 'Bateria',
      isActiveInSchedule: true,
      timesServedThisMonth: 0,
      lastServedAt: '{}',
    },
  ];

  const createdMembers = [];
  for (const m of musiciansData) {
    const member = await prisma.ministryMember.create({
      data: {
        user: { connect: { id: m.userId } },
        ministry: { connect: { id: ministry.id } },
        role: 'musician',
        worshipRoles: JSON.stringify(m.worshipRoles),
        instrument: m.instrument,
        isActiveInSchedule: m.isActiveInSchedule,
        timesServedThisMonth: m.timesServedThisMonth,
        lastServedAt: m.lastServedAt || '{}',
      },
    });
    createdMembers.push(member);
  }

  console.log(`Created ${createdMembers.length} musicians`);

  // ========== MÚSICAS ==========
  const songs: { title: string; artist: string; defaultKey: string; status: string }[] = [];

  const createdSongs = [];
  for (const song of songs) {
    const s = await prisma.song.create({
      data: {
        ...song,
        ministryId: ministry.id,
        createdById: adminUser.id,
      },
    });
    createdSongs.push(s);
  }

  console.log(`Created ${createdSongs.length} songs`);

  // ========== CICLO MENSAL ATIVO ==========
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const cycle = await prisma.monthlyScheduleCycle.create({
    data: {
      ministryId: ministry.id,
      month: currentMonth,
      year: currentYear,
      status: 'coletando_disponibilidade',
      availabilityDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Created cycle: ${currentMonth}/${currentYear} (coletando_disponibilidade)`);

  // ========== DOMINGOS DO CICLO ==========
  const sundays = [];
  const firstDay = new Date(currentYear, currentMonth - 1, 1);
  const lastDay = new Date(currentYear, currentMonth, 0);

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) { // Domingo
      sundays.push(new Date(d));
    }
  }

  const createdSchedules = [];
  for (const sunday of sundays.slice(0, 4)) { // Pega até 4 domingos
    const schedule = await prisma.serviceSchedule.create({
      data: {
        ministryId: ministry.id,
        cycleId: cycle.id,
        date: sunday,
        createdById: adminUser.id,
      },
    });
    createdSchedules.push(schedule);
  }

  console.log(`Created ${createdSchedules.length} sundays for cycle`);

  // ========== RESPOSTAS DE DISPONIBILIDADE (alguns músicos já responderam) ==========
  const availabilityData = [
    // Ana Carolina: disponível para todos
    { memberIdx: 0, available: true },
    // Pedro Henrique: disponível para todos
    { memberIdx: 1, available: true },
    // Juliana: indisponível no primeiro domingo
    { memberIdx: 2, available: false },
    // Lucas: disponível para todos
    { memberIdx: 3, available: true },
    // Mariana: só disponível no 2º e 4º domingo
    { memberIdx: 4, available: true },
    // Gabriel: disponível para todos
    { memberIdx: 5, available: true },
    // Fernanda: indisponível no 3º domingo
    { memberIdx: 6, available: true },
    // Rafael: disponível para todos
    { memberIdx: 7, available: true },
    // Thiago: só disponível no 1º e 3º domingo
    { memberIdx: 9, available: true },
  ];

  for (const resp of availabilityData) {
    for (const sunday of createdSchedules.slice(0, 3)) { // Cada um responde 3 domingos
      await prisma.availabilityResponse.create({
        data: {
          cycleId: cycle.id,
          ministryMemberId: createdMembers[resp.memberIdx].id,
          sundayDate: sunday.date,
          available: resp.available,
          respondedAt: new Date(),
        },
      });
    }
  }

  console.log('Created availability responses');

  // ========== ATRIBUIÇÕES EXEMPLO (para o primeiro domingo) ==========
  if (createdSchedules.length > 0) {
    const firstSchedule = createdSchedules[0];
    await prisma.serviceAssignment.createMany({
      data: [
        { scheduleId: firstSchedule.id, ministryMemberId: createdMembers[0].id, role: 'vocalista', status: 'confirmado', confirmed: true, confirmedAt: new Date() },
        { scheduleId: firstSchedule.id, ministryMemberId: createdMembers[1].id, role: 'guitarra', status: 'pendente', confirmed: false },
        { scheduleId: firstSchedule.id, ministryMemberId: createdMembers[3].id, role: 'bateria', status: 'confirmado', confirmed: true, confirmedAt: new Date() },
        { scheduleId: firstSchedule.id, ministryMemberId: createdMembers[4].id, role: 'vocalista', status: 'pendente', confirmed: false },
        { scheduleId: firstSchedule.id, ministryMemberId: createdMembers[5].id, role: 'teclado', status: 'pendente', confirmed: false },
        { scheduleId: firstSchedule.id, ministryMemberId: createdMembers[7].id, role: 'baixo', status: 'confirmado', confirmed: true, confirmedAt: new Date() },
      ],
    });

    // Repertório do primeiro domingo (vazio — músicas reais serão adicionadas depois)
    // await prisma.serviceRepertoireItem.createMany({
    //   data: [],
    // });
  }

  console.log('\n✅ Seed completo!');
  console.log(`   Ministério: ${ministry.name}`);
  console.log(`   Admin: admin@floworship.com / admin123`);
  console.log(`   Músicos: ${createdMembers.length} membros (${createdMembers.filter((_, i) => musiciansData[i].isActiveInSchedule).length} ativos)`);
  console.log(`   Ciclo: ${currentMonth}/${currentYear} (coletando_disponibilidade)`);
  console.log(`   Domingos: ${createdSchedules.length}`);
  console.log(`   Músicas: ${createdSongs.length} (nenhuma mock - aguardando músicas reais)`);
  console.log(`   Respostas de disponibilidade: ${availabilityData.length * 3}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
