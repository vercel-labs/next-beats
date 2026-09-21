import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { getDatabaseUrl, normalizeDatabaseUrl } from '@/lib/database-url';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  throw new Error(
    'Database connection is not configured. Set DATABASE_URL or POSTGRES_PRISMA_URL.',
  );
}

const connectionString = normalizeDatabaseUrl(databaseUrl);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
