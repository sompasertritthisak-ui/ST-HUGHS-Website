/**
 * Serverless-friendly connection string for PostgreSQL (Neon on Vercel).
 *
 * - Neon's pooled endpoint (host contains "-pooler") runs PgBouncer in
 *   transaction mode and needs `pgbouncer=true` so Prisma skips prepared
 *   statements; without it queries fail after the first request.
 * - `connection_limit` keeps each Prisma client small. During `next build`
 *   many workers pre-render pages in parallel; the default pool size
 *   (2 × CPUs + 1 per worker) exhausts Neon's connection budget and every
 *   worker then times out waiting for the pool.
 * - `pool_timeout` and `connect_timeout` give a sleeping Neon compute time to
 *   wake up instead of failing the build or a cold start.
 */
export function normaliseDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw || !/^postgres(ql)?:\/\//.test(raw)) return raw;
  try {
    const u = new URL(raw);
    const setDefault = (key: string, value: string) => {
      if (!u.searchParams.has(key)) u.searchParams.set(key, value);
    };
    if (u.hostname.includes("-pooler")) setDefault("pgbouncer", "true");
    setDefault("connection_limit", "5");
    setDefault("pool_timeout", "30");
    setDefault("connect_timeout", "20");
    setDefault("sslmode", "require");
    return u.toString();
  } catch {
    return raw;
  }
}
