import { prisma } from '../../db';

export async function logMessage(
  memberId: string,
  templateName: string,
  context: Record<string, unknown>,
  messageId: string,
  status: string = 'enviado'
) {
  const member = await prisma.ministryMember.findUnique({ where: { id: memberId } });
  if (!member) return;

  return prisma.whatsAppMessageLog.create({
    data: {
      ministryId: member.ministryId,
      musicianId: memberId,
      templateName,
      context: JSON.stringify(context),
      messageId,
      status,
      sentById: member.userId,
    },
  });
}

export async function updateStatus(messageId: string, status: string) {
  return prisma.whatsAppMessageLog.updateMany({
    where: { messageId },
    data: { status },
  });
}

export async function getMessagesByMusician(memberId: string) {
  return prisma.whatsAppMessageLog.findMany({
    where: { musicianId: memberId },
    orderBy: { sentAt: 'desc' },
  });
}

export async function getMessagesByCycle(_cycleId: string) {
  return prisma.whatsAppMessageLog.findMany({
    orderBy: { sentAt: 'desc' },
  });
}
