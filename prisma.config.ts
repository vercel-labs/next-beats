import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const url = process.env.DATABASE_URL;
// Client generation does not need a database connection, including on fresh installs.

export default defineConfig({
  ...(url ? { datasource: { url } } : {}),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  schema: 'prisma/schema.prisma',
});
