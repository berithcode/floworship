import { prisma } from '../../db';

export interface MinistryConfig {
  ministryId: string;
  defaultFormation: string[];
  availabilityDeadlineDays: number;
  substitutionWindowHours: number;
  cycleTriggerDay: number;
}

const DEFAULT_CONFIG: Omit<MinistryConfig, 'ministryId'> = {
  defaultFormation: ['vocalista', 'guitarrista', 'tecladista', 'baterista', 'baixista'],
  availabilityDeadlineDays: 5,
  substitutionWindowHours: 4,
  cycleTriggerDay: 20,
};

export async function getConfig(ministryId: string): Promise<MinistryConfig> {
  const existing = await prisma.ministryConfig.findUnique({ where: { ministryId } });
  if (existing) {
    return {
      ministryId: existing.ministryId,
      defaultFormation: existing.defaultFormation as unknown as string[],
      availabilityDeadlineDays: existing.availabilityDeadlineDays,
      substitutionWindowHours: existing.substitutionWindowHours,
      cycleTriggerDay: existing.cycleTriggerDay,
    };
  }
  return { ministryId, ...DEFAULT_CONFIG };
}

export async function updateConfig(ministryId: string, partial: Partial<MinistryConfig>) {
  const data: Record<string, any> = {};
  if (partial.defaultFormation) data.defaultFormation = partial.defaultFormation;
  if (partial.availabilityDeadlineDays) data.availabilityDeadlineDays = partial.availabilityDeadlineDays;
  if (partial.substitutionWindowHours) data.substitutionWindowHours = partial.substitutionWindowHours;
  if (partial.cycleTriggerDay) data.cycleTriggerDay = partial.cycleTriggerDay;

  return prisma.ministryConfig.upsert({
    where: { ministryId },
    create: { ministryId, ...data },
    update: data,
  });
}