import { createPrismaAdapter } from "./prisma-adapter.mjs";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter: createPrismaAdapter(process.env.DATABASE_URL) });

globalForPrisma.prisma = db;
