import { prisma } from '../../db';
import { logMessage } from './messageLogService';

export async function processButtonReply(
  phone: string,
  buttonId: string,
  context: { messageId: string; timestamp: string }
): Promise<void> {
  const member = await prisma.ministryMember.findFirst({
    where: { whatsappPhone: phone },
  });

  if (!member) return;

  if (buttonId === 'disponivel' || buttonId === 'nao_disponivel') {
    const available = buttonId === 'disponivel';
    const cycleId = context.messageId;

    try {
      await prisma.availabilityResponse.create({
        data: {
          cycleId,
          ministryMemberId: member.id,
          sundayDate: new Date(),
          available,
          respondedAt: new Date(),
        },
      });
    } catch (e) {
      console.error('Failed to save availability response:', e);
    }
  }

  if (buttonId === 'aceito' || buttonId === 'nao_posso') {
    const accept = buttonId === 'aceito';
    const assignment = await prisma.serviceAssignment.findFirst({
      where: { ministryMemberId: member.id, status: 'convidado' },
    });

    if (assignment) {
      await prisma.serviceAssignment.update({
        where: { id: assignment.id },
        data: { status: accept ? 'confirmado' : 'recusado' },
      });
    }
  }

  await logMessage(member.id, 'button_reply', { buttonId }, context.messageId, 'respondido');
}
