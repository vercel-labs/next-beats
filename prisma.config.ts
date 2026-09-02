import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { normalizeDatabaseUrl } from './lib/database-url';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

// Left undefined when unset rather than throwing, so `prisma generate` (which needs
// no connection) still runs on a fresh clone before anyone has written .env.local.
// Commands that do connect fail with Prisma's own missing-datasource error.
const url = process.env.DATABASE_URL;

export default defineConfig({
  ...(url ? { datasource: { url: normalizeDatabaseUrl(url) } } : {}),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  schema: 'prisma/schema.prisma',
});
