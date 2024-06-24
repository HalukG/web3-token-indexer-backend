import { Prisma } from '@prisma/client';

export type PrismaError = Prisma.PrismaClientKnownRequestError & {
  meta?: {
    target?: string[];
  };
};