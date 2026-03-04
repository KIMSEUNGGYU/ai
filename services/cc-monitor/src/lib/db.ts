import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient | null {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) return null;

  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient | null =
  globalForPrisma.prisma ?? createPrismaClient();

if (prisma && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Demo Mode 여부를 반환한다.
 * TURSO_DATABASE_URL이 설정되지 않으면 true.
 */
export function isDemoMode(): boolean {
  return !process.env.TURSO_DATABASE_URL;
}
