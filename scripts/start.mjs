#!/usr/bin/env node
/**
 * Production start for long-running hosts (Railway, a VPS).
 *
 * 1. If the database has no users at all, run the seed once (verified content + the admin account
 *    from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD). A database with any user is never touched, so
 *    redeploys cannot reset CMS edits. Set SEED_IF_EMPTY=false to disable even that.
 * 2. Apply pending one-time copy updates (scripts/apply-content-patches.mjs).
 * 3. Start Next.js on the port the host assigns.
 */
import { spawn, spawnSync } from "node:child_process";

const port = process.env.PORT || "3000";

async function usersExist() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const n = await prisma.user.count();
    await prisma.$disconnect();
    return n > 0;
  } catch (err) {
    console.warn("[start] could not count users; skipping seed check:", err?.message ?? err);
    return true;
  }
}

if (process.env.SEED_IF_EMPTY !== "false" && !(await usersExist())) {
  console.log("[start] empty database → seeding verified content and the admin account");
  const r = spawnSync("pnpm", ["exec", "tsx", "prisma/seed.ts"], { stdio: "inherit", env: process.env });
  if (r.status !== 0) console.error("[start] seed failed (exit " + r.status + "); starting the site anyway");
} else {
  console.log("[start] database has users; seed skipped");
}

// One-time copy updates for databases seeded before a copy change (CMS edits always win). Never blocks start-up.
if (process.env.CONTENT_PATCHES !== "false") {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const { applyContentPatches } = await import("./apply-content-patches.mjs");
    const prisma = new PrismaClient();
    await applyContentPatches(prisma);
    await prisma.$disconnect();
  } catch (err) {
    console.warn("[start] content patches skipped:", err?.message ?? err);
  }
}

const next = spawn("pnpm", ["exec", "next", "start", "-H", "0.0.0.0", "-p", port], { stdio: "inherit", env: process.env });
next.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => next.kill(sig));
