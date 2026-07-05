import { prisma } from '../../db';
import { validatePhoneNumber } from './metaCloudApi';

export async function getOptedInMusicians(ministryId: string) {
  return prisma.ministryMember.findMany({
    where: {
      ministryId,
      whatsappOptIn: true,
      whatsappPhone: { not: null },
    },
  });
}

export async function optIn(memberId: string, phone: string) {
  if (!validatePhoneNumber(phone)) {
    throw new Error('Invalid phone number format');
  }

  return prisma.ministryMember.update({
    where: { id: memberId },
    data: { whatsappPhone: phone, whatsappOptIn: true },
  });
}

export async function optOut(memberId: string) {
  return prisma.ministryMember.update({
    where: { id: memberId },
    data: { whatsappOptIn: false },
  });
}
