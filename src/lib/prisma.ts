import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { after } from "next/server";
import { cache } from "react";
import { normaliseDatabaseUrl } from "./database-url";

/**
 * One import, two runtimes.
 *
 * - Local development / plain Node: a single long-lived client (SQLite via the
 *   bundled engine, or PostgreSQL via the Neon serverless driver).
 * - Cloudflare Workers: one client per request. Workers forbid reusing I/O
 *   objects (sockets) across requests, so a module-level pool would fail with
 *   "Cannot perform I/O on behalf of a different request". `react.cache` scopes
 *   the instance to the current render/request and `after()` disconnects it
 *   once the response has been sent.
 *
 * Neon queries go over HTTP (`poolQueryViaFetch`), which needs no persistent
 * socket and is the fastest path from Cloudflare's edge to Neon.
 */

const LOG = process.env.NODE_ENV === "development" ? (["warn", "error"] as const) : (["error"] as const);

const isWorkersRuntime = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

function isPostgres(url: string | undefined): url is string {
  return Boolean(url && /^postgres(ql)?:\/\//.test(url));
}

function createClient(): PrismaClient {
  const url = normaliseDatabaseUrl(process.env.DATABASE_URL);
  if (isPostgres(url)) {
    neonConfig.poolQueryViaFetch = true;
    return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }), log: [...LOG] });
  }
  return new PrismaClient({ datasourceUrl: url, log: [...LOG] });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const perRequestClient = cache(() => {
  const client = createClient();
  try {
    after(() => client.$disconnect().catch(() => undefined));
  } catch {
    // Outside a request scope (e.g. build-time prerender): nothing to schedule.
  }
  return client;
});

function resolve(): PrismaClient {
  if (isWorkersRuntime) return perRequestClient();
  return (globalForPrisma.prisma ??= createClient());
}

/**
 * Drop-in `PrismaClient` facade. Every property access resolves the client for
 * the current runtime, so call sites keep writing `prisma.programme.findMany()`.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = resolve();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
