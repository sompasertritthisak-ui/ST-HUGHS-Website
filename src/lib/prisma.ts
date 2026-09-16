import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Serverless-friendly connection string. Neon's pooled endpoint (host contains
 * "-pooler") runs PgBouncer in transaction mode, which needs `pgbouncer=true`
 * so Prisma disables prepared statements; otherwise queries fail after the
 * first request. A connect timeout keeps cold starts from hanging silently.
 */
function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw || !/^postgres(ql)?:\/\//.test(raw)) return raw;
  try {
    const u = new URL(raw);
    if (u.hostname.includes("-pooler") && !u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
    if (!u.searchParams.has("connect_timeout")) u.searchParams.set("connect_timeout", "15");
    if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
    return u.toString();
  } catch {
    return raw;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
