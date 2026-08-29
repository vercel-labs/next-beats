import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

export default defineConfig({
  datasource: { url },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  schema: 'prisma/schema.prisma',
});
