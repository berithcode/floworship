import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    monthlyScheduleCycle: {
      async findMany({ args, query }) {
        (args.where as any) = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        (args.where as any) = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
    serviceSchedule: {
      async findMany({ args, query }) {
        (args.where as any) = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        (args.where as any) = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});

export { basePrisma };

export async function closePrisma() {
  await basePrisma.$disconnect();
}
