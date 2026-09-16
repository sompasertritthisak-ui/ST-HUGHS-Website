#!/usr/bin/env node
/**
 * Prepare the database for a build. Used by `pnpm vercel-build` (and usable locally).
 *
 * 1. Picks the Prisma provider from DATABASE_URL (postgres:// → postgresql, otherwise sqlite)
 *    and writes prisma/.schema.build.prisma with that provider — one source schema, no drift.
 * 2. `prisma generate` for that provider.
 * 3. `prisma db push` so the database has the current tables (fails on destructive changes so data is never dropped silently;
 *    set SKIP_DB_PUSH=1 to skip, e.g. when you manage migrations yourself).
 * 4. Seeds ONLY when SEED_ON_BUILD=true — set it for the first deploy, then remove it,
 *    because the seed resets navigation, pathways and FAQs to the seed content.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "";
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const provider = /^postgres(ql)?:\/\//.test(url) ? "postgresql" : "sqlite";
const src = readFileSync(path.resolve("prisma/schema.prisma"), "utf8");
const out = src.replace(/provider\s*=\s*"sqlite"/, `provider = "${provider}"`);
const schema = path.resolve("prisma/.schema.build.prisma");
writeFileSync(schema, out);
console.log(`[db-prepare] provider=${provider}`);

const run = (cmd) => {
  console.log(`[db-prepare] ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
};
run(`pnpm exec prisma generate --schema "${schema}"`);
if (process.env.SKIP_DB_PUSH !== "1") run(`pnpm exec prisma db push --schema "${schema}" --skip-generate`);
if (process.env.SEED_ON_BUILD === "true") run(`pnpm exec tsx prisma/seed.ts`);
