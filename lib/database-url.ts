// Normalize the Postgres connection string to `sslmode=verify-full`.
// `prefer`, `require`, and `verify-ca` will adopt weaker libpq semantics in
// pg-connection-string v3 / pg v9 and emit a deprecation warning today.
// We always want full TLS verification, so rewrite (or append) the param
// before passing the URL to any client/adapter/CLI codepath.
//
// Exception: an explicit `sslmode=disable` is left as-is, so a local or CI
// Postgres without TLS (e.g. the service container in .github/workflows/e2e.yml)
// can connect. Remote URLs like Neon never set `disable`, so they still get
// upgraded to `verify-full`.
export function getDatabaseUrl(): string | undefined {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim();

  return url || undefined;
}

export function normalizeDatabaseUrl(url: string): string {
  let u: URL;

  try {
    u = new URL(url);
  } catch {
    throw new Error(
      'Invalid database URL. Set DATABASE_URL or POSTGRES_PRISMA_URL to a valid PostgreSQL connection string.',
    );
  }

  if (u.protocol !== 'postgresql:' && u.protocol !== 'postgres:') {
    throw new Error('Database URL must use the postgres:// or postgresql:// protocol.');
  }

  if (u.searchParams.get('sslmode') !== 'disable') {
    u.searchParams.set('sslmode', 'verify-full');
  }
  return u.toString();
}
